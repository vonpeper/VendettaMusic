"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return { success: false as const, error: "No autorizado" }
  }
  return null
}

export async function createServiceItemAction(data: {
  name: string
  category: string
  icon?: string
  description?: string
  order?: number
}) {
  const u = await requireAdmin(); if (u) return u
  try {
    await db.serviceItem.create({
      data: {
        ...data,
        active: true
      }
    })
    revalidatePath("/admin/servicios")
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error creating service item:", error)
    return { success: false, error: "Error al crear el servicio" }
  }
}

export async function updateServiceItemAction(id: string, data: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    await db.serviceItem.update({
      where: { id },
      data
    })
    revalidatePath("/admin/servicios")
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error updating service item:", error)
    return { success: false, error: "Error al actualizar el servicio" }
  }
}

export async function deleteServiceItemAction(id: string) {
  const u = await requireAdmin(); if (u) return u
  try {
    await db.serviceItem.delete({ where: { id } })
    revalidatePath("/admin/servicios")
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting service item:", error)
    return { success: false, error: "Error al eliminar el servicio" }
  }
}

export async function linkServiceToPackageAction(packageId: string, serviceId: string) {
  const u = await requireAdmin(); if (u) return u
  try {
    await db.package.update({
      where: { id: packageId },
      data: {
        serviceItems: {
          connect: { id: serviceId }
        }
      }
    })
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error linking service:", error)
    return { success: false, error: "Error al vincular el servicio" }
  }
}

export async function unlinkServiceFromPackageAction(packageId: string, serviceId: string) {
  const u = await requireAdmin(); if (u) return u
  try {
    await db.package.update({
      where: { id: packageId },
      data: {
        serviceItems: {
          disconnect: { id: serviceId }
        }
      }
    })
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error unlinking service:", error)
    return { success: false, error: "Error al desvincular el servicio" }
  }
}
