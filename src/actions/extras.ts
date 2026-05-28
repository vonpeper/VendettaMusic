"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminErr as requireAdmin } from "@/lib/auth-guards"

export async function createExtraAction(data: {
  name: string
  description?: string
  setupCost: number
  hourlyCost: number
}) {
  const u = await requireAdmin(); if (u) return u
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
  const u = await requireAdmin(); if (u) return u
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
  const u = await requireAdmin(); if (u) return u
  try {
    await db.packageService.delete({ where: { id } })
    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting extra:", error)
    return { success: false, error: "Error al eliminar el servicio adicional" }
  }
}

export async function initializeDefaultExtrasAction() {
  const u = await requireAdmin(); if (u) return u
  try {
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

    const defaultExtras = [
      { name: "Templete", setupCost: 3800, hourlyCost: 0, description: "Escenario elevado para la banda" },
      { name: "Pista Iluminada", setupCost: 7500, hourlyCost: 0, description: "Pista LED premium para la pista de baile" },
      { name: "Robot LED (Batucada)", setupCost: 700, hourlyCost: 0, description: "Show visual con robots LED durante la batucada" },
      { name: "DJ (Hora Extra)", setupCost: 0, hourlyCost: 800, description: "DJ continuo en descansos o extensión de horario" },
      { name: "DJ con Pantallas (Hora Extra)", setupCost: 0, hourlyCost: 1500, description: "DJ con 2 pantallas LED de 45 pulgadas" },
      { name: "Audio Upgrade (>100 personas)", setupCost: 7500, hourlyCost: 0, description: "Upgrade a sistema de audio Pro" },
      { name: "Audio Upgrade (>300 personas)", setupCost: 10000, hourlyCost: 0, description: "Upgrade a sistema Line Array tipo festival" },
      { name: "Pantalla LED 3x2", setupCost: 15000, hourlyCost: 0, description: "Pantalla LED gigante detrás del escenario" },
    ]

    for (const item of defaultExtras) {
      // Evitar duplicados por nombre
      const exists = await db.packageService.findFirst({
        where: { packageId: armaPackage.id, name: item.name }
      })
      if (!exists) {
        await db.packageService.create({
          data: {
            packageId: armaPackage.id,
            name: item.name,
            description: item.description,
            setupCost: item.setupCost,
            hourlyCost: item.hourlyCost
          }
        })
      }
    }

    revalidatePath("/admin/paquetes")
    return { success: true }
  } catch (error) {
    console.error("Error initializing default extras:", error)
    return { success: false, error: "Error al pre-cargar los rubros por defecto" }
  }
}
