import { NotificationType } from "./types"

export const CEREMONY_LABELS: Record<string, string> = {
  boda: "💒 Boda", xv_anos: "👸 XV Años", cumpleanos: "🎂 Cumpleaños",
  corporativo: "🏢 Evento Corp", festival: "🎪 Festival", happening: "🎵 Happening",
  privado: "🏠 Privado", bar: "🍺 Bar / Venue", otro: "📋 Otro",
}

export const DRESS_CODE_MAP: Record<string, string> = {
  "formal": "🎩 Formal",
  "formal_casual": "👔 Formal Casual",
  "rock": "🎸 Rock / Casual",
  "nocturno": "🌙 Concierto Nocturno"
}

export const TEMPLATE_INQUIRY_RECEIPT = `¡Hola {{fullName}}! 👋 Recibimos tu solicitud para tu {{motive}} el {{eventDate}} en {{location}}. Estamos validando la disponibilidad de equipo y agenda técnica para tu aforo. En breve te enviamos tu propuesta formal personalizada.

— *Vendetta Live Music*
👉 https://vendetta.mx`

export const TEMPLATE_QUOTE_OFFICIAL = `🎸 *VENDETTA LIVE MUSIC* | Propuesta Oficial

Hola, *{{fullName}}*. Es un gusto saludarte.

Preparamos tu propuesta personalizada para tu evento en *{{location}}*:

📅 *Fecha:* {{eventDate}}
⏱️ *Duración:* {{durationHours}} horas de show en vivo
👥 *Aforo estimado:* {{guestCount}} personas
✨ *Formato:* 100% Pop Rock en vivo

Puedes consultar el desglose de tu show y confirmar tu fecha directamente en nuestro portal digital:
👉 {{proposalLink}}

_Nota: La fecha se cierra con el anticipo verificado y la firma de contrato para seguridad de nuestros clientes._

Cualquier duda o ajuste especial, estamos a tu disposición por este medio.
*Vendetta Management*`

export const TEMPLATE_CLIENT_QUOTE = TEMPLATE_QUOTE_OFFICIAL

/**
 * Función auxiliar para reemplazar {{variables}}
 */
export function parseTemplate(template: string, data: Record<string, any>): string {
  let result = template
  
  // Aliases y fallbacks comunes para compatibilidad entre diferentes disparadores
  const extendedData = {
    fullName:      data.fullName || data.clientName || data.eventName || "",
    clientName:    data.clientName || (data.fullName ? data.fullName.split(" ")[0] : "") || data.eventName || "",
    eventName:     data.eventName || data.fullName || data.clientName || "Evento Vendetta",
    motive:        data.motive || data.eventType || data.ceremony || "evento",
    eventDate:     data.eventDate || data.date || "",
    date:          data.date || data.eventDate || "",
    location:      data.location || data.locationName || data.city || data.municipio || "tu locación",
    durationHours: data.durationHours || data.bandHours || data.hours || "2",
    guestCount:    data.guestCount || data.aforo || "100",
    proposalLink:  data.proposalLink || data.bookingLink || data.statusLink || "",
    bookingLink:   data.bookingLink || data.proposalLink || data.statusLink || "",
    statusLink:    data.statusLink || data.proposalLink || data.bookingLink || "",
    shortId:       data.shortId || data.folio || "",
    folio:         data.folio || data.shortId || "",
    time:          data.time || data.startTime || data.setupTime || data.performanceStart || "Por confirmar",
    notes:         data.notes || data.musicianNotes || "Ninguna",
    ...data
  }

  // Reemplazar cada {{key}} por su valor, soportando espacios opcionales {{ key }}
  for (const [key, value] of Object.entries(extendedData)) {
    const val = value === null || value === undefined ? "" : String(value)
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, val)
  }

  // Convertir \n literales en saltos de línea reales
  return result.replace(/\\n/g, "\n")
}

/**
 * Obtiene la plantilla predeterminada o configurada por tipo
 */
export function getTemplateForType(type: NotificationType, config: any, payload: Record<string, any>): string {
  switch (type) {
    case "ADMIN_NEW_BOOKING":
      return `🎸 *NUEVO PEDIDO — VENDETTA* 🎸\nID: {{folio}}\n\n👤 *Cliente:* {{fullName}}\n📅 *Fecha:* {{date}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n\n✅ Verifica en: {{adminLink}}`
    
    case "CLIENT_QUOTE":
      return config?.msgTemplateQuote || TEMPLATE_CLIENT_QUOTE

    case "CLIENT_FOLLOWUP":
      return config?.msgTemplateFollowUp || `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla?

👉 Consulta tu propuesta formal y confirma tu fecha aquí:
https://vendetta.mx/propuesta/{{shortId}}

Seguimos a tus órdenes.`

    case "CLIENT_REMINDER":
      return config?.msgTemplateReminder || `¡Hola {{clientName}}! 🎸 Estamos a 7 días de tu fecha.

Te compartimos el resumen de tu evento para verificar que todo esté en orden:

🎉 *Evento:* {{ceremony}}
📅 *Fecha:* {{date}}
⏰ *Horario Show:* {{time}}
📍 *Lugar:* {{location}}
🏠 *Dirección:* {{address}}
🗺️ *Google Maps:* {{mapsLink}}

¿Tienes alguna actualización de logística, cambio de horario o detalle para la banda? 
Puedes responder directamente a este mensaje o consultar el estatus de tu evento con tu folio *{{shortId}}* en:
👉 https://vendetta.mx/status/{{shortId}}

¡Todo listo para que sea una noche inolvidable! 🤘✨
—
*Vendetta Live Music* | _vendetta.mx_`

    case "CLIENT_CONFIRMED":
      const isBar = payload.isBarEvent === "true" || payload.ceremony?.toLowerCase().includes("bar") || payload.package?.toLowerCase().includes("bar");
      if (isBar) {
        return config?.msgTemplateBarClose || `¡Hola {{clientName}}! 🎉

Tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
https://vendetta.mx/status/{{shortId}}

¡Gracias por confiar en *Vendetta*! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      } else {
        return config?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
https://vendetta.mx/status/{{shortId}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      }

    case "MUSICIAN_REMINDER_3DAYS":
      return config?.msgTemplateReminder3Days || `¡Hola {{musicianName}}! ⚠️ Recordatorio de *Vendetta Live Music*:

Tienes una fecha programada en *3 días* y aún no has confirmado tu asistencia:

📅 *Fecha:* {{date}}
🎉 *Tipo:* {{ceremony}}
📍 *Lugar:* {{location}}
⏱️ *Montaje:* {{setupTime}}
🚗 *Llegada Músicos:* {{arrivalTime}}

👉 *Por favor confirma o rechaza tu asistencia hoy mismo aquí:*
{{confirmLink}}

_(Es indispensable confirmar hoy para coordinar un suplente a tiempo si no puedes asistir)._

— Administración Vendetta`

    case "CLIENT_THANKS":
      return config?.msgTemplateThanks || `¡Hola {{clientName}}! 🎉 Todavía seguimos emocionados por lo de ayer.
      
Fue un honor ser parte de tu evento. Nos encantaría que nos regales una reseña aquí para que más personas conozcan la experiencia Vendetta:
👉 https://vendetta.mx/#testimoniales

¡Gracias totales por confiar en Vendetta! 🤘🎸`

    case "MUSICIAN_GIG":
      // Forzamos la nueva plantilla si la de la DB es la antigua o no tiene saludo
      const dbTemplate = config?.msgTemplateGig
      const isOldTemplate = !dbTemplate || dbTemplate.includes("NUEVO GIG") || !dbTemplate.includes("Hola")
      
      return isOldTemplate ? `¡Hola {{musicianName}}! 🎸 Te escribimos de *Vendetta Live Music* para convocarte al show:

📅 *Fecha:* {{date}}
🎉 *Tipo:* {{ceremony}}
📍 *Lugar:* {{location}}
🗺️ *Maps:* {{mapsLink}}
⏱️ *Montaje:* {{setupTime}}
🚗 *Llegada músicos:* {{arrivalTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Por favor confirma tu asistencia aquí:*
{{confirmLink}}` : dbTemplate

    case "MUSICIAN_REHEARSAL":
      return `🥁 *NUEVO ENSAYO — VENDETTA* 🥁
 
📅 *Fecha y Hora:* {{date}}
📍 *Lugar:* {{location}}
 
📝 *Tarea / Notas:* 
{{notes}}
 
🎶 *Repertorio a ensayar:*
{{songsList}}
 
⚠️ Confirma de recibido respondiendo este mensaje.
—
*Vendetta Live Music*
👉 https://vendetta.mx`

    case "EVENT_CANCELLED":
      return `⚠️ *AVISO: EVENTO CANCELADO* ⚠️

Lamentamos informarte que el evento del próximo *{{date}}* ha sido cancelado por el cliente o administración.

👤 *Evento:* {{eventName}}
📅 *Fecha:* {{date}}

Por favor, toma tus precauciones y libera la fecha en tu agenda. 

—
*Vendetta Live Music*
👉 https://vendetta.mx`

    case "MUSICIAN_TODAY_REMINDER":
      return config?.msgTemplateTodayReminder || `🎸 *RECORDATORIO DE SHOW HOY — VENDETTA* 🎸
¡Hola {{musicianName}}! Hoy tenemos show (detalles en https://vendetta.mx). Aquí tienes la información y horarios de la convocatoria:

📅 *Fecha:* {{date}}
👤 *Cliente:* {{clientName}}
🎉 *Tipo:* {{ceremony}}
🏠 *Dirección:* {{address}}
📍 *Lugar:* {{location}}
🗺️ *Google Maps:* {{mapsLink}}
⚙️ *Hora de Montaje:* {{setupTime}}
🚗 *Hora de Llegada Músicos:* {{arrivalTime}}
🎤 *Show Inicio:* {{performanceStart}}
🎵 *Show Fin:* {{performanceEnd}}
👔 *Vestimenta:* {{dressCode}}

📝 *Notas:* {{notes}}

¡Nos vemos al rato! 🤘`

    default:
      return ""
  }
}
