"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function submitReviewAction(formData: FormData) {
  const name = formData.get("name")?.toString() || ""
  const text = formData.get("text")?.toString() || ""
  const starsStr = formData.get("stars")?.toString() || "5"
  
  if (!name.trim() || !text.trim()) {
    return { error: "Name and text are required" }
  }

  const stars = parseInt(starsStr) || 5

  try {
    await db.review.create({
      data: {
        name,
        text,
        stars,
        status: "pending" // Requiere aprobación del admin
      }
    })
    
    revalidatePath("/") // Refresca el home
    return { success: true }
  } catch (error) {
    console.error("Error submitting review:", error)
    return { error: "Failed to submit review" }
  }
}
