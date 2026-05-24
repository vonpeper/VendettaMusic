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

    const { messageId, error } = await sendWhatsApp(notif.recipient, notif.message)

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
