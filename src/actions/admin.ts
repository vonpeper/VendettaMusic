"use server"

import { db } from "@/lib/db"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export async function repairOrphanedEvents() {
  console.log("--- Iniciando reparación de eventos huérfanos ---")
  
  try {
    const events = await db.event.findMany({
      where: {
        bookingRequest: null
      },
      include: {
        client: { include: { user: true } },
        location: true
      }
    })

    console.log(`Se encontraron ${events.length} eventos sin vinculación comercial.`)
    let count = 0

    for (const event of events) {
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
      const shortId = `VND-${randomHex}`
      
      const clientName = event.customName || event.client?.user.name || "Sin Nombre"
      const clientPhone = event.client?.whatsapp || ""
      const clientEmail = event.client?.user.email || ""

      await db.bookingRequest.create({
        data: {
          shortId,
          eventId: event.id,
          clientId: event.clientId,
          clientName,
          clientPhone,
          clientEmail,
          requestedDate: event.date,
          startTime: event.performanceStart || "21:00",
          endTime: event.performanceEnd || "23:00",
          packageName: "Paquete Manual (Reparado)",
          baseAmount: event.amount || 0,
          depositAmount: event.deposit || 0,
          paymentMethod: event.paymentMethod || "transfer",
          status: event.status === "scheduled" ? "agendado" : event.status,
          source: "manual",
          adminNote: event.musicianNotes || "Sincronizado automáticamente",
          venueType: event.ceremonyType || "salon",
          address: event.location?.address || "Dirección recuperada",
          city: event.location?.city || "CDMX",
          isPublic: event.isPublic,
        }
      })
      count++
    }

    // Migración de URLs de imágenes de la galería en SiteMedia
    let mediaMigratedCount = 0
    const renameMap: Record<string, string> = {
      "465316690_17947480430893604_4895218138077391354_n.jpeg": "vendetta-live-music-show-boda.jpeg",
      "480443072_617491504550335_3034048089450482085_n.jpg": "vendetta-concierto-versatil.jpg",
      "481504769_629534706679348_1561716134611844203_n.jpg": "vendetta-banda-en-vivo-evento.jpg",
      "514286757_724509610515190_4657541336968800422_n.jpg": "vendetta-cantante-escenario.jpg",
      "515963015_724509627181855_2465529527478650196_n.jpg": "vendetta-guitarrista-solo.jpg",
      "534982425_761041773528640_8278088169193635074_n.jpg": "vendetta-bateria-iluminacion.jpg",
      "535103174_761041763528641_7245225103265677160_n.jpg": "vendetta-saxofonista-metales.jpg",
      "535121155_761041770195307_8126776643887802338_n.jpg": "vendetta-trompetista-show.jpg",
      "535681229_761041766861974_6926113629069895939_n.jpg": "vendetta-vocalista-grupo.jpg",
      "536600427_761041776861973_6445050278382618381_n.jpg": "vendetta-bajista-ritmo.jpg",
      "597393886_854962487469901_2382660845125978946_n.jpg": "vendetta-musica-corporativo.jpg",
      "ChatGPT Image 10 abr 2026, 10_46_41 a.m..jpg": "vendetta-grupo-musical-animacion.jpg"
    }

    for (const [oldName, newName] of Object.entries(renameMap)) {
      const oldUrl = `/images/galeria/${oldName}`
      const newUrl = `/images/galeria/${newName}`
      
      const updated = await db.siteMedia.updateMany({
        where: { url: oldUrl },
        data: { url: newUrl }
      })
      if (updated.count > 0) {
        mediaMigratedCount += updated.count
        console.log(`Migrada imagen en DB: ${oldUrl} -> ${newUrl} (Afectados: ${updated.count})`)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/admin/ventas")
    
    return { success: true, message: `Se repararon ${count} registros. Imágenes migradas en DB: ${mediaMigratedCount}.` }
  } catch (error: any) {
    console.error("Error en reparación:", error)
    return { success: false, message: error.message }
  }
}
