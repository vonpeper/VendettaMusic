"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendWhatsApp } from "@/lib/notifications"
import { revalidatePath } from "next/cache"

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(v)

export async function getAccountantConfigAction() {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    return { success: true, phone: config?.accountantWhatsapp || "" }
  } catch (error: any) {
    return { success: false, phone: "" }
  }
}

export async function saveAccountantPhoneAction(phone: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "No autorizado" }
  }

  try {
    const cleanPhone = phone.replace(/\D/g, "")
    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { accountantWhatsapp: cleanPhone },
      create: { id: "vendetta_config", accountantWhatsapp: cleanPhone },
    })
    revalidatePath("/admin/configuracion")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al guardar el teléfono" }
  }
}

export async function notifyAccountantInvoiceAction(eventIdOrBookingId: string, customPhone?: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "No autorizado" }
  }

  try {
    let event = await db.event.findUnique({
      where: { id: eventIdOrBookingId },
      include: {
        client: { include: { user: true } },
        location: true,
        bookingRequest: true,
        package: true,
      },
    })

    let bookingRequest = null
    if (!event) {
      event = await db.event.findFirst({
        where: { bookingRequest: { id: eventIdOrBookingId } },
        include: {
          client: { include: { user: true } },
          location: true,
          bookingRequest: true,
          package: true,
        },
      })

      if (!event) {
        bookingRequest = await db.bookingRequest.findUnique({
          where: { id: eventIdOrBookingId },
        })
      }
    } else {
      bookingRequest = event.bookingRequest
    }

    if (!event && !bookingRequest) {
      return { success: false, error: "Evento o solicitud no encontrada" }
    }

    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    const targetPhone = (customPhone || config?.accountantWhatsapp || "").replace(/\D/g, "")
    if (!targetPhone || targetPhone.length < 10) {
      return {
        success: false,
        error: "Por favor ingresa un número de WhatsApp válido para el contador (Rodo).",
      }
    }

    // Resolver datos para el formato exacto solicitado por el usuario
    const rawClientName =
      event?.client?.user?.name ||
      event?.bookingRequest?.clientName ||
      bookingRequest?.clientName ||
      event?.customName ||
      "Cliente"
    const clientNameUpper = rawClientName.trim().toUpperCase()

    // Monto antes de IVA
    const baseAmount = event?.amount || bookingRequest?.baseAmount || 0

    // Concepto: happening "nombre del bar o titulo del evento"
    const venueOrTitle = (
      event?.location?.name ||
      event?.customName ||
      bookingRequest?.venueType ||
      "Show Vendetta"
    ).trim()
    const concepto = `Happening ${venueOrTitle}`

    // Mensaje exacto solicitado por el usuario:
    const message = `Hola Rodo, espero estés bien, este es un mensaje automático. Es para solicitar una factura para el cliente ${clientNameUpper}

Monto antes de IVA: ${MXN(baseAmount)}
Concepto: ${concepto}`

    const { messageId, error: sendError } = await sendWhatsApp(targetPhone, message)

    // Registrar en el log de notificaciones
    await db.notification.create({
      data: {
        type: "ACCOUNTANT_INVOICE_REQUEST",
        channel: "whatsapp",
        recipient: targetPhone,
        message,
        eventId: event?.id || null,
        bookingRequestId: bookingRequest?.id || null,
        status: messageId ? "sent" : "failed",
        errorDetails: sendError || null,
        messageId: messageId || null,
      },
    })

    if (!messageId && sendError) {
      return { success: false, error: `Error enviando WhatsApp: ${sendError}` }
    }

    // Si customPhone es válido y config no lo tenía o era diferente, guardarlo para futuras solicitudes
    if (customPhone && (!config?.accountantWhatsapp || config.accountantWhatsapp !== targetPhone)) {
      await db.globalConfig.update({
        where: { id: "vendetta_config" },
        data: { accountantWhatsapp: targetPhone },
      }).catch(() => {})
    }

    return {
      success: true,
      message: `Solicitud de factura enviada exitosamente a Rodo (${targetPhone}).`,
      messagePreview: message,
    }
  } catch (error: any) {
    console.error("Error notificando al contador:", error)
    return { success: false, error: error?.message || "Error al procesar la notificación" }
  }
}
