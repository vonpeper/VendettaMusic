"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function addSubstituteAction(musicianProfileId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const whatsapp = formData.get("whatsapp") as string
    const ratingStr = formData.get("rating") as string
    const rating = ratingStr ? parseInt(ratingStr, 10) : 3

    if (!name || !whatsapp) {
      return { success: false, error: "Nombre y WhatsApp son obligatorios" }
    }

    await db.substitute.create({
      data: {
        musicianProfileId,
        name,
        whatsapp,
        rating
      }
    })

    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error: any) {
    console.error("Error adding substitute:", error)
    return { success: false, error: "Error al agregar el suplente" }
  }
}

export async function updateSubstituteAction(id: string, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const ratingStr = data.rating as string
    const rating = ratingStr ? parseInt(ratingStr, 10) : 3

    await db.substitute.update({
      where: { id },
      data: {
        name: data.name as string,
        whatsapp: (data.whatsapp as string),
        notes: (data.notes as string) || null,
        status: data.status as string || "active",
        availability: data.availability as string || "Disponible",
        rating
      }
    })

    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating substitute:", error)
    return { success: false, error: "Error al actualizar suplente" }
  }
}

export async function deleteSubstituteAction(id: string) {
  try {
    await db.substitute.delete({
      where: { id }
    })
    
    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting substitute:", error)
    return { success: false, error: "Error al eliminar el suplente" }
  }
}

import { writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

async function handleImageUpload(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uniqueSuffix = randomUUID() + path.extname(file.name)
    const relativePath = `/images/uploads/${uniqueSuffix}`
    const filepath = path.join(process.cwd(), "public", "images", "uploads", uniqueSuffix)
    
    await writeFile(filepath, buffer)
    return relativePath
  } catch (error) {
    console.error("Error saving image:", error)
    return null
  }
}

export async function createMusicianProfileAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const instrument = formData.get("instrument") as string
    const phone = formData.get("phone") as string
    const whatsapp = formData.get("whatsapp") as string
    const notes = formData.get("notes") as string
    const ratingStr = formData.get("rating") as string
    const imageFile = formData.get("image") as File

    const rating = ratingStr ? parseInt(ratingStr, 10) : 3

    if (!name || !instrument) {
      return { success: false, error: "Nombre e instrumento son obligatorios" }
    }

    const imageUrl = await handleImageUpload(imageFile)

    const dummyEmail = `staff_${Date.now()}@vendettadummy.com`
    
    const user = await db.user.create({
      data: {
        name,
        email: dummyEmail,
        role: "USER",
        image: imageUrl
      }
    })

    await db.musicianProfile.create({
      data: {
        userId: user.id,
        instrument,
        phone: phone || null,
        whatsapp: whatsapp || null,
        notes: notes || null,
        rating
      }
    })

    revalidatePath("/admin/banda")
    revalidatePath("/admin/ensayos")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating musician:", error)
    return { success: false, error: "Error al crear el personal/músico" }
  }
}

export async function updateMusicianProfileAction(id: string, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const imageFile = formData.get("image") as File
    const name = data.name as string

    let imageUrl: string | undefined = undefined
    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleImageUpload(imageFile) || undefined
    }

    const profile = await db.musicianProfile.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!profile) return { success: false, error: "Perfil no encontrado" }

    await db.musicianProfile.update({
      where: { id },
      data: {
        instrument: data.instrument as string,
        phone: (data.phone as string) || null,
        whatsapp: (data.whatsapp as string) || null,
        notes: (data.notes as string) || null,
        status: data.status as string || "active",
        availability: data.availability as string || "Disponible",
        rating: data.rating ? parseInt(data.rating as string, 10) : 3,
        user: {
          update: {
            name: name || profile.user.name,
            image: imageUrl || profile.user.image
          }
        }
      }
    })

    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating musician:", error)
    return { success: false, error: "Error al actualizar músico" }
  }
}

export async function deleteMusicianProfileAction(id: string) {
  try {
    const profile = await db.musicianProfile.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!profile) return { success: false, error: "Perfil no encontrado" }

    // Deleting the user will cascade delete the profile
    await db.user.delete({
      where: { id: profile.userId }
    })

    revalidatePath("/admin/banda")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting musician:", error)
    return { success: false, error: "Error al eliminar músico" }
  }
}
