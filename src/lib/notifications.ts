/**
 * Cerebro Central de Notificaciones Vendetta
 * Responsable de la lógica Push via WhatsApp (Evolution API)
 */
import { formatDateMX } from "./utils"
import { getAppUrl } from "./url"

export type NotificationType = 
  | "ADMIN_NEW_BOOKING"   // Aviso al jefe de nueva venta web
  | "CLIENT_QUOTE"       // Envío de cotización inicial
  | "CLIENT_FOLLOWUP"    // Seguimiento de venta pendiente
  | "CLIENT_CONFIRMED"   // Aviso de fecha bloqueada (agendado)
  | "MUSICIAN_GIG"       // Convocatoria a músicos
  | "MUSICIAN_REHEARSAL" // Aviso de ensayo

const CEREMONY_LABELS: Record<string, string> = {
  boda: "💒 Boda", xv_anos: "👸 XV Años", cumpleanos: "🎂 Cumpleaños",
  corporativo: "🏢 Evento Corp", festival: "🎪 Festival", happening: "🎵 Happening",
  privado: "🏠 Privado", otro: "📋 Otro",
}

/**
 * Función Maestra: El único punto de entrada para notificaciones
 */
export async function dispatchNotification({
  type,
  to,
  bookingId,
  eventId,
  customData = {}
}: {
  type: NotificationType
  to?: string
  bookingId?: string
  eventId?: string
  customData?: Record<string, any>
}) {
  const { db } = await import("./db")
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
        clientName: booking.clientName.split(" ")[0],
        fullName: booking.clientName,
        eventName: booking.clientName, // Usamos el nombre del cliente como nombre de evento por ahora
        date: formatDateMX(booking.requestedDate, "d 'de' MMMM"),
        fullDate: formatDateMX(booking.requestedDate, "EEEE, d 'de' MMMM"),
        time: booking.startTime || "Por confirmar",
        location: booking.event?.location?.name || booking.address || "Por confirmar",
        package: booking.event?.package?.name || booking.packageName || "Personalizado",
        ceremony: booking.ceremonyType || "Show",
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
  let template = ""
  
  switch (type) {
    case "ADMIN_NEW_BOOKING":
      recipient = config?.adminWhatsapp || recipient
      template = `🎸 *NUEVO PEDIDO — VENDETTA* 🎸\nID: {{folio}}\n\n👤 *Cliente:* {{fullName}}\n📅 *Fecha:* {{date}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n\n✅ Verifica en: {{adminLink}}`
      break

      template = config?.msgTemplateQuote || `Hola {{clientName}}, somos *Vendetta Live Music* 🎸.

Es un gusto saludarte. Te compartimos adjunta la propuesta exclusiva para tu evento el próximo *{{date}}*.

Revisamos cada detalle para asegurar que la música sea inolvidable. Quedamos a tus órdenes para agendar una breve llamada y pulir los detalles.

¡Rock on! 🤘

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      break

    case "CLIENT_FOLLOWUP":
      template = config?.msgTemplateFollowUp || `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla? Seguimos a tus órdenes.`
      break

    case "CLIENT_CONFIRMED":
      template = config?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el estatus de tu evento y descargar tu contrato firmado aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      break

    case "MUSICIAN_GIG":
      // Forzamos la nueva plantilla si la de la DB es la antigua
      const dbTemplate = config?.msgTemplateGig
      const isOldTemplate = !dbTemplate || dbTemplate.includes("NUEVO GIG")
      
      template = isOldTemplate ? `🎸 *NUEVA CONVOCATORIA: {{eventName}}*
  
📅 *Fecha:* {{date}}
🎉 *Tipo:* {{ceremony}}
📍 *Lugar:* {{location}}
⏱️ *Montaje:* {{setupTime}}
🚗 *Llegada músicos:* {{arrivalTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}` : dbTemplate
      break
  }

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
  let finalMessage = template
    .replace(/{{clientName}}/g, payload.clientName || "")
    .replace(/{{fullName}}/g, payload.fullName || "")
    .replace(/{{date}}/g, payload.date || "")
    .replace(/{{time}}/g, payload.time || "")
    .replace(/{{package}}/g, payload.package || "")
    .replace(/{{total}}/g, payload.total || "")
    .replace(/{{shortId}}/g, payload.shortId || payload.folio || "")
    .replace(/{{folio}}/g, payload.folio || payload.shortId || "")
    .replace(/{{bookingLink}}/g, payload.bookingLink || "")
    .replace(/{{statusLink}}/g, payload.statusLink || payload.bookingLink || "")
    .replace(/{{adminLink}}/g, payload.adminLink || "")
    .replace(/\\n/g, "\n") // Convertir \n literales en saltos de línea reales

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
      const { generateContractPdf } = await import("./pdf/contract-generator")
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
          includeLegal: isConfirmed // Si está confirmado, incluye contrato legal
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
  const messageId = await sendWhatsApp(recipient, finalMessage, payload.fullName || recipient, media, fileName)
  
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
      category: "push_notification"
    }
  }).catch(e => console.error("Error logging notification:", e))

  return messageId
}

/**
 * Función auxiliar para reemplazar {{variables}}
 */
function parseTemplate(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || "")
  }
  return result
}

/**
 * Envío físico via Evolution API v2
 */
export async function sendWhatsApp(
  to: string, 
  message: string, 
  label?: string, 
  media?: string, 
  fileName?: string
): Promise<string | null> {
  const { db } = await import("./db")
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  let baseUrl = config?.evolutionUrl || process.env.EVOLUTION_BASE_URL || ""
  if (baseUrl && !baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`
  }
  
  const apiKey = config?.evolutionApiKey || process.env.EVOLUTION_API_KEY
  const instance = config?.evolutionInstance || "vendetta_admin"

  if (!baseUrl || !apiKey || !to) return null

  // Normalización Inteligente
  let cleanNumber = to.replace(/\D/g, "")
  if (cleanNumber.length === 10) cleanNumber = `52${cleanNumber}`
  else if (cleanNumber.length === 11 && cleanNumber.startsWith("1")) cleanNumber = `52${cleanNumber}`
  
  const isMedia = !!media
  const endpoint = isMedia ? "sendMedia" : "sendText"
  const url = `${baseUrl.replace(/\/$/, "")}/message/${endpoint}/${encodeURIComponent(instance)}`
  
  console.log(`📡 Llamando a Evolution API (${endpoint}): ${url}`)
  console.log(`📱 Destino: ${label || "Desconocido"} (${cleanNumber})`)

  try {
    const body: any = {
      number: cleanNumber,
      delay: 1200
    }

    if (isMedia) {
      body.media = media
      body.mediatype = "document"
      body.mimetype = "application/pdf"
      body.fileName = fileName || "Cotizacion_Vendetta.pdf"
      body.caption = message
    } else {
      body.text = message
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      console.log(`✅ WhatsApp Enviado con éxito. ID: ${data.key?.id || "sent_ok"}`)
      return data.key?.id || data.messageId || "sent_ok"
    } else {
      const errorBody = await res.text().catch(() => "Sin cuerpo de error")
      console.error(`❌ RECHAZO DE API [${res.status}]: ${errorBody}`)
    }
    return null
  } catch (err) {
    console.error("❌ Evolution API Error:", err)
    return null
  }
}

/**
 * Notificador de Músicos optimizado (Bucle centralizado)
 */
export async function notifyMusicians(eventId: string, gigDetails: any, db: any, targetMusicianIds?: string[]) {
  const event = await db.event.findUnique({ 
    where: { id: eventId },
    include: { bookingRequest: true }
  })
  
  // 1. Obtener perfiles de los músicos solicitados
  const profiles = await db.musicianProfile.findMany({
    where: {
      id: { in: targetMusicianIds },
      OR: [{ phone: { not: null } }, { whatsapp: { not: null } }],
      status: "active"
    },
    include: { 
      user: true,
      events: {
        where: { eventId: eventId }
      }
    }
  })

  // 2. Filtrar: Solo enviar a los que están "pending" (no han respondido o son nuevos)
  //    Si el admin los seleccionó en el UI, queremos convocarlos.
  const allRecipients = profiles.map((p: any) => ({ 
    id: p.id, 
    name: p.user?.name || "Músico", 
    phone: [p.whatsapp, p.phone].find((num: any) => num && num.trim() !== ""),
    instrument: p.instrument || "",
    currentStatus: p.events[0]?.status || "pending"
  })).filter((r: any) => r.currentStatus === "pending")

  console.log(`📣 notifyMusicians: Iniciando convocatoria para Evento ${eventId}. Titulares a notificar: ${allRecipients.length}`)

  if (allRecipients.length === 0) {
    console.warn("⚠️ No se encontraron destinatarios válidos (titulares o suplentes).")
    return
  }

  console.log("📋 PASE DE LISTA PARA CONVOCATORIA:", allRecipients.map(r => `${r.name} (${r.instrument})`).join(", "))

  // Obtenemos la configuración para el número del Admin (Sandbox)
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  for (const r of allRecipients) {
    if (!r.phone) continue

    // Lógica de prioridad para Ingenieros
    if (r.instrument.toLowerCase().includes("ingeniero") || r.instrument.toLowerCase().includes("audio")) {
      console.log(`⏭️ Saltando a ${r.name} (${r.instrument}): Convocatoria manual.`)
      continue
    }

    // Mapeo de vestimenta para que salga el texto bonito
    const dressCodeMap: Record<string, string> = {
      "formal": "🎩 Formal",
      "formal_casual": "👔 Formal Casual",
      "rock": "🎸 Rock / Casual",
      "nocturno": "🌙 Concierto Nocturno"
    }
    const finalDressCode = dressCodeMap[gigDetails.dressCode] || gigDetails.dressCode || "Por definir"

    // --- MODO SANDBOX: DESVÍO A ADMINISTRADOR ---
    const sandboxRecipient = config?.adminWhatsapp || "7222417045"
    
    console.log(`🧪 [SANDBOX] Desviando convocatoria de ${r.name} -> ADMIN (${sandboxRecipient})`)
    console.log(`📝 [DEBUG] Datos Crudos:`, {
      llegada: gigDetails.arrivalTime,
      montaje: gigDetails.setupTime,
      vestimenta: gigDetails.dressCode
    })

    await dispatchNotification({
      type: "MUSICIAN_GIG",
      to: sandboxRecipient,
      bookingId: event?.bookingRequest?.id,
      eventId: eventId,
      customData: {
        notes: gigDetails.musicianNotes || "Ninguna",
        arrivalTime: gigDetails.arrivalTime || "Por definir",
        setupTime: gigDetails.setupTime || "Por definir",
        dressCode: finalDressCode,
        confirmLink: `${getAppUrl()}/confirmar/${r.id}/${eventId}`
      }
    })
  }

  await db.event.update({ where: { id: eventId }, data: { notificationSent: true } })
}

/**
 * Google Calendar Sync (Stub)
 */
export async function syncToGoogleCalendar(event: any): Promise<string | null> {
  // Implementación pendiente de credenciales finales
  return null
}
