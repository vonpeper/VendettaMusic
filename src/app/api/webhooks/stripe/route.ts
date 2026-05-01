import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { findOrCreateLocation } from "@/lib/locations"
import { notifyClientBookingClosed, sendWhatsApp, buildGigMessage, notifyMusicians } from "@/lib/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/stripe
 *
 * Stripe POSTs aquí. Verificamos la firma con req.text() (raw body).
 * Eventos manejados:
 *   - checkout.session.completed   → marca booking como pagado y agenda
 *   - payment_intent.succeeded     → idempotente, redunda con checkout.completed
 *   - payment_intent.payment_failed → registra el fallo
 *   - charge.refunded              → marca payment como refunded
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 503 })
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    console.error("⚠️ Stripe webhook signature failed:", err?.message)
    return NextResponse.json({ error: `Bad signature: ${err?.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        // No-op
        break
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error(`❌ Stripe webhook handler error (${event.type}):`, err)
    return NextResponse.json({ error: err?.message || "Handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id
  if (!bookingId) {
    console.warn("checkout.session.completed sin bookingId en metadata")
    return
  }

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
  if (!booking) {
    console.warn(`checkout.session.completed: booking ${bookingId} no existe`)
    return
  }

  // Idempotencia: si ya existe Payment con esta sessionId, no hacer nada.
  const existing = await db.payment.findUnique({ where: { stripeSessionId: session.id } })
  if (existing) return

  // Persistimos el Payment
  await db.payment.create({
    data: {
      bookingRequestId: booking.id,
      eventId: booking.eventId || null,
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency || "mxn").toUpperCase(),
      method: "stripe_checkout",
      provider: "stripe",
      status: session.payment_status === "paid" ? "paid" : (session.payment_status ?? "pending"),
      reference: session.id,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : null,
      receiptUrl: null,
      rawPayload: JSON.stringify(session),
    },
  })

  await db.bookingRequest.update({
    where: { id: booking.id },
    data: {
      paymentStatus: "paid",
      paymentRef: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : booking.stripePaymentIntentId,
    },
  })

  // Si aún no se ha agendado, ejecutar el flujo de confirmación.
  if (booking.status !== "agendado") {
    await confirmBookingFromPayment(booking.id)
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  // Algunos métodos (OXXO) emiten succeeded sin pasar por checkout.session.completed síncrono.
  const bookingId = pi.metadata?.bookingId
  if (!bookingId) return

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
  if (!booking || booking.paymentStatus === "paid") return

  await db.bookingRequest.update({
    where: { id: bookingId },
    data: {
      paymentStatus: "paid",
      stripePaymentIntentId: pi.id,
      paymentRef: pi.id,
    },
  })

  if (booking.status !== "agendado") {
    await confirmBookingFromPayment(bookingId)
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId
  if (!bookingId) return
  await db.bookingRequest.update({
    where: { id: bookingId },
    data: { paymentStatus: "failed" },
  }).catch(() => null)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null
  if (!pi) return
  await db.payment.updateMany({
    where: { stripePaymentIntentId: pi },
    data: { status: "refunded", stripeChargeId: charge.id, receiptUrl: charge.receipt_url || null },
  })
}

/**
 * Replica la lógica de `PATCH /api/booking action=confirm` pero invocable internamente.
 * Crea Event, vincula Location, notifica al cliente y a los músicos.
 */
async function confirmBookingFromPayment(bookingId: string) {
  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
  if (!booking) return

  const locationId = await findOrCreateLocation({
    name: booking.packageName || "Lugar del Evento",
    address: `${booking.calle || ""} ${booking.numero || ""}`.trim() || booking.address,
    colonia: booking.colonia,
    municipio: booking.municipio || booking.city,
    city: booking.city,
    state: booking.state,
    mapsLink: booking.mapsLink,
  })

  await db.bookingRequest.update({
    where: { id: bookingId },
    data: { status: "agendado" },
  })

  let event = booking.eventId
    ? await db.event.findUnique({ where: { id: booking.eventId } })
    : null

  if (!event) {
    event = await db.event.create({
      data: {
        date: booking.requestedDate,
        guestCount: booking.guestCount,
        performanceStart: booking.startTime,
        performanceEnd: booking.endTime,
        amount: booking.baseAmount,
        deposit: booking.depositAmount,
        balance: booking.baseAmount - booking.depositAmount,
        depositMethod: "stripe",
        paymentMethod: "stripe",
        paymentRef: booking.paymentRef,
        status: "agendado",
        venueType: booking.venueType,
        mapsLink: booking.mapsLink,
        ceremonyType: booking.venueType,
        clientId: booking.clientId,
        locationId,
        isPublic: booking.isPublic,
        clientProvidesAudio: booking.clientProvidesAudio,
        source: "funnel",
      },
    })
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { eventId: event.id },
    })
  }

  await notifyClientBookingClosed(booking).catch(e =>
    console.error("notifyClientBookingClosed:", e)
  )

  await notifyMusicians(
    event.id,
    {
      clientName: booking.clientName,
      date: booking.requestedDate,
      guestCount: booking.guestCount,
      locationName: booking.municipio || booking.city,
      locationAddress: booking.address,
      performanceStart: booking.startTime,
      performanceEnd: booking.endTime,
      packageName: booking.packageName,
      isPublic: booking.isPublic,
    },
    db
  ).catch(e => console.error("notifyMusicians:", e))
}
