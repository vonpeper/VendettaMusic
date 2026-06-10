"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sendWhatsApp } from "@/lib/notifications"
import { getValidWhatsappPhone } from "@/lib/phone"

export async function clearAllNotificationsAction() {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    await db.notification.deleteMany({})
    revalidatePath("/admin/notificaciones")
    return { success: true }
  } catch (error: any) {
    console.error("Error clearing notifications:", error)
    return { success: false, error: error.message }
  }
}

export async function sendTestNotificationAction(target: "admin" | "musician" | "client") {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    const isSandbox = config?.isSandbox ?? false

    let phone = ""
    let recipientName = "Prueba"
    let message = ""

    if (target === "admin") {
      phone = config?.adminWhatsapp || ""
      recipientName = "Administrador"
      message = "🤖 *PRUEBA AUTOMÁTICA — ADMINISTRADOR*\n\nHola, esta es una prueba de conexión con Evolution API desde el panel de Vendetta.\n\n— Sistema de Notificaciones"
    } else if (target === "musician") {
      const musician = await db.musicianProfile.findFirst({
        include: { user: true }
      })
      const phoneToUse = musician?.whatsapp
      if (!musician || !phoneToUse) {
        return { success: false, error: "No hay músicos con teléfono registrado" }
      }
      
      phone = phoneToUse.replace(/\D/g, "")
      recipientName = musician.user.name || "Músico"
      message = `🤖 *PRUEBA AUTOMÁTICA — MÚSICO*\n\nHola ${recipientName}, esta es una prueba técnica de convocatoria.\nNo es necesario responder.\n\n— Administración Vendetta`
    } else if (target === "client") {
        const client = await db.clientProfile.findFirst({
          where: { whatsapp: { not: null } },
          include: { user: true }
        })
        if (!client) return { success: false, error: "No hay clientes con teléfono registrado" }
        const validated = getValidWhatsappPhone(client.whatsapp || "")
        if (!validated) {
          return { success: false, error: "El teléfono del cliente no es válido o está vacío. Revisa el número en el detalle de la venta." }
        }
        phone = validated
        recipientName = client.user.name || "Cliente"
        message = `🤖 *PRUEBA AUTOMÁTICA — CLIENTE*\n\nHola ${recipientName}, esta es una prueba técnica de seguimiento.\nNo es necesario responder.\n\n— Ventas Vendetta`
      }

    if (!phone) {
      return {
        success: false,
        error: target === "admin"
          ? "Número del administrador no definido. Ve a Configuración > Integraciones > WhatsApp del Administrador."
          : `Número de ${target} no encontrado en la base de datos.`
      }
    }

    // Determine real recipient phone
    const realRecipient = phone || "";
    const sandboxRecipient = config?.adminWhatsapp || "";
    const finalRecipient = config?.isSandbox ? sandboxRecipient : realRecipient;
    if (!finalRecipient) {
      return { success: false, error: `No recipient phone number available for ${target}.` };
    }
    console.log('[OFFICIAL REAL RECIPIENT]', realRecipient);
    console.log('[SANDBOX TARGET]', sandboxRecipient);
    console.log('[OFFICIAL FINAL RECIPIENT]', finalRecipient);

    const finalMessage = isSandbox ? `[SANDBOX - Destinatario original: ${phone}]\n\n${message}` : message;

    // Use sendWhatsApp (raw Evolution API call)
    const { messageId, error } = await sendWhatsApp(finalRecipient, finalMessage);
    const status = messageId ? "sent" : "failed"

    // Log to Notification table so it shows in the notification center
    await db.notification.create({
      data: {
        type: `test_${target}`,
        channel: "whatsapp",
        status,
        message: finalMessage,
        recipient: realRecipient,
        template: `test_${target}`,
        messageId: messageId || undefined,
        errorDetails: error ? error : (isSandbox ? `SANDBOX: destinatario real era ${phone}` : null),
        category: "automatic_notification"
      }
    })

    revalidatePath("/admin/notificaciones")
    return {
      success: !!messageId,
      error: messageId ? undefined : (error || "Evolution API no configurada o no respondió. Verifica la instancia en Configuración.")
    }
  } catch (error: any) {
    console.error("Error sending test notification:", error)
    return { success: false, error: error.message }
  }
}

export async function resendNotificationAction(bookingId: string, type: "admin" | "musician" | "client") {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { 
        event: { 
          include: { 
            location: true,
            package: true
          } 
        } 
      }
    })

    if (!booking) return { success: false, error: "Reserva no encontrada" }

    const { dispatchNotification, notifyMusicians } = await import("@/lib/notifications")
    const firstName = booking.clientName.split(" ")[0]

    if (type === "admin") {
      await dispatchNotification({
        type: "ADMIN_NEW_BOOKING",
        bookingId: bookingId
      })
    } else if (type === "client") {
      const fallbackPhone = (booking as any).client?.whatsapp || ""
      const cleanPhone = (booking.clientPhone || fallbackPhone).replace(/\D/g, "")
      if (!cleanPhone || cleanPhone.length < 10 || cleanPhone === "5500000000") {
        return { success: false, error: "El cliente no tiene un número de contacto válido registrado (actualmente es un marcador de posición)." }
      }
      const notificationType = (booking.status === "agendado" || booking.status === "completado") 
        ? "CLIENT_CONFIRMED" 
        : "CLIENT_QUOTE"

      await dispatchNotification({
        type: notificationType,
        bookingId: bookingId,
        forceResend: true
      })
    } else if (type === "musician" && booking.eventId && booking.event) {
      const gigDetails = {
        clientName: booking.clientName,
        date: booking.event.date,
        ceremonyType: booking.event.ceremonyType || booking.venueType,
        locationName: booking.event.location?.name || booking.address || "Por confirmar",
        mapsLink: booking.event.location?.mapsLink || booking.event.mapsLink || "",
        address: booking.event.location?.address || booking.address || "No especificada",
        locationAddress: booking.event.location?.address || booking.address || "No especificada",
        performanceStart: booking.event.performanceStart,
        performanceEnd: booking.event.performanceEnd,
        packageName: booking.event.package?.name || booking.packageName,
        dressCode: (booking.event as any).dressCode || "",
        arrivalTime: (booking.event as any).arrivalTime || "",
        setupTime: (booking.event as any).setupTime || "",
        musicianNotes: (booking.event as any).musicianNotes || (booking as any).adminNote || "",
        bookingRequestId: bookingId
      }
      const result = await notifyMusicians(booking.eventId, gigDetails, db, undefined, true)
      if (result && !result.success) {
        return { success: false, error: result.message }
      }
    }


    revalidatePath("/admin/ventas")
    
    if (type === "musician") {
      return { success: true, message: "Proceso de notificación a músicos completado. Revisa la terminal para detalles de envío." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error resending notification:", error)
    return { success: false, error: error.message }
  }
}

export async function resendIndividualMusicianNotificationAction(musicianId: string, eventId: string, bookingId: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    let booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { 
        event: { 
          include: { 
            location: true,
            package: true
          } 
        } 
      }
    })

    if (!booking) {
      // Fallback para Legacy Quotes
      const quote = await db.quote.findUnique({
        where: { id: bookingId },
        include: { 
          client: {
            include: { user: true }
          },
          event: { 
            include: { 
              location: true,
              package: true
            } 
          } 
        }
      })
      
      if (quote) {
        booking = {
          clientName: quote.client?.user?.name || "Cliente",
          venueType: quote.ceremonyType || "",
          address: "",
          packageName: "",
          adminNote: quote.notes || "",
          event: quote.event
        } as any
      }
    }

    if (!booking || !booking.event) {
      return { success: false, error: "No hay evento confirmado vinculado a esta venta" }
    }

    const { notifyMusicians } = await import("@/lib/notifications")
    
    const gigDetails = {
      clientName: booking.clientName,
      date: booking.event.date,
      ceremonyType: booking.event.ceremonyType || booking.venueType,
      locationName: booking.event.location?.name || booking.address || "Por confirmar",
      mapsLink: booking.event.location?.mapsLink || booking.event.mapsLink || "",
      address: booking.event.location?.address || booking.address || "No especificada",
      locationAddress: booking.event.location?.address || booking.address || "No especificada",
      performanceStart: booking.event.performanceStart,
      performanceEnd: booking.event.performanceEnd,
      packageName: booking.event.package?.name || booking.packageName,
      dressCode: (booking.event as any).dressCode || "",
      arrivalTime: (booking.event as any).arrivalTime || "",
      setupTime: (booking.event as any).setupTime || "",
      musicianNotes: (booking.event as any).musicianNotes || (booking as any).adminNote || "",
      bookingRequestId: bookingId
    }

    const result = await notifyMusicians(eventId, gigDetails, db, [musicianId], true)
    if (result && !result.success) {
      return { success: false, error: result.message }
    }

    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true, message: "Notificación individual enviada con éxito." }
  } catch (error: any) {
    console.error("Error resending individual notification:", error)
    return { success: false, error: error.message }
  }
}

export async function sendAutomatedClientWhatsAppAction(bookingId: string, forceResend: boolean = false) {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const { dispatchNotification } = await import("@/lib/notifications")
    const { db } = await import("@/lib/db")
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    const isSandbox = config?.isSandbox ?? false

    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    const notificationType = (booking.status === "agendado" || booking.status === "completado")
      ? "CLIENT_CONFIRMED"
      : "CLIENT_QUOTE"

    console.log("[OFFICIAL BUTTON CLICK]", { bookingId, notificationType, isSandbox })

    // Determine real recipient phone
    const rawPhone = booking.clientPhone || ""
    const realRecipient = getValidWhatsappPhone(rawPhone) || ""
    const sandboxRecipient = config?.adminWhatsapp || "7222417045"
    const finalRecipient = (config?.isSandbox ? sandboxRecipient : realRecipient) || ""
    if (!finalRecipient) {
      return { success: false, error: "No recipient phone number available." }
    }
    console.log('[OFFICIAL REAL RECIPIENT]', realRecipient);
    console.log('[SANDBOX TARGET]', sandboxRecipient);
    console.log('[OFFICIAL FINAL RECIPIENT]', finalRecipient);

    // Dispatch the notification and obtain messageId
    const messageId = await dispatchNotification({
      type: notificationType,
      bookingId: bookingId,
      forceResend,
    })

    // Removed duplicate recipient handling block (now managed earlier)
    console.log('[OFFICIAL DISPATCH RESULT]', { messageId })

    // Handle failure case where no messageId is returned
    if (!messageId) {
      const errorMsg = 'No se pudo enviar el mensaje a Evolution API.'
      console.error('[OFFICIAL ERROR]', errorMsg)
      return { success: false, error: errorMsg, isSandbox }
    }

    // Success path: revalidate and return toast message
    revalidatePath(`/admin/ventas/${bookingId}`)
    const toastMsg = isSandbox ? "Sandbox activo: mensaje enviado al número de prueba." : "Mensaje automático enviado con éxito."
    return { success: true, message: toastMsg, isSandbox }
  } catch (error: any) {
    console.error("Error sending automated client WhatsApp:", error)
    return { success: false, error: error.message }
  }
}

export async function sendManualClientThanksAction(bookingId: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const { dispatchNotification } = await import("@/lib/notifications")
    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    const messageId = await dispatchNotification({
      type: "CLIENT_THANKS",
      bookingId: bookingId,
      forceResend: true
    })

    if (!messageId) {
      const lastFailed = await db.notification.findFirst({
        where: { bookingRequestId: bookingId, type: "client_thanks", status: "failed" },
        orderBy: { createdAt: "desc" }
      })
      return { success: false, error: "No se pudo enviar el mensaje a Evolution API.", rawMessage: lastFailed?.message || "" }
    }

    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true, message: "Mensaje de agradecimiento enviado con éxito." }
  } catch (error: any) {
    console.error("Error sending manual client thanks WhatsApp:", error)
    return { success: false, error: error.message }
  }
}
