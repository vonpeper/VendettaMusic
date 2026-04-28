"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { notifyWhatsApp } from "@/lib/notifications"
import { formatDateMX } from "@/lib/utils"

export async function createRehearsalAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const dateStr = data.date as string
    const timeStr = data.time as string
    const locationId = data.locationId as string
    const notes = data.notes as string

    // Combine date and time
    const datetime = new Date(`${dateStr}T${timeStr}:00`)

    // Arrays
    const songIds = (formData.getAll("songIds") as string[]).filter(id => id.trim() !== "")
    const musicianProfileIds = formData.getAll("musicianProfileIds") as string[]
    const notifyPhones = formData.getAll("notifyPhones") as string[]
    
    // New songs logic
    const newSongTitles = formData.getAll("newSongTitle") as string[]
    const newSongArtists = formData.getAll("newSongArtist") as string[]

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

    // Create any new songs first
    const createdSongIds: string[] = []
    for (let i = 0; i < newSongTitles.length; i++) {
      const title = newSongTitles[i]
      const artist = newSongArtists[i]
      if (title && title.trim()) {
        const newSong = await db.song.create({
          data: {
            title: title.trim(),
            artist: (artist || "Desconocido").trim(),
            status: "active"
          }
        })
        createdSongIds.push(newSong.id)
      }
    }

    const allSongIds = [...songIds, ...createdSongIds].filter(id => !!id && id.trim() !== "")
    const cleanMusicianIds = musicianProfileIds.filter(id => !!id && id.trim() !== "")

    // 1. Crear el Ensayo (Cabecera)
    const rehearsal = await db.rehearsal.create({
      data: {
        datetime,
        locationId: finalLocationId || null,
        notes: notes || null,
      }
    })

    console.log("✅ Ensayo creado ID:", rehearsal.id)

    // 2. Vincular Canciones
    if (allSongIds.length > 0) {
      console.log("🎵 Vinculando canciones:", allSongIds.length)
      for (const sId of allSongIds) {
        await db.rehearsalSong.create({
          data: {
            rehearsalId: rehearsal.id,
            songId: sId
          }
        })
      }
    }

    // 3. Vincular Músicos
    if (cleanMusicianIds.length > 0) {
      console.log("🎸 Vinculando músicos:", cleanMusicianIds.length)
      for (const mId of cleanMusicianIds) {
        await db.rehearsalMusician.create({
          data: {
            rehearsalId: rehearsal.id,
            musicianId: mId
          }
        })
      }
    }

    // 4. Obtener objeto completo para notificación (usando include si el ORM lo permite o manual)
    const fullRehearsal = await db.rehearsal.findUnique({
      where: { id: rehearsal.id },
      include: {
        location: true,
        songs: { include: { song: true } }
      }
    })

    // Prepare WhatsApp Message
    if (notifyPhones.length > 0 && fullRehearsal) {
      const displayDate = formatDateMX(datetime, "EEEE, d 'de' MMMM, yyyy - HH:mm 'hrs'")
      const locationName = fullRehearsal.location?.name || locationFree || "Por confirmar"
      const songsList = (fullRehearsal.songs || []).map((s: any) => `- ${s.song?.title} (${s.song?.artist})`).join("\n")
      
      const message = `🥁 *NUEVO ENSAYO — VENDETTA* 🥁
 
📅 *Fecha y Hora:* ${displayDate}
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
          await notifyWhatsApp({
            to: phone,
            type: "rehearsal_created",
            data: {
              date:      displayDate,
              location:  locationName,
              notes:     notes || "Sin notas adicionales.",
              songsList: songsList || "No se especificaron canciones."
            }
          })
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

export async function updateRehearsalAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const rehearsalId = data.rehearsalId as string
    const dateStr = data.date as string
    const timeStr = data.time as string
    const locationId = data.locationId as string
    const notes = data.notes as string

    if (!rehearsalId) throw new Error("ID de ensayo no proporcionado")

    const datetime = new Date(`${dateStr}T${timeStr}:00`)

    // Handle location logic (same as create)
    let finalLocationId = locationId
    const locationFree = data.locationFree as string
    if (locationFree) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({ name: locationFree, address: locationFree })
      if (locId) finalLocationId = locId
    }

    // New songs logic (same as create)
    const newSongTitles = formData.getAll("newSongTitle") as string[]
    const newSongArtists = formData.getAll("newSongArtist") as string[]
    const createdSongIds: string[] = []
    for (let i = 0; i < newSongTitles.length; i++) {
      const title = newSongTitles[i]
      const artist = newSongArtists[i]
      if (title && title.trim()) {
        const newSong = await db.song.create({
          data: { title: title.trim(), artist: (artist || "Desconocido").trim(), status: "active" }
        })
        createdSongIds.push(newSong.id)
      }
    }

    const songIds = (formData.getAll("songIds") as string[]).filter(id => id.trim() !== "")
    const musicianProfileIds = formData.getAll("musicianProfileIds") as string[]
    const allSongIds = [...songIds, ...createdSongIds].filter(id => !!id && id.trim() !== "")
    const cleanMusicianIds = musicianProfileIds.filter(id => !!id && id.trim() !== "")

    // 1. Update Header
    await db.rehearsal.update({
      where: { id: rehearsalId },
      data: {
        datetime,
        locationId: finalLocationId || null,
        notes: notes || null
      }
    })

    // 2. Sync Songs (Delete & Create)
    await db.rehearsalSong.deleteMany({ where: { rehearsalId } })
    for (const sId of allSongIds) {
      await db.rehearsalSong.create({ data: { rehearsalId, songId: sId } })
    }

    // 3. Sync Musicians (Delete & Create)
    await db.rehearsalMusician.deleteMany({ where: { rehearsalId } })
    for (const mId of cleanMusicianIds) {
      await db.rehearsalMusician.create({ data: { rehearsalId, musicianId: mId } })
    }

    revalidatePath("/admin/ensayos")
    return { success: true, message: "Ensayo actualizado correctamente" }
  } catch (error: any) {
    console.error("Error updating rehearsal:", error)
    return { success: false, error: "Error al actualizar el ensayo" }
  }
}
