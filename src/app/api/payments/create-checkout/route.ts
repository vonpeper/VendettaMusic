import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stripe, getAppUrl, toStripeAmount } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/payments/create-checkout
 * body: { bookingId: string }
 *
 * Crea una Stripe Checkout Session para el ANTICIPO de la reserva.
 * El monto se calcula server-side desde el booking (no se confía en el cliente).
 * El bookingId se persiste en metadata y client_reference_id para que el webhook
 * pueda reconciliar el pago al recibir checkout.session.completed.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe no está configurado en el servidor." },
        { status: 503 }
      )
    }

    const { bookingId } = await req.json()
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requerido" }, { status: 400 })
    }

    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Esta reserva ya fue pagada" }, { status: 409 })
    }

    const depositAmount = booking.depositAmount || 0
    if (depositAmount <= 0) {
      return NextResponse.json({ error: "Anticipo inválido" }, { status: 400 })
    }

    const appUrl = getAppUrl()

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card", "oxxo"],
        client_reference_id: booking.id,
        customer_email: booking.clientEmail || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "mxn",
              unit_amount: toStripeAmount(depositAmount),
              product_data: {
                name: `Anticipo Vendetta — Folio ${booking.shortId ?? booking.id}`,
                description: `${booking.packageName} · ${new Date(
                  booking.requestedDate
                ).toLocaleDateString("es-MX")}`,
              },
            },
          },
        ],
        metadata: {
          bookingId: booking.id,
          shortId: booking.shortId ?? "",
        },
        success_url: `${appUrl}/status/${booking.shortId ?? booking.id}?paid=1`,
        cancel_url: `${appUrl}/cotizar?step=4&booking=${booking.id}`,
        // Reduce el riesgo de duplicados ante reintentos del cliente
      },
      { idempotencyKey: `checkout:${booking.id}` }
    )

    await db.bookingRequest.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error("POST /api/payments/create-checkout:", err)
    return NextResponse.json(
      { error: err?.message || "Error al crear la sesión de pago" },
      { status: 500 }
    )
  }
}
