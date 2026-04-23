"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createProviderAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    
    await db.provider.create({
      data: {
        name: data.name as string,
        company: (data.company as string) || null,
        address: (data.address as string) || null,
        whatsapp: (data.whatsapp as string) || null,
        serviceType: data.serviceType as string,
        contactInfo: data.contactInfo as string,
      }
    })
    
    revalidatePath("/admin/proveedores")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating provider:", error)
    return { success: false, error: error.message || "Error al crear el proveedor" }
  }
}

export async function updateProviderAction(id: string, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    
    await db.provider.update({
      where: { id },
      data: {
        name: data.name as string,
        company: (data.company as string) || null,
        address: (data.address as string) || null,
        whatsapp: (data.whatsapp as string) || null,
        serviceType: data.serviceType as string,
        contactInfo: data.contactInfo as string,
      }
    })
    
    revalidatePath("/admin/proveedores")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating provider:", error)
    return { success: false, error: error.message || "Error al actualizar el proveedor" }
  }
}

export async function deleteProviderAction(id: string) {
  try {
    await db.provider.delete({
      where: { id }
    })
    
    revalidatePath("/admin/proveedores")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting provider:", error)
    return { success: false, error: "Error al eliminar el proveedor" }
  }
}
