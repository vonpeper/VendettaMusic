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
      const clientPhone = event.client?.whatsapp || event.client?.phone || ""
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

    revalidatePath("/admin")
    revalidatePath("/admin/ventas")
    
    return { success: true, message: `Se repararon ${count} registros correctamente.` }
  } catch (error: any) {
    console.error("Error en reparación:", error)
    return { success: false, message: error.message }
  }
}
