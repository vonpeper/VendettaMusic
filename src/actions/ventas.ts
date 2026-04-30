"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function markBookingAsCompleted(bookingId: string) {
  try {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        status: "completado",
        paymentStatus: "paid"
      }
    })
    
    // Sincronizar con Event y Quote si existen
    const br = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (br) {
      if (br.eventId) {
        await db.event.update({
          where: { id: br.eventId },
          data: { status: "completado" }
        })
      }
      // Si es legacy y tiene quoteId (asumiendo que podría existir una relación indirecta o si bookingRequest se convirtió de Quote)
      // Pero usualmente BookingRequest e Event son la pareja principal ahora.
    }

    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error marking booking as completed:", error)
    return { success: false, error: "Error al completar el contrato." }
  }
}

export async function updateBookingStatusAction(bookingId: string, newStatus: string) {
  try {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        status: newStatus,
        ...(newStatus === "completado" ? { paymentStatus: "paid" } : {})
      }
    })

    // Sincronizar con Event
    const br = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (br?.eventId) {
      await db.event.update({
        where: { id: br.eventId },
        data: { status: newStatus }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath("/admin/eventos")
    return { success: true }
  } catch (error) {
    console.error("Error updating booking status:", error)
    return { success: false, error: "Error al actualizar el estado." }
  }
}
