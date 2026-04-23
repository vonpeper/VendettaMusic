import { db } from "./db"

/**
 * Busca un cliente por email o teléfono, o lo crea si no existe.
 * Retorna el profileId (ClientProfile.id).
 */
export async function findOrCreateClient(data: {
  name: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
}) {
  const { name, email, phone, whatsapp, city, state } = data

  let clientProfile = null

  // 1. Intentar buscar por Email si existe
  if (email && email.trim() !== "") {
    const user = await db.user.findUnique({
      where: { email: email.trim() },
      include: { clientProfile: true }
    })
    if (user?.clientProfile) {
      clientProfile = user.clientProfile
    }
  }

  // 2. Si no se encontró por email, intentar buscar por Teléfono en ClientProfile
  if (!clientProfile && phone && phone.trim() !== "") {
    clientProfile = await db.clientProfile.findFirst({
      where: { 
        OR: [
          { phone: phone.trim() },
          { whatsapp: phone.trim() }
        ]
      }
    })
  }

  // 3. Si se encontró un perfil, retornar su ID
  if (clientProfile) {
    // ACTUALIZAR DATOS SI CAMBIARON (El usuario quiere que los datos de la cotización se guarden para el cliente)
    // Solo actualizamos si el valor nuevo existe y es diferente
    const userUpdates: any = {}
    if (name && name !== "ClienteAnónimo") userUpdates.name = name
    
    if (Object.keys(userUpdates).length > 0) {
      await db.user.update({
        where: { id: clientProfile.userId },
        data: userUpdates
      })
    }
    
    const profileUpdates: any = {}
    if (phone && phone !== clientProfile.phone) profileUpdates.phone = phone
    if (city && city !== clientProfile.city) profileUpdates.city = city
    if (state && state !== clientProfile.state) profileUpdates.state = state
    if ((whatsapp || phone) && (whatsapp || phone) !== clientProfile.whatsapp) {
      profileUpdates.whatsapp = whatsapp || phone
    }

    if (Object.keys(profileUpdates).length > 0) {
      await db.clientProfile.update({
        where: { id: clientProfile.id },
        data: profileUpdates
      })
    }

    return clientProfile.id
  }

  // 4. Si no existe, crear usuario + perfil
  // Nota: Si no hay email, creamos un usuario sin email (permitido en SQLite/Prisma con unique nulls)
  const newUser = await db.user.create({
    data: {
      name,
      email: (email && email.trim() !== "") ? email.trim() : null,
      role: "CLIENT"
    }
  })

  if (!newUser) throw new Error("No se pudo crear el usuario base para el cliente")

  // Crear el perfil por separado ya que el conector custom no retorna el objeto anidado en el record
  const newProfile = await db.clientProfile.create({
    data: {
      userId: newUser.id,
      phone,
      whatsapp: whatsapp || phone,
      city,
      state,
      type: "social"
    }
  })

  if (!newProfile || !newProfile.id) {
    throw new Error("No se pudo crear el perfil del cliente")
  }

  return newProfile.id
}
