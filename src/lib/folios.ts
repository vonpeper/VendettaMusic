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

  // Bloquear caracteres peligrosos de inyección o formatos corruptos
  if (/[<>;'"\s()!]/.test(trimmed)) return false
  if (trimmed.length < 4 || trimmed.length > 64) return false

  // 1. Formato estándar oficial y alfanumérico Base36: VND- + 4 a 12 caracteres (con o sin versión -V1, -V2)
  const isStandardOrBase36 = /^VND-[0-9A-Z]{4,12}(-V\d+)?$/.test(trimmed)
  if (isStandardOrBase36) return true

  // 2. Soporte para folios con doble guión histórico (ej. VND--KBS)
  const isDoubleHyphen = /^VND--[0-9A-Z]{3,12}(-V\d+)?$/.test(trimmed)
  if (isDoubleHyphen) return true

  // 3. Formato alfanumérico directo sin prefijo VND- (ej. 4A2B, C2RS, ABC123X, 4 a 12 caracteres)
  const isBareAlphanumeric = /^[0-9A-Z]{4,12}(-V\d+)?$/.test(trimmed)
  if (isBareAlphanumeric) return true

  // 4. Soporte retrocompatible para folios largos previos (ej. Base32 segmentado)
  const isLongFormat = /^VND-[0-9A-Z]{4}(-[0-9A-Z]{4}){1,4}$/.test(trimmed)
  if (isLongFormat) return true

  // 5. Formato personalizado por palabra clave (ej. VND-COLEGIO o COLEGIO, mínimo 5 letras)
  const isNamedCustom = /^(VND-)?[A-Z]{5,20}$/.test(trimmed)
  if (isNamedCustom) return true

  // 6. Formato UUID directo (soporte retrocompatible para consultas directas por ID interno)
  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(trimmed)
  if (isUuid) return true

  // 7. Slugs compuestos con guiones (ej. fixed-codere-metepec-2026)
  if (/^[A-Z0-9]+(-[A-Z0-9]+){2,}$/.test(trimmed) && trimmed.length >= 10) return true

  return false
}
