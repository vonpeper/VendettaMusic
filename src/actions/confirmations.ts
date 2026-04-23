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
