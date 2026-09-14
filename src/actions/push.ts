"use server"

import { db } from "@/lib/db"
import { broadcastWebPush } from "@/lib/webpush"

export async function sendTodayShowReminderAction() {
  try {
    const cdmxDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date())

    const todayStart = new Date(`${cdmxDateStr}T00:00:00.000Z`)
    const todayEnd = new Date(`${cdmxDateStr}T23:59:59.999Z`)

    // Check today's events
    const todayEvents = await db.event.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["agendado", "confirmed"] }
      },
      include: { location: true }
    })

    console.log(`[sendTodayShowReminder] Found ${todayEvents.length} events for ${cdmxDateStr}`)

    if (todayEvents.length > 0) {
      for (const evt of todayEvents) {
        const title = evt.customName || "Show Vendetta"
        const time = evt.performanceStart || "20:00"
        const location = evt.location?.name || "Lugar confirmado"
        const arrival = evt.arrivalTime || evt.setupTime ? ` (Llegada: ${evt.arrivalTime || evt.setupTime})` : ""

        await broadcastWebPush({
          title: "⚡ VENDETTA | ¡HOY HAY SHOW!",
          body: `🎸 ${title} — ${time} hrs en ${location}${arrival}. Toca para ver la agenda.`,
          icon: "/images/branding/logo-vendetta.png",
          badge: "/images/branding/logo-vendetta.png",
          url: "/agenda",
          data: { eventId: evt.id }
        })
      }

      return {
        success: true,
        message: `Recordatorio enviado para ${todayEvents.length} show(s) de hoy.`
      }
    }

    // If no events today, find the next upcoming event
    const nextEvent = await db.event.findFirst({
      where: {
        date: { gte: todayStart },
        status: { in: ["agendado", "confirmed"] }
      },
      orderBy: { date: "asc" },
      include: { location: true }
    })

    if (nextEvent) {
      const d = new Date(nextEvent.date)
      const dateStr = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
      const title = nextEvent.customName || "Próximo Show"

      await broadcastWebPush({
        title: "⚡ VENDETTA MUSIC | Próxima Fecha",
        body: `📅 Próximo show: ${title} el ${dateStr}. Toca para consultar horarios y locación.`,
        url: "/agenda",
        data: { eventId: nextEvent.id }
      })

      return {
        success: true,
        message: "Se envió recordatorio del próximo evento agendado."
      }
    }

    return {
      success: true,
      message: "No hay eventos próximos registrados para notificar."
    }
  } catch (error: any) {
    console.error("Error in sendTodayShowReminderAction:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function sendWeekShowsReminderAction() {
  try {
    const cdmxDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date())

    const weekStart = new Date(`${cdmxDateStr}T00:00:00.000Z`)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

    const weekEvents = await db.event.findMany({
      where: {
        date: { gte: weekStart, lte: weekEnd },
        status: { in: ["agendado", "confirmed"] }
      },
      include: { location: true },
      orderBy: { date: "asc" }
    })

    if (weekEvents.length > 0) {
      const eventsList = weekEvents.map(e => {
        const dayName = new Intl.DateTimeFormat("es-MX", { 
          timeZone: "America/Mexico_City", 
          weekday: "short", 
          day: "numeric",
          month: "short" 
        }).format(e.date)
        return `${dayName}: ${e.customName || "Show Vendetta"}`
      }).join(" | ")

      const res = await broadcastWebPush({
        title: "📅 VENDETTA | Shows de esta Semana",
        body: `🎸 Esta semana tenemos ${weekEvents.length} show(s): ${eventsList}. ¡Revisa tus horarios en la agenda!`,
        url: "/agenda",
        data: { type: "weekly_reminder" }
      })

      return {
        success: true,
        message: `Recordatorio semanal enviado a ${res.successCount} dispositivo(s) para ${weekEvents.length} show(s).`
      }
    }

    return {
      success: true,
      message: "No hay eventos programados para los próximos 7 días."
    }
  } catch (error: any) {
    console.error("Error in sendWeekShowsReminderAction:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function testPushBroadcastAction() {
  try {
    const result = await broadcastWebPush({
      title: "⚡ VENDETTA MUSIC | Notificación de Prueba",
      body: "🎸 Las notificaciones de recordatorio de shows están activas y funcionando en tu dispositivo.",
      url: "/agenda"
    })

    return {
      success: true,
      message: `Notificación enviada a ${result.successCount} dispositivo(s).`
    }
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` }
  }
}
