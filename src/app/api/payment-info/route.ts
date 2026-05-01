import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/payment-info
 * Devuelve los datos bancarios para transferencia.
 * Público a propósito (el cliente tiene que verlos en el funnel),
 * pero los servimos vía API para que NO viajen al bundle estático.
 */
export async function GET() {
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
  return NextResponse.json({
    bank: config?.bankName ?? null,
    account: config?.bankAccount ?? null,
    clabe: config?.bankClabe ?? null,
    beneficiary: config?.bankBeneficiary ?? null,
  })
}
