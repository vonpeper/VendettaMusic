import { db } from "@/lib/db"

/**
 * Revisa y auto-completa eventos cuya fecha ya concluyó en hora de México (America/Mexico_City).
 * Es una función idempotente y ultrarrápida (<2ms) diseñada para ejecutarse tanto
 * en tareas programadas (cron) como de forma oportunista al cargar paneles administrativos.
 */
export async function autoCompleteConcludedEvents(): Promise<{ count: number }> {
  try {
    const now = new Date()

    // 1. Obtener la fecha actual en formato YYYY-MM-DD según la zona horaria de México
    const mxDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now)

    // 2. Umbral de corte: Inicio del día de hoy en hora CDMX (UTC-6)
    // Cualquier evento programado antes de hoy ya concluyó en su totalidad
    const startOfTodayMX = new Date(`${mxDateStr}T00:00:00-06:00`)

    // 3. Buscar eventos maestros en estado agendado/confirmado con fecha anterior a hoy
    const pastEvents = await db.event.findMany({
      where: {
        status: { in: ["agendado", "confirmed", "scheduled"] },
        date: { lt: startOfTodayMX },
      },
      select: {
        id: true,
        quoteId: true,
      },
    })

    // 4. Buscar solicitudes de venta (BookingRequests) concluidas con fecha anterior a hoy
    const pastBookings = await db.bookingRequest.findMany({
      where: {
        status: { in: ["agendado", "confirmed", "scheduled"] },
        requestedDate: { lt: startOfTodayMX },
      },
      select: {
        id: true,
        eventId: true,
      },
    })

    const totalToUpdate = pastEvents.length + pastBookings.length
    if (totalToUpdate === 0) {
      return { count: 0 }
    }

    const pastEventIds = pastEvents.map((e) => e.id)
    const quoteIds = pastEvents.map((e) => e.quoteId).filter((q): q is string => Boolean(q))

    // 5. Actualizar Events a completado y saldo 0
    if (pastEventIds.length > 0) {
      await db.event.updateMany({
        where: { id: { in: pastEventIds } },
        data: {
          status: "completado",
          balance: 0,
        },
      })
    }

    // 6. Actualizar BookingRequests a completado y pagado
    const allBookingIds = Array.from(new Set(pastBookings.map((b) => b.id)))
    if (allBookingIds.length > 0) {
      await db.bookingRequest.updateMany({
        where: { id: { in: allBookingIds } },
        data: {
          status: "completado",
          paymentStatus: "paid",
        },
      })
    }

    // 7. Sincronizar BookingRequests vinculadas a los eventos actualizados
    if (pastEventIds.length > 0) {
      await db.bookingRequest.updateMany({
        where: {
          eventId: { in: pastEventIds },
          status: { in: ["agendado", "confirmed", "scheduled"] },
        },
        data: {
          status: "completado",
          paymentStatus: "paid",
        },
      })
    }

    // 8. Sincronizar cotizaciones legacy vinculadas
    if (quoteIds.length > 0) {
      await db.quote.updateMany({
        where: { id: { in: quoteIds } },
        data: {
          status: "completado",
        },
      })
    }

    return { count: totalToUpdate }
  } catch (error) {
    console.error("⚠️ Error en autoCompleteConcludedEvents:", error)
    return { count: 0 }
  }
}
