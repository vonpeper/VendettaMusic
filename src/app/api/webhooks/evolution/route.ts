import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/evolution
 *
 * Receiver de webhooks de Evolution API v2. Configurar en Evolution:
 *   - URL: https://<host>/api/webhooks/evolution
 *   - Events: messages.upsert, send.message, connection.update
 *   - Webhook secret (opcional): se valida vía HMAC SHA-256 en header `x-evolution-signature`
 *     o por shared-token en header `apikey` que iguale a GlobalConfig.evolutionWebhookSecret.
 *
 * No fallamos si no hay secret configurado (modo dev), pero lo recomendamos en prod.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()

  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
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

  const event = (payload?.event || payload?.type || "").toString()

  try {
    if (event === "send.message" || event === "messages.update" || event === "messages.upsert") {
      await handleMessageEvent(event, payload)
    } else if (event === "connection.update") {
      // Estado de conexión: lo logueamos para visibilidad operativa.
      console.log(`📡 Evolution connection.update: ${JSON.stringify(payload?.data?.state || payload?.state)}`)
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Evolution webhook handler error:", err)
    return NextResponse.json({ error: err?.message || "Handler failed" }, { status: 500 })
  }
}

async function handleMessageEvent(event: string, payload: any) {
  const data = payload?.data || payload
  const key = data?.key || {}
  const messageId: string | undefined = key?.id || data?.id || data?.messageId
  const from: string | undefined = key?.remoteJid || data?.from
  const text: string | undefined =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.text ||
    null

  // Update outbound delivery/read status when Evolution reports it.
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

  // Inbound message from a client (messages.upsert with fromMe=false)
  if (event === "messages.upsert" && from && key?.fromMe === false) {
    const phone = from.replace(/[^\d]/g, "")
    await db.notification.create({
      data: {
        type: "inbound",
        channel: "whatsapp",
        recipient: phone,
        message: text || "(media o vacío)",
        status: "received",
        messageId: messageId || null,
      },
    }).catch(() => null)

    // Auto-confirm: si el cliente respondió "CONFIRMO" tratamos de marcar el músico como confirmado.
    if (text && /\bCONFIRMO\b/i.test(text)) {
      // Buscamos un músico cuyo whatsapp/phone coincida con el remitente.
      const cleanLast10 = phone.slice(-10)
      const musician = await db.musicianProfile.findFirst({
        where: {
          OR: [
            { whatsapp: { contains: cleanLast10 } },
            { phone:    { contains: cleanLast10 } },
          ],
        },
      })
      if (musician) {
        await db.eventMusician.updateMany({
          where: { musicianId: musician.id, status: "pending" },
          data:  { status: "confirmed" },
        }).catch(() => null)
      }
    }
  }
}
