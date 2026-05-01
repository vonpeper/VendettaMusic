import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWhatsApp } from "@/lib/notifications"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { notificationId } = await req.json()
  if (!notificationId) {
    return NextResponse.json({ error: "notificationId requerido" }, { status: 400 })
  }

  const existing = await db.notification.findUnique({ where: { id: notificationId } })
  if (!existing) {
    return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
  }
  if (!existing.recipient) {
    return NextResponse.json({ error: "Falta destinatario" }, { status: 400 })
  }

  const messageId = await sendWhatsApp(existing.recipient, existing.message)

  if (!messageId) {
    await db.notification.update({
      where: { id: notificationId },
      data:  { status: "failed" },
    })
    return NextResponse.json({ success: false, error: "Evolution API rechazó el mensaje" }, { status: 502 })
  }

  await db.notification.create({
    data: {
      eventId:   existing.eventId,
      type:      existing.type,
      channel:   "whatsapp",
      recipient: existing.recipient,
      message:   existing.message,
      status:    "sent",
      messageId,
    },
  })

  await db.notification.update({
    where: { id: notificationId },
    data:  { status: "sent" },
  })

  return NextResponse.json({ success: true, messageId })
}
