"use server"

import { db } from "@/lib/db"
import { broadcastWebPush } from "@/lib/webpush"

export async function sendTodayShowReminderAction() {
  try {
    const today = new Date()
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0))
    const todayEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))

    // Check today's events
    const todayEvents = await db.event.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["agendado", "confirmed"] }
      },
      include: { location: true }
    })

    if (todayEvents.length > 0) {
      for (const evt of todayEvents) {
        const title = evt.customName || "Show Vendetta"
        const time = evt.performanceStart || "21:00"
        const location = evt.location?.name || "Lugar confirmado"
        const arrival = evt.arrivalTime || evt.setupTime ? ` (Llegada: ${evt.arrivalTime || evt.setupTime})` : ""

        await broadcastWebPush({
          title: "⚡ VENDETTA | ¡HOY HAY SHOW!",
          body: `🎸 ${title} a las ${time} hrs en ${location}${arrival}. Toca para abrir la agenda completa.`,
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
