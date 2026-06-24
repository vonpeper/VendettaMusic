import { NotificationType } from "./types"
import { sendWhatsApp } from "./whatsapp"
import { getTemplateForType, parseTemplate } from "./templates"
import { formatDateMX } from "../utils"
import { getAppUrl } from "../url"
import { toWhatsAppNumber } from "../phone"

/**
 * Función Maestra: El único punto de entrada para notificaciones
 */
export async function dispatchNotification({
  type,
  to,
  bookingId,
  eventId,
  customData = {},
  forceResend = false
}: {
  type: NotificationType
  to?: string
  bookingId?: string
  eventId?: string
  customData?: Record<string, any>
  forceResend?: boolean
}) {
  const { db } = await import("../db")

  // Failsafe de registros eliminados: abortar si la reserva o evento vinculados no existen en la BD
  if (bookingId) {
    const bookingExists = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!bookingExists) {
      console.warn(`🛑 Notificación ${type} abortada porque la reserva ${bookingId} fue eliminada.`)
      return null
    }
  }
  if (eventId) {
    const eventExists = await db.event.findUnique({ where: { id: eventId } })
    if (!eventExists) {
      console.warn(`🛑 Notificación ${type} abortada porque el evento ${eventId} fue eliminado.`)
      return null
    }
  }
  
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  
  // Deduplication check (skip in sandbox mode)
  const isSandbox = config?.isSandbox ?? false;
  if (!forceResend && !isSandbox) {
    const isMusicianType = type.startsWith("MUSICIAN") || type === "EVENT_CANCELLED"
    const existing = await db.notification.findFirst({
      where: {
        type: type.toLowerCase(),
        status: "sent",
        ...(bookingId ? { bookingRequestId: bookingId } : {}),
        ...(eventId ? { eventId: eventId } : {}),
        ...(isMusicianType && to ? { recipient: to } : {})
      }
    })
    
    if (existing) {
      console.log(`⚠️ Prevented duplicate notification of type ${type} for booking ${bookingId} / event ${eventId} (Recipient: ${to})`)
      return existing.messageId || "already_sent"
    }
  }

  const baseUrl = getAppUrl()

  if (!config) {
    console.error("❌ ERROR CRÍTICO: No existe el registro 'vendetta_config' en GlobalConfig.")
    return null
  }

  // 1. Resolver Destinatario y Datos base
  let recipient = to
  let payload: Record<string, string> = { ...customData }

  // Si tenemos bookingId, cargamos datos para las plantillas automáticamente
  if (bookingId && !payload.clientName) {
    const booking = await db.bookingRequest.findUnique({ 
      where: { id: bookingId },
      include: { event: { include: { location: true, package: true } } }
    })
    if (booking) {
      payload = {
        ...payload,
        folio: booking.shortId || "S/F",
        shortId: booking.shortId || "S/F",
        clientName: booking.clientName.split(" ")[0],
        fullName: booking.clientName,
        eventName: booking.clientName, // Usamos el nombre del cliente como nombre de evento por ahora
        date: formatDateMX(booking.requestedDate, "d 'de' MMMM"),
        fullDate: formatDateMX(booking.requestedDate, "EEEE, d 'de' MMMM"),
        time: booking.startTime || "Por confirmar",
        location: booking.event?.location?.name || booking.address || "Por confirmar",
        package: booking.event?.package?.name || booking.packageName || "Personalizado",
        ceremony: booking.venueType || booking.event?.ceremonyType || "Show",
        isBarEvent: [
          booking.venueType,
          booking.packageName,
          booking.event?.package?.name,
          booking.event?.location?.name,
          booking.event?.location?.spaceType
        ].some((str: string | null | undefined) => str && str.toLowerCase().includes("bar")) ? "true" : "false",
        arrivalTime: booking.event?.arrivalTime || "Por definir",
        setupTime: booking.event?.setupTime || "Por definir",
        dressCode: (() => {
          const map: Record<string, string> = {
            "formal": "🎩 Formal",
            "formal_casual": "👔 Formal Casual",
            "rock": "🎸 Rock / Casual",
            "nocturno": "🌙 Concierto Nocturno"
          }
          return map[booking.event?.dressCode || ""] || booking.event?.dressCode || "Por definir"
        })(),
        adminLink: `${baseUrl}/admin/ventas/${bookingId}`,
        statusLink: `${baseUrl}/status/${booking.shortId}`,
        bookingLink: `${baseUrl}/status/${booking.shortId}`,
        total: booking.baseAmount?.toLocaleString("es-MX") || "0"
      }
      if (!recipient && type.startsWith("CLIENT")) recipient = booking.clientPhone
    }
  }

  // Si tenemos eventId y no bookingId, cargamos datos para las plantillas automáticamente
  if (eventId && !bookingId && !payload.clientName) {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { bookingRequest: true, location: true, client: { include: { user: true } } }
    })
    if (event) {
      payload = {
        ...payload,
        folio: event.bookingRequest?.shortId || event.quoteId?.slice(0, 8).toUpperCase() || "S/F",
        shortId: event.bookingRequest?.shortId || event.quoteId?.slice(0, 8).toUpperCase() || "S/F",
        clientName: event.customName || event.client?.user?.name || event.bookingRequest?.clientName || "Cliente",
        fullName: event.customName || event.client?.user?.name || event.bookingRequest?.clientName || "Cliente",
        eventName: event.customName || event.client?.user?.name || event.bookingRequest?.clientName || "Evento Vendetta",
        date: formatDateMX(event.date, "d 'de' MMMM"),
        fullDate: formatDateMX(event.date, "EEEE, d 'de' MMMM"),
        time: event.performanceStart || event.startTime || "Por confirmar",
        location: event.location?.name || event.bookingRequest?.city || "Por confirmar",
        address: event.location?.address || event.bookingRequest?.address || "No especificada",
        mapsLink: event.location?.mapsLink || event.bookingRequest?.mapsLink || "",
        setupTime: event.setupTime || event.bookingRequest?.setupTime || "Por definir",
        arrivalTime: event.arrivalTime || event.bookingRequest?.arrivalTime || "Por definir",
        performanceStart: event.performanceStart || "Por definir",
        performanceEnd: event.performanceEnd || "Por definir",
        dressCode: (() => {
          const map: Record<string, string> = {
            "formal": "🎩 Formal",
            "formal_casual": "👔 Formal Casual",
            "rock": "🎸 Rock / Casual",
            "nocturno": "🌙 Concierto Nocturno"
          }
          return map[event.dressCode || ""] || event.dressCode || "Por definir"
        })(),
        ceremony: (() => {
          const map: Record<string, string> = {
            boda: "💒 Boda", xv_anos: "👸 XV Años", cumpleanos: "🎂 Cumpleaños",
            corporativo: "🏢 Evento Corp", festival: "🎪 Festival", happening: "🎵 Happening",
            privado: "🏠 Privado", bar: "🍺 Bar / Venue", otro: "📋 Otro",
          }
          return map[event.ceremonyType || event.venueType || ""] || event.ceremonyType || event.venueType || "Show"
        })(),
        notes: event.musicianNotes || event.bookingRequest?.musicianNotes || "Ninguna"
      }
    }
  }

  // 2. Definir Plantillas y Lógica por Tipo
  if (type === "ADMIN_NEW_BOOKING") {
    recipient = config?.adminWhatsapp || recipient
  }

  const template = getTemplateForType(type, config, payload)

  // --- MODO SANDBOX GLOBAL: DESVÍO DE TODOS LOS MENSAJES ---
  // Moved sandbox config retrieval earlier; removed duplicate query
  // const sandboxConfigs: any[] = await db.$queryRaw`SELECT isSandbox FROM GlobalConfig WHERE id = 'vendetta_config' LIMIT 1`
  // const isSandbox = sandboxConfigs.length > 0 ? Boolean(sandboxConfigs[0].isSandbox) : false
  console.log('[DISPATCHER SANDBOX]', isSandbox)
  let originalRecipient: string | undefined = undefined
  if (isSandbox && type !== "ADMIN_NEW_BOOKING") {
    const sandboxRecipient = config?.adminWhatsapp || "7222417045"
    console.log(`🧪 [SANDBOX GLOBAL] Desviando [${type}] de ${recipient} -> ADMIN (${sandboxRecipient})`)
    originalRecipient = recipient
    recipient = sandboxRecipient
  }

  // Failsafe Global para Músicos Inactivos
  const targetPhone = originalRecipient || recipient
  if (targetPhone) {
    const normalizedTarget = toWhatsAppNumber(targetPhone)
    if (normalizedTarget) {
      const cleanTarget = normalizedTarget.replace(/\D+/g, "")
      const inactiveMusicians = await db.musicianProfile.findMany({
        where: {
          status: { not: "active" },
          whatsapp: { not: null }
        }
      })
      const isInactive = inactiveMusicians.some((m: any) => {
        if (!m.whatsapp) return false
        const cleanM = m.whatsapp.replace(/\D+/g, "")
        return cleanM.slice(-10) === cleanTarget.slice(-10)
      })

      if (isInactive) {
        console.warn(`🛑 [FAILSAFE BLOQUEO] Se abortó el envío de [${type}] a ${targetPhone} porque pertenece a un músico INACTIVO / ELIMINADO.`)
        await db.notification.create({
          data: {
            bookingRequestId: bookingId || null,
            eventId: eventId || null,
            type: type.toLowerCase(),
            channel: "whatsapp",
            recipient: targetPhone,
            message: `[BLOQUEADO FAILSAFE] Notificación bloqueada por estatus inactivo del músico.`,
            status: "blocked",
            category: "push_notification"
          }
        }).catch(() => {})
        return null
      }
    }
  }

  if (!recipient || !template) {
    console.warn(`⚠️ Notificación ${type} abortada: Faltan datos (Dest: ${recipient})`)
    return null
  }

  // 3. Renderizar Mensaje
  // Aseguramos que los campos básicos estén en el payload si no vienen de customData
  const finalPayload = {
    notes: "Ninguna",
    songsList: "No se especificaron canciones.",
    location: "Por confirmar",
    ...payload,
  }

  let finalMessage = parseTemplate(template, finalPayload)

  // Añadir prefijo de sandbox si aplica
  if (isSandbox && type !== "ADMIN_NEW_BOOKING") {
    const originalName = payload.fullName || payload.clientName || "Destinatario"
    const label = type.startsWith("CLIENT") ? "Cliente" : "Músico"
    finalMessage = `🧪 *[MODO SANDBOX — PRUEBA]*\n_Originalmente para: ${originalName} (${label})_\n\n${finalMessage}`
    if (originalRecipient) {
      finalMessage = `🧪 SANDBOX: destinatario real era ${originalRecipient}\n${finalMessage}`
    }
  }

  // 4. Generar PDF si es Cotización o Confirmación
  let media: string | undefined = undefined
  let fileName: string | undefined = undefined

  if (type === "CLIENT_CONFIRMED" && bookingId) {
    try {
    console.log('[OFFICIAL WHATSAPP] Starting official WhatsApp notification flow')
      const { generateContractPdf } = await import("../pdf/contract-generator")
      // Re-fetcheamos para tener los datos completos para el generador
      const booking = await db.bookingRequest.findUnique({ 
        where: { id: bookingId }
      })

      if (booking) {
        // Mapeo idéntico al de la API /api/admin/contract/[id]
        const funnelData: any = {
          bookingId: booking.id,
          shortId: booking.shortId || "",
          packageId: booking.packageId || "manual-arma",
          packageName: booking.packageName || "Paquete Personalizado",
          packagePrice: booking.baseAmount || 0,
          guestCount: booking.guestCount || 0,
          venueType: booking.venueType || "salon",
          bandHours: booking.bandHours || 2,
          djHours:   booking.djHours || 0,
          isDjWithTvs: booking.isDjWithTvs || false,
          hasTemplete: booking.hasTemplete || false,
          hasPista:    booking.hasPista || false,
          hasRobot:    booking.hasRobot || false,
          street: booking.calle || "",
          houseNumber: booking.numero || "",
          colonia: booking.colonia || "",
          municipio: booking.municipio || booking.city || "",
          address: booking.address || "",
          city: booking.city || "",
          state: booking.state || "México",
          viaticosAmount: booking.viaticosAmount || 0,
          requestedDate: booking.requestedDate ? booking.requestedDate.toISOString() : new Date().toISOString(),
          startTime: booking.startTime || "21:00",
          endTime: booking.endTime || "23:00",
          clientName: booking.clientName || "Cliente",
          clientPhone: booking.clientPhone || "",
        }

        const isConfirmed = type === "CLIENT_CONFIRMED"
        const pdfBytes = await generateContractPdf(funnelData, booking.shortId || booking.id, {
          includeLegal: isConfirmed, // Si está confirmado, incluye contrato legal
          clientSignature: booking.clientSignature || undefined,
          adminSignature: (booking.adminSignature && booking.adminSignature.length > 10) 
            ? booking.adminSignature 
            : (config?.adminSignature || undefined),
          signedAt: booking.signedAt ? booking.signedAt.toISOString() : undefined,
          contractLegalText: (booking.venueType?.toLowerCase() === "bar" || (booking as any).event?.venueType?.toLowerCase() === "bar") 
            ? ((config as any)?.contractBarLegalText || undefined)
            : (config?.contractLegalText || undefined)
        })
        
        media = Buffer.from(pdfBytes).toString("base64")
        const prefix = isConfirmed ? "Contrato" : "Cotizacion"
        fileName = `${prefix}_Vendetta_${booking.shortId || "S-F"}.pdf`
      }
    } catch (err) {
      console.error("❌ Error generando PDF para WhatsApp:", err)
    }
  }

  // 5. Enviar y Registrar
  const { messageId, error } = await sendWhatsApp(recipient, finalMessage, payload.fullName || recipient, media, fileName)
  console.log(`[NOTIFICATION STATUS] messageId: ${messageId}, error: ${error}`)
  
  if (!messageId) {
    console.log('[WHATSAPP RESPONSE] No messageId returned, possible failure')
  }

  await db.notification.create({
    data: {
      bookingRequestId: bookingId || null,
      eventId: eventId || null,
      type: type.toLowerCase(),
      channel: "whatsapp",
      recipient,
      message: finalMessage,
      status: messageId ? "sent" : "failed",
      messageId: messageId || null,
      errorDetails: isSandbox && originalRecipient ? `Sandbox: original recipient ${originalRecipient}` : error,
      category: "push_notification"
    }
  }).catch((e: any) => console.error("Error logging notification:", e))

  return messageId
}
