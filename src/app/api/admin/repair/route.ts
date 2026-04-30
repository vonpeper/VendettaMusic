import { db } from "@/lib/db"
import { findOrCreateClient } from "@/lib/clients"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const johanna = await db.bookingRequest.findFirst({
      where: { clientName: { contains: "Johanna" } }
    })

    if (!johanna) {
      return NextResponse.json({ success: false, error: "Johanna not found" })
    }

    console.log("Repairing Johanna:", johanna.id)

    // A. Create/Find Client
    let clientId = johanna.clientId
    if (!clientId) {
      clientId = await findOrCreateClient({
        name: johanna.clientName,
        email: johanna.clientEmail === "no@no.com" ? null : johanna.clientEmail,
        phone: johanna.clientPhone,
        city: johanna.municipio,
        state: johanna.state
      })
      await db.bookingRequest.update({
        where: { id: johanna.id },
        data: { clientId }
      })
    }

    // B. Create Event if confirmed
    let eventId = johanna.eventId
    if (johanna.status === "agendado" && !eventId) {
      const event = await db.event.create({
        data: {
          date: johanna.requestedDate,
          guestCount: johanna.guestCount,
          performanceStart: johanna.startTime,
          performanceEnd: johanna.endTime,
          amount: johanna.baseAmount,
          deposit: johanna.depositAmount,
          balance: johanna.baseAmount - johanna.depositAmount,
          depositMethod: johanna.paymentMethod,
          status: "agendado",
          venueType: johanna.venueType,
          mapsLink: johanna.mapsLink,
          ceremonyType: johanna.venueType,
          clientId: clientId!,
          isPublic: johanna.isPublic,
        }
      })
      eventId = event.id
      await db.bookingRequest.update({
        where: { id: johanna.id },
        data: { eventId: event.id }
      })
    }

    return NextResponse.json({ 
      success: true, 
      johanna: {
        id: johanna.id,
        clientId,
        eventId
      }
    })
  } catch (error: any) {
    console.error("Repair error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
