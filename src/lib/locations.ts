import { db } from "./db"

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

  // 1. Intentar buscar por nombre exacto (case insensitive si es posible, aquí usamos normalizado)
  const normalizedName = name.trim()
  
  if (normalizedName === "" || normalizedName === "Sin Nombre") {
    // Si no hay nombre, intentamos buscar por dirección
    if (address && address.trim() !== "") {
       const existingByAddr = await db.location.findFirst({
         where: { address: address.trim() }
       })
       if (existingByAddr) return existingByAddr.id
    }
    return null
  }

  const existing = await db.location.findFirst({
    where: {
      OR: [
        { name: { contains: normalizedName } },
        { address: address?.trim() || "---" }
      ]
    }
  })

  if (existing) {
    // Actualizar mapsLink si no lo tenía
    if (mapsLink && !existing.mapsLink) {
      await db.location.update({
        where: { id: existing.id },
        data: { mapsLink }
      })
    }
    return existing.id
  }

  // 2. Si no existe, crear
  const newLocation = await db.location.create({
    data: {
      name: normalizedName,
      address: address?.trim() || "No especificada",
      city: city || municipio || "No especificada",
      state: state || "México",
      mapsLink: mapsLink || null
    }
  })

  return newLocation.id
}
