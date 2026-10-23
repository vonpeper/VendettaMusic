import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/evolution
 *
 * Receiver de webhooks de Evolution API v2.
 * - Procesa actualizaciones de entrega y lectura de mensajes salientes (delivery/read receipts).
 * - Procesa y persiste mensajes entrantes (Inbound) en InboxItem y Notification cuando WHATSAPP_INBOUND_ENABLED está activo.
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
      await handleMessageEvent(event, payload, config)
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
      const envInbound = process.env.WHATSAPP_INBOUND_ENABLED?.trim()
      const inboundEnabled =
        envInbound === "true" ||
        envInbound === "1" ||
        (envInbound === undefined && (config?.logInboundActive ?? true))

      if (!inboundEnabled) {
        // INBOUND APAGADO: No procesar, no almacenar en InboxItem ni generar notificaciones inbound.
        continue
      }

      await handleInboundMessage(data, payload, from, messageId, config)
    }
  }
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
  const messageText = extractMessageText(data) || extractMessageText(payload)
  const cleanDigits = (from || "").split("@")[0].replace(/\D/g, "")
  const last10 = cleanDigits.slice(-10)

  const pushName =
    data?.pushName ||
    payload?.pushName ||
    payload?.senderName ||
    null

  let senderName: string | null = pushName
  let clientId: string | null = null
  let bookingRequestId: string | null = null

  // Vincular con ClientProfile y BookingRequest existentes por número de WhatsApp
  if (last10 && last10.length === 10) {
    const client = await db.clientProfile.findFirst({
      where: {
        whatsapp: { contains: last10 },
      },
      include: {
        user: { select: { name: true } },
      },
    })

    if (client) {
      clientId = client.id
      if (!senderName && client.user?.name) {
        senderName = client.user.name
      }
    }

    const booking = await db.bookingRequest.findFirst({
      where: {
        clientPhone: { contains: last10 },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientName: true,
        clientId: true,
      },
    })

    if (booking) {
      bookingRequestId = booking.id
      if (!senderName && booking.clientName) {
        senderName = booking.clientName
      }
      if (!clientId && booking.clientId) {
        clientId = booking.clientId
      }
    }
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
    return
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
}
