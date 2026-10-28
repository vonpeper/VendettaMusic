import { db as defaultDb } from "@/lib/db"

export interface LeadLifecycleResult {
  expiredPastDate: number
  expiredInactivity: number
  totalExpired: number
}

/**
 * Rutina para depurar y expirar automáticamente leads inactivos o no confirmados:
 * - Paso A: Eventos cuya fecha tentativa ya concluyó en hora México sin confirmar anticipo.
 * - Paso B: Solicitudes en estado pendiente/requiere_llamada/cotizado creadas hace más de 7 días naturales sin anticipo pagado.
 */
export async function autoExpireInactiveLeads(db: any = defaultDb): Promise<LeadLifecycleResult> {
  const now = new Date()

  // 1. Obtener inicio del día de hoy en zona horaria CDMX (America/Mexico_City)
  const mxDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const startOfTodayMX = new Date(`${mxDateStr}T00:00:00-06:00`)

  // 2. Umbral de vigencia de 7 días naturales
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let expiredPastDate = 0
  let expiredInactivity = 0

  // -------------------------------------------------------------
  // PASO A: Fecha tentativa ya concluida sin confirmar
  // -------------------------------------------------------------
  const pastDateBookings = await db.bookingRequest.findMany({
    where: {
      requestedDate: { lt: startOfTodayMX },
      status: { in: ["pendiente", "requiere_llamada", "pending", "cotizado", "contactado", "llamada_agendada", "new"] },
      eventId: null,
      paymentStatus: { not: "paid" }
    },
    select: { id: true, sourceInquiryId: true }
  })

  if (pastDateBookings.length > 0) {
    const pastIds = pastDateBookings.map((b: any) => b.id)
    const pastInquiryIds = pastDateBookings.map((b: any) => b.sourceInquiryId).filter(Boolean)

    await db.bookingRequest.updateMany({
      where: { id: { in: pastIds } },
      data: {
        status: "expirado",
        closedAt: now,
        cancellationReason: "Fecha tentativa del evento ya concluida sin confirmación de anticipo."
      }
    })

    if (pastInquiryIds.length > 0) {
      await db.contactInquiry.updateMany({
        where: { id: { in: pastInquiryIds } },
        data: { status: "expirado" }
      })
    }

    expiredPastDate += pastIds.length
  }

  // ContactInquiries huérfanos con fecha pasada
  const pastOrphanInquiries = await db.contactInquiry.updateMany({
    where: {
      requestedDate: { lt: startOfTodayMX },
      status: { in: ["new", "reviewing", "requiere_llamada", "pending"] },
      convertedBooking: null
    },
    data: {
      status: "expirado"
    }
  })
  expiredPastDate += (pastOrphanInquiries?.count || 0)

  // -------------------------------------------------------------
  // PASO B: Superada vigencia comercial (7 días sin anticipo)
  // -------------------------------------------------------------
  const inactiveBookings = await db.bookingRequest.findMany({
    where: {
      createdAt: { lt: sevenDaysAgo },
      status: { in: ["pendiente", "requiere_llamada", "pending", "cotizado"] },
      eventId: null,
      paymentStatus: { not: "paid" }
    },
    select: { id: true, sourceInquiryId: true }
  })

  if (inactiveBookings.length > 0) {
    const inactiveIds = inactiveBookings.map((b: any) => b.id)
    const inactiveInquiryIds = inactiveBookings.map((b: any) => b.sourceInquiryId).filter(Boolean)

    await db.bookingRequest.updateMany({
      where: { id: { in: inactiveIds } },
      data: {
        status: "expirado",
        closedAt: now,
        cancellationReason: "Expirado automáticamente por superar vigencia comercial (7 días sin anticipo)."
      }
    })

    if (inactiveInquiryIds.length > 0) {
      await db.contactInquiry.updateMany({
        where: { id: { in: inactiveInquiryIds } },
        data: { status: "expirado" }
      })
    }

    expiredInactivity += inactiveIds.length
  }

  // ContactInquiries huérfanos con más de 7 días
  const inactiveOrphanInquiries = await db.contactInquiry.updateMany({
    where: {
      createdAt: { lt: sevenDaysAgo },
      status: { in: ["new", "reviewing", "requiere_llamada", "pending"] },
      convertedBooking: null
    },
    data: {
      status: "expirado"
    }
  })
  expiredInactivity += (inactiveOrphanInquiries?.count || 0)

  return {
    expiredPastDate,
    expiredInactivity,
    totalExpired: expiredPastDate + expiredInactivity
  }
}
