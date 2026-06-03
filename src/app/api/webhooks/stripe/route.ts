import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/stripe
 *
 * El webhook de Stripe está temporalmente deshabilitado.
 */
export async function POST(req: NextRequest) {
  console.log("Stripe webhook received, but Stripe is disabled.")
  return NextResponse.json({ received: true, message: "Stripe integration is disabled." })
}
