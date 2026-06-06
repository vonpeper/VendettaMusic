import { NextResponse } from "next/server"
import { syncEventToGoogleCalendar } from "@/lib/google-calendar"

export async function GET() {
  try {
    const eventId = "4ed4ca86-1024-4982-82eb-ebf81548c3de"
    console.log(`🔗 [API Sync] Sincronizando evento ${eventId}...`);
    await syncEventToGoogleCalendar(eventId)
    console.log(`✅ [API Sync] Evento ${eventId} sincronizado.`);
    return NextResponse.json({ success: true, message: `Synced event ${eventId} successfully` })
  } catch (error: any) {
    console.error("❌ [API Sync] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
