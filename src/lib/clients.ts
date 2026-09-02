import { db } from "./db"

const INVALID_PHONES = new Set([
  "0000000000",
  "5500000000",
  "1234567890",
  "5555555555",
  "1111111111",
  "9999999999",
  "1234567899"
])

/**
 * Normaliza un número telefónico a 10 dígitos o retorna null si es inválido.
 */
export function normalizeClientPhone(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 10) return null
  const last10 = digits.slice(-10)
  if (INVALID_PHONES.has(last10)) return null
  return last10
}

/**
 * Normaliza un email a minúsculas o retorna null si es inválido.
 */
export function normalizeClientEmail(email?: string | null): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || trimmed === "no@no.com" || !trimmed.includes("@")) return null
  return trimmed
}

import { Prisma, PrismaClient } from "@prisma/client"

/**
 * Busca un cliente por email o teléfono con normalización estricta, o lo crea atómicamente si no existe.
 * Retorna el profileId (ClientProfile.id).
 */
export async function findOrCreateClient(
  data: {
    name: string
    email?: string | null
    whatsapp?: string | null
    city?: string | null
    state?: string | null
  },
  prismaClient: PrismaClient | Prisma.TransactionClient = db
): Promise<string> {
  const cleanName = data.name?.trim() || "Cliente"
  const cleanEmail = normalizeClientEmail(data.email)
  const cleanPhone = normalizeClientPhone(data.whatsapp)
  const cleanCity = data.city?.trim() || null
  const cleanState = data.state?.trim() || null

  let clientProfile = null

  // 1. Buscar por email canónico
  if (cleanEmail) {
    const user = await prismaClient.user.findUnique({
      where: { email: cleanEmail },
      include: { clientProfile: true }
    })
    if (user?.clientProfile) {
      clientProfile = user.clientProfile
    }
  }

  // 2. Si no se encontró por email, buscar por teléfono normalizado de 10 dígitos
  if (!clientProfile && cleanPhone) {
    clientProfile = await prismaClient.clientProfile.findFirst({
      where: {
        OR: [
          { whatsapp: cleanPhone },
          { whatsapp: { endsWith: cleanPhone } }
        ]
      },
      include: { user: true }
    })
  }

  // 3. Si se encontró un perfil existente: actualizar únicamente campos faltantes (sin sobreescritura destructiva)
  if (clientProfile) {
    const profileUpdates: { city?: string; state?: string; whatsapp?: string } = {}
    if (cleanCity && !clientProfile.city) profileUpdates.city = cleanCity
    if (cleanState && !clientProfile.state) profileUpdates.state = cleanState
    if (cleanPhone && !clientProfile.whatsapp) profileUpdates.whatsapp = cleanPhone

    if (Object.keys(profileUpdates).length > 0) {
      await prismaClient.clientProfile.update({
        where: { id: clientProfile.id },
        data: profileUpdates
      }).catch(() => null)
    }

    return clientProfile.id
  }

  // 4. Si no existe, crear usuario y perfil
  const newUser = await prismaClient.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      role: "CLIENT"
    }
  })

  const newProfile = await prismaClient.clientProfile.create({
    data: {
      userId: newUser.id,
      whatsapp: cleanPhone,
      city: cleanCity,
      state: cleanState,
      type: "social"
    }
  })

  return newProfile.id
}
