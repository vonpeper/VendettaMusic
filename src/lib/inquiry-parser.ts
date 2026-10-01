/**
 * Utilidades para parsear y extraer información estructurada
 * de prospectos (ContactInquiry) hacia cotizaciones de eventos en el CRM.
 */

export interface ParsedInquiryData {
  cleanEmail: string
  ceremonyType: string
  customName: string
  packageKeyword: string | null
  startTime: string
  endTime: string
  arrivalTime: string
  setupTime: string
  guestCount: number | null
  city: string
  venueName: string
  mapsLink: string | null
  viaticosAmount: number | null
  notes: string
}

/**
 * Normaliza horas en formato 12h (02:00 PM) o 24h (20:00) a formato 24h "HH:mm".
 */
export function normalizeTimeTo24h(timeStr: string): string {
  if (!timeStr) return ""
  const trimmed = timeStr.trim().toLowerCase()

  // Coincide "02:00 pm", "2:00pm", "10:30 am", etc.
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/)
  if (match12h) {
    let hours = parseInt(match12h[1], 10)
    const minutes = match12h[2]
    const period = match12h[3]

    if (period === "pm" && hours < 12) hours += 12
    if (period === "am" && hours === 12) hours = 0

    return `${hours.toString().padStart(2, "0")}:${minutes}`
  }

  // Coincide "20:00", "8:30"
  const match24h = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (match24h) {
    const hours = parseInt(match24h[1], 10)
    const minutes = match24h[2]
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, "0")}:${minutes}`
    }
  }

  return timeStr.trim()
}

/**
 * Suma o resta minutos a una hora "HH:mm" (24h).
 */
export function addMinutesToTime(time24h: string, minutesToAdd: number): string {
  if (!/^\d{2}:\d{2}$/.test(time24h)) return ""
  const [hStr, mStr] = time24h.split(":")
  const totalMins = (parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutesToAdd + 24 * 60) % (24 * 60)
  const newH = Math.floor(totalMins / 60)
  const newM = totalMins % 60
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`
}

/**
 * Mapea texto libre al valor estándar del enum de tipo de ceremonia.
 */
export function mapCeremonyType(rawType?: string | null): string {
  if (!rawType) return "otro"
  const norm = rawType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  if (norm.includes("boda")) return "boda"
  if (norm.includes("xv") || norm.includes("quince")) return "xv_anos"
  if (norm.includes("cumple") || norm.includes("aniversario")) return "cumpleanos"
  if (norm.includes("corporativo") || norm.includes("empresa") || norm.includes("fin de ano") || norm.includes("gala")) return "corporativo"
  if (norm.includes("festival") || norm.includes("masivo")) return "festival"
  if (norm.includes("bar") || norm.includes("restaurante") || norm.includes("antro")) return "bar"
  if (norm.includes("graduaci")) return "graduacion"
  if (norm.includes("happening") || norm.includes("privada")) return "happening"

  return "otro"
}

/**
 * Etiqueta legible para nombres de eventos.
 */
const CEREMONY_LABELS: Record<string, string> = {
  boda: "Boda",
  xv_anos: "XV Años",
  cumpleanos: "Cumpleaños",
  corporativo: "Corporativo",
  festival: "Festival",
  bar: "Show Bar",
  graduacion: "Graduación",
  happening: "Happening Privado",
  otro: "Evento",
}

/**
 * Extrae toda la información estructurada de un ContactInquiry.
 */
export function parseInquiryDetails(params: {
  name: string
  email?: string | null
  phone?: string | null
  eventType?: string | null
  message?: string | null
  defaultDurationHours?: number
}): ParsedInquiryData {
  const { name, email, eventType, message, defaultDurationHours = 2 } = params
  const fullText = `${eventType || ""} | ${message || ""}`

  // 1. Correo electrónico: no usar correos genéricos o de cotizador automático
  let cleanEmail = (email || "").trim()
  const lowerEmail = cleanEmail.toLowerCase()
  if (
    lowerEmail === "contacto@vendetta.mx" ||
    lowerEmail.includes("@cotizacion.vendetta.mx") ||
    lowerEmail.startsWith("no@") ||
    lowerEmail.startsWith("test@")
  ) {
    cleanEmail = ""
  }

  // 2. Tipo de Ceremonia
  const ceremonyType = mapCeremonyType(eventType || message)
  const ceremonyLabel = CEREMONY_LABELS[ceremonyType] || "Evento"
  const customName = `${ceremonyLabel} - ${name.trim()}`

  // 3. Detección de Paquete
  let packageKeyword: string | null = null
  const lowerFull = fullText.toLowerCase()
  if (lowerFull.includes("essential")) {
    packageKeyword = "Essential"
  } else if (lowerFull.includes("experience")) {
    packageKeyword = "Experience"
  } else if (lowerFull.includes("festival")) {
    packageKeyword = "Festival"
  } else if (lowerFull.includes("cocktail") || lowerFull.includes("acustico")) {
    packageKeyword = "Cocktail"
  } else if (lowerFull.includes("arma tu show")) {
    packageKeyword = "Arma tu show"
  }

  // 4. Horarios
  let startTime = ""
  let endTime = ""

  // Patrón A: "Horario: 02:00 PM a 03:30 PM" o "Horario: 20:00 a 22:00"
  const horarioRangeMatch = message?.match(/Horario:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AaPp][Mm])?)\s*a\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AaPp][Mm])?)/i)
  if (horarioRangeMatch) {
    startTime = normalizeTimeTo24h(horarioRangeMatch[1])
    endTime = normalizeTimeTo24h(horarioRangeMatch[2])
  } else {
    // Patrón B: "Hora: 20:00" o "Hora: 8:00 PM"
    const horaSingleMatch = message?.match(/Hora:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AaPp][Mm])?)/i)
    if (horaSingleMatch) {
      startTime = normalizeTimeTo24h(horaSingleMatch[1])
      if (startTime) {
        endTime = addMinutesToTime(startTime, defaultDurationHours * 60)
      }
    }
  }

  // Cálculo de llegada y montaje a partir de la hora de inicio
  let arrivalTime = ""
  let setupTime = ""
  if (startTime) {
    arrivalTime = addMinutesToTime(startTime, -90) // 1.5 horas antes
    setupTime = addMinutesToTime(startTime, -120)  // 2 horas antes
  }

  // 5. Invitados / Aforo
  let guestCount: number | null = null
  const invitadosMatch = message?.match(/(?:Invitados|Aforo):\s*(\d+)/i)
  if (invitadosMatch) {
    guestCount = parseInt(invitadosMatch[1], 10) || null
  }

  // 6. Ubicación / Ciudad / Venue
  let city = ""
  let venueName = ""
  const ubicacionMatch = message?.match(/Ubicaci(?:o|ó)n:\s*([^|]+)/i)
  if (ubicacionMatch) {
    const rawLoc = ubicacionMatch[1].trim()
    // Si contiene paréntesis ej. "Tlalnepantla de Baz, Estado de México (Estevez Jor.Servicos)"
    const venueInsideParen = rawLoc.match(/\(([^)]+)\)/)
    if (venueInsideParen) {
      venueName = venueInsideParen[1].trim()
      city = rawLoc.replace(/\([^)]+\)/, "").trim().replace(/,\s*$/, "")
    } else {
      city = rawLoc
      venueName = rawLoc
    }
  }

  // 7. Enlace Google Maps
  let mapsLink: string | null = null
  const mapsMatch = message?.match(/Maps:\s*(https?:\/\/[^\s|]+)/i)
  if (mapsMatch) {
    mapsLink = mapsMatch[1].trim()
  }

  // 8. Viáticos
  let viaticosAmount: number | null = null
  const viaticosMatch = message?.match(/Vi[aá]ticos:\s*\$?(\d+)/i)
  if (viaticosMatch) {
    viaticosAmount = parseInt(viaticosMatch[1], 10) || null
  }

  // 9. Notas Adicionales
  let notes = ""
  const notasMatch = message?.match(/Notas:\s*([^|]+)/i)
  if (notasMatch) {
    notes = notasMatch[1].trim()
  }

  return {
    cleanEmail,
    ceremonyType,
    customName,
    packageKeyword,
    startTime,
    endTime,
    arrivalTime,
    setupTime,
    guestCount,
    city,
    venueName,
    mapsLink,
    viaticosAmount,
    notes,
  }
}
