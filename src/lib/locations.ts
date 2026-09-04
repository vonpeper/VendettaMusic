import { db } from "./db"

/**
 * Valida un link de Google Maps. Si es vacío o no es una URL válida,
 * genera automáticamente un enlace de búsqueda en Google Maps basado en la dirección.
 * Si no hay dirección válida, retorna la web principal de Vendetta.
 */
export function getValidMapsLink(mapsLink?: string | null, address?: string | null): string {
  const cleanLink = mapsLink?.trim()
  if (cleanLink && (cleanLink.startsWith("http://") || cleanLink.startsWith("https://"))) {
    return cleanLink
  }
  const cleanAddr = address?.trim()
  if (cleanAddr && cleanAddr !== "No especificada" && cleanAddr !== "Dirección no especificada" && cleanAddr.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddr)}`
  }
  return "https://www.vendetta.mx"
}

import { Prisma, PrismaClient } from "@prisma/client"

/**
 * Busca un lugar real por nombre o dirección, o lo crea si no existe.
 * Retorna el locationId (Location.id) o null si es una dirección genérica.
 */
export async function findOrCreateLocation(
  data: {
    name: string
    address?: string | null
    city?: string | null
    state?: string | null
    colonia?: string | null
    municipio?: string | null
    mapsLink?: string | null
  },
  prismaClient: PrismaClient | Prisma.TransactionClient = db
): Promise<string> {
  const cleanName = data.name?.trim() || "Ubicación Particular"
  const cleanAddress = data.address?.trim() || "No especificada"
  const cleanCity = data.city?.trim() || data.municipio?.trim() || null
  const cleanState = data.state?.trim() || "México"
  const validMapsLink = getValidMapsLink(data.mapsLink, cleanAddress)

  // 1. Buscar coincidencia exacta por nombre en la misma ciudad
  const existing = await prismaClient.location.findFirst({
    where: {
      AND: [
        { name: { equals: cleanName } },
        ...(cleanCity ? [{ city: { equals: cleanCity } }] : [])
      ]
    }
  })

  if (existing) {
    // Si no tenía link de maps y ahora sí, actualizar
    if (validMapsLink && (!existing.mapsLink || existing.mapsLink === "https://www.vendetta.mx")) {
      await prismaClient.location.update({
        where: { id: existing.id },
        data: { mapsLink: validMapsLink }
      }).catch(() => null)
    }
    return existing.id
  }

  // 2. Si no existe, crear nueva locación en el catálogo
  const newLocation = await prismaClient.location.create({
    data: {
      name: cleanName,
      address: cleanAddress,
      city: cleanCity,
      state: cleanState,
      mapsLink: validMapsLink,
      active: true
    }
  })

  return newLocation.id
}
