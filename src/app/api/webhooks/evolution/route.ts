import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/evolution
 *
 * Receiver de webhooks de Evolution API v2.
 * - Procesa actualizaciones de entrega y lectura de mensajes salientes (delivery/read receipts).
 * - El procesamiento y almacenamiento de mensajes entrantes (Inbound) está APAGADO por defecto (WHATSAPP_INBOUND_ENABLED=false).
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
      await handleMessageEvent(event, payload)
    } else if (event === "connection.update") {
      console.log("Evolution connection.update received.")
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Evolution webhook handler error:", err?.message || err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }
}

async function handleMessageEvent(event: string, payload: any) {
  const data = payload?.data || payload
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
    const inboundEnabled = process.env.WHATSAPP_INBOUND_ENABLED === "true"
    if (!inboundEnabled) {
      // INBOUND APAGADO: No procesar, no almacenar en InboxItem ni generar notificaciones inbound.
      return
    }
  }
}
