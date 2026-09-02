import crypto from "crypto"
import { PrismaClient, Prisma } from "@prisma/client"

// Alfabeto Crockford Base32 (32 caracteres libres de ambigüedad visual)
// Excluye I, L, O, U para evitar confusiones al leer o transcribir manualmente.
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

/**
 * Genera una cadena aleatoria criptográficamente segura con 80 bits de entropía
 * en formato Crockford Base32 estructurado en 4 bloques de 4 caracteres.
 * Total: VND-XXXX-XXXX-XXXX-XXXX (16 caracteres base32 = 32^16 = 2^80 combinaciones).
 */
export function generateSecureShortId(): string {
  // 10 bytes = 80 bits = 16 caracteres de 5 bits cada uno
  const bytes = crypto.randomBytes(10)
  let chars = ""
  
  // Extraer 16 índices de 5 bits a partir de los 80 bits aleatorios
  let bitBuffer = 0
  let bitCount = 0
  let byteIndex = 0

  while (chars.length < 16) {
    if (bitCount < 5 && byteIndex < bytes.length) {
      bitBuffer = (bitBuffer << 8) | bytes[byteIndex++]
      bitCount += 8
    }
    const index = (bitBuffer >> (bitCount - 5)) & 31
    bitCount -= 5
    chars += CROCKFORD_ALPHABET[index]
  }

  return `VND-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`
}

/**
 * Genera un folio único verificando la unicidad en la base de datos relacional y
 * reintentando de manera segura ante cualquier colisión improbable.
 */
export async function generateUniqueShortId(
  tx: Prisma.TransactionClient | PrismaClient,
  maxRetries = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidateId = generateSecureShortId()
    const existing = await tx.bookingRequest.findUnique({
      where: { shortId: candidateId }
    })
    if (!existing) {
      return candidateId
    }
  }
  throw new Error("No fue posible generar un folio único tras múltiples reintentos.")
}

/**
 * Valida si un ID o folio cumple con el formato válido.
 * Acepta tanto el nuevo formato seguro de 80 bits (VND-XXXX-XXXX-XXXX-XXXX),
 * como los folios heredados (VND-XXXX, VND-XXXX-V2) y UUIDs directos.
 */
export function isValidShortIdFormat(id?: string | null): boolean {
  if (!id || typeof id !== "string") return false
  const trimmed = id.trim().toUpperCase()

  // 1. Nuevo formato seguro: VND- + 4 bloques de 4 caracteres Crockford Base32
  const isNewSecureFormat = /^VND-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$/.test(trimmed)
  if (isNewSecureFormat) return true

  // 2. Formato histórico corto: VND- + 4 a 8 caracteres hexadecimales (con o sin sufijo de versión -V1, -V2)
  const isLegacyFormat = /^VND-[0-9A-F]{4,8}(-V\d+)?$/.test(trimmed)
  if (isLegacyFormat) return true

  // 3. Formato UUID directo (soporte retrocompatible para consultas directas por ID interno)
  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(trimmed)
  if (isUuid) return true

  return false
}
