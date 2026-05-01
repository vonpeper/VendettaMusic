"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"

export async function createClienteAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = (formData.get("email") as string || "").trim() || null
    const phone = (formData.get("phone") as string) || null
    const whatsapp = (formData.get("whatsapp") as string) || null
    const state = (formData.get("state") as string) || null
    const city = (formData.get("city") as string) || null
    const type = (formData.get("type") as string) || null
    const company = (formData.get("company") as string) || null
    const rfc = (formData.get("rfc") as string) || null
    const notes = (formData.get("notes") as string) || null

    if (!name) {
      return { success: false, message: "El nombre es obligatorio." }
    }

    if (email) {
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return { success: false, message: "Ya existe un usuario con ese correo electrónico." }
      }
    }

    const passwordHash = await hash("Vendetta2026!", 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: "CLIENT",
        clientProfile: {
          create: {
            phone,
            whatsapp,
            state,
            city,
            type: type || "private",
            company,
            rfc,
            notes,
          }
        }
      }
    })

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente creado exitosamente.", id: user.id }
  } catch (error) {
    console.error("Error crear cliente:", error)
    return { success: false, message: "Error interno al crear el cliente." }
  }
}

export async function updateClienteAction(prevState: any, formData: FormData) {
  try {
    const profileId = formData.get("profileId") as string
    const name = formData.get("name") as string
    const emailInput = (formData.get("email") as string || "").trim()
    const email = emailInput || null
    const phone = formData.get("phone") as string
    const whatsapp = formData.get("whatsapp") as string
    const state = formData.get("state") as string
    const city = formData.get("city") as string
    const type = formData.get("type") as string
    const company = formData.get("company") as string
    const rfc = formData.get("rfc") as string
    const notes = formData.get("notes") as string

    if (!profileId || !name) {
      return { success: false, message: "Nombre e ID son obligatorios." }
    }

    const profile = await db.clientProfile.findUnique({
      where: { id: profileId },
      include: { user: true }
    })
    if (!profile) return { success: false, message: "Cliente no encontrado." }

    await db.user.update({
      where: { id: profile.userId },
      data: { name, email }
    })

    await db.clientProfile.update({
      where: { id: profileId },
      data: { phone, whatsapp, state, city, type, company, rfc, notes }
    })

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente actualizado correctamente." }
  } catch (error) {
    console.error("Error editar cliente:", error)
    return { success: false, message: "Error al actualizar el cliente." }
  }
}

export async function deleteClienteAction(profileId: string) {
  try {
    const profile = await db.clientProfile.findUnique({
      where: { id: profileId }
    })
    if (!profile) return { success: false, message: "Cliente no encontrado." }

    await db.user.delete({ where: { id: profile.userId } })

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente eliminado." }
  } catch (error) {
    console.error("Error eliminar cliente:", error)
    return { success: false, message: "Error al eliminar el cliente." }
  }
}
export async function deleteClientesAction(profileIds: string[]) {
  try {
    if (!profileIds || profileIds.length === 0) {
      return { success: false, message: "No se proporcionaron IDs." }
    }

    // 1. Obtener UserIDs asociados
    const profiles = await db.clientProfile.findMany({
      where: { id: { in: profileIds } },
      select: { userId: true }
    })
    const userIds = profiles.map(p => p.userId)

    // 2. Ejecutar borrado en orden de dependencia
    await db.$transaction(async (tx) => {
      // Borrar notificaciones vinculadas a eventos de estos clientes
      // Primero obtenemos los IDs de eventos de estos clientes
      const events = await tx.event.findMany({
        where: { clientId: { in: profileIds } },
        select: { id: true }
      })
      const eventIds = events.map(e => e.id)

      if (eventIds.length > 0) {
        await tx.notification.deleteMany({
          where: { eventId: { in: eventIds } }
        })
      }

      // Borrar solicitudes de booking
      await tx.bookingRequest.deleteMany({
        where: { clientId: { in: profileIds } }
      })
      await tx.bookingRequest.deleteMany({
        where: { clientUserId: { in: userIds } }
      })

      // Borrar eventos (y sus cascadas en DB: Contract, Payment, EventMusician)
      await tx.event.deleteMany({
        where: { clientId: { in: profileIds } }
      })

      // Borrar cotizaciones (y su cascada en DB: QuoteItem)
      await tx.quote.deleteMany({
        where: { clientId: { in: profileIds } }
      })

      // Finalmente borrar los usuarios (que por cascada borran el ClientProfile)
      await tx.user.deleteMany({
        where: { id: { in: userIds } }
      })
    })

    revalidatePath("/admin/clientes")
    return { success: true, message: `${profileIds.length} clientes eliminados con todo su historial.` }
  } catch (error) {
    console.error("Error eliminar clientes masivo:", error)
    return { success: false, message: "Error al eliminar los clientes. Es posible que tengan dependencias complejas." }
  }
}
