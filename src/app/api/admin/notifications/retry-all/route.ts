import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWhatsApp } from "@/lib/notifications/whatsapp"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Buscar notificaciones fallidas (con un límite para no saturar)
  const failedNotifications = await db.notification.findMany({
    where: { 
      status: "failed",
      type: { not: "inbound" }
    },
    take: 50,
    orderBy: { createdAt: "desc" }
  })

  if (failedNotifications.length === 0) {
    return NextResponse.json({ successCount: 0, failedCount: 0, message: "No hay notificaciones fallidas para reintentar" })
  }

  let successCount = 0
  let failedCount = 0

  // Procesar secuencialmente para no saturar Evolution API
  for (const notif of failedNotifications) {
    if (!notif.recipient) {
      failedCount++
      continue
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
      console.warn(`🛑 [RETRY FAILSAFE] Cancelando reintento para ${notif.recipient} porque ya existe un registro exitoso.`)
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

    if (!messageId) {
      await db.notification.update({
        where: { id: notif.id },
        data:  { 
          errorDetails: error,
          retries: (notif.retries || 0) + 1,
          lastRetryAt: new Date(),
          actorId: session.user.id
        },
      })
      failedCount++
    } else {
      await db.notification.update({
        where: { id: notif.id },
        data:  { 
          status: "sent",
          errorDetails: null,
          retries: (notif.retries || 0) + 1,
          lastRetryAt: new Date(),
          actorId: session.user.id,
          messageId
        },
      })
      successCount++
    }

    // Pequeño delay entre envíos
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return NextResponse.json({ successCount, failedCount })
}
