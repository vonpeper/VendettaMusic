import { NextResponse } from "next/server"
import { saveUnifiedEventQuoteAction } from "@/actions/events"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await saveUnifiedEventQuoteAction(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Error en /api/admin/events/save-unified:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno al procesar evento" }, { status: 500 })
  }
}
