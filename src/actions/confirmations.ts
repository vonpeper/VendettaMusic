"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function confirmAttendanceAction(musicianId: string, eventId: string) {
  try {
    // Check if musician exists
    const musician = await db.musicianProfile.findUnique({ where: { id: musicianId } })
    if (!musician) return { success: false, error: "Músico no encontrado" }

    // Check if event exists
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return { success: false, error: "Evento no encontrado" }

    // Find existing record
    const existing = await db.eventMusician.findFirst({
      where: { eventId, musicianId }
    })

    if (existing) {
      await db.eventMusician.update({
        where: { id: existing.id },
        data: { status: "confirmed" }
      })
    } else {
      await db.eventMusician.create({
        data: {
          eventId,
          musicianId,
          status: "confirmed"
        }
      })
    }

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error) {
    console.error("Error confirming attendance:", error)
    return { success: false, error: "Error al confirmar asistencia" }
  }
}

export async function rejectAttendanceAction(musicianId: string, eventId: string) {
  try {
    const [musician, event, config] = await Promise.all([
      db.musicianProfile.findUnique({ where: { id: musicianId }, include: { user: true } }),
      db.event.findUnique({ where: { id: eventId } }),
      db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    ])

    if (!musician || !event) return { success: false, error: "Datos no encontrados" }

    // Actualizar estatus a rejected
    const existing = await db.eventMusician.findFirst({ where: { eventId, musicianId } })
    if (existing) {
      await db.eventMusician.update({ where: { id: existing.id }, data: { status: "rejected" } })
    } else {
      await db.eventMusician.create({ data: { eventId, musicianId, status: "rejected" } })
    }

    // NOTIFICAR AL ADMIN: Kevin no puede ir, búscame un reemplazo
    if (config?.adminWhatsapp) {
      const { sendWhatsApp } = await import("@/lib/notifications")
      const eventDateStr = event.date.toLocaleDateString("es-MX", { day: 'numeric', month: 'long' })
      const message = `⚠️ *RECHAZO DE FECHA*
El músico *${musician.user?.name || "Desconocido"}* ha indicado que *NO ESTÁ DISPONIBLE* para el evento:
🎸 *${event.customName || "Evento Vendetta"}*
📅 *Fecha:* ${eventDateStr}

Favor de buscar un reemplazo.`
      
      await sendWhatsApp(config.adminWhatsapp, message).catch(e => console.error("Error notifying admin of rejection:", e))
    }

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting attendance:", error)
    return { success: false, error: "Error al rechazar asistencia" }
  }
}
