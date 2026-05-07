"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { notifyMusicians } from "@/lib/notifications"
import { formatDateMX } from "@/lib/utils"

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
    const br = await db.bookingRequest.findUnique({ 
      where: { id: bookingId },
      include: { 
        event: { 
          include: { 
            location: true,
            package: true,
            client: { include: { user: true } }
          } 
        } 
      }
    })

    if (br?.eventId && br.event) {
      await db.event.update({
        where: { id: br.eventId },
        data: { status: newStatus }
      })

      if (newStatus === "agendado" && !br.event.notificationSent) {
        const gigDetails = {
          clientName: br.clientName,
          date: br.event.date,
          ceremonyType: br.event.ceremonyType,
          guestCount: br.event.guestCount || 0,
          locationName: br.event.location?.name || br.address || "Por confirmar",
          locationAddress: br.event.location?.address || "",
          performanceStart: br.event.performanceStart,
          performanceEnd: br.event.performanceEnd,
          musicianNotes: br.event.musicianNotes,
          isPublic: br.event.isPublic,
          packageName: br.event.package?.name || br.packageName
        }
        await notifyMusicians(br.eventId, gigDetails, db)
      }
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
      include: { 
        event: { 
          include: { 
            contracts: true,
            location: true,
            package: true
          } 
        } 
      }
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

    // Notificar a músicos automáticamente al firmar contrato
    if (booking.event && booking.event.status === "agendado") {
      const gigDetails = {
        clientName: booking.clientName,
        date: booking.event.date,
        ceremonyType: booking.event.ceremonyType,
        guestCount: booking.event.guestCount || 0,
        locationName: booking.event.location?.name || booking.address || "Por confirmar",
        locationAddress: booking.event.location?.address || "",
        performanceStart: booking.event.performanceStart,
        performanceEnd: booking.event.performanceEnd,
        musicianNotes: booking.event.musicianNotes,
        isPublic: booking.event.isPublic,
        packageName: booking.event.package?.name || booking.packageName
      }
      
      await notifyMusicians(booking.eventId, gigDetails, db)
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
