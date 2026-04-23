"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { buildGigMessage, notifyMusicians } from "@/lib/notifications"

export async function updateEventAction(id: string, _prev: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const amount = parseFloat(data.amount as string || "0")
    const deposit = parseFloat(data.deposit as string || "0")
    const invoice = data.invoice === "on" || data.invoice === "true"

    let dateValue: Date | undefined = undefined
    if (data.date) {
      const parsedDate = new Date((data.date as string) + "T12:00:00")
      if (isNaN(parsedDate.getTime())) {
        return { success: false, message: "Fecha inválida proporcionada" }
      }
      dateValue = parsedDate
    }

    let finalLocationId = data.locationId as string

    // Si hay texto libre, usamos la nueva utilidad de consolidación
    const locationFree = data.locationFree as string
    if (locationFree) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({
        name: locationFree,
        address: locationFree,
        mapsLink: data.mapsLink as string || null
      })
      if (locId) finalLocationId = locId
    }

    await db.event.update({
      where: { id },
      data: {
        date: dateValue,
        amount,
        deposit,
        balance: amount - deposit,
        ivaAmount: parseFloat(data.ivaAmount as string || "0"),
        totalIncome: parseFloat(data.totalIncome as string || "0"),
        paymentMethod: (data.paymentMethod as string) || (data.depositMethod as string) || null,
        paymentRef: (data.paymentRef as string) || null,
        status: (data.status as string) || "scheduled",
        performanceStart: (data.performanceStart as string) || null,
        performanceEnd: (data.performanceEnd as string) || null,
        arrivalTime: (data.arrivalTime as string) || null,
        setupTime: (data.setupTime as string) || null,
        ceremonyType: (data.ceremonyType as string) || "show",
        dressCode: (data.dressCode as string) || null,
        location: finalLocationId ? { connect: { id: finalLocationId } } : { disconnect: true },
        package: data.packageId ? { connect: { id: data.packageId as string } } : { disconnect: true },
        guestCount: parseInt(data.guestCount as string || "0"),
        invoice,
        totalWithTax: invoice ? amount * 1.16 : amount,
        depositMethod: (data.depositMethod as string) || null,
        musicianNotes: (data.musicianNotes as string) || null,
        customName: (data.customName as string) || null,
        isPublic: data.isPublic === "on" || data.isPublic === "true",
        mapsLink: (data.mapsLink as string) || null,
        source: (data.source as string) || "manual",
        bitacora: (data.bitacora as string) || null,
        audioEngineer: (data.audioEngineer as string) || null,
      }
    })
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/")

    // Notificación opcional
    let gigMessage = ""
    if (data.sendNotification === "on" || data.sendNotification === "true") {
      const gigDetails = {
        clientName: data.customName as string || (await db.event.findUnique({ where: { id }, include: { client: { include: { user: true } } } }))?.client?.user?.name || "Sin Nombre",
        date: dateValue || new Date(),
        ceremonyType: data.ceremonyType as string,
        guestCount: parseInt(data.guestCount as string || "0"),
        locationName: locationFree || "",
        performanceStart: data.performanceStart as string,
        performanceEnd: data.performanceEnd as string,
        musicianNotes: data.musicianNotes as string,
        isPublic: data.isPublic === "on" || data.isPublic === "true",
      }
      gigMessage = buildGigMessage(gigDetails)
      await notifyMusicians(id, gigDetails, db)
    }

    return { 
      success: true, 
      message: "Evento actualizado correctamente",
      gigMessage 
    }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { success: false, message: `Error al actualizar: ${error?.message || "Error desconocido"}` }
  }
}

export async function deleteEventAction(id: string) {
  try {
    await db.event.delete({
      where: { id }
    })
    revalidatePath("/admin/eventos")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting event:", error)
    return { success: false, error: "Error al eliminar el evento" }
  }
}

export async function createEventAction(_prev: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const amount = parseFloat(data.amount as string || "0")
    const deposit = parseFloat(data.deposit as string || "0")
    
    let finalLocationId = data.locationId as string

    // Automación de catálogo de ubicaciones con nueva utilidad
    const locationFree = data.locationFree as string
    if (locationFree) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({
        name: locationFree,
        address: locationFree,
        mapsLink: data.mapsLink as string || null
      })
      if (locId) finalLocationId = locId
    }

    const event = await db.event.create({
      data: {
        clientId: (data.clientId as string) || null,
        date: new Date((data.date as string) + "T12:00:00"),
        amount,
        deposit,
        balance: amount - deposit,
        ivaAmount: parseFloat(data.ivaAmount as string || "0"),
        totalIncome: parseFloat(data.totalIncome as string || "0"),
        paymentMethod: (data.paymentMethod as string) || (data.depositMethod as string) || null,
        paymentRef: (data.paymentRef as string) || null,
        ceremonyType: (data.ceremonyType as string) || "show",
        guestCount: parseInt(data.guestCount as string || "0"),
        location: finalLocationId ? { connect: { id: finalLocationId } } : undefined,
        performanceStart: (data.performanceStart as string) || null,
        performanceEnd: (data.performanceEnd as string) || null,
        arrivalTime: (data.arrivalTime as string) || null,
        setupTime: (data.setupTime as string) || null,
        dressCode: (data.dressCode as string) || null,
        status: (data.status as string) || "scheduled",
        musicianNotes: (data.musicianNotes as string) || null,
        invoice: data.invoice === "on" || data.invoice === "true",
        depositMethod: (data.depositMethod as string) || null,
        customName: (data.customName as string) || null,
        isPublic: data.isPublic === "on" || data.isPublic === "true",
        mapsLink: (data.mapsLink as string) || null,
        source: (data.source as string) || "manual",
        bitacora: (data.bitacora as string) || null,
        audioEngineer: (data.audioEngineer as string) || null,
      },
      include: {
        client: { include: { user: true } },
        location: true,
      }
    })

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/")

    // Notificación opcional
    let gigMessage = ""
    if (data.sendNotification === "on" || data.sendNotification === "true") {
      const gigDetails = {
        clientName: data.customName as string || event.client?.user?.name || "Sin Nombre",
        date: event.date,
        ceremonyType: event.ceremonyType,
        guestCount: event.guestCount || 0,
        locationName: event.location?.name || locationFree || "",
        locationAddress: event.location?.address || "",
        performanceStart: event.performanceStart,
        performanceEnd: event.performanceEnd,
        musicianNotes: event.musicianNotes,
        isPublic: event.isPublic,
      }
      gigMessage = buildGigMessage(gigDetails)
      await notifyMusicians(event.id, gigDetails, db)
    }

    return { 
      success: true, 
      message: "Evento creado exitosamente", 
      eventId: event.id,
      gigMessage 
    }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { success: false, message: `Error al crear el evento: ${error?.message || "Error desconocido"}` }
  }
}

export async function notifyEventAction(id: string) {
  try {
    await db.event.update({
      where: { id },
      data: { notificationSent: true }
    })
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error notifying event:", error)
    return { success: false }
  }
}

/**
 * Acción rápida para cambiar el estatus desde la tabla
 */
export async function updateEventStatusAction(id: string, newStatus: string) {
  try {
    const event = await db.event.update({
      where: { id },
      data: { status: newStatus }
    })

    // Sincronizar con BookingRequest si existe
    if (event.quoteId) {
       await db.bookingRequest.updateMany({
         where: { eventId: id },
         data: { status: newStatus }
       })
    }

    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin/eventos")
    revalidatePath("/")
    
    return { success: true }
  } catch (error) {
    console.error("Error updating event status:", error)
    return { success: false, error: "No se pudo actualizar el estatus" }
  }
}
