"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createExtraAction(data: {
  name: string
  description?: string
  setupCost: number
  hourlyCost: number
}) {
  try {
    // Buscamos o creamos el paquete "Arma tu Show" que actúa como contenedor global de extras
    let armaPackage = await db.package.findFirst({
      where: { name: { contains: "Arma" } }
    })

    if (!armaPackage) {
      armaPackage = await db.package.create({
        data: {
          name: "Arma tu Show (Personalizado)",
          baseCostPerHour: 4000,
          minDuration: 2,
          description: "Paquete base para personalización",
          isCustom: true
        }
      })
    }

    await db.packageService.create({
      data: {
        packageId: armaPackage.id,
        name: data.name,
        description: data.description || "",
        setupCost: data.setupCost,
        hourlyCost: data.hourlyCost
      }
    })

    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error creating extra:", error)
    return { success: false, error: "Error al crear el servicio adicional" }
  }
}

export async function updateExtraAction(id: string, data: any) {
  try {
    await db.packageService.update({
      where: { id },
      data
    })
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error updating extra:", error)
    return { success: false, error: "Error al actualizar el servicio adicional" }
  }
}

export async function deleteExtraAction(id: string) {
  try {
    await db.packageService.delete({ where: { id } })
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting extra:", error)
    return { success: false, error: "Error al eliminar el servicio adicional" }
  }
}
