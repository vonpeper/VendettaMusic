"use server"

import { db } from "@/lib/db"
import { dispatchAdminAlert } from "@/lib/notifications/admin"
import { revalidatePath } from "next/cache"

const BASE_VENDETTA = 35000
const BASE_PRODUCCION = 43770
const OPTIONAL_PANTALLA = 36250
const OPTIONAL_TEMPLETE = 18390

export interface LegalData {
  rfc?: string
  fiscalAddress?: string
  legalRepName?: string
  legalRepRole?: string
  legalRepPower?: string
  notificationAddress?: string
  billingData?: string
  clientEmail?: string
  clientPhone?: string
}

/**
 * Recalcula precios en el servidor y actualiza la cotización
 */
export async function updateProposalSelectionsAction(
  bookingId: string,
  hasPantalla: boolean,
  hasTemplete: boolean
) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return { success: false, error: "Cotización no encontrada" }
    }

    if (booking.status === "agendado" || booking.status === "completado") {
      return { success: false, error: "Esta versión está aprobada y bloqueada. Solicita cambios para editarla." }
    }

    // Recalcular montos en servidor
    const pantallaPrice = hasPantalla ? OPTIONAL_PANTALLA : 0
    const templetePrice = hasTemplete ? OPTIONAL_TEMPLETE : 0
    const subtotal = BASE_VENDETTA + BASE_PRODUCCION + pantallaPrice + templetePrice
    
    // Tasa IVA 16%
    const ivaAmount = Math.round(subtotal * 0.16 * 100) / 100
    const total = subtotal + ivaAmount
    const depositAmount = Math.round(total * 0.50 * 100) / 100

    // Guardar selección
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        hasPantalla,
        hasTemplete,
        baseAmount: subtotal,
        depositAmount
      }
    })

    // Alerta administrador
    await dispatchAdminAlert(
      `🔔 El cliente de la propuesta ${booking.shortId} (${booking.clientName}) modificó sus opciones. Opcionales seleccionados: Pantalla LED: ${hasPantalla ? "SÍ" : "NO"}, Templete: ${hasTemplete ? "SÍ" : "NO"}. Nuevo Total: $${total.toLocaleString("es-MX")} MXN.`
    )

    revalidatePath(`/propuesta/${booking.shortId}`)
    revalidatePath(`/status/${booking.shortId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error updating selections:", error)
    return { success: false, error: error.message || "Error al actualizar la selección" }
  }
}

/**
 * Guarda los datos fiscales y legales del cliente
 */
export async function saveClientLegalDataAction(bookingId: string, data: LegalData) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { client: true }
    })

    if (!booking) {
      return { success: false, error: "Propuesta no encontrada" }
    }

    const {
      rfc,
      fiscalAddress,
      legalRepName,
      legalRepRole,
      legalRepPower,
      notificationAddress,
      billingData,
      clientEmail,
      clientPhone
    } = data

    // Si tiene ClientProfile, lo actualizamos
    if (booking.clientId) {
      await db.clientProfile.update({
        where: { id: booking.clientId },
        data: {
          rfc: rfc || null,
          fiscalAddress: fiscalAddress || null,
          legalRepName: legalRepName || null,
          legalRepRole: legalRepRole || null,
          legalRepPower: legalRepPower || null,
          notificationAddress: notificationAddress || null,
          billingData: billingData || null,
          whatsapp: clientPhone || undefined
        }
      })
    }

    // Actualizar datos en el BookingRequest
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        clientEmail: clientEmail || undefined,
        clientPhone: clientPhone || undefined
      }
    })

    // Alerta al admin
    await dispatchAdminAlert(
      `📝 El cliente de la propuesta ${booking.shortId} (${booking.clientName}) completó/actualizó sus datos fiscales y legales.`
    )

    revalidatePath(`/propuesta/${booking.shortId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error saving legal data:", error)
    return { success: false, error: error.message || "Error al guardar los datos legales" }
  }
}

/**
 * Acepta formalmente la cotización, la bloquea y genera el contrato
 */
export async function acceptProposalAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true, client: true }
    })

    if (!booking) {
      return { success: false, error: "Propuesta no encontrada" }
    }

    if (booking.status === "agendado" || booking.status === "completado") {
      return { success: false, error: "Esta propuesta ya fue aceptada previamente" }
    }

    // Aceptar la cotización y cambiar estado a 'agendado' (Confirmado)
    const updatedBooking = await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: "agendado"
      }
    })

    // Sincronizar o crear el Event y el Contract asociado
    let eventId = booking.eventId
    if (!eventId) {
      // Si no hay evento creado, creamos uno
      const newEvent = await db.event.create({
        data: {
          clientId: booking.clientId,
          date: booking.requestedDate,
          startTime: booking.startTime,
          performanceStart: booking.startTime,
          performanceEnd: booking.endTime,
          amount: booking.baseAmount,
          deposit: booking.depositAmount,
          balance: booking.baseAmount - booking.depositAmount,
          totalIncome: booking.baseAmount,
          status: "scheduled",
          venueType: booking.venueType,
          mapsLink: booking.mapsLink,
          customName: booking.customName || "Colegio Mexicano de Anestesiología A.C.",
          source: "manual"
        }
      })
      eventId = newEvent.id
      await db.bookingRequest.update({
        where: { id: bookingId },
        data: { eventId }
      })
    }

    // Crear Contrato si no existe
    const existingContract = await db.contract.findFirst({
      where: { eventId: eventId! }
    })

    if (!existingContract) {
      await db.contract.create({
        data: {
          eventId: eventId!,
          status: "pending"
        }
      })
    }

    // Alerta al admin
    await dispatchAdminAlert(
      `✅ ¡Propuesta Aceptada! El cliente ${booking.clientName} ha aceptado formalmente la propuesta ${booking.shortId} v${booking.quoteVersion}. Monto total: $${booking.baseAmount.toLocaleString("es-MX")} MXN. Anticipo requerido: $${booking.depositAmount.toLocaleString("es-MX")} MXN.`
    )

    revalidatePath(`/propuesta/${booking.shortId}`)
    revalidatePath(`/status/${booking.shortId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error accepting proposal:", error)
    return { success: false, error: error.message || "Error al aceptar la propuesta" }
  }
}

/**
 * Solicita cambios sobre una cotización aceptada.
 * Clona el estado actual como versión histórica (ej. VND-1234-V1) y habilita la edición incrementando la versión actual.
 */
export async function requestChangesAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true }
    })

    if (!booking) {
      return { success: false, error: "Propuesta no encontrada" }
    }

    // Clonar versión histórica antes de modificar
    const historicalShortId = `${booking.shortId}-V${booking.quoteVersion}`
    
    // Verificar si ya existe este folio histórico para evitar colisiones
    const exists = await db.bookingRequest.findUnique({
      where: { shortId: historicalShortId }
    })

    if (!exists) {
      const { id, shortId, createdAt, updatedAt, event, ...cloneData } = booking
      await db.bookingRequest.create({
        data: {
          ...cloneData,
          shortId: historicalShortId,
          status: "cancelado", // Marcamos la histórica como desactiva/cancelada
          adminNote: `Historial: Versión ${booking.quoteVersion} archivada tras solicitud de cambios.`
        }
      })
    }

    // Actualizar la cotización actual a 'pendiente' e incrementar versión
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: "pendiente",
        quoteVersion: booking.quoteVersion + 1,
        clientSignature: null, // Reset firma
        signedAt: null, // Reset fecha de firma
        signedIp: null // Reset IP de firma
      }
    })

    // Alerta admin
    await dispatchAdminAlert(
      `🔄 El cliente ${booking.clientName} solicitó cambios en la propuesta ${booking.shortId}. Se ha generado la Versión ${booking.quoteVersion + 1} para revisión.`
    )

    revalidatePath(`/propuesta/${booking.shortId}`)
    revalidatePath(`/status/${booking.shortId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error requesting changes:", error)
    return { success: false, error: error.message || "Error al solicitar cambios" }
  }
}
