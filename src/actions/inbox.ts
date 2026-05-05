"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateInboxItemStatus(id: string, status: string) {
  try {
    await db.inboxItem.update({
      where: { id },
      data: { status }
    })
    revalidatePath("/admin/inbox")
    return { success: true }
  } catch (error) {
    console.error("Error updating inbox item status:", error)
    return { success: false, error: "Error al actualizar el estado" }
  }
}

export async function updateInboxItemPriority(id: string, priority: string) {
  try {
    await db.inboxItem.update({
      where: { id },
      data: { priority }
    })
    revalidatePath("/admin/inbox")
    return { success: true }
  } catch (error) {
    console.error("Error updating inbox item priority:", error)
    return { success: false, error: "Error al actualizar la prioridad" }
  }
}

export async function assignInboxItem(id: string, userId: string | null) {
  try {
    await db.inboxItem.update({
      where: { id },
      data: { assignedTo: userId }
    })
    revalidatePath("/admin/inbox")
    return { success: true }
  } catch (error) {
    console.error("Error assigning inbox item:", error)
    return { success: false, error: "Error al asignar el mensaje" }
  }
}

export async function deleteInboxItem(id: string) {
  try {
    await db.inboxItem.delete({
      where: { id }
    })
    revalidatePath("/admin/inbox")
    return { success: true }
  } catch (error) {
    console.error("Error deleting inbox item:", error)
    return { success: false, error: "Error al eliminar el mensaje" }
  }
}
