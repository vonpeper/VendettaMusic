"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function importSongsAction(songsRaw: string) {
  try {
    const lines = songsRaw.split("\n").filter(l => l.trim().length > 0)
    
    // Heuristic processing: "Title - Artist" or just "Title"
    const songData = lines.map(line => {
      let title = line.trim()
      let artist = "Desconocido"
      let genre = "Pop" // Default
      let era = "Actual"

      if (line.includes(" - ")) {
        const parts = line.split(" - ")
        title = parts[0].trim()
        artist = parts.slice(1).join(" - ").trim()
      } else if (line.includes("-")) {
        const parts = line.split("-")
        title = parts[0].trim()
        artist = parts.slice(1).join("-").trim()
      } else if (line.includes(" by ")) {
        const parts = line.split(" by ")
        title = parts[0].trim()
        artist = parts.slice(1).join(" by ").trim()
      }

      // Simple heuristic for era/genre
      const fullText = (title + " " + artist).toLowerCase()
      if (fullText.includes("disco") || fullText.includes("bee gees") || fullText.includes("abba")) {
        genre = "Disco"
        era = "70s"
      } else if (fullText.includes("80s") || fullText.includes("rock") || fullText.includes("queen")) {
        genre = "Rock"
        era = "80s"
      } else if (fullText.includes("reggaeton") || fullText.includes("bad bunny") || fullText.includes("j balvin")) {
        genre = "Reggaeton"
        era = "Actual"
      } else if (fullText.includes("salsa") || fullText.includes("cumbia") || fullText.includes("marc anthony")) {
        genre = "Tropical"
        era = "Clásicos"
      }

      return { title, artist, genre, era }
    })

    console.log(`🚀 Iniciando importación de ${songData.length} canciones...`)

    // Create many
    let importedCount = 0
    for (const s of songData) {
      try {
        await db.song.create({
          data: {
            title: s.title,
            artist: s.artist,
            genre: s.genre,
            era: s.era,
            status: "active"
          }
        })
        importedCount++
      } catch (e) {
        console.error(`❌ Error importando canción: ${s.title}`, e)
      }
    }

    console.log(`✅ Importación finalizada. Éxito: ${importedCount}/${songData.length}`)
    
    revalidatePath("/admin/repertorio")
    return { success: true, count: importedCount }
  } catch (error: any) {
    console.error("🔥 Error crítico en importación:", error)
    return { success: false, error: "Error interno al procesar la lista" }
  }
}

export async function createSetlistAction(name: string, songIds: string[]) {
  try {
    const setlist = await db.setlist.create({
      data: {
        name,
        songs: {
          create: songIds.map((id, index) => ({
            songId: id,
            order: index
          }))
        }
      }
    })

    revalidatePath("/admin/repertorio")
    return { success: true, id: setlist.id }
  } catch (error: any) {
    console.error("Error creating setlist:", error)
    return { success: false, error: "Error al crear setlist" }
  }
}

export async function deleteSetlistAction(id: string) {
  try {
    await db.setlist.delete({ where: { id } })
    revalidatePath("/admin/repertorio")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al eliminar setlist" }
  }
}

export async function deleteSongsAction(ids: string[]) {
  try {
    await db.song.deleteMany({
      where: {
        id: { in: ids }
      }
    })
    revalidatePath("/admin/repertorio")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al eliminar canciones" }
  }
}

export async function updateSongAction(id: string, data: any) {
  try {
    await db.song.update({
      where: { id },
      data
    })
    revalidatePath("/admin/repertorio")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar canción" }
  }
}
