import crypto from "crypto"
import { PrismaClient, Prisma } from "@prisma/client"

/**
 * Genera el folio estándar oficial de Vendetta Live Music:
 * Formato canónico: VND-XXXX (4 caracteres hexadecimales en mayúsculas).
 * Ejemplo: VND-4A2B, VND-5F39, VND-A7FA.
 */
export function generateSecureShortId(): string {
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase()
  return `VND-${randomHex}`
}

/**
 * Genera un folio único verificando la unicidad en la base de datos relacional y
 * reintentando de manera segura ante cualquier colisión improbable.
 */
export async function generateUniqueShortId(
  tx: Prisma.TransactionClient | PrismaClient,
  maxRetries = 10
): Promise<string> {
  // Intentos principales: Formato estándar oficial VND-XXXX (4 caracteres hex)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidateId = generateSecureShortId()
    const existing = await tx.bookingRequest.findUnique({
      where: { shortId: candidateId }
    })
    if (!existing) {
      return candidateId
    }
  }

  // Si tras múltiples reintentos con 2 bytes colisiona (extremadamente raro en 65,536 combinaciones),
  // se escala a 3 bytes (6 caracteres hex: VND-XXXXXX) para garantizar disponibilidad inmediata
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidateId = `VND-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
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
 * Acepta:
 * 1. Formato estándar oficial: VND-XXXX (4 a 8 caracteres hex, con o sin versión -V1, -V2)
 * 2. Formato personalizado o retrocompatible con folios previos (ej. VND-COLEGIO o folios largos)
 * 3. Formato UUID directo
 */
export function isValidShortIdFormat(id?: string | null): boolean {
  if (!id || typeof id !== "string") return false
  const trimmed = id.trim().toUpperCase()

  // 1. Formato estándar oficial: VND- + 4 a 8 caracteres hexadecimales (con o sin versión -V1, -V2)
  const isStandardFormat = /^VND-[0-9A-F]{4,8}(-V\d+)?$/.test(trimmed)
  if (isStandardFormat) return true

  // 2. Soporte retrocompatible para folios largos previos de 16 caracteres Base32
  const isLongFormat = /^VND-[0-9A-HJKMNP-Z]{4}(-[0-9A-HJKMNP-Z]{4}){3}$/.test(trimmed)
  if (isLongFormat) return true

  // 3. Formato personalizado por palabra clave (ej. VND-COLEGIO, mínimo 5 letras)
  const isNamedCustom = /^VND-[A-Z]{5,15}$/.test(trimmed)
  if (isNamedCustom) return true

  // 4. Formato UUID directo (soporte retrocompatible para consultas directas por ID interno)
  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(trimmed)
  if (isUuid) return true

  return false
}
