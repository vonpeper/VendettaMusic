import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const bandEvents = await db.bandEvent.count();
    const clients = await db.clientProfile.count();
    const events = await db.event.count();
    
    // VERIFICACION DE CONSULTA RAW (La que estaba causando el error 500)
    const locations = await db.$queryRawUnsafe("SELECT * FROM Location");
    
    return NextResponse.json({
      status: "✅ PHASE 2 RESCUE SUCCESSFUL",
      message: "Se ha restaurado el soporte para consultas directas ($queryRawUnsafe).",
      counts: {
        eventualidades: bandEvents,
        clientes: clients,
        eventos: events,
        ubicaciones_via_raw: Array.isArray(locations) ? locations.length : 0
      },
      file_info: {
        path: "/Users/vonpeper/Documents/Antigravity/Vendetta/prisma/dev.db",
        size: "240KB"
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: "❌ PHASE 2 FAIL", 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
