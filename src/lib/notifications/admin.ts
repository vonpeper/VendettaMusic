import { sendWhatsApp } from "./whatsapp"

/**
 * Notificación interna para administradores
 */
export async function dispatchAdminAlert(message: string) {
  const { db } = await import("../db")
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  if (!config?.adminWhatsapp) return

  const cleanPhone = config.adminWhatsapp.replace(/\D/g, "")
  const to = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone
  
  await sendWhatsApp(to, message, "Admin Alert")
}
