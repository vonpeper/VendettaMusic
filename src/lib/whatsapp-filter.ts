import { db } from "@/lib/db"

/**
 * Verifica si los últimos 10 dígitos de un número existen en alguna tabla de contactos.
 * Usamos queryRaw para evitar que el compilador de TS se pierda en tipos complejos de Prisma.
 */
export async function checkIsRegistered(cleanLast10: string): Promise<boolean> {
  try {
    const query = `%${cleanLast10}`
    const results = await (db as any).$queryRaw`
      SELECT 1 FROM (
        SELECT whatsapp as p FROM MusicianProfile WHERE whatsapp LIKE ${query}
        UNION ALL
        SELECT phone as p FROM MusicianProfile WHERE phone LIKE ${query}
        UNION ALL
        SELECT whatsapp as p FROM ClientProfile WHERE whatsapp LIKE ${query}
        UNION ALL
        SELECT phone as p FROM ClientProfile WHERE phone LIKE ${query}
        UNION ALL
        SELECT clientPhone as p FROM BookingRequest WHERE clientPhone LIKE ${query}
        UNION ALL
        SELECT whatsapp as p FROM Substitute WHERE whatsapp LIKE ${query}
        UNION ALL
        SELECT whatsapp as p FROM Provider WHERE whatsapp LIKE ${query}
      ) AS contacts LIMIT 1
    ` as any[]
    
    return results.length > 0
  } catch (err) {
    console.error("Error in checkIsRegistered:", err)
    return false
  }
}

export interface MessageClassification {
  intent: "actionable" | "simple_response" | "unknown"
  category: "payment_related" | "event_change" | "contract_related" | "general_inquiry" | "customer_reply" | "cancellation" | null
}

/**
 * Clasifica un mensaje basado en palabras clave para decidir si va a la bandeja de atención.
 */
export function classifyMessage(text: string): MessageClassification {
  const t = text.toLowerCase()

  // 1. Detección de intención accionable (Keywords críticas)
  const keywords = {
    payment_related:  ["pago", "deposito", "transferencia", "comprobante", "recibo", "anticipo", "abono", "liquidar", "pagado", "cuenta", "clabe"],
    event_change:     ["fecha", "cambio", "dia", "posponer", "reprogramar", "horario", "hora", "moverse"],
    contract_related: ["contrato", "firma", "clausula", "legal", "documento", "pdf"],
    cancellation:     ["cancelar", "cancelacion", "baja", "no podre", "ya no"],
    general_inquiry:  ["cotizacion", "precio", "cuanto", "paquete", "duda", "pregunta", "informacion", "presupuesto", "info", "ubicacion", "maps"]
  }

  for (const [cat, list] of Object.entries(keywords)) {
    if (list.some(word => t.includes(word))) {
      return { 
        intent: "actionable", 
        category: cat as MessageClassification["category"] 
      }
    }
  }

  // 2. Respuestas simples (Se ignoran de la bandeja de atención)
  const simpleReplies = ["ok", "gracias", "recibido", "enterado", "perfecto", "listo", "thx", "thanks", "visto", "bueno", "sale", "va", "confirmo"]
  
  // Limpiamos puntuación básica para el check de palabras sueltas
  const words = t.replace(/[.,!?]/g, "").split(/\s+/)
  if (words.length <= 3 && words.some(w => simpleReplies.includes(w))) {
    return { intent: "simple_response", category: "customer_reply" }
  }

  return { intent: "unknown", category: null }
}
