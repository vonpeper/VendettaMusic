"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getReviewsAction() {
  try {
    const reviews = await db.review.findMany({
      orderBy: { createdAt: "desc" }
    })
    return { success: true, reviews }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return { success: false, error: "Failed to fetch reviews" }
  }
}

export async function updateReviewStatusAction(id: string, status: string) {
  try {
    await db.review.update({
      where: { id },
      data: { status }
    })
    revalidatePath("/")
    revalidatePath("/admin/testimoniales")
    return { success: true }
  } catch (error) {
    console.error("Error updating review status:", error)
    return { success: false, error: "Failed to update review status" }
  }
}

export async function deleteReviewAction(id: string) {
  try {
    await db.review.delete({
      where: { id }
    })
    revalidatePath("/")
    revalidatePath("/admin/testimoniales")
    return { success: true }
  } catch (error) {
    console.error("Error deleting review:", error)
    return { success: false, error: "Failed to delete review" }
  }
}
