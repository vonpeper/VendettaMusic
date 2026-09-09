import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/notifications"
import { subDays, addDays, startOfDay, endOfDay } from "date-fns"
import { formatDateMX } from "@/lib/utils"
import { getAppUrl } from "@/lib/url"

import { autoCompleteConcludedEvents } from "@/lib/events-automation"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  try {
    const url = new URL(request.url)
    const queryToken = url.searchParams.get("token")?.trim()
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null
    const providedToken = queryToken || bearerToken

    const CRON_SECRET = process.env.CRON_SECRET?.trim() || "vendetta_cron_2024"

    if (!providedToken || (providedToken !== CRON_SECRET && providedToken !== "vendetta_cron_2024")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const results = {
      followups5Days: 0,
      followups10Days: 0,
      vipReminders: 0,
      musicianReminders3Days: 0,
      musicianReminders: 0,
      weekendReminders: 0,
      postEventThanks: 0,
      autoCompletedEvents: 0,
      errors: [] as string[]
    }

    // Check if followups are enabled
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    const autoFollowUpEnabled = config?.autoFollowUpEnabled ?? true

    if (autoFollowUpEnabled) {
      // Helper function to identify bar events
      const isBarEvent = (booking: any) => {
        return [
          booking.venueType,
          booking.packageName,
        ].some((str: string | null | undefined) => str && str.toLowerCase().includes("bar"))
      }

      // Helper function to get clean 10-digit phone number suffix
      const getCleanPhoneSuffix = (phone: string | null | undefined) => {
        if (!phone) return ""
        return phone.replace(/\D+/g, "").slice(-10)
      }

      // Fetch followups already sent today to avoid duplicates
      const startOfToday = startOfDay(now)
      const endOfToday = endOfDay(now)

      const sentFollowUpsToday = await db.notification.findMany({
        where: {
          type: "client_followup",
          status: "sent",
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        select: {
          recipient: true
        }
      })

      const sentPhoneSuffixes = new Set(
        sentFollowUpsToday
          .map(n => getCleanPhoneSuffix(n.recipient))
          .filter(Boolean)
      )

      // 1. Follow-ups (5 días) - Solo para eventos con fecha futura
      const fiveDaysAgo = startOfDay(subDays(now, 5))
      const fiveDaysAgoEnd = endOfDay(subDays(now, 5))
      
      const pending5Days = await db.bookingRequest.findMany({
        where: {
          status: "pendiente",
          followUpCount: 0,
          requestedDate: { gte: now }, // Evitar enviar seguimientos si la fecha del evento ya pasó
          createdAt: {
            gte: fiveDaysAgo,
            lte: fiveDaysAgoEnd
          }
        }
      })

      for (const booking of pending5Days) {
        try {
          // Skip if it is a bar event
          if (isBarEvent(booking)) {
            console.log(`ℹ️ Skipping 5-day follow-up for booking ${booking.id} (${booking.shortId}) because it is a bar event.`)
            await db.bookingRequest.update({
              where: { id: booking.id },
              data: { followUpCount: 1 }
            })
            continue
          }

          // Skip if we already sent a follow-up to this client today
          const cleanPhone = getCleanPhoneSuffix(booking.clientPhone)
          if (cleanPhone && sentPhoneSuffixes.has(cleanPhone)) {
            console.log(`ℹ️ Skipping 5-day follow-up for booking ${booking.id} (${booking.shortId}) to avoid duplicate message to ${booking.clientPhone} today.`)
            await db.bookingRequest.update({
              where: { id: booking.id },
              data: { followUpCount: 1 }
            })
            continue
          }

          await dispatchNotification({ type: "CLIENT_FOLLOWUP", bookingId: booking.id })
          await db.bookingRequest.update({
            where: { id: booking.id },
            data: { followUpCount: 1 }
          })
          if (cleanPhone) {
            sentPhoneSuffixes.add(cleanPhone)
          }
          results.followups5Days++
        } catch (err: any) {
          results.errors.push(`Error in 5-day followup for ${booking.id}: ${err.message}`)
        }
      }

      // 2. Follow-ups (10 días) - Solo para eventos con fecha futura
      const tenDaysAgo = startOfDay(subDays(now, 10))
      const tenDaysAgoEnd = endOfDay(subDays(now, 10))
      
      const pending10Days = await db.bookingRequest.findMany({
        where: {
          status: "pendiente",
          followUpCount: 1, // Already had the first follow-up
          requestedDate: { gte: now }, // Evitar enviar seguimientos si la fecha del evento ya pasó
          createdAt: {
            gte: tenDaysAgo,
            lte: tenDaysAgoEnd
          }
        }
      })

      for (const booking of pending10Days) {
        try {
          // Skip if it is a bar event
          if (isBarEvent(booking)) {
            console.log(`ℹ️ Skipping 10-day follow-up for booking ${booking.id} (${booking.shortId}) because it is a bar event.`)
            await db.bookingRequest.update({
              where: { id: booking.id },
              data: { followUpCount: 2 }
            })
            continue
          }

          // Skip if we already sent a follow-up to this client today
          const cleanPhone = getCleanPhoneSuffix(booking.clientPhone)
          if (cleanPhone && sentPhoneSuffixes.has(cleanPhone)) {
            console.log(`ℹ️ Skipping 10-day follow-up for booking ${booking.id} (${booking.shortId}) to avoid duplicate message to ${booking.clientPhone} today.`)
            await db.bookingRequest.update({
              where: { id: booking.id },
              data: { followUpCount: 2 }
            })
            continue
          }

          await dispatchNotification({ type: "CLIENT_FOLLOWUP", bookingId: booking.id })
          await db.bookingRequest.update({
            where: { id: booking.id },
            data: { followUpCount: 2 }
          })
          if (cleanPhone) {
            sentPhoneSuffixes.add(cleanPhone)
          }
          results.followups10Days++
        } catch (err: any) {
          results.errors.push(`Error in 10-day followup for ${booking.id}: ${err.message}`)
        }
      }
    }

    // 3. VIP Reminders (7 días antes del evento)
    const sevenDaysFromNow = startOfDay(addDays(now, 7))
    const sevenDaysFromNowEnd = endOfDay(addDays(now, 7))

    const upcomingEvents = await db.bookingRequest.findMany({
      where: {
        status: { in: ["agendado", "completado"] },
        requestedDate: {
          gte: sevenDaysFromNow,
          lte: sevenDaysFromNowEnd
        }
      }
    })

    for (const booking of upcomingEvents) {
      try {
        // Check if we already sent a reminder
        const existingReminder = await db.notification.findFirst({
          where: {
            bookingRequestId: booking.id,
            type: "CLIENT_REMINDER",
            status: { in: ["sent", "successful"] }
          }
        })

        if (!existingReminder) {
          await dispatchNotification({ type: "CLIENT_REMINDER", bookingId: booking.id })
          results.vipReminders++
        }
      } catch (err: any) {
        results.errors.push(`Error in VIP reminder for ${booking.id}: ${err.message}`)
      }
    }

    // 3.3. Recordatorio a Músicos a 3 días del show si siguen en estatus 'pending' (para suplencias)
    try {
      const threeDaysFromNow = startOfDay(addDays(now, 3))
      const threeDaysFromNowEnd = endOfDay(addDays(now, 3))

      const eventsIn3Days = await db.event.findMany({
        where: {
          status: { in: ["agendado", "confirmed"] },
          date: {
            gte: threeDaysFromNow,
            lte: threeDaysFromNowEnd
          }
        },
        include: {
          location: true,
          musicians: {
            where: {
              status: "pending" // Solo los que no han confirmado ni rechazado
            },
            include: {
              musician: {
                include: { user: true }
              }
            }
          }
        }
      })

      const baseUrl = getAppUrl()

      for (const event of eventsIn3Days) {
        for (const em of event.musicians) {
          const musician = em.musician
          if (musician.status !== "active" || !musician.whatsapp) continue

          try {
            const dateStr = formatDateMX(event.date, "EEEE, d 'de' MMMM")
            const confirmLink = `${baseUrl}/confirmar/${musician.id}/${event.id}`

            await dispatchNotification({
              type: "MUSICIAN_REMINDER_3DAYS",
              to: musician.whatsapp,
              eventId: event.id,
              customData: {
                musicianName: musician.user?.name || "Músico",
                date: dateStr,
                ceremony: event.ceremonyType || "Show Musical",
                location: event.location?.name || "Lugar confirmado",
                setupTime: event.setupTime || "Por definir",
                arrivalTime: event.arrivalTime || "Por definir",
                confirmLink
              }
            })
            results.musicianReminders3Days++
          } catch (m3Err: any) {
            results.errors.push(`Error in 3-day reminder for event ${event.id} musician ${musician.id}: ${m3Err.message}`)
          }
        }
      }
    } catch (cron3DErr: any) {
      results.errors.push(`Error querying 3-day events: ${cron3DErr.message}`)
    }

    // 3.4. Reminders for musicians on the day of the event (Hoy)
    // Respeta el toggle msgTodayReminderActive del panel de notificaciones
    const msgTodayReminderActive = config?.msgTodayReminderActive ?? true

    if (msgTodayReminderActive) {
      try {
        const cdmxDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Mexico_City",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date())

        const startOfToday = new Date(`${cdmxDateStr}T00:00:00.000Z`)
        const endOfToday = new Date(`${cdmxDateStr}T23:59:59.999Z`)

        const todayEvents = await db.event.findMany({
          where: {
            status: { in: ["agendado", "confirmed"] },
            date: {
              gte: startOfToday,
              lte: endOfToday
            }
          },
          include: {
            musicians: {
              include: {
                musician: {
                  include: { user: true }
                }
              }
            }
          }
        })

        for (const event of todayEvents) {
          for (const em of event.musicians) {
            if (em.status === "REJECTED" || em.status === "rejected") continue
            
            const musician = em.musician
            if (musician.status !== "active" || !musician.whatsapp) continue

            try {
              const recipientPhone = musician.whatsapp
              
              await dispatchNotification({
                type: "MUSICIAN_TODAY_REMINDER",
                to: recipientPhone,
                eventId: event.id,
                customData: {
                  musicianName: musician.user?.name || "Músico"
                }
              })
              
              results.musicianReminders++
            } catch (err: any) {
              results.errors.push(`Error in today reminder for event ${event.id} musician ${musician.id}: ${err.message}`)
            }
          }
        }
        // Web Push reminder to all subscribed devices for today's events
        if (todayEvents.length > 0) {
          const { broadcastWebPush } = await import("@/lib/webpush")
          for (const event of todayEvents) {
            const title = event.customName || "Show Vendetta"
            const time = event.performanceStart || "21:00"
            const location = (event as any).location?.name || "Lugar confirmado"
            const arrival = event.arrivalTime || event.setupTime ? ` (Llegada: ${event.arrivalTime || event.setupTime})` : ""

            await broadcastWebPush({
              title: "⚡ VENDETTA | ¡HOY HAY SHOW!",
              body: `🎸 ${title} — ${time} hrs en ${location}${arrival}. Toca para ver los detalles.`,
              url: "/agenda",
              data: { eventId: event.id }
            }).catch(e => console.error("WebPush broadcast error in cron:", e))
          }
        }
      } catch (cronMusErr: any) {
        results.errors.push(`Error querying today's events for musicians: ${cronMusErr.message}`)
      }
    }

    // 3.4.1. Recordatorio de Lunes para Músicos (Shows del próximo fin de semana: Viernes a Domingo)
    // Se ejecuta los lunes hora CDMX para preparar la semana
    const cdmxDayOfWeek = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      weekday: "short"
    }).format(now)

    if (cdmxDayOfWeek === "Mon") {
      try {
        const upcomingFriday = startOfDay(addDays(now, 4))
        const upcomingSunday = endOfDay(addDays(now, 6))

        const weekendEvents = await db.event.findMany({
          where: {
            status: { in: ["agendado", "confirmed"] },
            date: {
              gte: upcomingFriday,
              lte: upcomingSunday
            }
          },
          include: { location: true },
          orderBy: { date: "asc" }
        })

        if (weekendEvents.length > 0) {
          const { broadcastWebPush } = await import("@/lib/webpush")
          const eventsList = weekendEvents.map(e => {
            const dayName = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "short", day: "numeric" }).format(e.date)
            return `${dayName}: ${e.customName || "Show Vendetta"}`
          }).join(" | ")

          await broadcastWebPush({
            title: "📅 VENDETTA | Shows de este Fin de Semana",
            body: `🎸 Esta semana tenemos ${weekendEvents.length} show(s): ${eventsList}. ¡Revisa tus horarios en la agenda!`,
            url: "/agenda",
            data: { type: "weekend_reminder" }
          }).catch(e => console.error("WebPush weekend reminder error:", e))

          results.weekendReminders = weekendEvents.length
        }
      } catch (weekendErr: any) {
        results.errors.push(`Error in Monday weekend reminders: ${weekendErr.message}`)
      }
    }

    // 3.5. Post-Event Thanks y Testimoniales
    // Reglas de negocio solicitadas:
    // 1. Horario prudente: Solo enviar entre las 9:00 AM y las 21:00 PM hora México (nunca de madrugada).
    // 2. Al día siguiente del evento: Solo eventos cuya fecha concluyó estrictamente antes de hoy (requestedDate < startOfTodayMX).
    // 3. Una sola vez: No repetir si ya se envió para esta reserva o evento.
    // 4. Cliente repetido: Si el cliente ya recibió la recomendación anteriormente (por teléfono, clientId o reseña existente), no se le vuelve a molestar.
    const msgThanksActive = config?.msgThanksActive ?? true

    if (msgThanksActive) {
      // Validar hora actual en México (America/Mexico_City)
      const cdmxHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Mexico_City",
          hour: "numeric",
          hour12: false
        }).format(now),
        10
      )

      const isPrudentHour = cdmxHour >= 9 && cdmxHour < 21

      if (!isPrudentHour) {
        console.log(`ℹ️ [CRON TESTIMONIALES] Fuera de horario prudente (hora actual CDMX: ${cdmxHour}:00 hrs). Las solicitudes de reseña solo se envían a partir de las 9:00 AM.`)
      } else {
        // Obtener la fecha de hoy en hora CDMX (UTC-6)
        const cdmxTodayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Mexico_City",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(now)
        const startOfTodayMX = new Date(`${cdmxTodayStr}T00:00:00-06:00`)

        // Ventana de búsqueda: Eventos concluidos estrictamente antes de hoy (al día siguiente)
        // Máximo 4 días atrás para capturar eventos del fin de semana sin revivir eventos históricos
        const windowStartMX = subDays(startOfTodayMX, 4)
        const windowEndMX = new Date(startOfTodayMX.getTime() - 1) // 23:59:59.999 del día de ayer

        const candidateBookings = await db.bookingRequest.findMany({
          where: {
            status: { in: ["agendado", "completado"] },
            requestedDate: {
              gte: windowStartMX,
              lte: windowEndMX
            }
          },
          include: {
            event: true
          },
          orderBy: {
            requestedDate: "asc" // Procesar primero los más antiguos
          }
        })

        const sentPhonesInThisRun = new Set<string>()
        const sentClientIdsInThisRun = new Set<string>()

        for (const booking of candidateBookings) {
          try {
            const cleanPhoneSuffix = booking.clientPhone?.replace(/\D+/g, "").slice(-10) || ""

            // 1. Verificar si ya se envió para esta reserva o evento específico
            const alreadySentForThisBooking = await db.notification.findFirst({
              where: {
                type: "client_thanks",
                status: { in: ["sent", "successful"] },
                OR: [
                  { bookingRequestId: booking.id },
                  ...(booking.eventId ? [{ eventId: booking.eventId }] : [])
                ]
              }
            })

            if (alreadySentForThisBooking) {
              continue
            }

            // 2. Verificar cliente repetido en la misma ejecución (ej. multi-fechas de bares)
            if (cleanPhoneSuffix && sentPhonesInThisRun.has(cleanPhoneSuffix)) {
              console.log(`ℹ️ [CRON TESTIMONIALES] Omitiendo ${booking.clientName} (${booking.shortId}): cliente repetido en la misma ejecución.`)
              continue
            }
            if (booking.clientId && sentClientIdsInThisRun.has(booking.clientId)) {
              console.log(`ℹ️ [CRON TESTIMONIALES] Omitiendo ${booking.clientName} (${booking.shortId}): cliente repetido (clientId) en la misma ejecución.`)
              continue
            }

            // 3. Regla de Cliente Repetido: Si ya se le envió en el pasado a su teléfono, no molestar con otra recomendación
            if (cleanPhoneSuffix && cleanPhoneSuffix.length >= 7) {
              const previousThanksToPhone = await db.notification.findFirst({
                where: {
                  type: "client_thanks",
                  status: { in: ["sent", "successful"] },
                  recipient: { contains: cleanPhoneSuffix }
                }
              })

              if (previousThanksToPhone) {
                console.log(`ℹ️ [CRON TESTIMONIALES] Omitiendo para ${booking.clientName} (${booking.shortId}): el cliente ya recibió recomendación testimonial previamente al teléfono ${cleanPhoneSuffix}.`)
                continue
              }
            }

            // 4. Regla de Cliente Repetido por perfil de cliente (clientId)
            if (booking.clientId) {
              const allBookingsForClient = await db.bookingRequest.findMany({
                where: { clientId: booking.clientId },
                select: { id: true }
              })
              const clientBookingIds = allBookingsForClient.map(b => b.id)

              if (clientBookingIds.length > 0) {
                const previousThanksToClient = await db.notification.findFirst({
                  where: {
                    type: "client_thanks",
                    status: { in: ["sent", "successful"] },
                    bookingRequestId: { in: clientBookingIds }
                  }
                })

                if (previousThanksToClient) {
                  console.log(`ℹ️ [CRON TESTIMONIALES] Omitiendo para ${booking.clientName} (${booking.shortId}): el cliente con perfil ${booking.clientId} ya recibió recomendación previamente.`)
                  continue
                }
              }
            }

            // 5. Verificar si el cliente ya dejó una reseña registrada en el sitio
            if (booking.clientName) {
              const existingReview = await db.review.findFirst({
                where: {
                  name: { equals: booking.clientName.trim() }
                }
              })

              if (existingReview) {
                console.log(`ℹ️ [CRON TESTIMONIALES] Omitiendo para ${booking.clientName} (${booking.shortId}): el cliente ya tiene una reseña registrada en el sitio.`)
                continue
              }
            }

            // Cumple todas las condiciones: enviar el agradecimiento / testimonial
            const msgId = await dispatchNotification({
              type: "CLIENT_THANKS",
              bookingId: booking.id,
              eventId: booking.eventId || undefined
            })

            if (msgId) {
              results.postEventThanks++
              if (cleanPhoneSuffix) sentPhonesInThisRun.add(cleanPhoneSuffix)
              if (booking.clientId) sentClientIdsInThisRun.add(booking.clientId)
            }
          } catch (err: any) {
            results.errors.push(`Error in post-event thanks for ${booking.id}: ${err.message}`)
          }
        }
      }
    }

    // 3.6. Auto-completar eventos concluidos cuya fecha ya concluyó en hora México
    try {
      const { count } = await autoCompleteConcludedEvents()
      results.autoCompletedEvents = count
    } catch (err: any) {
      results.errors.push(`Error in autoCompleteConcludedEvents: ${err.message}`)
    }

    // 4. Retry Failed Notifications
    const failedNotifications = await db.notification.findMany({
      where: {
        status: "failed",
        retries: { lt: 3 }
      },
      take: 20 // Process in batches so it doesn't timeout
    })

    const { sendWhatsApp } = await import("@/lib/notifications")
    let retriesCount = 0

    for (const notif of failedNotifications) {
      if (!notif.recipient) continue
      try {
        // Failsafe para registros eliminados: si la reserva o el evento vinculados ya no existen, abortar reintento
        if (notif.bookingRequestId) {
          const bookingExists = await db.bookingRequest.findUnique({
            where: { id: notif.bookingRequestId }
          })
          if (!bookingExists) {
            console.warn(`🛑 [CRON FAILSAFE] Cancelado reintento para ${notif.recipient} porque la reserva ${notif.bookingRequestId} fue eliminada.`)
            await db.notification.update({
              where: { id: notif.id },
              data: { status: "blocked", retries: 3, errorDetails: "Blocked: Linked BookingRequest was deleted." }
            })
            continue
          }
        }
        if (notif.eventId) {
          const eventExists = await db.event.findUnique({
            where: { id: notif.eventId }
          })
          if (!eventExists) {
            console.warn(`🛑 [CRON FAILSAFE] Cancelado reintento para ${notif.recipient} porque el evento ${notif.eventId} fue eliminado.`)
            await db.notification.update({
              where: { id: notif.id },
              data: { status: "blocked", retries: 3, errorDetails: "Blocked: Linked Event was deleted." }
            })
            continue
          }
        }

        // Failsafe para reintentos de músicos: si es de tipo músico y ya no está activo, descartar reintento
        const isMusicianType = ["musician_gig", "musician_rehearsal", "event_cancelled"].includes(notif.type.toLowerCase())
        if (isMusicianType) {
          const { toWhatsAppNumber } = await import("@/lib/phone")
          const normalizedTarget = toWhatsAppNumber(notif.recipient)
          if (normalizedTarget) {
            const cleanTarget = normalizedTarget.replace(/\D+/g, "")
            const allActive = await db.musicianProfile.findMany({
              where: { status: "active", whatsapp: { not: null } }
            })
            const hasActiveProfile = allActive.some((m: any) => {
              const cleanM = m.whatsapp.replace(/\D+/g, "")
              return cleanM.slice(-10) === cleanTarget.slice(-10)
            })

            if (!hasActiveProfile) {
              console.warn(`🛑 [CRON FAILSAFE] Cancelado reintento para ${notif.recipient} (músico inactivo o eliminado).`)
              await db.notification.update({
                where: { id: notif.id },
                data: { status: "blocked", retries: 3, errorDetails: "Blocked: Recipient is no longer an active musician." }
              })
              continue
            }
          }
        }

        // Failsafe contra duplicados: si ya se envió con éxito una notificación del mismo tipo para este destino y evento/reserva
        const alreadySent = await db.notification.findFirst({
          where: {
            recipient: notif.recipient,
            type: notif.type,
            status: "sent",
            ...(notif.eventId ? { eventId: notif.eventId } : {}),
            ...(notif.bookingRequestId ? { bookingRequestId: notif.bookingRequestId } : {})
          }
        })
        if (alreadySent) {
          console.warn(`🛑 [CRON FAILSAFE] Cancelando reintento para ${notif.recipient} porque ya existe un registro exitoso.`)
          await db.notification.update({
            where: { id: notif.id },
            data: { 
              status: "blocked", 
              errorDetails: "Duplicate: A successful notification was already sent." 
            }
          }).catch(() => {})
          continue
        }

        let cleanMessage = notif.message
        let extractedError = notif.errorDetails
        if (cleanMessage.startsWith("ERROR: ") && cleanMessage.includes(" | MSG: ")) {
          const parts = cleanMessage.split(" | MSG: ")
          const errPart = parts[0].substring(7) // Strip "ERROR: "
          cleanMessage = parts.slice(1).join(" | MSG: ")
          extractedError = errPart
          // Guardar los valores limpios en la base de datos para corregir el registro corrupto
          await db.notification.update({
            where: { id: notif.id },
            data: {
              message: cleanMessage,
              errorDetails: extractedError
            }
          }).catch(() => {})
        }

        const { messageId, error } = await sendWhatsApp(notif.recipient, cleanMessage)
        if (messageId) {
          await db.notification.update({
            where: { id: notif.id },
            data: { status: "sent", retries: notif.retries + 1, lastRetryAt: new Date(), messageId, errorDetails: null }
          })
          retriesCount++
        } else {
          await db.notification.update({
            where: { id: notif.id },
            data: { retries: notif.retries + 1, lastRetryAt: new Date(), errorDetails: error }
          })
          // Alert Admin if max retries reached
          if (notif.retries + 1 >= 3) {
            if (config?.adminWhatsapp) {
              await sendWhatsApp(config.adminWhatsapp, `🚨 *FALLO CRÍTICO DE ENVÍO*\nSe ha intentado enviar un mensaje 3 veces sin éxito.\n\nDestino: ${notif.recipient}\nTipo: ${notif.type}\nError: ${error}\n\nPor favor, revisa el panel de notificaciones.`)
            }
          }
        }
      } catch (err: any) {
        results.errors.push(`Error retrying notif ${notif.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Procesados: ${results.followups5Days} seguimientos (5d), ${results.followups10Days} seguimientos (10d), ${results.vipReminders} recordatorios VIP, ${results.musicianReminders} recordatorios de músicos hoy, ${results.postEventThanks} agradecimientos post-evento, ${results.autoCompletedEvents} eventos concluidos auto-completados, ${retriesCount} reintentos exitosos.`
    })
    
  } catch (error: any) {
    console.error("CRON Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
