import { toWhatsAppNumber } from "../phone"
export async function sendWhatsApp(
  to: string, 
  message: string, 
  label?: string, 
  media?: string, 
  fileName?: string
): Promise<{ messageId: string | null; error: string | null }> {
  const { db } = await import("../db")
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  // Failsafe de Seguridad: No enviar a músicos inactivos
  if (to) {
    const normalizedTarget = toWhatsAppNumber(to)
    if (normalizedTarget) {
      const cleanTarget = normalizedTarget.replace(/\D+/g, "")
      const inactiveMusicians = await db.musicianProfile.findMany({
        where: {
          status: { not: "active" },
          whatsapp: { not: null }
        }
      })
      const isInactive = inactiveMusicians.some((m: any) => {
        if (!m.whatsapp) return false
        const cleanM = m.whatsapp.replace(/\D+/g, "")
        return cleanM.slice(-10) === cleanTarget.slice(-10)
      })

      if (isInactive) {
        console.warn(`🛑 [FAILSAFE SENDWHATSAPP] Bloqueado envío a ${to} porque pertenece a un músico INACTIVO / ELIMINADO.`)
        return { messageId: null, error: "Blocked: Recipient is an inactive musician." }
      }
    }
  }

  let baseUrl = config?.evolutionUrl || process.env.EVOLUTION_BASE_URL || ""
  if (baseUrl && !baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`
  }
  
  const apiKey = config?.evolutionApiKey || process.env.EVOLUTION_API_KEY
  const instance = config?.evolutionInstance || "vendetta_admin"

  if (!baseUrl || !apiKey || !to) return { messageId: null, error: "Faltan credenciales o destino" }

  // Normalización Inteligente — usa toWhatsAppNumber() de phone.ts
  const normalized = toWhatsAppNumber(to)
  if (!normalized) {
    console.warn(`⚠️ Número inválido o no normalizable: "${to}" — abortando envío.`)
    return { messageId: null, error: `Número inválido: ${to}` }
  }
  const cleanNumber = normalized
  
  const isMedia = !!media
  const endpoint = isMedia ? "sendMedia" : "sendText"
  const url = `${baseUrl.replace(/\/$/, "")}/message/${endpoint}/${encodeURIComponent(instance)}`
  
  console.log(`📡 Llamando a Evolution API (${endpoint}): ${url}`)
  console.log(`📱 Destino: ${label || "Desconocido"} (${cleanNumber})`)

  try {
    const body: any = {
      number: `${cleanNumber}@s.whatsapp.net`,
      delay: 1200
    }

    if (isMedia) {
      body.media = media
      body.mediatype = "document"
      body.mimetype = "application/pdf"
      body.fileName = fileName || "Cotizacion_Vendetta.pdf"
      body.caption = message
    } else {
      body.text = message
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      console.log(`✅ WhatsApp Enviado con éxito. ID: ${data.key?.id || "sent_ok"}`)
      return { messageId: data.key?.id || data.messageId || "sent_ok", error: null }
    } else {
      const errorBody = await res.text().catch(() => "Sin cuerpo de error")
      console.error(`❌ RECHAZO DE API [${res.status}]: ${errorBody}`)
      return { messageId: null, error: `[HTTP ${res.status}] ${errorBody}` }
    }
  } catch (err: any) {
    console.error("❌ Evolution API Error:", err)
    return { messageId: null, error: err?.message || "Error de red desconocido" }
  }
}
