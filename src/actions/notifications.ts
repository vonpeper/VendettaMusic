"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { notifyWhatsApp } from "@/lib/notifications"

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
    const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
    
    let phone = ""
    let name = "Prueba"
    let message = ""

    if (target === "admin") {
      phone = config?.adminWhatsapp || ""
      name = "Administrador"
      message = "🤖 *PRUEBA AUTOMÁTICA — ADMINISTRADOR*\n\nHola, esta es una prueba de conexión con Evolution API desde el panel de Vendetta.\n\n— Sistema de Notificaciones"
    } else if (target === "musician") {
      const musician = await db.musicianProfile.findFirst({
        where: { OR: [{ whatsapp: { not: null } }, { phone: { not: null } }] },
        include: { user: true }
      })
      if (!musician) return { success: false, error: "No hay músicos con teléfono registrado" }
      phone = musician.whatsapp || musician.phone || ""
      name = musician.user.name || "Músico"
      message = `🤖 *PRUEBA AUTOMÁTICA — MÚSICO*\n\nHola ${name}, esta es una prueba técnica de convocatoria.\nNo es necesario responder.\n\n— Administración Vendetta`
    } else if (target === "client") {
      const client = await db.clientProfile.findFirst({
        where: { OR: [{ whatsapp: { not: null } }, { phone: { not: null } }] },
        include: { user: true }
      })
      if (!client) return { success: false, error: "No hay clientes con teléfono registrado" }
      phone = client.whatsapp || client.phone || ""
      name = client.user.name || "Cliente"
      message = `🤖 *PRUEBA AUTOMÁTICA — CLIENTE*\n\nHola ${name}, esta es una prueba técnica de seguimiento.\nNo es necesario responder.\n\n— Ventas Vendetta`
    }

    if (!phone) {
      return { success: false, error: `Número de ${target} no definido` }
    }

    const res = await notifyWhatsApp({
      phone,
      message,
      recipientName: name,
      type: "admin_booking", // Use a valid type
      category: "automatic_notification"
    })

    revalidatePath("/admin/notificaciones")
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error("Error sending test notification:", error)
    return { success: false, error: error.message }
  }
}
