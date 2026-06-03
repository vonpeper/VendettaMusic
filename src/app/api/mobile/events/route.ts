import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getMobileUser } from "@/lib/mobile-auth"

export async function GET(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const musicianProfileId = user.musicianProfileId
    if (!musicianProfileId) {
      return NextResponse.json({ error: "El usuario no es un músico registrado." }, { status: 403 })
    }

    // Query events where this musician is assigned
    const assignments = await db.eventMusician.findMany({
      where: {
        musicianId: musicianProfileId,
        event: {
          status: { in: ["scheduled", "agendado", "completado"] }
        }
      },
      include: {
        event: {
          include: {
            location: true,
            package: true,
            client: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        event: {
          date: "asc"
        }
      }
    })

    // Map and sanitize events for the mobile app (Privacy Rule: No client contact details, just name, location & logistics!)
    const events = assignments.map(a => {
      const e = a.event
      return {
        eventId: e.id,
        assignmentId: a.id,
        status: a.status, // pending, confirmed, rejected
        date: e.date,
        customName: e.customName || "Show Vendetta",
        ceremonyType: e.ceremonyType || "Show",
        dressCode: e.dressCode || "Por definir",
        arrivalTime: e.arrivalTime || "Por definir",
        setupTime: e.setupTime || "Por definir",
        performanceStart: e.performanceStart || "Por definir",
        performanceEnd: e.performanceEnd || "Por definir",
        musicianNotes: e.musicianNotes || "Ninguna",
        isPublic: e.isPublic,
        packageName: e.package?.name || "Paquete Personalizado",
        clientName: e.client?.user?.name || "Cliente Vendetta",
        location: e.location ? {
          name: e.location.name,
          address: e.location.address,
          city: e.location.city || "",
          state: e.location.state || "",
          mapsLink: e.location.mapsLink || ""
        } : null
      }
    })

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error("GET mobile events error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const musicianProfileId = user.musicianProfileId
    if (!musicianProfileId) {
      return NextResponse.json({ error: "El usuario no es un músico registrado." }, { status: 403 })
    }

    const { eventId, status } = await req.json()
    if (!eventId || !status || !["confirmed", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 })
    }

    // Find assignment
    const assignment = await db.eventMusician.findFirst({
      where: {
        eventId,
        musicianId: musicianProfileId
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Asignación no encontrada para este evento." }, { status: 404 })
    }

    // Update status
    const updated = await db.eventMusician.update({
      where: { id: assignment.id },
      data: { status }
    })

    // Log event response in database notification log
    await db.notification.create({
      data: {
        type: "MUSICIAN_RESPONSE",
        channel: "mobile_app",
        message: `Músico ${user.name} cambió su estatus a ${status} para el evento ${eventId}`,
        status: "sent",
        eventId
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, status: updated.status })
  } catch (error: any) {
    console.error("POST mobile events error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
