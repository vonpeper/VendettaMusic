import crypto from "crypto"

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return "fallback_secret_vendetta_music_app_2026"
    }
    throw new Error("AUTH_SECRET environment variable is not configured.")
  }
  return secret
}

/**
 * Genera un token HMAC-SHA256 acotado a un recurso (ej: bookingId, quoteId).
 */
export function generateResourceToken(resourceId: string): string {
  const secret = getAuthSecret()
  return crypto.createHmac("sha256", secret).update(resourceId).digest("hex")
}

/**
 * Valida un token HMAC-SHA256 para un recurso específico utilizando tiempo constante.
 */
export function verifyResourceToken(resourceId: string, token?: string | null): boolean {
  if (!token || typeof token !== "string") return false
  try {
    const secret = getAuthSecret()
    const expected = crypto.createHmac("sha256", secret).update(resourceId).digest("hex")
    
    if (token.length !== expected.length) return false
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
