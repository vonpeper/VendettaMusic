"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { writeFile, unlink } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function getMediaBySection(section: string) {
  return await db.siteMedia.findMany({
    where: { section }
  })
}

export async function uploadMedia(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const section = formData.get("section") as string
    const type = formData.get("type") as string || "image"

    if (!file || !section) return { success: false, error: "Faltan datos obligatorios" }

    // Generar nombre de archivo único
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uniqueSuffix = randomUUID() + path.extname(file.name)
    const filepath = path.join(process.cwd(), "public", "images", "uploads", uniqueSuffix)

    // Guardar en el filesystem local
    await writeFile(filepath, buffer)
    const url = `/images/uploads/${uniqueSuffix}`

    // Guardar en SQLite V12 (puente)
    // Si la seccion es "hero", "mentiras" o "arma_tu_show", debemos limpiar los anteriores para que sea el principal
    if (["hero", "mentiras", "arma_tu_show"].includes(section)) {
        await db.$executeRawUnsafe(`DELETE FROM SiteMedia WHERE section = ?`, section)
    }

    await db.siteMedia.create({
      data: {
        section,
        type,
        url,
        title: file.name
      }
    })

    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true, url }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteMedia(id: string) {
  try {
    const media = await db.siteMedia.findUnique({ where: { id } })
    if (!media) return { success: false, error: "Media no encontrada" }

    // Eliminar registro DB
    await db.siteMedia.delete({ where: { id } })

    // Eliminar archivo
    if (media.url.startsWith("/images/uploads/")) {
       const filepath = path.join(process.cwd(), "public", media.url)
       await unlink(filepath).catch(e => console.error("No se pudo borrar archivo físico:", e))
    }

    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveVideoLink(section: string, url: string) {
  try {
    await db.$executeRawUnsafe(`DELETE FROM SiteMedia WHERE section = ?`, section)
    await db.siteMedia.create({
      data: {
        section,
        type: "video",
        url,
        title: "Video Link"
      }
    })
    revalidatePath("/")
    revalidatePath("/admin/media")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
