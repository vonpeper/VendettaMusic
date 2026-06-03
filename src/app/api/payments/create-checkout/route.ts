import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/payments/create-checkout
 *
 * El pago por Stripe está temporalmente deshabilitado.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "El pago por Stripe está temporalmente deshabilitado." },
    { status: 503 }
  )
}
