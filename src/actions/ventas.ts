"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function markBookingAsCompleted(bookingId: string) {
  try {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { status: "completado" }
    })
    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error marking booking as completed:", error)
    return { success: false, error: "Error al completar el contrato." }
  }
}
