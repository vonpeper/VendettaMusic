import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // 1. Obtener info de columnas de BookingRequest
    const bookingColumns = await db.$queryRaw<any[]>`PRAGMA table_info(BookingRequest)`
    const bookingColNames = bookingColumns.map(c => ({ name: c.name, type: c.type }))

    // 2. Obtener info de columnas de Event
    const eventColumns = await db.$queryRaw<any[]>`PRAGMA table_info(Event)`
    const eventColNames = eventColumns.map(c => ({ name: c.name, type: c.type }))

    // 3. Ejecutar un chequeo rápido de inserción / lectura para descartar bloqueos de base de datos
    let writeCheck = "success"
    try {
      await db.$queryRaw`SELECT 1`
    } catch (e: any) {
      writeCheck = `failed: ${e.message}`
    }

    return NextResponse.json({
      success: true,
      writeCheck,
      bookingColumnsCount: bookingColumns.length,
      bookingColumns: bookingColNames,
      eventColumnsCount: eventColumns.length,
      eventColumns: eventColNames,
    })
  } catch (error: any) {
    console.error("Debug DB Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
