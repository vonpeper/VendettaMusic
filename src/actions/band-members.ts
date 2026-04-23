"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const BandMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  emoji: z.string(),
  img: z.string().min(1),
  shortBio: z.string(),
  fullBio: z.string(),
  ig: z.string().optional(),
  order: z.number().default(0)
})

export async function createBandMemberAction(formData: FormData) {
  try {
    const data = {
      name: formData.get("name")?.toString() || "",
      role: formData.get("role")?.toString() || "",
      emoji: formData.get("emoji")?.toString() || "🎸",
      img: formData.get("img")?.toString() || "/images/musicians/default.jpg",
      shortBio: formData.get("shortBio")?.toString() || "",
      fullBio: formData.get("fullBio")?.toString() || "",
      ig: formData.get("ig")?.toString() || "",
      order: Number(formData.get("order")) || 0
    }
    
    const valid = BandMemberSchema.parse(data)
    
    await db.publicBandMember.create({ data: valid })
    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { error: "Failed to create band member" }
  }
}

export async function updateBandMemberAction(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get("name")?.toString() || "",
      role: formData.get("role")?.toString() || "",
      emoji: formData.get("emoji")?.toString() || "🎸",
      img: formData.get("img")?.toString() || "/images/musicians/default.jpg",
      shortBio: formData.get("shortBio")?.toString() || "",
      fullBio: formData.get("fullBio")?.toString() || "",
      ig: formData.get("ig")?.toString() || "",
      order: Number(formData.get("order")) || 0
    }
    
    const valid = BandMemberSchema.parse(data)
    
    await db.publicBandMember.update({ where: { id }, data: valid })
    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { error: "Failed to update band member" }
  }
}

export async function deleteBandMemberAction(id: string) {
  try {
    await db.publicBandMember.delete({ where: { id } })
    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { error: "Failed to delete band member" }
  }
}
