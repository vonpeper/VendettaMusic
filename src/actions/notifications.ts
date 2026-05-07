"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sendWhatsApp } from "@/lib/notifications"

export async function clearAllNotificationsAction() {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    await db.notification.deleteMany({})
    revalidatePath("/admin/notificaciones")
    return { success: true }
  } catch (error: any) {
    console.error("Error clearing notifications:", error)
    return { success: false, error: error.message }
  }
}

export async function sendTestNotificationAction(target: "admin" | "musician" | "client") {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

    let phone = ""
    let recipientName = "Prueba"
    let message = ""

    if (target === "admin") {
      phone = config?.adminWhatsapp || ""
      recipientName = "Administrador"
      message = "🤖 *PRUEBA AUTOMÁTICA — ADMINISTRADOR*\n\nHola, esta es una prueba de conexión con Evolution API desde el panel de Vendetta.\n\n— Sistema de Notificaciones"
    } else if (target === "musician") {
      const musician = await db.musicianProfile.findFirst({
        include: { user: true }
      })
      
      const phoneToUse = musician?.whatsapp || musician?.phone || musician?.user?.phone
      
      if (!musician || !phoneToUse) {
        return { success: false, error: "No hay músicos con teléfono registrado" }
      }
      
      phone = phoneToUse.replace(/\D/g, "")
      recipientName = musician.user.name || "Músico"
      message = `🤖 *PRUEBA AUTOMÁTICA — MÚSICO*\n\nHola ${recipientName}, esta es una prueba técnica de convocatoria.\nNo es necesario responder.\n\n— Administración Vendetta`
    } else if (target === "client") {
      const client = await db.clientProfile.findFirst({
        where: { OR: [{ whatsapp: { not: null } }, { phone: { not: null } }] },
        include: { user: true }
      })
      if (!client) return { success: false, error: "No hay clientes con teléfono registrado" }
      phone = client.whatsapp || client.phone || ""
      recipientName = client.user.name || "Cliente"
      message = `🤖 *PRUEBA AUTOMÁTICA — CLIENTE*\n\nHola ${recipientName}, esta es una prueba técnica de seguimiento.\nNo es necesario responder.\n\n— Ventas Vendetta`
    }

    if (!phone) {
      return {
        success: false,
        error: target === "admin"
          ? "Número del administrador no definido. Ve a Configuración > Integraciones > WhatsApp del Administrador."
          : `Número de ${target} no encontrado en la base de datos.`
      }
    }

    // Use sendWhatsApp (raw Evolution API call)
    const msgId = await sendWhatsApp(phone, message)
    const status = msgId ? "sent" : "failed"

    // Log to Notification table so it shows in the notification center
    await db.notification.create({
      data: {
        type: "admin_booking",
        channel: "whatsapp",
        status,
        message,
        recipient: phone,
        template: `test_${target}`,
        messageId: msgId || undefined,
        category: "automatic_notification"
      }
    })

    revalidatePath("/admin/notificaciones")
    return {
      success: !!msgId,
      error: msgId ? undefined : "Evolution API no configurada o no respondió. Verifica la instancia en Configuración."
    }
  } catch (error: any) {
    console.error("Error sending test notification:", error)
    return { success: false, error: error.message }
  }
}
