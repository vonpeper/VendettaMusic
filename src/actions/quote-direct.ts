"use server"

import { db } from "@/lib/db"
import { sendWhatsApp } from "@/lib/notifications/whatsapp"
import { generateUniqueShortId } from "@/lib/folios"

export interface SubmitPublicQuoteInput {
  nombre: string
  telefono: string
  tipoEvento: string
  fecha: string // YYYY-MM-DD
  horaInicio?: string
  horaFin?: string
  horasShow?: number
  invitados: number
  estado?: string
  municipio: string
  lugarEvento?: string
  paquete?: string
  notas?: string
  inquiryId?: string
  produccionAdicional?: string[]
  viaticos?: any
  mapsLink?: string
}

export interface SaveQuoteDraftInput {
  nombre: string
  telefono: string
  fecha?: string
  municipio?: string
  estado?: string
  invitados?: number
  tipoEvento?: string
  inquiryId?: string
}

export type SaveQuoteDraftResult = {
  success: boolean
  inquiryId?: string
  error?: string
}

export async function saveQuoteDraftAction(
  input: SaveQuoteDraftInput
): Promise<SaveQuoteDraftResult> {
  try {
    const nombre = (input.nombre || "").trim()
    const telefono = (input.telefono || "").trim()
    const cleanPhone = telefono.replace(/\D/g, "")

    if (!nombre) {
      return { success: false, error: "El nombre completo es obligatorio." }
    }
    if (cleanPhone.length < 10) {
      return { success: false, error: "El número de WhatsApp debe contener al menos 10 dígitos." }
    }

    let parsedDate: Date | null = null
    if (input.fecha) {
      const d = new Date(`${input.fecha}T12:00:00`)
      if (!isNaN(d.getTime())) {
        parsedDate = d
      }
    }

    const aforo = Number(input.invitados) || 100
    const municipio = (input.municipio || "").trim()
    const estado = (input.estado || "Estado de México").trim()
    const tipoEvento = input.tipoEvento || "Evento Privado"
    const message = `[Borrador Cualificación] Aforo: ${aforo} pax | Ubicación: ${municipio || "Pendiente"}, ${estado}`

    if (input.inquiryId) {
      const existing = await db.contactInquiry.findUnique({ where: { id: input.inquiryId } })
      if (existing) {
        const updated = await db.contactInquiry.update({
          where: { id: input.inquiryId },
          data: {
            name: nombre,
            phone: cleanPhone,
            requestedDate: parsedDate ?? existing.requestedDate,
            eventType: `${tipoEvento} (Borrador)`,
            message: message,
            status: existing.status === "converted" ? "converted" : "prospecto_cotizando"
          }
        })
        return { success: true, inquiryId: updated.id }
      }
    }

    const fallbackEmail = `cliente_${cleanPhone.slice(-10)}@prospectos.vendetta.mx`
    const inquiry = await db.contactInquiry.create({
      data: {
        name: nombre,
        phone: cleanPhone,
        email: fallbackEmail,
        requestedDate: parsedDate,
        eventType: `${tipoEvento} (Borrador)`,
        message: message,
        status: "prospecto_cotizando"
      }
    })

    return { success: true, inquiryId: inquiry.id }
  } catch (err: any) {
    console.error("Error al registrar borrador de prospecto:", err)
    return { success: false, error: "Error interno al registrar borrador." }
  }
}

export type SubmitPublicQuoteResult = {
  success: boolean
  mode?: "auto_quote" | "needs_review" | "lead_captured"
  shortId?: string
  bookingId?: string
  inquiryId?: string
  proposalUrl?: string
  clientName?: string
  fecha?: string
  municipio?: string
  motivo?: string
  error?: string
}

function formatFechaEspanol(fechaStr: string): string {
  if (!fechaStr) return ""
  try {
    const [year, month, day] = fechaStr.split("-").map(Number)
    if (!year || !month || !day) return fechaStr
    const fechaObj = new Date(year, month - 1, day, 12, 0, 0)
    const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fechaObj)
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
  } catch {
    return fechaStr
  }
}

export async function submitPublicQuoteAction(
  input: SubmitPublicQuoteInput
): Promise<SubmitPublicQuoteResult> {
  try {
    // 1. Validaciones
    const nombre = (input.nombre || "").trim()
    if (!nombre) {
      return { success: false, error: "El nombre completo es obligatorio." }
    }

    const rawPhone = (input.telefono || "").replace(/\D/g, "")
    if (rawPhone.length < 10) {
      return { success: false, error: "Ingresa un número de WhatsApp válido de 10 dígitos." }
    }
    const cleanPhone = rawPhone.slice(-10)

    if (!input.fecha) {
      return { success: false, error: "La fecha del evento es obligatoria." }
    }

    const [year, month, day] = input.fecha.split("-").map(Number)
    const eventDate = new Date(year, month - 1, day, 12, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(eventDate.getTime())) {
      return { success: false, error: "La fecha proporcionada no es válida." }
    }
    if (eventDate < today) {
      return { success: false, error: "La fecha del evento debe ser a futuro." }
    }

    const municipio = (input.municipio || "").trim()
    if (!municipio) {
      return { success: false, error: "El municipio o zona del evento es obligatorio." }
    }

    const estado = (input.estado || "Estado de México").trim()
    const tipoEvento = (input.tipoEvento || "Evento Privado").trim()
    const aforo = Number(input.invitados) || 100
    const horasShow = Number(input.horasShow) || 2
    const horaInicio = (input.horaInicio || "21:00").trim()
    const horaFin = (input.horaFin || "23:00").trim()
    const horario = `${horaInicio} a ${horaFin}`

    // 2. Generar Folio Único Oficial VND-XXXX
    const shortId = await generateUniqueShortId(db)

    // 3. Crear / actualizar ContactInquiry
    const inqMsg = `[Solicitud Cotizador Web] Folio: ${shortId} | Motivo: ${tipoEvento} | Fecha: ${input.fecha} | Horario: ${horario} (${horasShow} Horas Show) | Aforo: ${aforo} pax | Ubicación: ${municipio}, ${estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}${input.paquete ? ` | Formato de interés: ${input.paquete}` : ""}${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""}`
    const fallbackEmail = `cliente_${cleanPhone}@cotizacion.vendetta.mx`

    let inquiryId = input.inquiryId
    if (inquiryId) {
      try {
        const updated = await db.contactInquiry.update({
          where: { id: inquiryId },
          data: {
            name: nombre,
            phone: cleanPhone,
            requestedDate: eventDate,
            eventType: tipoEvento,
            message: inqMsg,
            status: "pendiente_aprobacion"
          }
        })
        inquiryId = updated.id
      } catch {
        inquiryId = undefined
      }
    }

    if (!inquiryId) {
      const createdInq = await db.contactInquiry.create({
        data: {
          name: nombre,
          phone: cleanPhone,
          email: fallbackEmail,
          requestedDate: eventDate,
          eventType: tipoEvento,
          message: inqMsg,
          status: "pendiente_aprobacion"
        }
      })
      inquiryId = createdInq.id
    }

    // 4. Crear BookingRequest en estado pendiente_aprobacion (CERO PRECIOS INICIALES)
    const pkgLabel = input.paquete ? `Show Vendetta - ${input.paquete}` : "Show Vendetta (Por definir)"
    const booking = await db.bookingRequest.create({
      data: {
        shortId,
        sourceInquiryId: inquiryId,
        clientName: nombre,
        clientPhone: cleanPhone,
        clientEmail: fallbackEmail,
        packageName: pkgLabel,
        guestCount: aforo,
        venueType: tipoEvento,
        requestedDate: eventDate,
        startTime: horaInicio,
        endTime: horaFin,
        bandHours: horasShow,
        city: municipio,
        state: estado,
        address: input.lugarEvento?.trim() || municipio,
        mapsLink: input.mapsLink?.trim() || null,
        baseAmount: 0,
        depositAmount: 0,
        viaticosAmount: 0,
        discountAmount: 0,
        paymentMethod: "transferencia",
        paymentStatus: "pending",
        adminNote: `🚨 Nueva solicitud de cotización [${shortId}]. Pendiente de aprobación técnica y definición de precio por el administrador.${input.paquete ? ` Formato solicitado: ${input.paquete}.` : ""}${input.notas?.trim() ? ` Notas: ${input.notas.trim()}` : ""}`,
        musicianNotes: input.notas?.trim() || null,
        status: "pendiente_aprobacion",
        source: "cotizador_web"
      }
    })

    const fechaFormateada = formatFechaEspanol(input.fecha) || input.fecha

    // 5. WhatsApp al Cliente (Confirmación de recepción sin precios)
    try {
      const clientMsg = `¡Hola ${nombre}! 👋 Recibimos tu solicitud para tu ${tipoEvento} este ${fechaFormateada} en ${municipio}. Ya estamos revisando la disponibilidad y armando tu propuesta técnica. En breve te enviaremos el enlace oficial con los detalles de tu evento. — Equipo Vendetta`
      await sendWhatsApp(cleanPhone, clientMsg, `Confirmación Cotización - ${nombre}`).catch(err =>
        console.warn("Error enviando WhatsApp al cliente:", err)
      )
    } catch (clientErr) {
      console.warn("Excepción al enviar WhatsApp a cliente:", clientErr)
    }

    // 6. WhatsApp Inmediato al Administrador
    try {
      const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
      const adminPhone =
        config?.adminWhatsapp ||
        process.env.ADMIN_WHATSAPP_NUMBER ||
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
        "5217222880045"

      const adminMsg = 
`🚨 *NUEVA SOLICITUD DE COTIZACIÓN* 🚨
*Folio:* ${shortId}
*Cliente:* ${nombre}
*WhatsApp:* ${cleanPhone}
*Fecha:* ${fechaFormateada} (${horario})
*Lugar:* ${municipio}, ${estado}
*Aforo:* ${aforo} pax
*Motivo:* ${tipoEvento}${input.paquete ? `\n*Formato:* ${input.paquete}` : ""}${input.notas?.trim() ? `\n*Notas:* ${input.notas.trim()}` : ""}
👉 *Revisar y Aprobar:* https://vendetta.mx/admin/ventas/${booking.id}`

      await sendWhatsApp(adminPhone, adminMsg, `🚨 Nueva Solicitud [${shortId}] - ${nombre}`).catch(err =>
        console.warn("Error enviando WhatsApp a admin:", err)
      )
    } catch (adminErr) {
      console.warn("Excepción al enviar WhatsApp a admin:", adminErr)
    }

    return {
      success: true,
      mode: "needs_review",
      shortId: shortId,
      bookingId: booking.id,
      inquiryId: inquiryId,
      clientName: nombre,
      fecha: fechaFormateada,
      municipio: municipio,
      motivo: tipoEvento
    }
  } catch (err: unknown) {
    console.error("Error en submitPublicQuoteAction:", err)
    const message = err instanceof Error ? err.message : "Error al procesar la cotización"
    return {
      success: false,
      mode: "needs_review",
      error: message
    }
  }
}
