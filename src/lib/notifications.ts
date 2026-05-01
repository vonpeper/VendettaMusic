/**
 * Generador de mensajes de Gig y cliente de Twilio WhatsApp
 * 
 * Variables de entorno requeridas (agregar al .env cuando tengas cuenta Twilio):
 * TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * TWILIO_AUTH_TOKEN=your_auth_token
 * TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (sandbox) o tu número verificado
 */
import { formatDateMX } from "./utils"

export interface GigDetails {
  clientName: string
  date: Date
  ceremonyType?: string | null
  guestCount?: number
  locationName?: string | null
  locationAddress?: string | null
  performanceStart?: string | null
  performanceEnd?: string | null
  dressCode?: string | null
  packageName?: string | null
  musicianNotes?: string | null
  isPublic?: boolean
}

export interface ClientNotificationDetails {
  clientName: string
  date: Date
  folio?: string
  bookingLink?: string
  total?: number
}

export interface RehearsalNotificationDetails {
  date: Date
  location: string
  notes?: string
  songsList?: string
}

const DRESS_CODE_LABELS: Record<string, string> = {
  formal:        "🎩 Formal",
  formal_casual: "👔 Formal Casual",
  rock:          "🎸 Rock / Casual",
  nocturno:      "🌙 Concierto Nocturno",
}

const CEREMONY_LABELS: Record<string, string> = {
  boda:          "💒 Boda",
  xv_anos:       "👸 XV Años",
  cumpleanos:    "🎂 Cumpleaños",
  corporativo:   "🏢 Evento Corporativo",
  festival:      "🎪 Festival",
  happening:     "🎵 Happening",
  privado:       "🏠 Privado",
  otro:          "📋 Otro",
}

export function parseTemplate(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || "")
  }
  return result
}

/**
 * Genera el mensaje de WhatsApp formateado para los músicos basado en la plantilla
 */
export function buildGigMessage(gig: GigDetails, template: string, musicianId?: string, eventId?: string): string {
  const dateStr = formatDateMX(gig.date, "EEEE, d 'de' MMMM, yyyy")

  const ceremony = gig.ceremonyType
    ? CEREMONY_LABELS[gig.ceremonyType] ?? gig.ceremonyType
    : "Evento"

  const horario = gig.performanceStart
    ? `${gig.performanceStart}${gig.performanceEnd ? ` — ${gig.performanceEnd}` : ""} hrs`
    : "Por confirmar"

  const ubicacion = gig.locationName
    ? `${gig.locationName}${gig.locationAddress ? `, ${gig.locationAddress}` : ""}`
    : "Por confirmar"

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vendetta.app"
  const confirmLink = musicianId && eventId 
    ? `\n✅ *CONFIRMA AQUÍ:* \n${baseUrl}/confirmar/${musicianId}/${eventId}`
    : "\n✅ *CONFIRMACIÓN REQUERIDA:* \nResponde con la palabra *CONFIRMO*."

  const notesText = gig.musicianNotes ? `${gig.musicianNotes}` : "Ninguna"
  const isPublicText = !gig.isPublic ? `\n⚠️ *AVISO:* EVENTO PRIVADO\n` : ""

  const data = {
    clientName: gig.clientName,
    date: dateStr,
    ceremony: ceremony || "Evento",
    location: ubicacion,
    time: horario,
    package: gig.packageName || "Por confirmar",
    notes: notesText + isPublicText,
    confirmLink: confirmLink,
    total: "", // No aplica para gig
  }

  return parseTemplate(template, data)
}

/**
 * Notifica al cliente cuando su reserva ha sido confirmada/agendada
 */
export async function notifyClientBookingClosed(booking: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vendettalive.com"
  const bookingLink = `${baseUrl}/status/${booking.shortId}`
  
  await notifyWhatsApp({
    to: booking.clientPhone,
    type: "client_closed",
    data: {
      clientName:  booking.clientName?.split(" ")[0] || "Cliente",
      date:        formatDateMX(booking.requestedDate, "d 'de' MMMM, yyyy"),
      folio:       booking.shortId || "S/F",
      bookingLink: bookingLink,
    },
    eventId: booking.eventId
  })
}

/**
 * Función central para enviar notificaciones de WhatsApp con registro en BD y reemplazo de variables.
 */
export async function notifyWhatsApp({
  to,
  type,
  templateKey,
  data,
  eventId,
  saveLog = true
}: {
  to: string
  type: "admin_booking" | "client_followup" | "client_closed" | "gig_created" | "rehearsal_created"
  templateKey?: keyof any // En el futuro se puede tipar con GlobalConfig
  data: Record<string, string>
  eventId?: string
  saveLog?: boolean
}) {
  const { db } = await import("./db")
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
  
  let template = ""
  
  // 1. Resolver Plantilla
  switch (type) {
    case "admin_booking":
      template = `🎸 *NUEVO PEDIDO — VENDETTA* 🎸\nID Seguimiento: {{folio}}\n\n👤 *Cliente:* {{clientName}}\n📞 *Tel:* {{clientPhone}}\n📧 {{clientEmail}}\n\n📅 *Fecha:* {{date}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n📍 *Ubicación:* {{location}}\n\n✅ Verifica en: {{adminLink}}`
      break
    case "client_closed":
      template = config?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉\n\nHemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.\n\nFolio de seguimiento: *{{folio}}*\nConsulta el estatus y descarga tu contrato aquí:\n{{bookingLink}}\n\n¡Gracias por confiar en *Vendetta*! 🎸`
      break
    case "gig_created":
      template = config?.msgTemplateGig || `🎸 *NUEVO GIG — VENDETTA* 🎸\n\n📅 *Fecha:* {{date}}\n👤 *Cliente:* {{clientName}}\n🎉 *Tipo de evento:* {{ceremony}}\n📍 *Ubicación:* {{location}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n\n📝 *Notas:* {{notes}}\n\n{{confirmLink}}\n— Administración Vendetta`
      break
    case "rehearsal_created":
      template = `🥁 *NUEVO ENSAYO — VENDETTA* 🥁\n\n📅 *Fecha y Hora:* {{date}}\n📍 *Lugar:* {{location}}\n\n📝 *Tarea / Notas:* \n{{notes}}\n\n🎶 *Repertorio a ensayar:*\n{{songsList}}\n\n⚠️ Confirma de recibido respondiendo este mensaje.\n— Administración Vendetta`
      break
    // Aquí se pueden añadir más casos según crezca el sistema
  }

  // 2. Reemplazar Variables
  const message = parseTemplate(template, data)
  
  // 3. Enviar
  const messageId = await sendWhatsApp(to, message)
  
  // 4. Registrar en BD si aplica
  if (saveLog && messageId) {
    await db.notification.create({
      data: {
        eventId:   eventId || null,
        type:      type,
        channel:   "whatsapp",
        recipient: to,
        message,
        status:    "sent",
        twilioSid: messageId,
      }
    }).catch(e => console.error("Error logging notification:", e))
  }

  return messageId
}

/**
 * Envía un mensaje de WhatsApp vía Evolution API v2
 * Retorna el ID del mensaje si se envió, o null si no hay credenciales
 */
export async function sendWhatsApp(to: string, message: string): Promise<string | null> {
  const { db } = await import("./db")
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })

  const baseUrl  = config?.evolutionUrl || process.env.EVOLUTION_BASE_URL
  const apiKey   = config?.evolutionApiKey || process.env.EVOLUTION_API_KEY
  const instance = config?.evolutionInstance || process.env.EVOLUTION_INSTANCE || "vendetta_admin"

  if (!baseUrl || !apiKey || !baseUrl.startsWith("http")) {
    console.log("⚠️  Evolution API no configurada o URL inválida. Mensaje listo para enviar manualmente:")
    console.log("BASE_URL:", baseUrl)
    console.log("TO:", to)
    console.log("MSG:", message)
    return null
  }

  try {
    // Evolution API v2 strict phone number format
    let cleanNumber = to.replace(/\D/g, "")
    // Agregamos el prefijo 52 si falta y es número mexicano de 10 dígitos
    if (cleanNumber.length === 10) cleanNumber = `52${cleanNumber}`
    
    // El payload en Evolution API v2 soporta "number", y "text" a la raíz, pero en algunas subversiones requiere "options".
    // El envío estándar de texto que funciona en la mayoría de forks de v2 es:
    const payload = {
      number: cleanNumber,
      options: {
        delay: 1200,
        presence: "composing",
        linkPreview: true
      },
      textMessage: {
        text: message
      }
    }

    // Usamos headers agresivos para soportar auth v1 (apikey) y auth v2 (Bearer)
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    // Fallback: si el server responde 400 por esquema estricto (algunos forks de Evo no soportan textMessage anidado)
    // Hacemos un re-intento con el formato legacy plano.
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn(`⚠️ Intento 1 Evolution API (${response.status}) falló. Intentando formato legacy. Error:`, errorData)
      
      const legacyResponse = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: message,
          delay: 1200,
          linkPreview: true
        })
      })

      if (!legacyResponse.ok) {
         const legacyError = await legacyResponse.json().catch(() => ({}))
         console.error(`❌ Error definitivo Evolution API (${legacyResponse.status}):`, legacyError)
         return null
      }
      
      const data = await legacyResponse.json()
      const msgId = data.key?.id || data.messageId || data.id || "sent_ok_legacy"
      console.log(`✅ WhatsApp (Legacy) enviado a ${to} — ID: ${msgId}`)
      return msgId
    }

    const data = await response.json()
    const msgId = data.key?.id || data.messageId || data.id || "sent_ok"

    console.log(`✅ WhatsApp (v2) enviado a ${to} — ID: ${msgId}`)
    return msgId
  } catch (err) {
    console.error(`❌ Error conectando con Evolution API:`, err)
    return null
  }
}

/**
 * Notifica a todos los músicos base sobre un nuevo Gig
 * Guarda el log de cada notification en la BD
 */
export async function notifyMusicians(eventId: string, gig: GigDetails, db: any, musicianIds?: string[]) {
  const whereClause: any = { phone: { not: null } }
  
  if (musicianIds && musicianIds.length > 0) {
    whereClause.id = { in: musicianIds }
  }

  const musicians = await db.musicianProfile.findMany({
    where: whereClause,
    include: { user: true },
  })

  if (musicians.length === 0) {
    console.log("ℹ️  No hay músicos con teléfono registrado para notificar.")
    return
  }

  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
  const template = config?.msgTemplateGig || `🎸 *NUEVO GIG — VENDETTA* 🎸\n\n📅 *Fecha:* {{date}}\n👤 *Cliente:* {{clientName}}\n🎉 *Tipo de evento:* {{ceremony}}\n📍 *Ubicación:* {{location}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n\n📝 *Notas:* {{notes}}\n\n{{confirmLink}}\n— Administración Vendetta`

  for (const musician of musicians) {
    const phone = musician.whatsapp ?? musician.phone ?? null
    if (!phone) continue

    const dateStr = formatDateMX(gig.date, "EEEE, d 'de' MMMM, yyyy")
    const ceremony = gig.ceremonyType ? (CEREMONY_LABELS[gig.ceremonyType] ?? gig.ceremonyType) : "Evento"
    const horario = gig.performanceStart ? `${gig.performanceStart}${gig.performanceEnd ? ` — ${gig.performanceEnd}` : ""} hrs` : "Por confirmar"
    const ubicacion = gig.locationName ? `${gig.locationName}${gig.locationAddress ? `, ${gig.locationAddress}` : ""}` : "Por confirmar"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vendetta.app"
    const confirmLink = `\n✅ *CONFIRMA AQUÍ:* \n${baseUrl}/confirmar/${musician.id}/${eventId}`
    const notesText = gig.musicianNotes ? `${gig.musicianNotes}` : "Ninguna"
    const isPublicText = !gig.isPublic ? `\n⚠️ *AVISO:* EVENTO PRIVADO\n` : ""

    await notifyWhatsApp({
      to: phone,
      type: "gig_created",
      data: {
        clientName: gig.clientName,
        date: dateStr,
        ceremony: ceremony || "Evento",
        location: ubicacion,
        time: horario,
        package: gig.packageName || "Por confirmar",
        notes: notesText + isPublicText,
        confirmLink: confirmLink,
      },
      eventId
    })
  }

  // Marcar evento como notificado
  await db.event.update({
    where: { id: eventId },
    data:  { notificationSent: true }
  })
}

/**
 * Google Calendar — stub preparado para cuando tengas las credenciales
 * Variables requeridas:
 * GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID
 */
export async function syncToGoogleCalendar(event: {
  id: string
  title: string
  date: Date
  performanceStart?: string | null
  performanceEnd?: string | null
  locationName?: string | null
  description?: string
}): Promise<string | null> {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const calendarId   = process.env.GOOGLE_CALENDAR_ID ?? "primary"

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("⚠️  Google Calendar no configurado. Credenciales pendientes.")
    return null
  }

  try {
    const { google } = await import("googleapis")
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    const dateStr = event.date.toISOString().split("T")[0]
    const startDateTime = event.performanceStart
      ? `${dateStr}T${event.performanceStart}:00`
      : `${dateStr}T20:00:00`
    const endDateTime = event.performanceEnd
      ? `${dateStr}T${event.performanceEnd}:00`
      : `${dateStr}T23:00:00`

    const gcEvent = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary:     event.title,
        description: event.description,
        location:    event.locationName ?? undefined,
        start: { dateTime: startDateTime, timeZone: "America/Mexico_City" },
        end:   { dateTime: endDateTime,   timeZone: "America/Mexico_City" },
        extendedProperties: { private: { vendettaEventId: event.id } },
      },
    })

    return gcEvent.data.id ?? null
  } catch (err) {
    console.error("❌ Error sincronizando con Google Calendar:", err)
    return null
  }
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteFromGoogleCalendar(calendarEventId: string): Promise<boolean> {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const calendarId   = process.env.GOOGLE_CALENDAR_ID ?? "primary"

  if (!clientId || !clientSecret || !refreshToken || !calendarEventId) {
    return false
  }

  try {
    const { google } = await import("googleapis")
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    await calendar.events.delete({ calendarId, eventId: calendarEventId })

    console.log(`✅ Evento eliminado de Google Calendar: ${calendarEventId}`)
    return true
  } catch (err) {
    console.error("❌ Error eliminando evento de Google Calendar:", err)
    return false
  }
}
