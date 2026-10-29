import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { findCommercialContact } from "@/lib/commercial-contacts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/evolution
 *
 * Receiver de webhooks de Evolution API v2.
 * - Procesa actualizaciones de entrega y lectura de mensajes salientes (delivery/read receipts).
 * - Procesa y persiste mensajes entrantes (Inbound) exclusivamente de contactos comerciales reconocidos.
 * - Descarta inmediatamente mensajes grupales (@g.us) y números no registrados en el CRM.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const secret = config?.evolutionWebhookSecret || process.env.EVOLUTION_WEBHOOK_SECRET || null

  if (secret) {
    const sig = req.headers.get("x-evolution-signature") || ""
    const sharedKey = req.headers.get("apikey") || ""
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
    const sigOk = sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    const keyOk = sharedKey && sharedKey === secret
    if (!sigOk && !keyOk) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Validar instancia si está configurada
  const configuredInstance = config?.evolutionInstance || process.env.EVOLUTION_INSTANCE
  const payloadInstance = payload?.instance || payload?.data?.instance
  if (configuredInstance && payloadInstance && configuredInstance !== payloadInstance) {
    return NextResponse.json({ error: "Instance mismatch" }, { status: 403 })
  }

  const event = (payload?.event || payload?.type || "").toString()

  try {
    if (event === "send.message" || event === "messages.update" || event === "messages.upsert") {
      const result = await handleMessageEvent(event, payload, config)
      if (result) {
        return NextResponse.json(result)
      }
    } else if (event === "connection.update") {
      console.log("Evolution connection.update received.")
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Evolution webhook handler error:", err?.message || err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }
}

async function handleMessageEvent(event: string, payload: any, config: any) {
  const rawData = payload?.data || payload
  const items = Array.isArray(rawData) ? rawData : [rawData]
  let lastInboundResult: any = null

  for (const data of items) {
    const key = data?.key || {}
    const messageId: string | undefined = key?.id || data?.id || data?.messageId
    const from: string | undefined = key?.remoteJid || data?.from

    // 1. Actualizar estado de entrega / lectura de mensajes salientes para deduplicación y tracking técnico
    if ((event === "messages.update" || event === "send.message") && messageId) {
      const status = String(data?.status || data?.update?.status || "").toLowerCase()
      if (status) {
        const newStatus =
          status.includes("read") ? "read" :
          status.includes("delivered") ? "delivered" :
          status.includes("server") || status.includes("ack") ? "sent" :
          status.includes("error") || status.includes("fail") ? "failed" :
          null
        if (newStatus) {
          await db.notification.updateMany({
            where: { messageId },
            data: { status: newStatus },
          }).catch(() => null)
        }
      }
    }

    // 2. Mensajes entrantes (Inbound)
    const isInbound = (event === "messages.upsert" && from && key?.fromMe === false)
    if (isInbound) {
      // 2a. Descarte inmediato de grupos o difusiones (@g.us, @broadcast, key.participant)
      if (from.endsWith("@g.us") || from.includes("@g.us") || key?.participant || from.includes("@broadcast")) {
        console.log(`[INBOUND] Mensaje de grupo descartado: ${from}`)
        lastInboundResult = { ignored: true, reason: "group_message" }
        continue
      }

      const envInbound = process.env.WHATSAPP_INBOUND_ENABLED?.trim()
      const inboundEnabled =
        envInbound === "true" ||
        envInbound === "1" ||
        (envInbound === undefined && (config?.logInboundActive ?? true))

      if (!inboundEnabled) {
        // INBOUND APAGADO: No procesar, no almacenar en InboxItem ni generar notificaciones inbound.
        lastInboundResult = { ignored: true, reason: "inbound_disabled" }
        continue
      }

      const inboundRes = await handleInboundMessage(data, payload, from, messageId, config)
      lastInboundResult = inboundRes
    }
  }

  return lastInboundResult || { received: true }
}

function extractMessageText(data: any): string {
  if (!data) return ""
  if (typeof data === "string") return data.trim()
  if (typeof data.message === "string") return data.message.trim()

  const msg = data.message || data
  if (typeof msg === "string") return msg.trim()

  if (msg?.conversation) return String(msg.conversation).trim()
  if (msg?.extendedTextMessage?.text) return String(msg.extendedTextMessage.text).trim()
  if (msg?.imageMessage?.caption) return String(msg.imageMessage.caption).trim()
  if (msg?.videoMessage?.caption) return String(msg.videoMessage.caption).trim()
  if (msg?.documentMessage?.caption) return String(msg.documentMessage.caption).trim()
  if (msg?.buttonsResponseMessage?.selectedDisplayText) return String(msg.buttonsResponseMessage.selectedDisplayText).trim()
  if (msg?.listResponseMessage?.title) return String(msg.listResponseMessage.title).trim()
  if (data?.body && typeof data.body === "string") return data.body.trim()
  if (data?.text && typeof data.text === "string") return data.text.trim()

  return ""
}

function detectMessageCategory(text: string): string {
  if (!text) return "general_inquiry"
  const lower = text.toLowerCase()
  if (
    lower.includes("pago") ||
    lower.includes("transferencia") ||
    lower.includes("anticipo") ||
    lower.includes("comprobante") ||
    lower.includes("spei") ||
    lower.includes("depósito") ||
    lower.includes("deposito")
  ) {
    return "payment_related"
  }
  if (
    lower.includes("cancelar") ||
    lower.includes("cancelación") ||
    lower.includes("cancelo") ||
    lower.includes("cancelen")
  ) {
    return "cancellation"
  }
  if (
    lower.includes("contrato") ||
    lower.includes("firmar") ||
    lower.includes("firma") ||
    lower.includes("firmado")
  ) {
    return "contract_related"
  }
  if (
    lower.includes("cambio") ||
    lower.includes("mover") ||
    lower.includes("horario") ||
    lower.includes("fecha") ||
    lower.includes("posponer")
  ) {
    return "event_change"
  }
  return "general_inquiry"
}

async function handleInboundMessage(
  data: any,
  payload: any,
  from: string,
  messageId: string | undefined,
  config: any
) {
  // Filtro Estricto de Admisión:
  // Antes de crear cualquier registro en InboxItem o disparar notificaciones,
  // valida si los últimos 10 dígitos del remitente existen en BookingRequest, ContactInquiry o ClientProfile.
  const contact = await findCommercialContact(from)

  if (!contact.isCommercial) {
    console.log(`[INBOUND] Mensaje ignorado - contacto no comercial: ${from}`)
    return { ignored: true, reason: "non_commercial_contact" }
  }

  const messageText = extractMessageText(data) || extractMessageText(payload)
  const cleanDigits = (from || "").split("@")[0].replace(/\D/g, "")
  const last10 = contact.last10 || cleanDigits.slice(-10)

  const pushName =
    data?.pushName ||
    payload?.pushName ||
    payload?.senderName ||
    null

  let senderName: string | null = pushName
  let clientId: string | null = null
  let bookingRequestId: string | null = null

  // 1. Resolver clientId
  if (contact.client) {
    clientId = contact.client.id
    if (!senderName && contact.client.user?.name) {
      senderName = contact.client.user.name
    }
  } else if (contact.booking?.clientId) {
    clientId = contact.booking.clientId
  } else if (contact.inquiry?.matchedClientId) {
    clientId = contact.inquiry.matchedClientId
  } else if (contact.inquiry?.convertedBooking?.clientId) {
    clientId = contact.inquiry.convertedBooking.clientId
  }

  // 2. Resolver bookingRequestId
  if (contact.booking) {
    bookingRequestId = contact.booking.id
    if (!senderName && contact.booking.clientName) {
      senderName = contact.booking.clientName
    }
  } else if (contact.inquiry?.convertedBooking?.id) {
    bookingRequestId = contact.inquiry.convertedBooking.id
    if (!senderName && contact.inquiry.convertedBooking.clientName) {
      senderName = contact.inquiry.convertedBooking.clientName
    }
  } else if (clientId) {
    // Si tenemos cliente pero no booking directo por teléfono, asociar su booking más reciente
    const latestBooking = await db.bookingRequest.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { id: true, clientName: true },
    })
    if (latestBooking) {
      bookingRequestId = latestBooking.id
      if (!senderName && latestBooking.clientName) {
        senderName = latestBooking.clientName
      }
    }
  }

  // 3. Fallback de nombre si provino de ContactInquiry
  if (!senderName && contact.inquiry?.name) {
    senderName = contact.inquiry.name
  }

  const isKnownContact = Boolean(clientId || bookingRequestId)
  const priority = isKnownContact ? "high" : "medium"
  const itemType = isKnownContact ? "customer_action_required" : "new_lead"
  const category = detectMessageCategory(messageText)

  // Anti-duplicados: evitar registrar el mismo webhook dos veces en < 15 segundos
  const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000)
  const recentDuplicate = await db.inboxItem.findFirst({
    where: {
      phoneNumber: cleanDigits || from || "Desconocido",
      message: messageText || "[Mensaje multimedia]",
      createdAt: { gte: fifteenSecondsAgo },
    },
  })

  if (recentDuplicate) {
    console.log(`[INBOUND] Mensaje duplicado omitido para ${cleanDigits}`)
    return { ignored: true, reason: "duplicate" }
  }

  // Registrar en InboxItem para que aparezca en /admin/inbox
  await db.inboxItem.create({
    data: {
      phoneNumber: cleanDigits || from || "Desconocido",
      senderName: senderName || (last10 ? `WhatsApp (${last10})` : "Contacto WhatsApp"),
      message: messageText || "[Mensaje multimedia / sin texto]",
      type: itemType,
      category,
      status: "pending",
      priority,
      clientId,
      bookingRequestId,
    },
  })

  // Registrar en Notification con tipo 'inbound' para la pestaña de Log
  if (config?.logInboundActive !== false) {
    await db.notification.create({
      data: {
        type: "inbound",
        channel: "whatsapp",
        recipient: cleanDigits || from,
        message: messageText || "[Mensaje multimedia / sin texto]",
        status: "received",
        messageId: messageId || null,
        bookingRequestId,
        category,
      },
    }).catch((err) => console.error("Error logging inbound notification:", err))
  }

  try {
    revalidatePath("/admin/inbox")
  } catch {
    // Entorno sin soporte de revalidatePath
  }

  return { received: true, processed: true }
}
