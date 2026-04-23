"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { sendWhatsApp } from "@/lib/notifications"
import { formatDateMX } from "@/lib/utils"

export async function createRehearsalAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const datetimeStr = data.datetime as string
    const locationId = data.locationId as string
    const notes = data.notes as string

    // Arrays
    const songIds = formData.getAll("songIds") as string[]
    const musicianProfileIds = formData.getAll("musicianProfileIds") as string[]
    const notifyPhones = formData.getAll("notifyPhones") as string[]

    const datetime = new Date(datetimeStr)

    // Handle free text location using the existing locations util
    let finalLocationId = locationId
    const locationFree = data.locationFree as string
    if (locationFree) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({
        name: locationFree,
        address: locationFree,
      })
      if (locId) finalLocationId = locId
    }

    const rehearsal = await db.rehearsal.create({
      data: {
        datetime,
        locationId: finalLocationId || null,
        notes: notes || null,
        songs: {
          create: songIds.map(id => ({ songId: id }))
        },
        musicians: {
          create: musicianProfileIds.map(id => ({ musicianId: id }))
        }
      },
      include: {
        location: true,
        songs: { include: { song: true } }
      }
    })

    // Prepare WhatsApp Message
    if (notifyPhones.length > 0) {
      const dateStr = formatDateMX(datetime, "EEEE, d 'de' MMMM, yyyy - HH:mm 'hrs'")
      const locationName = rehearsal.location?.name || locationFree || "Por confirmar"
      const songsList = rehearsal.songs.map(s => `- ${s.song.title} (${s.song.artist})`).join("\n")
      
      const message = `🥁 *NUEVO ENSAYO — VENDETTA* 🥁

📅 *Fecha y Hora:* ${dateStr}
📍 *Lugar:* ${locationName}

📝 *Tarea / Notas:* 
${notes || "Sin notas adicionales."}

🎶 *Repertorio a ensayar:*
${songsList || "No se especificaron canciones."}

⚠️ Confirma de recibido respondiendo este mensaje.
— Administración Vendetta`

      // Send to all selected phones
      for (const phone of notifyPhones) {
        if (phone) {
          await sendWhatsApp(phone, message)
        }
      }
    }

    revalidatePath("/admin/ensayos")
    return { success: true, message: "Ensayo agendado y notificado correctamente" }
  } catch (error: any) {
    console.error("Error creating rehearsal:", error)
    return { success: false, error: "Error al agendar el ensayo" }
  }
}

export async function deleteRehearsalAction(id: string) {
  try {
    await db.rehearsal.delete({
      where: { id }
    })
    
    revalidatePath("/admin/ensayos")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting rehearsal:", error)
    return { success: false, error: "Error al eliminar el ensayo" }
  }
}
