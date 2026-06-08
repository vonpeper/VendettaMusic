import { db } from "@/lib/db"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export async function getAccessToken(): Promise<string> {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  if (!config?.googleClientId || !config?.googleClientSecret || !config?.googleRefreshToken) {
    throw new Error("Google integration is not configured or linked")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: config.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("Error refreshing Google token:", err)
    throw new Error(`Failed to refresh access token: ${err}`)
  }

  const data = await response.json()
  return data.access_token
}

interface CalendarEventInput {
  summary: string
  location?: string
  description?: string
  date: Date | string
  startTime: string // HH:MM
  endTime: string // HH:MM
}

export async function createGoogleCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.googleCalendarId || !config.googleRefreshToken) {
      console.log("📅 [CalendarSync] Sincronización inactiva o sin configurar.")
      return null
    }

    const accessToken = await getAccessToken()
    const calendarId = config.googleCalendarId || "primary"

    const eventDate = new Date(input.date)
    const y = eventDate.getUTCFullYear()
    const m = String(eventDate.getUTCMonth() + 1).padStart(2, "0")
    const d = String(eventDate.getUTCDate()).padStart(2, "0")

    const startDateTime = `${y}-${m}-${d}T${input.startTime}:00`
    const endDateTime = `${y}-${m}-${d}T${input.endTime}:00`

    const body = {
      summary: input.summary,
      location: input.location || "",
      description: input.description || "",
      start: {
        dateTime: startDateTime,
        timeZone: "America/Mexico_City"
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Mexico_City"
      }
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Error creating Google Calendar event:", err)
      return null
    }

    const data = await response.json()
    console.log("📅 [CalendarSync] Evento creado exitosamente en Google Calendar:", data.id)
    return data.id as string
  } catch (error) {
    console.error("Error in createGoogleCalendarEvent:", error)
    return null
  }
}

export async function updateGoogleCalendarEvent(calendarEventId: string, input: CalendarEventInput): Promise<boolean> {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.googleCalendarId || !config.googleRefreshToken) {
      return false
    }

    const accessToken = await getAccessToken()
    const calendarId = config.googleCalendarId || "primary"

    const eventDate = new Date(input.date)
    const y = eventDate.getUTCFullYear()
    const m = String(eventDate.getUTCMonth() + 1).padStart(2, "0")
    const d = String(eventDate.getUTCDate()).padStart(2, "0")

    const startDateTime = `${y}-${m}-${d}T${input.startTime}:00`
    const endDateTime = `${y}-${m}-${d}T${input.endTime}:00`

    const body = {
      summary: input.summary,
      location: input.location || "",
      description: input.description || "",
      start: {
        dateTime: startDateTime,
        timeZone: "America/Mexico_City"
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Mexico_City"
      }
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${calendarEventId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Error updating Google Calendar event:", err)
      return false
    }

    console.log("📅 [CalendarSync] Evento actualizado en Google Calendar:", calendarEventId)
    return true
  } catch (error) {
    console.error("Error in updateGoogleCalendarEvent:", error)
    return false
  }
}

export async function deleteFromGoogleCalendar(calendarEventId: string): Promise<boolean> {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.googleCalendarId || !config.googleRefreshToken) {
      return false
    }

    const accessToken = await getAccessToken()
    const calendarId = config.googleCalendarId || "primary"

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${calendarEventId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      if (response.status === 404) return true // Ya no existe
      const err = await response.text()
      console.error("Error deleting Google Calendar event:", err)
      return false
    }

    console.log("📅 [CalendarSync] Evento eliminado de Google Calendar:", calendarEventId)
    return true
  } catch (error) {
    console.error("Error in deleteFromGoogleCalendar:", error)
    return false
  }
}

/**
 * Sincroniza un evento de la base de datos local hacia Google Calendar.
 */
export async function syncEventToGoogleCalendar(eventId: string): Promise<void> {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        location: true,
        client: { include: { user: true } },
        package: true,
        bookingRequest: true,
      }
    })

    if (!event) {
      console.log(`📅 [CalendarSync] Evento ${eventId} no encontrado para sincronización.`)
      return
    }

    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.googleCalendarId || !config.googleRefreshToken) {
      // Sincronización no configurada
      return
    }

    // Verificar si el estado amerita que esté en el calendario
    const isConfirmed = event.status === "agendado" || event.status === "completado" || event.status === "confirmed"

    // Construir información general del evento
    const clientName = event.customName || event.client?.user?.name || event.bookingRequest?.clientName || "Sin nombre"
    const locationName = event.location?.name || "Locación no especificada"
    const locationAddress = event.location?.address || event.bookingRequest?.address || "Dirección no especificada"
    const locationGps = event.location?.mapsLink || event.mapsLink || event.bookingRequest?.mapsLink || ""

    const summary = `Vendetta: ${clientName} - ${event.ceremonyType || "Show"}`
    const startTime = event.performanceStart || event.startTime || "21:00"
    const endTime = event.performanceEnd || event.performanceStart || "23:00"

    const descriptionParts = [
      `🎸 EVENTO VENDETTA`,
      `---------------------------------------`,
      `👤 Cliente: ${clientName}`,
      `📞 Teléfono: ${event.bookingRequest?.clientPhone || event.client?.whatsapp || "No especificado"}`,
      `📧 Email: ${event.bookingRequest?.clientEmail || event.client?.user?.email || "No especificado"}`,
      `🎉 Tipo: ${event.ceremonyType || "Show"}`,
      `📍 Dirección: ${locationAddress}`,
      locationGps ? `🗺️ Google Maps: ${locationGps}` : "",
      `---------------------------------------`,
      `⏰ Hora de llegada: ${event.arrivalTime || "No especificada"}`,
      `🏗️ Montaje: ${event.setupTime || "No especificado"}`,
      `👔 Vestimenta: ${event.dressCode || "No especificada"}`,
      event.musicianNotes ? `📝 Notas: ${event.musicianNotes}` : ""
    ].filter(Boolean)

    const description = descriptionParts.join("\n")

    const input: CalendarEventInput = {
      summary,
      location: locationAddress,
      description,
      date: event.date,
      startTime,
      endTime,
    }

    if (isConfirmed) {
      if (event.googleCalendarId) {
        // Actualizar evento existente
        const ok = await updateGoogleCalendarEvent(event.googleCalendarId, input)
        if (!ok) {
          // Si falló porque el evento fue borrado directamente en Google Calendar, intentamos recrearlo
          console.log(`📅 [CalendarSync] Re-creando evento en Google Calendar...`)
          const newCalId = await createGoogleCalendarEvent(input)
          if (newCalId) {
            await db.event.update({
              where: { id: eventId },
              data: { googleCalendarId: newCalId }
            })
          }
        }
      } else {
        // Crear nuevo evento
        const newCalId = await createGoogleCalendarEvent(input)
        if (newCalId) {
          await db.event.update({
            where: { id: eventId },
            data: { googleCalendarId: newCalId }
          })
        }
      }
    } else {
      // Si el evento no está confirmado y tiene ID en Google Calendar, lo removemos
      if (event.googleCalendarId) {
        await deleteFromGoogleCalendar(event.googleCalendarId)
        await db.event.update({
          where: { id: eventId },
          data: { googleCalendarId: null }
        })
      }
    }
  } catch (error) {
    console.error("Error in syncEventToGoogleCalendar:", error)
  }
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  if (!config?.googleClientId || !config?.googleClientSecret) {
    throw new Error("Missing Google Client ID or Secret")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("Error exchanging token:", err)
    throw new Error(`Failed to exchange auth code: ${err}`)
  }

  const data = await response.json()
  if (!data.refresh_token) {
    console.warn("No refresh token returned by Google OAuth. User might already be authorized. Prompt consent next time.")
  }

  // Update GlobalConfig
  await db.globalConfig.update({
    where: { id: "vendetta_config" },
    data: {
      googleRefreshToken: data.refresh_token || config.googleRefreshToken,
      lastCalendarSync: new Date(),
    },
  })

  return data
}
