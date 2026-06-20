import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/notifications"
import { subDays, addDays, startOfDay, endOfDay } from "date-fns"

// GET /api/cron/daily?token=SECRET
// Revisa clientes sin respuesta a los 5 y 10 días, y eventos próximos a 7 días.
export const dynamic = 'force-dynamic' // Force dynamic route

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    
    // Hardcoded secret for now, can be moved to env.
    const CRON_SECRET = process.env.CRON_SECRET || "vendetta_cron_2024"
    
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const results = {
      followups5Days: 0,
      followups10Days: 0,
      vipReminders: 0,
      musicianReminders: 0,
      postEventThanks: 0,
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

      // 1. Follow-ups (5 días)
      const fiveDaysAgo = startOfDay(subDays(now, 5))
      const fiveDaysAgoEnd = endOfDay(subDays(now, 5))
      
      const pending5Days = await db.bookingRequest.findMany({
        where: {
          status: "pendiente",
          followUpCount: 0,
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

      // 2. Follow-ups (10 días)
      const tenDaysAgo = startOfDay(subDays(now, 10))
      const tenDaysAgoEnd = endOfDay(subDays(now, 10))
      
      const pending10Days = await db.bookingRequest.findMany({
        where: {
          status: "pendiente",
          followUpCount: 1, // Already had the first follow-up
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

    // 3.4. Reminders for musicians on the day of the event (Hoy)
    try {
      const startOfToday = startOfDay(now)
      const endOfToday = endOfDay(now)

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
          if (em.status === "REJECTED") continue
          
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
    } catch (cronMusErr: any) {
      results.errors.push(`Error querying today's events for musicians: ${cronMusErr.message}`)
    }

    // 3.5. Post-Event Thanks (El día después del evento)
    const yesterday = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))
    
    // Check if the thank you message feature is active
    const msgThanksActive = config?.msgThanksActive ?? false

    if (msgThanksActive) {
      const pastEvents = await db.bookingRequest.findMany({
        where: {
          status: { in: ["agendado", "completado"] },
          requestedDate: {
            gte: yesterday,
            lte: yesterdayEnd
          }
        }
      })

      for (const booking of pastEvents) {
        try {
          const existingThanks = await db.notification.findFirst({
            where: {
              bookingRequestId: booking.id,
              type: "client_thanks",
              status: { in: ["sent", "successful"] }
            }
          })

          if (!existingThanks) {
            await dispatchNotification({ type: "CLIENT_THANKS", bookingId: booking.id })
            results.postEventThanks++
          }
        } catch (err: any) {
          results.errors.push(`Error in post-event thanks for ${booking.id}: ${err.message}`)
        }
      }
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

        const { messageId, error } = await sendWhatsApp(notif.recipient, notif.message)
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
      message: `Procesados: ${results.followups5Days} seguimientos (5d), ${results.followups10Days} seguimientos (10d), ${results.vipReminders} recordatorios VIP, ${results.musicianReminders} recordatorios de músicos hoy, ${results.postEventThanks} agradecimientos post-evento, ${retriesCount} reintentos exitosos.`
    })
    
  } catch (error: any) {
    console.error("CRON Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
