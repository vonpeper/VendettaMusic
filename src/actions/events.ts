"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { notifyMusicians, notifyEventCancellation } from "@/lib/notifications"
import { assignDefaultMusicians } from "@/lib/musicians"
import crypto from "crypto"

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

    const ivaAmount = invoice ? Math.round(amount * 0.16 * 100) / 100 : 0

    await db.event.update({
      where: { id },
      data: {
        date: dateValue,
        amount,
        deposit,
        balance: amount - deposit,
        ivaAmount,
        totalIncome: parseFloat(data.totalIncome as string || "0") || amount,
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
        totalWithTax: amount + ivaAmount,
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

    // Sincronizar con Quote (Legacy) si existe
    const updatedEvent = await db.event.findUnique({ 
      where: { id },
      include: { location: true, package: true, client: { include: { user: true } } }
    })

    // Sincronizar con ClientProfile si existe para mantener el dato maestro actualizado
    // (Eliminado: No debemos sobreescribir el nombre del cliente con data.customName que es el nombre del show)


    if (updatedEvent?.quoteId) {
      await db.quote.update({
        where: { id: updatedEvent.quoteId },
        data: { 
          status: (data.status as string) || "scheduled"
        }
      })
    }

    // Sincronizar con BookingRequest (Nuevo Funnel)
    const existingBooking = await db.bookingRequest.findUnique({ where: { eventId: id } })
    
    if (existingBooking) {
      await db.bookingRequest.update({
        where: { eventId: id },
        data: {
          status: (data.status as string) || "scheduled",
          requestedDate: dateValue,
          startTime: (data.performanceStart as string) || "21:00",
          endTime: (data.performanceEnd as string) || "23:00",
          baseAmount: amount,
          depositAmount: deposit,
          venueType: (data.ceremonyType as string) || "salon",
          clientName: (data.customName as string) || undefined,
          isPublic: data.isPublic === "on" || data.isPublic === "true",
          adminNote: (data.musicianNotes as string) || undefined,
          ...(data.status === "completado" ? { paymentStatus: "paid" } : {})
        }
      })
    } else {
      // Si no existe, lo creamos (Self-healing)
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
      const shortId = `VND-${randomHex}`
      
      const evt = await db.event.findUnique({ 
        where: { id },
        include: { location: true, package: true, client: { include: { user: true } } }
      })

      if (evt) {
        await db.bookingRequest.create({
          data: {
            shortId,
            eventId: id,
            clientId: evt.clientId,
            clientName: evt.customName || evt.client?.user?.name || "Sin Nombre",
            clientPhone: evt.client?.whatsapp || "",
            clientEmail: evt.client?.user?.email || "",
            requestedDate: evt.date,
            startTime: evt.performanceStart || "21:00",
            endTime: evt.performanceEnd || "23:00",
            packageName: evt.package?.name || "Paquete Personalizado",
            packageId: evt.packageId,
            baseAmount: evt.amount,
            depositAmount: evt.deposit,
            paymentMethod: evt.paymentMethod || "transfer",
            status: evt.status,
            source: "manual",
            venueType: evt.ceremonyType || "salon",
            address: evt.location?.name || "Dirección manual",
            city: evt.location?.city || "CDMX",
          }
        })
      }
    }

    // 3. Gestionar Músicos (Si se proporcionan IDs)
    const musicianIds = formData.getAll("musicianIds") as string[]
    if (musicianIds.length > 0) {
      // Borrar anteriores para reemplazarlos
      await db.eventMusician.deleteMany({ where: { eventId: id } })
      for (const mId of musicianIds) {
        await db.eventMusician.create({
          data: {
            id: `${id}-${mId}`,
            eventId: id,
            musicianId: mId,
            status: "pending"
          }
        })
      }
    }

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/")

    // Notificación automática
    const shouldNotify = (data.sendNotification === "on" || data.sendNotification === "true")

    if (shouldNotify && updatedEvent) {
      // ASEGURAR QUE HAYA MÚSICOS: Si no hay músicos asignados, intentar asignar los titulares por default
      const currentMusicians = await db.eventMusician.count({ where: { eventId: id } })
      if (currentMusicians === 0) {
        console.log(`🤖 updateEventAction: No se encontraron músicos para el evento ${id}. Asignando titulares por default...`)
        await assignDefaultMusicians(id, db).catch(e => console.error("Error auto-assigning musicians in updateEventAction:", e))
      }

      const gigDetails = {
        clientName: data.customName as string || updatedEvent.client?.user?.name || "Sin Nombre",
        date: dateValue || updatedEvent.date,
        ceremonyType: updatedEvent.ceremonyType,
        guestCount: updatedEvent.guestCount || 0,
        locationName: locationFree || updatedEvent.location?.name || "",
        mapsLink: updatedEvent.location?.mapsLink || updatedEvent.mapsLink || "",
        locationAddress: updatedEvent.location?.address || "",
        performanceStart: updatedEvent.performanceStart,
        performanceEnd: updatedEvent.performanceEnd,
        arrivalTime: (data.arrivalTime as string) || updatedEvent.arrivalTime,
        setupTime: (data.setupTime as string) || updatedEvent.setupTime,
        dressCode: (data.dressCode as string) || updatedEvent.dressCode,
        musicianNotes: updatedEvent.musicianNotes,
        isPublic: updatedEvent.isPublic,
        packageName: updatedEvent.package?.name || "Paquete Personalizado"
      }
      // LOG DE INTENTO (Breadcrumb)
      await db.notification.create({
        data: {
          type: "SYSTEM_DEBUG",
          channel: "log",
          message: `Intentando notificar evento ${id}. Músicos encontrados en count: ${currentMusicians}`,
          status: "info"
        }
      }).catch(() => {})

      const notifyMusicianIds = formData.getAll("notifyMusicianIds") as string[]
      // Añadir ingeniero de audio si está seleccionado en el formulario
      const engineerId = data.audioEngineer as string
      if (engineerId) notifyMusicianIds.push(engineerId)
      await notifyMusicians(id, gigDetails, db, notifyMusicianIds.length ? notifyMusicianIds : undefined)
    }

    if ((data.status as string) === "cancelado") {
      console.log(`⚠️ updateEventAction: Detectada cancelación para evento ${id}. Notificando...`)
      await notifyEventCancellation(id, db).catch(e => console.error("Error sending cancellation notifications:", e))
    }

    return { 
      success: true, 
      message: "Evento actualizado correctamente",
      gigMessage: shouldNotify ? "Mensaje de convocatoria enviado por WhatsApp." : undefined
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
    const invoiceCreate = data.invoice === "on" || data.invoice === "true"
    
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

    const quoteId = crypto.randomUUID()
    const targetClientId = (data.clientId as string)
    
    if (targetClientId) {
      await db.quote.create({
        data: {
          id: quoteId,
          clientId: targetClientId,
          status: (data.status as string) || "scheduled",
          totalEstimated: amount,
          guestCount: parseInt(data.guestCount as string || "0"),
          ceremonyType: (data.ceremonyType as string) || "show",
          notes: (data.adminNote as string) || (data.musicianNotes as string) || "",
          eventDate: new Date((data.date as string) + "T12:00:00"),
          items: {
            create: [
              {
                description: `Evento Manual: ${data.customName || "Sin Nombre"}`,
                quantity: 1,
                unitCost: amount
              }
            ]
          }
        }
      })
    }

    const event = await db.event.create({
      data: {
        quoteId: targetClientId ? quoteId : null,
        clientId: targetClientId || null,
        date: new Date((data.date as string) + "T12:00:00"),
        amount,
        deposit,
        balance: amount - deposit,
        ivaAmount: invoiceCreate ? Math.round(amount * 0.16 * 100) / 100 : 0,
        totalIncome: parseFloat(data.totalIncome as string || "0") || amount,
        paymentMethod: (data.paymentMethod as string) || (data.depositMethod as string) || null,
        paymentRef: (data.paymentRef as string) || null,
        ceremonyType: (data.ceremonyType as string) || "show",
        guestCount: parseInt(data.guestCount as string || "0"),
        locationId: finalLocationId || null,
        performanceStart: (data.performanceStart as string) || null,
        performanceEnd: (data.performanceEnd as string) || null,
        arrivalTime: (data.arrivalTime as string) || null,
        setupTime: (data.setupTime as string) || null,
        dressCode: (data.dressCode as string) || null,
        status: (data.status as string) === "scheduled" ? "agendado" : (data.status as string) || "agendado",
        musicianNotes: (data.musicianNotes as string) || null,
        invoice: invoiceCreate,
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

    // [NUEVO] Crear BookingRequest para que aparezca en el Centro de Ventas
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
    const shortId = `VND-${randomHex}`
    
    // Obtener nombre del paquete
    let packageName = "Paquete Personalizado"
    if (data.packageId) {
      const pkg = await db.package.findUnique({ where: { id: data.packageId as string } })
      if (pkg) packageName = pkg.name
    }

    // Obtener info del cliente para el booking
    let clientName = (data.customName as string) || "Sin Nombre"
    let clientPhone = ""
    let clientEmail = ""
    
    if (targetClientId) {
      const fullClient = await db.clientProfile.findUnique({ 
        where: { id: targetClientId },
        include: { user: true }
      })
      if (fullClient) {
        clientName = fullClient.user.name || clientName
        clientPhone = fullClient.whatsapp || ""
        clientEmail = fullClient.user.email || ""
      }
    }

    await db.bookingRequest.create({
      data: {
        shortId,
        eventId: event.id,
        clientId: targetClientId || null,
        clientName,
        clientPhone,
        clientEmail,
        requestedDate: event.date,
        startTime: event.performanceStart || "21:00",
        endTime: event.performanceEnd || "23:00",
        packageName,
        packageId: (data.packageId as string) || null,
        baseAmount: amount,
        depositAmount: deposit,
        paymentMethod: (data.paymentMethod as string) || "transfer",
        status: event.status === "scheduled" ? "agendado" : event.status,
        source: "manual",
        adminNote: (data.musicianNotes as string) || "",
        venueType: (data.ceremonyType as string) || "salon",
        address: (data.locationFree as string) || event.location?.address || "Dirección manual",
        city: event.location?.city || "CDMX",
        isPublic: event.isPublic,
      }
    })

    // Gestionar Músicos (Si se proporcionan IDs)
    const musicianIds = formData.getAll("musicianIds") as string[]
    if (musicianIds.length > 0) {
      for (const mId of musicianIds) {
        await db.eventMusician.create({
          data: {
            id: `${event.id}-${mId}`,
            eventId: event.id,
            musicianId: mId,
            status: "pending"
          }
        })
      }
    } else {
      // Asignar automáticamente los músicos titulares al evento si no se pasaron IDs
      await assignDefaultMusicians(event.id, db)
    }

    // Sincronizar con Quote (Legacy) si existe
    if (event.quoteId) {
      await db.quote.update({
        where: { id: event.quoteId },
        data: { 
          status: (data.status as string) || "scheduled"
        }
      })
    }

    // Sincronizar con BookingRequest (Nuevo Funnel)
    await db.bookingRequest.updateMany({
      where: { eventId: event.id },
      data: {
        status: (data.status as string) || "scheduled",
        ...(data.status === "completado" ? { paymentStatus: "paid" } : {})
      }
    })

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/")

    // Notificación automática
    const shouldNotify = (data.sendNotification === "on" || data.sendNotification === "true")

    if (shouldNotify) {
      // ASEGURAR QUE HAYA MÚSICOS
      await assignDefaultMusicians(event.id, db).catch(e => console.error("Error auto-assigning musicians in createEventAction:", e))
      
      const gigDetails = {
        clientName: data.customName as string || event.client?.user?.name || "Sin Nombre",
        date: event.date,
        ceremonyType: event.ceremonyType,
        guestCount: event.guestCount || 0,
        locationName: event.location?.name || locationFree || "",
        mapsLink: event.location?.mapsLink || event.mapsLink || "",
        locationAddress: event.location?.address || "",
        performanceStart: event.performanceStart,
        performanceEnd: event.performanceEnd,
        arrivalTime: event.arrivalTime,
        setupTime: event.setupTime,
        dressCode: event.dressCode,
        musicianNotes: event.musicianNotes,
        isPublic: event.isPublic,
        packageName: packageName
      }
      // Construir lista de IDs a notificar (ingeniero + músicos explícitos)
      const targetIds: string[] = []
      const engineerId = data.audioEngineer as string
      if (engineerId) targetIds.push(engineerId)
      const extraNotifyIds = formData.getAll("notifyMusicianIds") as string[]
      if (extraNotifyIds.length) targetIds.push(...extraNotifyIds)
      await notifyMusicians(event.id, gigDetails, db, targetIds.length ? targetIds : undefined)
    }

    return { 
      success: true, 
      message: "Evento creado exitosamente", 
      eventId: event.id,
      gigMessage: shouldNotify ? "Mensaje de convocatoria enviado por WhatsApp." : undefined
    }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { success: false, message: `Error al crear el evento: ${error?.message || "Error desconocido"}` }
  }
}

export async function notifyEventAction(id: string) {
  try {
    const event = await db.event.findUnique({
      where: { id },
      include: { location: true, package: true, client: { include: { user: true } } }
    })

    if (!event) return { success: false, error: "Evento no encontrado" }

    const gigDetails = {
      clientName: event.customName || event.client?.user?.name || "Sin Nombre",
      date: event.date,
      ceremonyType: event.ceremonyType,
      guestCount: event.guestCount || 0,
      locationName: event.location?.name || "Por definir",
      mapsLink: event.location?.mapsLink || event.mapsLink || "",
      locationAddress: event.location?.address || "",
      performanceStart: event.performanceStart,
      performanceEnd: event.performanceEnd,
      arrivalTime: event.arrivalTime,
      setupTime: event.setupTime,
      dressCode: event.dressCode,
      musicianNotes: event.musicianNotes,
      isPublic: event.isPublic,
      packageName: event.package?.name || "Paquete Personalizado"
    }

    // Enviamos la notificación real
    await notifyMusicians(id, gigDetails, db)

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

    // Sincronizar con Quote (Legacy) si existe
    if (event.quoteId) {
       await db.quote.update({
         where: { id: event.quoteId },
         data: { status: newStatus }
       })
    }

    // Sincronizar con BookingRequest (Nuevo Funnel)
    const existingBooking = await db.bookingRequest.findUnique({ where: { eventId: id } })
    
    if (existingBooking) {
      await db.bookingRequest.update({
        where: { eventId: id },
        data: { 
          status: newStatus,
          ...(newStatus === "completado" ? { paymentStatus: "paid" } : {})
        }
      })
    } else {
      // Si no existe, lo creamos (Self-healing)
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
      const shortId = `VND-${randomHex}`
      
      const evt = await db.event.findUnique({ 
        where: { id },
        include: { location: true, package: true, client: { include: { user: true } } }
      })

      if (evt) {
        await db.bookingRequest.create({
          data: {
            shortId,
            eventId: id,
            clientId: evt.clientId,
            clientName: evt.customName || evt.client?.user?.name || "Sin Nombre",
            clientPhone: evt.client?.whatsapp || "",
            clientEmail: evt.client?.user?.email || "",
            requestedDate: evt.date,
            startTime: evt.performanceStart || "21:00",
            endTime: evt.performanceEnd || "23:00",
            packageName: evt.package?.name || "Paquete Personalizado",
            packageId: evt.packageId,
            baseAmount: evt.amount,
            depositAmount: evt.deposit,
            paymentMethod: evt.paymentMethod || "transfer",
            status: newStatus,
            source: "manual",
            venueType: evt.ceremonyType || "salon",
            address: evt.location?.name || "Dirección manual",
            city: evt.location?.city || "CDMX",
          }
        })
      }
    }

    if (newStatus === "agendado") {
      // 1. Asignar automáticamente los músicos titulares si es necesario
      await assignDefaultMusicians(id, db).catch(e => console.error("Error auto-assigning musicians:", e))

      const fullEvent = await db.event.findUnique({
        where: { id },
        include: { location: true, package: true, client: { include: { user: true } } }
      })
      if (fullEvent && !fullEvent.notificationSent) {
        const gigDetails = {
          clientName: fullEvent.customName || fullEvent.client?.user?.name || "Sin Nombre",
          date: fullEvent.date,
          ceremonyType: fullEvent.ceremonyType,
          guestCount: fullEvent.guestCount || 0,
          locationName: fullEvent.location?.name || "",
          mapsLink: fullEvent.location?.mapsLink || fullEvent.mapsLink || "",
          locationAddress: fullEvent.location?.address || "",
          performanceStart: fullEvent.performanceStart,
          performanceEnd: fullEvent.performanceEnd,
          arrivalTime: fullEvent.arrivalTime,
          setupTime: fullEvent.setupTime,
          dressCode: fullEvent.dressCode,
          musicianNotes: fullEvent.musicianNotes,
          isPublic: fullEvent.isPublic,
          packageName: fullEvent.package?.name || "Paquete Personalizado"
        }
        await notifyMusicians(id, gigDetails, db)
      }
    }

    if (newStatus === "cancelado") {
      console.log(`⚠️ updateEventStatusAction: Detectada cancelación para evento ${id}. Notificando...`)
      await notifyEventCancellation(id, db).catch(e => console.error("Error sending cancellation notifications:", e))
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
export async function notifySingleMusicianAction(eventId: string, musicianId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { location: true, package: true, client: { include: { user: true } } }
    })

    if (!event) return { success: false, error: "Evento no encontrado" }

    const gigDetails = {
      clientName: event.customName || event.client?.user?.name || "Sin Nombre",
      date: event.date,
      ceremonyType: event.ceremonyType,
      guestCount: event.guestCount || 0,
      locationName: event.location?.name || "Por definir",
      mapsLink: event.location?.mapsLink || event.mapsLink || "",
      locationAddress: event.location?.address || "",
      performanceStart: event.performanceStart,
      performanceEnd: event.performanceEnd,
      arrivalTime: event.arrivalTime,
      setupTime: event.setupTime,
      dressCode: event.dressCode,
      musicianNotes: event.musicianNotes,
      isPublic: event.isPublic,
      packageName: event.package?.name || "Paquete Personalizado"
    }

    await notifyMusicians(eventId, gigDetails, db, [musicianId])

    return { success: true }
  } catch (error) {
    console.error("Error notifying musician:", error)
    return { success: false, error: "Error al enviar notificación" }
  }
}
