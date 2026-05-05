"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function clearAllNotificationsAction() {
  const session = await auth()
  if (!session?.user || !["ADMIN"].includes(session.user.role as string)) {
    return { success: false, error: "No autorizado" }
  }

  try {
    await db.notification.deleteMany({})
    revalidatePath("/admin/notificaciones")
    return { success: true }
  } catch (error: any) {
    console.error("Error clearing notifications:", error)
    return { success: false, error: error.message }
  }
}
