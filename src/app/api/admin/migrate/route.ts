import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * MIGRATION UTILITY
 * normalizes legacy statuses:
 * confirmed -> agendado
 * scheduled -> agendado
 * pending   -> pendiente
 * rejected  -> cancelado
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const results = {
      bookingRequests: { updated: 0, errors: 0 },
      events: { updated: 0, errors: 0 },
      quotes: { updated: 0, errors: 0 }
    }

    // 1. Migrate BookingRequests
    const bookings = await db.bookingRequest.findMany({
      where: {
        status: { in: ["confirmed", "scheduled", "pending", "rejected"] }
      }
    })

    for (const b of bookings) {
      let newStatus = b.status
      if (b.status === "confirmed" || b.status === "scheduled") newStatus = "agendado"
      else if (b.status === "pending") newStatus = "pendiente"
      else if (b.status === "rejected") newStatus = "cancelado"

      try {
        await db.bookingRequest.update({
          where: { id: b.id },
          data: { status: newStatus }
        })
        results.bookingRequests.updated++
      } catch (e) {
        results.bookingRequests.errors++
      }
    }

    // 2. Migrate Events
    const events = await db.event.findMany({
      where: {
        status: { in: ["confirmed", "scheduled", "pending", "rejected", "completed"] }
      }
    })

    for (const e of events) {
      let newStatus = e.status
      if (e.status === "confirmed" || e.status === "scheduled") newStatus = "agendado"
      else if (e.status === "pending") newStatus = "pendiente"
      else if (e.status === "rejected") newStatus = "cancelado"
      else if (e.status === "completed") newStatus = "completado"

      try {
        await db.event.update({
          where: { id: e.id },
          data: { status: newStatus }
        })
        results.events.updated++
      } catch (err) {
        results.events.errors++
      }
    }

    // 3. Migrate Quotes
    const quotes = await db.quote.findMany({
      where: {
        status: { in: ["pending", "accepted", "rejected"] }
      }
    })

    for (const q of quotes) {
      let newStatus = q.status
      if (q.status === "pending") newStatus = "pendiente"
      else if (q.status === "accepted") newStatus = "agendado"
      else if (q.status === "rejected") newStatus = "cancelado"

      try {
        await db.quote.update({
          where: { id: q.id },
          data: { status: newStatus }
        })
        results.quotes.updated++
      } catch (err) {
        results.quotes.errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migración de estados completada",
      results
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
