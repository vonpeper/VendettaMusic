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
      errors: [] as string[]
    }

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
        await dispatchNotification({ type: "CLIENT_FOLLOWUP", bookingId: booking.id })
        await db.bookingRequest.update({
          where: { id: booking.id },
          data: { followUpCount: 1 }
        })
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
        await dispatchNotification({ type: "CLIENT_FOLLOWUP", bookingId: booking.id })
        await db.bookingRequest.update({
          where: { id: booking.id },
          data: { followUpCount: 2 }
        })
        results.followups10Days++
      } catch (err: any) {
        results.errors.push(`Error in 10-day followup for ${booking.id}: ${err.message}`)
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
            const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
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
      message: `Procesados: ${results.followups5Days} seguimientos (5d), ${results.followups10Days} seguimientos (10d), ${results.vipReminders} recordatorios VIP, ${retriesCount} reintentos exitosos.`
    })
    
  } catch (error: any) {
    console.error("CRON Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
