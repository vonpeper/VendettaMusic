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
        ceremony: booking.venueType || booking.event?.ceremonyType || "Show",
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

    case "MUSICIAN_REHEARSAL":
      template = `🥁 *NUEVO ENSAYO — VENDETTA* 🥁
 
📅 *Fecha y Hora:* {{date}}
📍 *Lugar:* {{location}}
 
📝 *Tarea / Notas:* 
{{notes}}
 
🎶 *Repertorio a ensayar:*
{{songsList}}
 
⚠️ Confirma de recibido respondiendo este mensaje.
— Administración Vendetta`
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
    .replace(/{{notes}}/g, payload.notes || "Ninguna")
    .replace(/{{songsList}}/g, payload.songsList || "No se especificaron canciones.")
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
          includeLegal: isConfirmed, // Si está confirmado, incluye contrato legal
          clientSignature: booking.clientSignature || undefined,
          adminSignature: booking.adminSignature || config?.adminSignature || undefined,
          signedAt: booking.signedAt ? booking.signedAt.toISOString() : undefined
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
    include: { bookingRequest: true, musicians: true }
  })

  // Log de inicio
  await db.notification.create({
    data: {
      type: "SYSTEM_DEBUG",
      channel: "log",
      message: `notifyMusicians iniciado para ${eventId}. Músicos en relación: ${event?.musicians?.length || 0}`,
      status: "info"
    }
  }).catch(() => {})
  
  // 1. Resolver qué músicos notificar:
  //    - Si se pasan IDs específicos, usarlos.
  //    - Si no, tomar todos los asignados al evento en EventMusician.
  let resolvedIds: string[] = targetMusicianIds || []
  if (resolvedIds.length === 0) {
    const assigned = await db.eventMusician.findMany({
      where: { eventId },
      select: { musicianId: true }
    })
    resolvedIds = assigned.map((em: any) => em.musicianId)
  }

  if (resolvedIds.length === 0) {
    console.warn(`⚠️ notifyMusicians: Evento ${eventId} no tiene músicos asignados ni IDs específicos. Abortando.`)
    return
  }

  const profiles = await db.musicianProfile.findMany({
    where: {
      id: { in: resolvedIds },
      OR: [{ phone: { not: null } }, { whatsapp: { not: null } }],
      status: "active"
    },
    include: { 
      user: true,
      eventMusicians: {
        where: { eventId: eventId }
      }
    }
  })

  // 2. Filtrar: Solo enviar a los que están "pending" (no han respondido o son nuevos)
  const allRecipients = profiles.map((p: any) => ({ 
    id: p.id, 
    name: p.user?.name || "Músico", 
    phone: [p.whatsapp, p.phone].find((num: any) => num && num.trim() !== ""),
    instrument: p.instrument || "",
    currentStatus: p.eventMusicians[0]?.status || "pending"
  })).filter((r: any) => r.currentStatus === "pending" || r.currentStatus === "confirmed" || r.currentStatus === "rejected") 
  // Nota: Permitimos re-enviar incluso si ya respondieron si se solicita explícitamente

  console.log(`📣 notifyMusicians: Iniciando convocatoria para Evento ${eventId}. Destinatarios filtrados: ${allRecipients.length}`)

  if (allRecipients.length === 0) {
    const reason = profiles.length === 0 ? "No hay perfiles activos con teléfono" : "Todos los músicos ya tienen estatus distinto a pending"
    console.warn(`⚠️ No se encontraron destinatarios válidos para el evento ${eventId}. Razón: ${reason}`)
    return
  }

  console.log("📋 PASE DE LISTA PARA CONVOCATORIA:", allRecipients.map((r: any) => `${r.name} (${r.instrument})`).join(", "))

  // Obtenemos la configuración para el número del Admin (Sandbox)
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const sandboxRows: any[] = await db.$queryRaw`SELECT isSandbox FROM GlobalConfig WHERE id = 'vendetta_config' LIMIT 1`
  const isSandbox = sandboxRows.length > 0 ? Boolean(sandboxRows[0].isSandbox) : false

  const baseUrl = getAppUrl()

  // Pre-calcular fecha formateada desde el evento
  const eventDate = gigDetails.date
    ? (typeof gigDetails.date === "string" && gigDetails.date.includes("de")
        ? gigDetails.date
        : formatDateMX(new Date(gigDetails.date), "d 'de' MMMM"))
    : "Por confirmar"

  const ceremonyLabel: Record<string, string> = {
    boda: "💒 Boda", xv_anos: "👸 XV Años", cumpleanos: "🎂 Cumpleaños",
    corporativo: "🏢 Evento Corp", festival: "🎪 Festival", happening: "🎵 Happening",
    privado: "🏠 Privado", bar: "🍺 Bar / Venue", otro: "📋 Otro",
  }

  const dressCodeMap: Record<string, string> = {
    "formal": "🎩 Formal",
    "formal_casual": "👔 Formal Casual",
    "rock": "🎸 Rock / Casual",
    "nocturno": "🌙 Concierto Nocturno"
  }

  for (const r of allRecipients) {
    if (!r.phone) continue

    // Ingenieros de Audio: convocatoria manual
    if (r.instrument.toLowerCase().includes("ingeniero") || r.instrument.toLowerCase().includes("audio")) {
      console.log(`⏭️ Saltando a ${r.name} (${r.instrument}): Convocatoria manual.`)
      continue
    }

    const finalDressCode = dressCodeMap[gigDetails.dressCode] || gigDetails.dressCode || "Por definir"
    const eventName = gigDetails.clientName || gigDetails.eventName || "Evento Vendetta"
    const confirmLink = `${baseUrl}/confirmar/${r.id}/${eventId}`

    // Determinar destinatario real (respetando sandbox)
    const realRecipient = isSandbox
      ? (config?.adminWhatsapp || "7222417045")
      : r.phone

    if (isSandbox) {
      console.log(`🧪 [SANDBOX] Desviando convocatoria de ${r.name} (${r.phone}) -> ADMIN (${realRecipient})`)
    } else {
      console.log(`📤 Enviando convocatoria a ${r.name} (${r.instrument}) -> ${realRecipient}`)
    }

    // Obtener template de la DB o usar el default
    const dbTemplate = config?.msgTemplateGig
    const isOldTemplate = !dbTemplate || dbTemplate.includes("NUEVO GIG")
    const template = isOldTemplate
      ? `🎸 *NUEVA CONVOCATORIA: {{eventName}}*
  
📅 *Fecha:* {{date}}
🎉 *Tipo:* {{ceremony}}
📍 *Lugar:* {{location}}
🗺️ *Maps:* {{mapsLink}}
⏱️ *Montaje:* {{setupTime}}
🚗 *Llegada músicos:* {{arrivalTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}`
      : dbTemplate

    // Sustituir variables directamente sin pasar bookingId (evita sobreescritura)
    const message = template
      .replace(/{{eventName}}/g, eventName)
      .replace(/{{date}}/g, eventDate)
      .replace(/{{ceremony}}/g, ceremonyLabel[gigDetails.ceremonyType || gigDetails.venueType || ""] || gigDetails.ceremonyType || "Show")
      .replace(/{{location}}/g, gigDetails.locationName || gigDetails.address || "Por confirmar")
      .replace(/{{mapsLink}}/g, gigDetails.mapsLink ? gigDetails.mapsLink : "(no registrado)")
      .replace(/{{setupTime}}/g, gigDetails.setupTime || gigDetails.performanceStart || "Por definir")
      .replace(/{{arrivalTime}}/g, gigDetails.arrivalTime || gigDetails.performanceStart || "Por definir")
      .replace(/{{dressCode}}/g, finalDressCode)
      .replace(/{{notes}}/g, gigDetails.musicianNotes || "Ninguna")
      .replace(/{{confirmLink}}/g, confirmLink)

    // Enviar directamente via Evolution sin pasar por dispatchNotification
    // (para evitar que el bookingId sobreescriba los datos ya resueltos)
    const evolutionUrl = (config as any)?.evolutionUrl || process.env.EVOLUTION_API_URL
    const evolutionKey = (config as any)?.evolutionApiKey || process.env.EVOLUTION_API_KEY
    const evolutionInstance = (config as any)?.evolutionInstance || process.env.EVOLUTION_INSTANCE_NAME

    if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
      console.error(`❌ Evolution API no configurada. URL: ${evolutionUrl}, Instance: ${evolutionInstance}`)
      continue
    }

    const cleanPhone = realRecipient.replace(/\D/g, "")
    const jid = cleanPhone.length === 10 ? `52${cleanPhone}@s.whatsapp.net` : `${cleanPhone}@s.whatsapp.net`

    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": evolutionKey },
        body: JSON.stringify({ number: jid, text: message })
      })

      if (resp.ok) {
        console.log(`✅ Convocatoria enviada a ${r.name} (${r.instrument})`)
        // Registrar notificación exitosa
        await db.notification.create({
          data: {
            type: "MUSICIAN_GIG",
            channel: "whatsapp",
            recipient: realRecipient,
            status: "sent",
            message: message.substring(0, 500),
            eventId: eventId,
            bookingRequestId: event?.bookingRequest?.id || null,
          }
        }).catch(() => {})
      } else {
        const err = await resp.text()
        console.error(`❌ Error Evolution para ${r.name}:`, err)
        // Registrar notificación fallida
        await db.notification.create({
          data: {
            type: "MUSICIAN_GIG",
            channel: "whatsapp",
            recipient: realRecipient,
            status: "failed",
            message: `ERROR: ${err.substring(0, 100)} | MSG: ${message.substring(0, 300)}`,
            eventId: eventId,
            bookingRequestId: event?.bookingRequest?.id || null,
          }
        }).catch(() => {})
      }
    } catch (err: any) {
      console.error(`❌ Fallo de red al notificar a ${r.name}:`, err?.message)
    }
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

/**
 * Google Calendar Delete (Stub)
 */
export async function deleteFromGoogleCalendar(calendarEventId: string): Promise<boolean> {
  console.log("📅 [Calendar Stub] Borrando evento:", calendarEventId);
  return true;
}
