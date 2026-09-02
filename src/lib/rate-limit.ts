interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Validador de tasa de peticiones (Rate Limiter) en memoria para protección contra fuerza bruta en endpoints públicos.
 * @param identifier Identificador del cliente (IP, hash de sesión o subred)
 * @param maxRequests Máximo número de intentos permitidos en la ventana
 * @param windowMs Duración de la ventana en milisegundos (por defecto 1 minuto)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  // Limpieza periódica si la tienda crece
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count += 1
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}
