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

  let cleanMessage = existing.message
  let extractedError = existing.errorDetails
  if (cleanMessage.startsWith("ERROR: ") && cleanMessage.includes(" | MSG: ")) {
    const parts = cleanMessage.split(" | MSG: ")
    const errPart = parts[0].substring(7) // Strip "ERROR: "
    cleanMessage = parts.slice(1).join(" | MSG: ")
    extractedError = errPart
    // Guardar los valores limpios en la base de datos para corregir el registro corrupto
    await db.notification.update({
      where: { id: notificationId },
      data: {
        message: cleanMessage,
        errorDetails: extractedError
      }
    }).catch(() => {})
  }

  const { messageId, error } = await sendWhatsApp(existing.recipient, cleanMessage)

  if (!messageId) {
    await db.notification.update({
      where: { id: notificationId },
      data:  { 
        status: "failed",
        errorDetails: error,
        retries: existing.retries + 1,
        lastRetryAt: new Date(),
        actorId: session.user.id
      },
    })
    return NextResponse.json({ success: false, error: error || "Evolution API rechazó el mensaje" }, { status: 502 })
  }

  await db.notification.update({
    where: { id: notificationId },
    data:  { 
      status: "sent",
      errorDetails: null, // Clear error on success
      retries: existing.retries + 1,
      lastRetryAt: new Date(),
      actorId: session.user.id,
      messageId
    },
  })

  return NextResponse.json({ success: true, messageId })
}
