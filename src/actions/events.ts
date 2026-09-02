"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { notifyMusicians, notifyEventCancellation } from "@/lib/notifications"
import { assignDefaultMusicians } from "@/lib/musicians"
import crypto from "crypto"

export async function updateEventAction(id: string, _prev: unknown, formData: FormData) {
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
    const locationFreeName = data.locationFreeName as string
    const locationFree = data.locationFree as string
    const locationFreeCity = data.locationFreeCity as string
    if (locationFree || locationFreeName) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({
        name: locationFreeName || locationFree,
        address: locationFree || locationFreeName,
        city: locationFreeCity || null,
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
        startTime: (data.performanceStart as string) || null,
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
      include: { location: true, package: true, bookingRequest: true, client: { include: { user: true } } }
    })

    // Sincronizar con ClientProfile si existe para mantener el dato maestro actualizado
    // (Eliminado: No debemos sobreescribir el nombre del cliente con data.customName que es el nombre del show)


    if (updatedEvent?.quoteId) {
      try {
        await db.quote.updateMany({
          where: { id: updatedEvent.quoteId },
          data: { 
            status: (data.status as string) || "scheduled"
          }
        })
      } catch (quoteErr) {
        console.warn("Could not sync legacy quote:", quoteErr)
      }
    }

    // Sincronizar con BookingRequest (Nuevo Funnel)
    const existingBooking = await db.bookingRequest.findUnique({ where: { eventId: id } })
    
    if (existingBooking) {
      const addressVal = updatedEvent?.location?.address || updatedEvent?.location?.name || (data.locationFree as string) || "Dirección manual"
      
      // Parsear dirección para mantener en sincronía calle, número y colonia
      let calle = ""
      let numero = ""
      let colonia = ""
      const parts = addressVal.split(",").map((p: string) => p.trim())
      if (parts.length > 0) {
        const firstPart = parts[0]
        const match = firstPart.match(/^(.*?)\s+(\d+[-a-zA-Z0-9]*)$/)
        if (match) {
          calle = match[1]
          numero = match[2]
        } else {
          calle = firstPart
          numero = ""
        }
      }
      if (parts.length > 1) {
        colonia = parts[1]
      }

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
          clientName: (data.clientName as string) || (data.customName as string) || undefined,
          clientPhone: (data.clientPhone as string) || undefined,
          clientEmail: (data.clientEmail as string) || undefined,
          bandHours: data.bandHours ? parseInt(data.bandHours as string) : undefined,
          djHours: data.djHours ? parseInt(data.djHours as string) : undefined,
          isDjWithTvs: data.isDjWithTvs === "on" || data.isDjWithTvs === "true",
          hasTemplete: data.hasTemplete === "on" || data.hasTemplete === "true",
          hasPista: data.hasPista === "on" || data.hasPista === "true",
          hasRobot: data.hasRobot === "on" || data.hasRobot === "true",
          clientProvidesAudio: data.clientProvidesAudio === "on" || data.clientProvidesAudio === "true",
          originalPrice: data.originalPrice ? parseFloat(data.originalPrice as string) : undefined,
          discountAmount: data.discountAmount ? parseFloat(data.discountAmount as string) : undefined,
          isPublic: data.isPublic === "on" || data.isPublic === "true",
          adminNote: (data.musicianNotes as string) || undefined,
          address: addressVal,
          calle,
          numero,
          colonia,
          municipio: updatedEvent?.location?.city || "CDMX",
          city: updatedEvent?.location?.city || "CDMX",
          state: updatedEvent?.location?.state || "México",
          mapsLink: updatedEvent?.location?.mapsLink || (data.mapsLink as string) || null,
          viaticosAmount: parseFloat(data.viaticosAmount as string || "0"),
          distanceKm: parseFloat(data.distanceKm as string || "0") || null,
          durationSec: parseInt(data.durationSec as string || "0") || null,
          tollCost: parseFloat(data.tollCost as string || "0") || null,
          fuelCost: parseFloat(data.fuelCost as string || "0") || null,
          requiresManualQuote: data.requiresManualQuote === "true",
          arrivalTime: (data.arrivalTime as string) || null,
          setupTime: (data.setupTime as string) || null,
          dressCode: (data.dressCode as string) || null,
          musicianNotes: (data.musicianNotes as string) || null,
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
            arrivalTime: evt.arrivalTime,
            setupTime: evt.setupTime,
            dressCode: evt.dressCode,
            musicianNotes: evt.musicianNotes,
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
        clientName: updatedEvent.client?.user?.name || updatedEvent.bookingRequest?.clientName || "Sin Nombre",
        eventName: updatedEvent.customName || "Evento Vendetta",
        date: dateValue || updatedEvent.date,
        ceremonyType: updatedEvent.ceremonyType,
        guestCount: updatedEvent.guestCount || 0,
        locationName: updatedEvent.location?.name || locationFree || updatedEvent.bookingRequest?.address || "Por definir",
        mapsLink: updatedEvent.location?.mapsLink || updatedEvent.mapsLink || "",
        address: updatedEvent.location?.address || locationFree || updatedEvent.bookingRequest?.address || "",
        locationAddress: updatedEvent.location?.address || locationFree || updatedEvent.bookingRequest?.address || "",
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
      await notifyMusicians(id, gigDetails, db, notifyMusicianIds)
    }

    if ((data.status as string) === "cancelado") {
      console.log(`⚠️ updateEventAction: Detectada cancelación para evento ${id}. Notificando...`)
      await notifyEventCancellation(id, db).catch(e => console.error("Error sending cancellation notifications:", e))
    }

    // Sincronizar con Google Calendar de forma asíncrona
    const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
    syncEventToGoogleCalendar(id).catch(e => console.error("Error syncing to Google Calendar:", e))

    return { 
      success: true, 
      message: "Evento actualizado correctamente",
      gigMessage: shouldNotify ? "Mensaje de convocatoria enviado por WhatsApp." : undefined
    }
  } catch (error: unknown) {
    console.error("Error updating event:", error)
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, message: `Error al actualizar: ${msg}` }
  }
}

export async function deleteEventAction(id: string) {
  try {
    const event = await db.event.findUnique({ where: { id } })
    if (event?.googleCalendarId) {
      const { deleteFromGoogleCalendar } = await import("@/lib/google-calendar")
      await deleteFromGoogleCalendar(event.googleCalendarId).catch(e => console.error("Error deleting from Google Calendar:", e))
    }
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

export async function createEventAction(_prev: unknown, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const amount = parseFloat(data.amount as string || "0")
    const deposit = parseFloat(data.deposit as string || "0")
    const invoiceCreate = data.invoice === "on" || data.invoice === "true"
    
    let finalLocationId = data.locationId as string

    // Automación de catálogo de ubicaciones con nueva utilidad
    const locationFreeName = data.locationFreeName as string
    const locationFree = data.locationFree as string
    const locationFreeCity = data.locationFreeCity as string
    if (locationFree || locationFreeName) {
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locId = await findOrCreateLocation({
        name: locationFreeName || locationFree,
        address: locationFree || locationFreeName,
        city: locationFreeCity || null,
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
        startTime: (data.performanceStart as string) || null,
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
    let clientName = (data.clientName as string) || (data.customName as string) || "Sin Nombre"
    let clientPhone = (data.clientPhone as string) || ""
    let clientEmail = (data.clientEmail as string) || ""
    
    if (targetClientId && !data.clientName) {
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

    const bookingRequestId = data.bookingRequestId as string
    const addressVal = (data.locationFree as string) || event.location?.address || "Dirección manual"
    
    // Parsear dirección para mantener en sincronía calle, número y colonia
    let calle = ""
    let numero = ""
    let colonia = ""
    const parts = addressVal.split(",").map((p: string) => p.trim())
    if (parts.length > 0) {
      const firstPart = parts[0]
      const match = firstPart.match(/^(.*?)\s+(\d+[-a-zA-Z0-9]*)$/)
      if (match) {
        calle = match[1]
        numero = match[2]
      } else {
        calle = firstPart
        numero = ""
      }
    }
    if (parts.length > 1) {
      colonia = parts[1]
    }

    if (bookingRequestId) {
      await db.bookingRequest.update({
        where: { id: bookingRequestId },
        data: {
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
          adminNote: (data.musicianNotes as string) || "",
          venueType: (data.ceremonyType as string) || "salon",
          address: addressVal,
          calle,
          numero,
          colonia,
          municipio: event.location?.city || "CDMX",
          city: event.location?.city || "CDMX",
          state: event.location?.state || "México",
          mapsLink: event.location?.mapsLink || (data.mapsLink as string) || null,
          isPublic: event.isPublic,
          viaticosAmount: parseFloat(data.viaticosAmount as string || "0"),
          distanceKm: parseFloat(data.distanceKm as string || "0") || null,
          durationSec: parseInt(data.durationSec as string || "0") || null,
          tollCost: parseFloat(data.tollCost as string || "0") || null,
          fuelCost: parseFloat(data.fuelCost as string || "0") || null,
          requiresManualQuote: data.requiresManualQuote === "true",
          bandHours: data.bandHours ? parseInt(data.bandHours as string) : 0,
          djHours: data.djHours ? parseInt(data.djHours as string) : 0,
          isDjWithTvs: data.isDjWithTvs === "on" || data.isDjWithTvs === "true",
          hasTemplete: data.hasTemplete === "on" || data.hasTemplete === "true",
          hasPista: data.hasPista === "on" || data.hasPista === "true",
          hasRobot: data.hasRobot === "on" || data.hasRobot === "true",
          clientProvidesAudio: data.clientProvidesAudio === "on" || data.clientProvidesAudio === "true",
          originalPrice: data.originalPrice ? parseFloat(data.originalPrice as string) : 0,
          discountAmount: data.discountAmount ? parseFloat(data.discountAmount as string) : 0,
          arrivalTime: (data.arrivalTime as string) || null,
          setupTime: (data.setupTime as string) || null,
          dressCode: (data.dressCode as string) || null,
          musicianNotes: (data.musicianNotes as string) || null,
        }
      })
    } else {
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
          address: addressVal,
          calle,
          numero,
          colonia,
          municipio: event.location?.city || "CDMX",
          city: event.location?.city || "CDMX",
          state: event.location?.state || "México",
          isPublic: event.isPublic,
          viaticosAmount: parseFloat(data.viaticosAmount as string || "0"),
          distanceKm: parseFloat(data.distanceKm as string || "0") || null,
          durationSec: parseInt(data.durationSec as string || "0") || null,
          tollCost: parseFloat(data.tollCost as string || "0") || null,
          fuelCost: parseFloat(data.fuelCost as string || "0") || null,
          requiresManualQuote: data.requiresManualQuote === "true",
          bandHours: data.bandHours ? parseInt(data.bandHours as string) : 0,
          djHours: data.djHours ? parseInt(data.djHours as string) : 0,
          isDjWithTvs: data.isDjWithTvs === "on" || data.isDjWithTvs === "true",
          hasTemplete: data.hasTemplete === "on" || data.hasTemplete === "true",
          hasPista: data.hasPista === "on" || data.hasPista === "true",
          hasRobot: data.hasRobot === "on" || data.hasRobot === "true",
          clientProvidesAudio: data.clientProvidesAudio === "on" || data.clientProvidesAudio === "true",
          originalPrice: data.originalPrice ? parseFloat(data.originalPrice as string) : 0,
          discountAmount: data.discountAmount ? parseFloat(data.discountAmount as string) : 0,
          arrivalTime: (data.arrivalTime as string) || null,
          setupTime: (data.setupTime as string) || null,
          dressCode: (data.dressCode as string) || null,
          musicianNotes: (data.musicianNotes as string) || null,
        }
      })
    }

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
    if (bookingRequestId) {
      revalidatePath(`/admin/ventas/${bookingRequestId}`)
    }

    // Notificación automática
    const shouldNotify = (data.sendNotification === "on" || data.sendNotification === "true")

    if (shouldNotify) {
      // ASEGURAR QUE HAYA MÚSICOS
      await assignDefaultMusicians(event.id, db).catch(e => console.error("Error auto-assigning musicians in createEventAction:", e))
      
      const gigDetails = {
        clientName: event.client?.user?.name || clientName || "Sin Nombre",
        eventName: event.customName || "Evento Vendetta",
        date: event.date,
        ceremonyType: event.ceremonyType,
        guestCount: event.guestCount || 0,
        locationName: event.location?.name || locationFree || "Por definir",
        mapsLink: event.location?.mapsLink || event.mapsLink || "",
        address: event.location?.address || locationFree || "",
        locationAddress: event.location?.address || locationFree || "",
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

    // Sincronizar con Google Calendar de forma asíncrona
    const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
    syncEventToGoogleCalendar(event.id).catch(e => console.error("Error syncing to Google Calendar:", e))

    return { 
      success: true, 
      message: "Evento creado exitosamente", 
      eventId: event.id,
      gigMessage: shouldNotify ? "Mensaje de convocatoria enviado por WhatsApp." : undefined
    }
  } catch (error: unknown) {
    console.error("Error creating event:", error)
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, message: `Error al crear el evento: ${msg}` }
  }
}

export async function notifyEventAction(id: string) {
  try {
    const event = await db.event.findUnique({
      where: { id },
      include: { location: true, package: true, bookingRequest: true, client: { include: { user: true } } }
    })

    if (!event) return { success: false, error: "Evento no encontrado" }

    const gigDetails = {
      clientName: event.client?.user?.name || event.bookingRequest?.clientName || "Sin Nombre",
      eventName: event.customName || "Evento Vendetta",
      date: event.date,
      ceremonyType: event.ceremonyType,
      guestCount: event.guestCount || 0,
      locationName: event.location?.name || event.bookingRequest?.address || "Por definir",
      mapsLink: event.location?.mapsLink || event.mapsLink || "",
      address: event.location?.address || event.bookingRequest?.address || "",
      locationAddress: event.location?.address || event.bookingRequest?.address || "",
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
    }

    if (newStatus === "cancelado") {
      console.log(`⚠️ updateEventStatusAction: Detectada cancelación para evento ${id}. Notificando...`)
      await notifyEventCancellation(id, db).catch(e => console.error("Error sending cancellation notifications:", e))
    }

    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin/eventos")
    revalidatePath("/")
    // Sincronizar con Google Calendar de forma asíncrona
    const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
    syncEventToGoogleCalendar(id).catch(e => console.error("Error syncing to Google Calendar:", e))
    
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
      include: { location: true, package: true, bookingRequest: true, client: { include: { user: true } } }
    })

    if (!event) return { success: false, error: "Evento no encontrado" }

    const gigDetails = {
      clientName: event.client?.user?.name || event.bookingRequest?.clientName || "Sin Nombre",
      eventName: event.customName || "Evento Vendetta",
      date: event.date,
      ceremonyType: event.ceremonyType,
      guestCount: event.guestCount || 0,
      locationName: event.location?.name || event.bookingRequest?.address || "Por definir",
      mapsLink: event.location?.mapsLink || event.mapsLink || "",
      address: event.location?.address || event.bookingRequest?.address || "",
      locationAddress: event.location?.address || event.bookingRequest?.address || "",
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

import { calculateQuoteTotals, AdditionalLineItem } from "@/lib/pricing"
import { normalizeClientEmail, normalizeClientPhone } from "@/lib/clients"
import { getValidMapsLink } from "@/lib/locations"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const saveUnifiedEventQuoteSchema = z.object({
  mode: z.enum(["create", "edit"]).default("create"),
  targetId: z.string().optional(),
  clientId: z.string().nullable().optional(),
  clientName: z.string().min(2, "El nombre del cliente debe tener al menos 2 caracteres").max(100),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().email("Correo electrónico inválido").nullable().optional().or(z.literal("")),
  clientCity: z.string().nullable().optional(),

  customName: z.string().nullable().optional(),
  ceremonyType: z.string().nullable().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  setupTime: z.string().nullable().optional(),
  guestCount: z.number().int().min(0).default(0),
  dressCode: z.string().nullable().optional(),
  status: z.enum(["pendiente", "agendado", "completado", "cancelado"]).default("pendiente"),
  musicianNotes: z.string().nullable().optional(),
  audioEngineer: z.string().nullable().optional(),

  locationId: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  venueAddress: z.string().nullable().optional(),
  venueCity: z.string().nullable().optional(),
  venueState: z.string().nullable().optional(),
  mapsLink: z.string().nullable().optional(),

  packageId: z.string().nullable().optional(),
  packageName: z.string().nullable().optional(),
  basePrice: z.number().min(0, "El precio base no puede ser negativo"),
  viaticosAmount: z.number().min(0).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  additionalItems: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, "La descripción del concepto adicional es requerida"),
    quantity: z.number().int().min(1).default(1),
    unitCost: z.number().min(0).default(0),
    order: z.number().int().default(0)
  })).default([]),
  invoice: z.boolean().default(false),
  depositAmount: z.number().min(0).nullable().optional(),
})

export type SaveUnifiedEventQuotePayload = z.infer<typeof saveUnifiedEventQuoteSchema>

export async function saveUnifiedEventQuoteAction(rawPayload: unknown) {
  try {
    // 1. Autorización administrativa estricta
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Se requiere sesión de administrador." }
    }

    // 2. Validación en runtime con Zod
    const parsed = saveUnifiedEventQuoteSchema.safeParse(rawPayload)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Datos del formulario inválidos"
      return { success: false, error: issue }
    }

    const val = parsed.data
    const dateObj = new Date(`${val.eventDate}T12:00:00`)
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: "Fecha del evento inválida" }
    }

    // 3. Cálculo canónico y validación de anticipo solicitado
    const totals = calculateQuoteTotals({
      basePrice: val.basePrice,
      viaticosAmount: val.viaticosAmount,
      discountAmount: val.discountAmount,
      additionalItems: val.additionalItems as AdditionalLineItem[],
      invoice: val.invoice,
      depositAmount: val.depositAmount
    })

    if (totals.depositExceedsTotal) {
      return {
        success: false,
        error: totals.depositError || `El anticipo solicitado ($${totals.depositAmount}) no puede superar el total ($${totals.totalAmount})`
      }
    }

    // 4. Ejecución 100% atómica dentro de db.$transaction
    const result = await db.$transaction(async (tx) => {
      // A. Resolución / creación de Cliente dentro de la transacción
      let finalClientId = val.clientId
      if (!finalClientId && val.clientName) {
        const cleanEmail = normalizeClientEmail(val.clientEmail)
        const cleanPhone = normalizeClientPhone(val.clientPhone)

        if (cleanEmail) {
          const u = await tx.user.findUnique({
            where: { email: cleanEmail },
            include: { clientProfile: true }
          })
          if (u?.clientProfile) finalClientId = u.clientProfile.id
        }

        if (!finalClientId && cleanPhone) {
          const cp = await tx.clientProfile.findFirst({
            where: { whatsapp: { contains: cleanPhone } }
          })
          if (cp) finalClientId = cp.id
        }

        if (!finalClientId) {
          const newUser = await tx.user.create({
            data: {
              name: val.clientName,
              email: cleanEmail || null,
              role: "CLIENT",
              clientProfile: {
                create: {
                  whatsapp: cleanPhone || val.clientPhone || null,
                  city: val.clientCity || null,
                  state: "México",
                  type: "private"
                }
              }
            },
            include: { clientProfile: true }
          })
          finalClientId = newUser.clientProfile?.id || null
        }
      }

      // B. Resolución / creación de Locación dentro de la transacción
      let finalLocationId = val.locationId
      const cleanVenueName = val.venueName?.trim()
      const isPendingVenue = !cleanVenueName || cleanVenueName === "Lugar por confirmar" || cleanVenueName === "Por confirmar" || cleanVenueName === "No especificada" || cleanVenueName === "Lugar aún no definido"

      if (!finalLocationId && !isPendingVenue && cleanVenueName) {
        const existingLoc = await tx.location.findFirst({
          where: { name: { equals: cleanVenueName } }
        })

        if (existingLoc) {
          finalLocationId = existingLoc.id
        } else {
          const newLoc = await tx.location.create({
            data: {
              name: cleanVenueName,
              address: val.venueAddress?.trim() || cleanVenueName,
              city: val.venueCity?.trim() || null,
              state: val.venueState?.trim() || "México",
              mapsLink: getValidMapsLink(val.mapsLink, val.venueAddress)
            }
          })
          finalLocationId = newLoc.id
        }
      }

      // C. Modo Edición
      if (val.mode === "edit" && val.targetId) {
        const existingBooking = await tx.bookingRequest.findUnique({
          where: { id: val.targetId },
          include: { event: true, lineItems: true }
        })

        const existingEvent = !existingBooking
          ? await tx.event.findUnique({ where: { id: val.targetId }, include: { bookingRequest: true } })
          : null

        const bookingId = existingBooking?.id || existingEvent?.bookingRequest?.id
        const eventId = existingBooking?.eventId || existingEvent?.id

        if (bookingId) {
          // Actualizar BookingRequest
          await tx.bookingRequest.update({
            where: { id: bookingId },
            data: {
              clientName: val.clientName,
              clientPhone: val.clientPhone || "",
              clientEmail: val.clientEmail || null,
              clientId: finalClientId || null,
              customName: val.customName || null,
              ceremonyType: val.ceremonyType || "boda",
              requestedDate: dateObj,
              startTime: val.startTime || "21:00",
              endTime: val.endTime || "23:00",
              arrivalTime: val.arrivalTime || "19:00",
              setupTime: val.setupTime || "17:00",
              guestCount: val.guestCount || 0,
              dressCode: val.dressCode || "formal",
              musicianNotes: val.musicianNotes || null,
              packageId: val.packageId || null,
              packageName: val.packageName || "Paquete Personalizado",
              baseAmount: totals.basePrice,
              viaticosAmount: totals.viaticosAmount,
              discountAmount: totals.discountAmount,
              invoice: Boolean(val.invoice),
              depositAmount: totals.depositAmount,
              address: val.venueAddress || val.venueName || "Por confirmar",
              city: val.venueCity || "Toluca",
              state: val.venueState || "México",
              mapsLink: val.mapsLink || null,
              status: val.status
            }
          })

          // Sincronizar BookingLineItem
          await tx.bookingLineItem.deleteMany({ where: { bookingRequestId: bookingId } })
          if (val.additionalItems.length > 0) {
            await tx.bookingLineItem.createMany({
              data: val.additionalItems.map((item, idx) => ({
                bookingRequestId: bookingId,
                description: item.description,
                quantity: item.quantity,
                unitCost: item.unitCost,
                lineTotal: item.quantity * item.unitCost,
                order: item.order ?? idx
              }))
            })
          }
        }

        // Si ya existe un evento vinculado o el estatus cambia a agendado/completado
        if (eventId) {
          await tx.event.update({
            where: { id: eventId },
            data: {
              customName: val.customName || `Evento ${val.clientName}`,
              ceremonyType: val.ceremonyType || "boda",
              date: dateObj,
              startTime: val.startTime || "21:00",
              performanceStart: val.startTime || "21:00",
              performanceEnd: val.endTime || "23:00",
              arrivalTime: val.arrivalTime || "19:00",
              setupTime: val.setupTime || "17:00",
              guestCount: val.guestCount || 0,
              dressCode: val.dressCode || "formal",
              musicianNotes: val.musicianNotes || null,
              audioEngineer: val.audioEngineer || null,
              package: val.packageId ? { connect: { id: val.packageId } } : { disconnect: true },
              location: finalLocationId ? { connect: { id: finalLocationId } } : { disconnect: true },
              client: finalClientId ? { connect: { id: finalClientId } } : undefined,
              amount: totals.subtotal,
              deposit: totals.depositAmount,
              balance: totals.balanceAmount,
              ivaAmount: totals.ivaAmount,
              totalWithTax: totals.totalAmount,
              invoice: Boolean(val.invoice),
              status: val.status === "completado" ? "completado" : val.status === "cancelado" ? "cancelado" : "scheduled",
              mapsLink: val.mapsLink || null
            }
          })
        } else if ((val.status === "agendado" || val.status === "completado") && bookingId) {
          // Crear el Event por primera vez al pasar de pendiente a agendado
          const createdEvt = await tx.event.create({
            data: {
              customName: val.customName || `Evento ${val.clientName}`,
              ceremonyType: val.ceremonyType || "boda",
              date: dateObj,
              startTime: val.startTime || "21:00",
              performanceStart: val.startTime || "21:00",
              performanceEnd: val.endTime || "23:00",
              arrivalTime: val.arrivalTime || "19:00",
              setupTime: val.setupTime || "17:00",
              guestCount: val.guestCount || 0,
              dressCode: val.dressCode || "formal",
              musicianNotes: val.musicianNotes || null,
              audioEngineer: val.audioEngineer || null,
              package: val.packageId ? { connect: { id: val.packageId } } : undefined,
              location: finalLocationId ? { connect: { id: finalLocationId } } : undefined,
              client: finalClientId ? { connect: { id: finalClientId } } : undefined,
              amount: totals.subtotal,
              deposit: totals.depositAmount,
              balance: totals.balanceAmount,
              ivaAmount: totals.ivaAmount,
              totalWithTax: totals.totalAmount,
              totalIncome: 0,
              invoice: Boolean(val.invoice),
              status: val.status === "completado" ? "completado" : "scheduled",
              mapsLink: val.mapsLink || null,
              source: "admin"
            }
          })

          await tx.bookingRequest.update({
            where: { id: bookingId },
            data: { eventId: createdEvt.id }
          })
        }

        return { id: val.targetId, bookingId, eventId }
      } else {
        // D. Modo Creación
        const shortId = "VND-" + crypto.randomBytes(2).toString("hex").toUpperCase()

        let createdEventId: string | null = null

        // REGLA FUNDAMENTAL: Sólo crear Event si el estatus es 'agendado' o 'completado'.
        // Si el estatus es 'pendiente', NO se crea Event, ni agenda, ni asignaciones de músicos.
        if (val.status === "agendado" || val.status === "completado") {
          const newEvent = await tx.event.create({
            data: {
              customName: val.customName || `Evento ${val.clientName}`,
              ceremonyType: val.ceremonyType || "boda",
              date: dateObj,
              startTime: val.startTime || "21:00",
              performanceStart: val.startTime || "21:00",
              performanceEnd: val.endTime || "23:00",
              arrivalTime: val.arrivalTime || "19:00",
              setupTime: val.setupTime || "17:00",
              guestCount: val.guestCount || 0,
              dressCode: val.dressCode || "formal",
              musicianNotes: val.musicianNotes || null,
              audioEngineer: val.audioEngineer || null,
              package: val.packageId ? { connect: { id: val.packageId } } : undefined,
              location: finalLocationId ? { connect: { id: finalLocationId } } : undefined,
              client: finalClientId ? { connect: { id: finalClientId } } : undefined,
              amount: totals.subtotal,
              deposit: totals.depositAmount,
              balance: totals.balanceAmount,
              ivaAmount: totals.ivaAmount,
              totalWithTax: totals.totalAmount,
              totalIncome: 0,
              invoice: Boolean(val.invoice),
              status: val.status === "completado" ? "completado" : "scheduled",
              mapsLink: val.mapsLink || null,
              source: "admin"
            }
          })
          createdEventId = newEvent.id
        }

        // Crear BookingRequest
        const newBooking = await tx.bookingRequest.create({
          data: {
            shortId,
            clientName: val.clientName,
            clientPhone: val.clientPhone || "",
            clientEmail: val.clientEmail || null,
            clientId: finalClientId || null,
            customName: val.customName || null,
            ceremonyType: val.ceremonyType || "boda",
            requestedDate: dateObj,
            startTime: val.startTime || "21:00",
            endTime: val.endTime || "23:00",
            arrivalTime: val.arrivalTime || "19:00",
            setupTime: val.setupTime || "17:00",
            guestCount: val.guestCount || 0,
            dressCode: val.dressCode || "formal",
            musicianNotes: val.musicianNotes || null,
            venueType: "salon",
            packageId: val.packageId || null,
            packageName: val.packageName || "Paquete Personalizado",
            baseAmount: totals.basePrice,
            viaticosAmount: totals.viaticosAmount,
            discountAmount: totals.discountAmount,
            invoice: Boolean(val.invoice),
            depositAmount: totals.depositAmount,
            paymentMethod: "transfer",
            paymentStatus: "pending",
            address: val.venueAddress || val.venueName || "Por confirmar",
            city: val.venueCity || "Toluca",
            state: val.venueState || "México",
            mapsLink: val.mapsLink || null,
            status: val.status,
            eventId: createdEventId,
            source: "admin"
          }
        })

        // Guardar conceptos adicionales en BookingLineItem
        if (val.additionalItems.length > 0) {
          await tx.bookingLineItem.createMany({
            data: val.additionalItems.map((item, idx) => ({
              bookingRequestId: newBooking.id,
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.quantity * item.unitCost,
              order: item.order ?? idx
            }))
          })
        }

        return { bookingId: newBooking.id, eventId: createdEventId, shortId }
      }
    })

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/ventas")
    revalidatePath("/agenda")

    return { success: true, ...result }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al guardar el registro"
    return { success: false, error: msg }
  }
}

/**
 * Convierte explícitamente una cotización / reservación pendiente a Evento confirmado
 * Acción administrativa atómica e idempotente.
 */
export async function convertBookingToEventAction(bookingId: string) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Se requiere sesión de administrador." }
    }

    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true, client: true, lineItems: true }
    })

    if (!booking) {
      return { success: false, error: "Reservación no encontrada" }
    }

    // Idempotencia: Si ya tiene Evento creado, retornar el ID existente sin duplicar
    if (booking.eventId && booking.event) {
      return { success: true, eventId: booking.eventId, alreadyConverted: true }
    }

    const event = await db.$transaction(async (tx) => {
      const totals = calculateQuoteTotals({
        basePrice: booking.baseAmount,
        viaticosAmount: booking.viaticosAmount,
        discountAmount: booking.discountAmount,
        additionalItems: booking.lineItems,
        invoice: booking.invoice,
        depositAmount: booking.depositAmount
      })

      const newEvent = await tx.event.create({
        data: {
          customName: booking.customName || `Evento ${booking.clientName}`,
          ceremonyType: booking.ceremonyType || "boda",
          date: booking.requestedDate,
          startTime: booking.startTime,
          performanceStart: booking.startTime,
          performanceEnd: booking.endTime,
          arrivalTime: booking.arrivalTime || "19:00",
          setupTime: booking.setupTime || "17:00",
          guestCount: booking.guestCount || 0,
          dressCode: booking.dressCode || "formal",
          musicianNotes: booking.musicianNotes || null,
          packageId: booking.packageId,
          clientId: booking.clientId,
          amount: totals.subtotal,
          deposit: totals.depositAmount,
          balance: totals.balanceAmount,
          ivaAmount: totals.ivaAmount,
          totalWithTax: totals.totalAmount,
          totalIncome: 0,
          invoice: booking.invoice,
          status: "scheduled",
          mapsLink: booking.mapsLink,
          source: booking.source || "admin"
        }
      })

      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: "agendado",
          eventId: newEvent.id
        }
      })

      return newEvent
    })

    revalidatePath("/admin/eventos")
    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath("/agenda")

    return { success: true, eventId: event.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al convertir a evento"
    return { success: false, error: msg }
  }
}
