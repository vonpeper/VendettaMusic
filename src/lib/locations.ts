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

/**
 * Busca un lugar por nombre o dirección, o lo crea si no existe.
 * Retorna el locationId (Location.id).
 */
export async function findOrCreateLocation(data: {
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  colonia?: string | null
  municipio?: string | null
  mapsLink?: string | null
}) {
  const { name, address, city, state, colonia, municipio, mapsLink } = data
  const normalizedName = name?.trim() || "Sin Nombre"

  // Normalizar marcadores de posición a "Show - [Nombre]" para que se filtren del catálogo
  let finalName = normalizedName
  const cleanNameLower = normalizedName.toLowerCase()
  const isPlaceholder = [
    "essential", "festival premium", "experience", "premium", "show",
    "sin nombre", "por definir", "no especificada", "no especificado",
    "paquete", "personalizado"
  ].includes(cleanNameLower)

  if (isPlaceholder || (cleanNameLower.startsWith("show") && !cleanNameLower.startsWith("show -"))) {
    finalName = cleanNameLower.startsWith("show") 
      ? `Show - ${normalizedName.substring(4).trim()}` 
      : `Show - ${normalizedName}`
  }

  const cleanName = finalName.trim()

  // 1. Búsqueda rigurosa para evitar duplicados
  const existing = await db.location.findFirst({
    where: {
      OR: [
        // Coincidencia exacta de nombre en la misma ciudad
        { 
          AND: [
            { name: { equals: cleanName } },
            { city: { equals: city || municipio || "---" } }
          ]
        },
        // O dirección exacta
        { address: { equals: address?.trim() || "---" } }
      ]
    }
  })

  if (existing) {
    // Actualizar mapsLink si no lo tenía o era inválido
    const validLink = getValidMapsLink(mapsLink, address || existing.address)
    if (validLink && (!existing.mapsLink || existing.mapsLink === "No registrado" || existing.mapsLink.startsWith("essential"))) {
      await db.location.update({
        where: { id: existing.id },
        data: { mapsLink: validLink }
      })
    }
    return existing.id
  }

  // 2. Si no existe, crear
  const newLocation = await db.location.create({
    data: {
      name: cleanName,
      address: address?.trim() || "No especificada",
      city: city || municipio || "No especificada",
      state: state || "México",
      mapsLink: getValidMapsLink(mapsLink, address)
    }
  })

  return newLocation.id
}
