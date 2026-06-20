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

/**
 * Función auxiliar para reemplazar {{variables}}
 */
export function parseTemplate(template: string, data: Record<string, any>): string {
  let result = template
  
  // Aliases y fallbacks comunes para compatibilidad entre diferentes disparadores
  const extendedData = {
    fullName:    data.fullName || data.clientName || data.eventName || "",
    clientName:  data.clientName || (data.fullName ? data.fullName.split(" ")[0] : "") || data.eventName || "",
    eventName:   data.eventName || data.fullName || data.clientName || "Evento Vendetta",
    shortId:     data.shortId || data.folio || "",
    folio:       data.folio || data.shortId || "",
    time:        data.time || data.startTime || data.setupTime || data.performanceStart || "Por confirmar",
    location:    data.location || data.locationName || "Por confirmar",
    statusLink:  data.statusLink || data.bookingLink || "",
    bookingLink: data.bookingLink || data.statusLink || "",
    notes:       data.notes || data.musicianNotes || "Ninguna",
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
      return config?.msgTemplateQuote || `Hola {{clientName}}, somos *Vendetta Live Music* 🎸.

Es un gusto saludarte. Te compartimos adjunta la propuesta exclusiva para tu evento el próximo *{{date}}*.

Revisamos cada detalle para asegurar que la música sea inolvidable. Quedamos a tus órdenes para agendar una breve llamada y pulir los detalles.

¡Rock on! 🤘

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`

    case "CLIENT_FOLLOWUP":
      return config?.msgTemplateFollowUp || `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla? Seguimos a tus órdenes.`

    case "CLIENT_REMINDER":
      return config?.msgTemplateReminder || `¡Hola {{clientName}}! Estamos a solo unos días de tu gran evento el *{{date}}* 🎸.
      
Te escribimos para confirmar que todo está en orden. Si tienes alguna duda, estamos a tus órdenes.`

    case "CLIENT_CONFIRMED":
      const isBar = payload.isBarEvent === "true" || payload.ceremony?.toLowerCase().includes("bar") || payload.package?.toLowerCase().includes("bar");
      if (isBar) {
        return config?.msgTemplateBarClose || `¡Hola {{clientName}}! 🎉

Tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el detalle de tu evento, *firmar tu contrato digital* y descargarlo aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta*! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      } else {
        return config?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el detalle de tu evento, *firmar tu contrato digital* y descargarlo aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`
      }

    case "CLIENT_THANKS":
      return config?.msgTemplateThanks || `¡Hola {{clientName}}! 🎉 Todavía seguimos emocionados por lo de ayer.
      
Queríamos agradecerte por confiar en *Vendetta* para tu evento. ¡Esperamos que la hayas pasado increíble!

¡Gracias totales! 🤘🎸`

    case "MUSICIAN_GIG":
      // Forzamos la nueva plantilla si la de la DB es la antigua o no tiene saludo
      const dbTemplate = config?.msgTemplateGig
      const isOldTemplate = !dbTemplate || dbTemplate.includes("NUEVO GIG") || !dbTemplate.includes("Hola")
      
      return isOldTemplate ? `¡Hola {{musicianName}}! 🎸 Te escribimos de *Vendetta Live Music* para convocarte al siguiente show:

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
— Administración Vendetta`

    case "EVENT_CANCELLED":
      return `⚠️ *AVISO: EVENTO CANCELADO* ⚠️

Lamentamos informarte que el evento del próximo *{{date}}* ha sido cancelado por el cliente o administración.

👤 *Evento:* {{eventName}}
📅 *Fecha:* {{date}}

Por favor, toma tus precauciones y libera la fecha en tu agenda. 

— Administración Vendetta`

    default:
      return ""
  }
}
