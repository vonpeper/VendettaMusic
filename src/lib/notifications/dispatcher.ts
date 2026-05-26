import { NotificationType } from "./types"
import { sendWhatsApp } from "./whatsapp"
import { getTemplateForType, parseTemplate } from "./templates"
import { formatDateMX } from "../utils"
import { getAppUrl } from "../url"

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
  
  // Deduplication check
  if (!forceResend) {
    const existing = await db.notification.findFirst({
      where: {
        type: type.toLowerCase(),
        status: "sent",
        ...(bookingId ? { bookingRequestId: bookingId } : {}),
        ...(eventId ? { eventId: eventId } : {}),
      }
    })
    
    if (existing) {
      console.log(`⚠️ Prevented duplicate notification of type ${type} for booking ${bookingId} / event ${eventId}`)
      return existing.messageId || "already_sent"
    }
  }

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
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

  // 2. Definir Plantillas y Lógica por Tipo
  if (type === "ADMIN_NEW_BOOKING") {
    recipient = config?.adminWhatsapp || recipient
  }

  let template = getTemplateForType(type, config, payload)

  // --- MODO SANDBOX GLOBAL: DESVÍO DE TODOS LOS MENSAJES ---
  const sandboxConfigs: any[] = await db.$queryRaw`SELECT isSandbox FROM GlobalConfig WHERE id = 'vendetta_config' LIMIT 1`
  const isSandbox = sandboxConfigs.length > 0 ? Boolean(sandboxConfigs[0].isSandbox) : false
  if (isSandbox && type !== "ADMIN_NEW_BOOKING") {
    const sandboxRecipient = config?.adminWhatsapp || "7222417045"
    console.log(`🧪 [SANDBOX GLOBAL] Desviando [${type}] de ${recipient} -> ADMIN (${sandboxRecipient})`)
    recipient = sandboxRecipient
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
  }

  // 4. Generar PDF si es Cotización o Confirmación
  let media: string | undefined = undefined
  let fileName: string | undefined = undefined

  if ((type === "CLIENT_QUOTE" || type === "CLIENT_CONFIRMED") && bookingId) {
    try {
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
      errorDetails: error,
      category: "push_notification"
    }
  }).catch((e: any) => console.error("Error logging notification:", e))

  return messageId
}
