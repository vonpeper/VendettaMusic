import { formatDateMX } from "../utils"
import { getAppUrl } from "../url"
import { parseTemplate } from "./templates"
import { dispatchNotification } from "./dispatcher"
import { toWhatsAppJid } from "../phone"

/**
 * Notificador de Músicos optimizado (Bucle centralizado)
 */
export async function notifyMusicians(eventId: string, gigDetails: any, db: any, targetMusicianIds?: string[], forceResend = false) {
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
  let resolvedIds: string[]
  if (targetMusicianIds !== undefined) {
    resolvedIds = targetMusicianIds
  } else {
    const assigned = await db.eventMusician.findMany({
      where: { eventId },
      select: { musicianId: true }
    })
    resolvedIds = assigned.map((em: any) => em.musicianId)
  }

  if (resolvedIds.length === 0) {
    console.warn(`⚠️ notifyMusicians: Evento ${eventId} no tiene músicos asignados ni IDs específicos. Abortando.`)
    return { success: false, message: "No hay músicos asignados a este evento." }
  }

  const profiles = await db.musicianProfile.findMany({
    where: {
      id: { in: resolvedIds },
      whatsapp: { not: null },
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
  // O a los que explícitamente se pasaron por targetMusicianIds
  const allRecipients = profiles.map((p: any) => ({ 
    id: p.id, 
    userId: p.userId,
    name: p.user?.name || "Músico", 
    phone: p.whatsapp,
    instrument: p.instrument || "",
    currentStatus: p.eventMusicians[0]?.status || "pending"
  })).filter((r: any) => 
    r.currentStatus === "pending" || 
    r.currentStatus === "confirmed" || 
    r.currentStatus === "rejected" || 
    (targetMusicianIds && targetMusicianIds.includes(r.id))
  ) 

  console.log(`📣 notifyMusicians: Iniciando convocatoria para Evento ${eventId}. Destinatarios filtrados: ${allRecipients.length}`)

  if (allRecipients.length === 0) {
    const reason = profiles.length === 0 ? "No hay perfiles activos con teléfono" : "Todos los músicos ya tienen estatus distinto a pending"
    console.warn(`⚠️ No se encontraron destinatarios válidos para el evento ${eventId}. Razón: ${reason}`)
    return { success: false, message: `No se encontraron destinatarios válidos. Razón: ${reason}` }
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

  // Enviar Notificación Push Batch a la App Móvil
  try {
    const userIds = allRecipients.map((r: any) => r.userId).filter(Boolean)
    if (userIds.length > 0) {
      const eventName = gigDetails.clientName || gigDetails.eventName || "Evento Vendetta"
      const { sendPushNotificationToUsers } = await import("../push-notifications")
      await sendPushNotificationToUsers(userIds, {
        title: "Nueva Convocatoria 🎸",
        body: `Has sido convocado para el show "${eventName}" el ${eventDate}. ¡Ingresa a la app para ver la logística!`,
        data: { eventId }
      })
    }
  } catch (pushErr) {
    console.error("⚠️ Error enviando push notifications en batch:", pushErr)
  }

  for (const r of allRecipients) {
    if (!r.phone) continue

    // Ingenieros de Audio: convocatoria manual (a menos que se fuerce el envío individual)
    const isExplicitTarget = targetMusicianIds && targetMusicianIds.includes(r.id)
    if (!isExplicitTarget && (r.instrument.toLowerCase().includes("ingeniero") || r.instrument.toLowerCase().includes("audio"))) {
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

    if (!forceResend) {
      const existing = await db.notification.findFirst({
        where: {
          type: "MUSICIAN_GIG",
          eventId: eventId,
          recipient: realRecipient,
          status: "sent"
        }
      })
      
      if (existing) {
        console.log(`⚠️ Convocatoria ya enviada a ${r.name} (${realRecipient}) para evento ${eventId}. Saltando...`)
        continue
      }
    }

    if (isSandbox) {
      console.log(`🧪 [SANDBOX] Desviando convocatoria de ${r.name} (${r.phone}) -> ADMIN (${realRecipient})`)
    } else {
      console.log(`📤 Enviando convocatoria a ${r.name} (${r.instrument}) -> ${realRecipient}`)
    }

    // Obtener template de la DB o usar el default
    const dbTemplate = config?.msgTemplateGig
    const isOldTemplate = !dbTemplate || dbTemplate.includes("NUEVO GIG")
    const template = isOldTemplate
      ? `🎸 *NUEVA CONVOCATORIA — VENDETTA* 🎸

📅 *Fecha:* {{date}}
👤 *Cliente:* {{fullName}}
🎉 *Tipo:* {{ceremony}}
🏠 *Dirección:* {{address}}
📍 *Lugar:* {{location}} ({{mapsLink}})
🚗 *Hora de Llegada:* {{arrivalTime}}
⚙️ *Hora de Montaje:* {{setupTime}}
🎤 *Hora de Inicio:* {{performanceStart}}
🎵 *Hora de Finalización:* {{performanceEnd}}
👔 *Vestimenta:* {{dressCode}}

📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}`
      : dbTemplate

    // Sustituir variables usando el parser centralizado
    const templateData = {
      eventName,
      date: eventDate,
      ceremony: ceremonyLabel[gigDetails.ceremonyType || gigDetails.venueType || ""] || gigDetails.ceremonyType || "Show",
      location: gigDetails.locationName || gigDetails.address || "Por confirmar",
      address: gigDetails.address || "No especificada",
      mapsLink: gigDetails.mapsLink || "No registrado",
      setupTime: gigDetails.setupTime || "Por definir",
      arrivalTime: gigDetails.arrivalTime || "Por definir",
      performanceStart: gigDetails.performanceStart || "Por definir",
      performanceEnd: gigDetails.performanceEnd || "Por definir",
      dressCode: finalDressCode,
      notes: gigDetails.musicianNotes || "Ninguna",
      clientName: gigDetails.clientName || "Vendetta",
      confirmLink,
      // Añadimos variables adicionales solicitadas por el usuario en plantillas personalizadas
      fullName: eventName,
      time: gigDetails.performanceStart || gigDetails.setupTime || "Por definir"
    }
    
    const message = parseTemplate(template, templateData)

    // Enviar directamente via Evolution sin pasar por dispatchNotification
    const evolutionUrl = (config as any)?.evolutionUrl || process.env.EVOLUTION_BASE_URL
    const evolutionKey = (config as any)?.evolutionApiKey || process.env.EVOLUTION_API_KEY
    const evolutionInstance = (config as any)?.evolutionInstance || process.env.EVOLUTION_INSTANCE || "vendetta_admin"

    if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
      console.error(`❌ Evolution API no configurada. URL: ${evolutionUrl}, Instance: ${evolutionInstance}`)
      continue
    }

    const jid = toWhatsAppJid(realRecipient)
    if (!jid) {
      console.warn(`⚠️ Número inválido para ${r.name}: "${realRecipient}" — omitiendo.`)
      continue
    }

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
  
  return { success: true, message: `Convocatoria enviada a ${allRecipients.length} músicos.` }
}

/**
 * Notifica a los músicos asignados que un evento ha sido cancelado
 */
export async function notifyEventCancellation(eventId: string, prisma?: any) {
  const { db } = await import("../db")
  const client = prisma || db

  const event = await client.event.findUnique({
    where: { id: eventId },
    include: {
      musicians: {
        include: { musician: { include: { user: true } } }
      }
    }
  })

  if (!event) return

  const dateStr = formatDateMX(event.date, "d 'de' MMMM")
  const eventName = event.customName || "Evento Vendetta"

  const userIdsToNotify: string[] = []

  for (const em of event.musicians) {
    // Notificar solo a los que están confirmados o pendientes (que están esperando el show)
    if (em.status !== "confirmed" && em.status !== "pending") continue

    const musician = em.musician
    if (musician.status !== "active") {
      console.log(`⏭️ Saltando notificación de cancelación para ${musician.user?.name || "Músico"} porque está inactivo.`)
      continue
    }

    if (musician.userId) {
      userIdsToNotify.push(musician.userId)
    }
    const phone = musician.whatsapp
    
    if (phone) {
      await dispatchNotification({
        type: "EVENT_CANCELLED",
        to: phone,
        customData: {
          date: dateStr,
          eventName: eventName
        }
      }).catch(e => console.error(`Error enviando cancelación a ${musician.user?.name}:`, e))
    }
  }

  // Enviar notificaciones push por cancelación
  if (userIdsToNotify.length > 0) {
    try {
      const { sendPushNotificationToUsers } = await import("../push-notifications")
      await sendPushNotificationToUsers(userIdsToNotify, {
        title: "Show Cancelado ⚠️",
        body: `El show "${eventName}" del ${dateStr} ha sido cancelado.`,
        data: { eventId }
      })
    } catch (pushErr) {
      console.error("⚠️ Error enviando push notifications de cancelación:", pushErr)
    }
  }

  // Registrar en notificaciones el aviso de cancelación global
  await client.notification.create({
    data: {
      type: "EVENT_CANCELLED",
      channel: "whatsapp",
      message: `Aviso de cancelación enviado para el evento ${eventId}`,
      status: "sent",
      recipient: "Multiples músicos",
      bookingRequestId: event.bookingRequestId
    }
  }).catch(() => {})
}
