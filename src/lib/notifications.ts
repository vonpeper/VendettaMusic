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

/**
 * Genera el mensaje de WhatsApp formateado para los músicos
 */
export function buildGigMessage(gig: GigDetails, musicianId?: string, eventId?: string): string {
  const dateStr = formatDateMX(gig.date, "EEEE, d 'de' MMMM, yyyy")

  const ceremony = gig.ceremonyType
    ? CEREMONY_LABELS[gig.ceremonyType] ?? gig.ceremonyType
    : "Evento"

  const dresscode = gig.dressCode
    ? DRESS_CODE_LABELS[gig.dressCode] ?? gig.dressCode
    : "Por confirmar"

  const horario = gig.performanceStart
    ? `${gig.performanceStart}${gig.performanceEnd ? ` — ${gig.performanceEnd}` : ""} hrs`
    : "Por confirmar"

  const invitados = gig.guestCount && gig.guestCount > 0
    ? `${gig.guestCount} personas`
    : "Por confirmar"

  const ubicacion = gig.locationName
    ? `${gig.locationName}${gig.locationAddress ? `, ${gig.locationAddress}` : ""}`
    : "Por confirmar"

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vendetta.app"
  const confirmLink = musicianId && eventId 
    ? `\n\n✅ *CONFIRMA AQUÍ:* \n${baseUrl}/confirmar/${musicianId}/${eventId}`
    : "\n\n✅ *CONFIRMACIÓN REQUERIDA:* \nResponde con la palabra *CONFIRMO*."

  return `🎸 *NUEVO GIG — VENDETTA* 🎸

📅 *Fecha:* ${dateStr}
👤 *Cliente:* ${gig.clientName}
🎉 *Tipo de evento:* ${ceremony}
👥 *Invitados:* ${invitados}
📍 *Ubicación:* ${ubicacion}
⏰ *Horario de ejecución:* ${horario}
👔 *Vestimenta:* ${dresscode}
📦 *Paquete:* ${gig.packageName ?? "Por confirmar"}

${gig.musicianNotes ? `📝 *Notas:* ${gig.musicianNotes}\n` : ""}${!gig.isPublic ? `⚠️ *AVISO:* EVENTO PRIVADO\n` : ""}${confirmLink}
— Administración Vendetta`
}

/**
 * Envía un mensaje de WhatsApp vía Evolution API
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
    // Limpiar el número: solo dígitos (Evolution prefiere formato internacional sin "whatsapp:" ni "+")
    const cleanNumber = to.replace(/\D/g, "")

    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: message,
        delay: 0,
        linkPreview: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ Error Evolution API (${response.status}):`, errorData)
      return null
    }

    const data = await response.json()
    // Evolution v2 devuelve la estructura { key: { id: "..." }, ... } o similar
    const msgId = data.key?.id || data.messageId || "sent_ok"

    console.log(`✅ WhatsApp enviado a ${to} — ID: ${msgId}`)
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
export async function notifyMusicians(eventId: string, gig: GigDetails, db: any) {
  const musicians = await db.musicianProfile.findMany({
    where: { phone: { not: null } },
    include: { user: true },
  })

  if (musicians.length === 0) {
    console.log("ℹ️  No hay músicos con teléfono registrado para notificar.")
    return
  }

  for (const musician of musicians) {
    const phone = musician.whatsapp ?? musician.phone ?? null
    if (!phone) continue

    const message = buildGigMessage(gig, musician.id, eventId)
    const messageId = await sendWhatsApp(phone, message)

    // Guardar log de notificación
    await db.notification.create({
      data: {
        eventId,
        type:      "gig_created",
        channel:   "whatsapp",
        recipient: phone,
        message,
        status:    messageId ? "sent" : "failed",
        twilioSid: messageId, // Usamos este campo para el ID de Evolution API
      }
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
