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

export async function markBookingAsPaidAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid" }
    })

    if (booking.eventId) {
      await db.event.update({
        where: { id: booking.eventId },
        data: { balance: 0 }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error marking booking as paid:", error)
    return { success: false, error: "Error al liquidar el pago." }
  }
}
export async function markContractAsSignedAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: { include: { contracts: true } } }
    })

    if (!booking || !booking.eventId) {
      return { success: false, error: "No se encontró un evento vinculado." }
    }

    // Si tiene contrato, marcar el primero como firmado
    if (booking.event?.contracts && booking.event.contracts.length > 0) {
      await db.contract.update({
        where: { id: booking.event.contracts[0].id },
        data: { status: "signed" }
      })
    } else {
      // Si no tiene, crear uno firmado (fallback)
      await db.contract.create({
        data: {
          eventId: booking.eventId,
          status: "signed",
        }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error marking contract as signed:", error)
    return { success: false, error: "Error al firmar el contrato." }
  }
}
