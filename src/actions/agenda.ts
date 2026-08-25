"use server"

import { db } from "@/lib/db"

export interface AgendaEvent {
  id: string
  date: string // ISO string YYYY-MM-DD
  dateTimeISO: string
  title: string
  status: "agendado" | "pendiente" | "completado" | "cancelado" | string
  startTime: string
  endTime: string
  arrivalTime?: string | null
  setupTime?: string | null
  locationName?: string | null
  locationAddress?: string | null
  city?: string | null
  mapsLink?: string | null
  ceremonyType?: string | null
  packageName?: string | null
  dressCode?: string | null
  musicianNotes?: string | null
  isPublic?: boolean
  musiciansCount?: number
  confirmedMusiciansCount?: number
  source: "event" | "bandEvent"
}

export async function getAgendaEventsAction(): Promise<AgendaEvent[]> {
  try {
    const [events, bandEvents] = await Promise.all([
      db.event.findMany({
        orderBy: { date: "asc" },
        include: {
          location: true,
          package: true,
          client: { include: { user: true } },
          bookingRequest: true,
          musicians: {
            include: {
              musician: { include: { user: true } }
            }
          }
        }
      }),
      db.bandEvent.findMany({
        orderBy: { eventDate: "asc" }
      })
    ])

    const mappedEvents: AgendaEvent[] = events.map((e) => {
      const d = new Date(e.date)
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, "0")
      const day = String(d.getUTCDate()).padStart(2, "0")
      const dateKey = `${year}-${month}-${day}`

      const title =
        e.customName ||
        e.client?.user?.name ||
        e.bookingRequest?.clientName ||
        e.location?.name ||
        "Evento Vendetta"

      const start = e.performanceStart || e.startTime || "21:00"
      const end = e.performanceEnd || "23:00"

      const confirmedCount = e.musicians?.filter((m) => m.status === "confirmed").length || 0

      return {
        id: e.id,
        date: dateKey,
        dateTimeISO: e.date.toISOString(),
        title,
        status: e.status || "agendado",
        startTime: start,
        endTime: end,
        arrivalTime: e.arrivalTime,
        setupTime: e.setupTime,
        locationName: e.location?.name || e.bookingRequest?.address || (e.isPublic ? "Evento Público" : "Lugar Privado"),
        locationAddress: e.location?.address || e.bookingRequest?.address || null,
        city: e.location?.city || e.bookingRequest?.city || e.client?.city || null,
        mapsLink: e.mapsLink || e.location?.mapsLink || e.bookingRequest?.mapsLink || null,
        ceremonyType: e.ceremonyType || e.bookingRequest?.venueType || "Show",
        packageName: e.package?.name || e.bookingRequest?.packageName || "Show Vendetta",
        dressCode: e.dressCode || e.bookingRequest?.dressCode || null,
        musicianNotes: e.musicianNotes || e.bookingRequest?.adminNote || null,
        isPublic: !!e.isPublic,
        musiciansCount: e.musicians?.length || 0,
        confirmedMusiciansCount: confirmedCount,
        source: "event"
      }
    })

    // Also include legacy BandEvents if they don't already match an event ID
    const eventIds = new Set(events.map((e) => e.id))
    const mappedBandEvents: AgendaEvent[] = bandEvents
      .filter((be) => !eventIds.has(be.id))
      .map((be) => {
        const d = new Date(be.eventDate)
        const year = d.getUTCFullYear()
        const month = String(d.getUTCMonth() + 1).padStart(2, "0")
        const day = String(d.getUTCDate()).padStart(2, "0")
        const dateKey = `${year}-${month}-${day}`

        return {
          id: be.id,
          date: dateKey,
          dateTimeISO: be.eventDate.toISOString(),
          title: be.clientName || "Show Vendetta",
          status: be.status || "completado",
          startTime: "21:00",
          endTime: "23:00",
          arrivalTime: null,
          setupTime: null,
          locationName: be.location || null,
          locationAddress: null,
          city: null,
          mapsLink: null,
          ceremonyType: be.eventType || "Show",
          packageName: "Show Vendetta",
          dressCode: null,
          musicianNotes: be.notes || null,
          isPublic: false,
          musiciansCount: 0,
          confirmedMusiciansCount: 0,
          source: "bandEvent"
        }
      })

    // Combine and sort by date ascending
    const all = [...mappedEvents, ...mappedBandEvents].sort((a, b) => {
      return new Date(a.dateTimeISO).getTime() - new Date(b.dateTimeISO).getTime()
    })

    return JSON.parse(JSON.stringify(all))
  } catch (error) {
    console.error("Error in getAgendaEventsAction:", error)
    return []
  }
}
