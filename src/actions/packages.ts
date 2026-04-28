"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPackageAction(data: {
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string
  includes: string
}) {
  try {
    await db.package.create({
      data: {
        ...data,
        active: true
      }
    })
    revalidatePath("/admin/paquetes")
    revalidatePath("/cotizar")
    return { success: true }
  } catch (error) {
    console.error("Error creating package:", error)
    return { success: false, error: "Error al crear el paquete" }
  }
}

export async function updatePackageAction(id: string, data: any) {
  try {
    await db.package.update({
      where: { id },
      data
    })
    revalidatePath("/admin/paquetes")
    revalidatePath("/cotizar")
    return { success: true }
  } catch (error) {
    console.error("Error updating package:", error)
    return { success: false, error: "Error al actualizar el paquete" }
  }
}

export async function deletePackageAction(id: string) {
  try {
    await db.package.delete({ where: { id } })
    revalidatePath("/admin/paquetes")
    revalidatePath("/cotizar")
    return { success: true }
  } catch (error) {
    console.error("Error deleting package:", error)
    return { success: false, error: "Error al eliminar el paquete" }
  }
}
