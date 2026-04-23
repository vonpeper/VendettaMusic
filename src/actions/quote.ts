"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createQuoteAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "No autenticado" }
  }

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id }
  })
  
  if (!profile) {
    return { success: false, message: "Perfil de cliente no encontrado" }
  }

  const packageId = formData.get("packageId") as string
  const eventDate = formData.get("eventDate") as string
  const guests = parseInt(formData.get("guests") as string || "0")
  const ceremonyType = formData.get("ceremonyType") as string
  const notes = formData.get("notes") as string

  if (!packageId || !eventDate) {
    return { success: false, message: "Faltan datos requeridos (Paquete o Fecha)" }
  }

  try {
    const pkg = await db.package.findUnique({ where: { id: packageId } })
    if (!pkg) return { success: false, message: "Paquete inválido" }

    const estimatedCost = pkg.baseCostPerHour * pkg.minDuration

    await db.quote.create({
      data: {
        clientId: profile.id,
        eventDate: new Date(eventDate),
        guestCount: guests,
        ceremonyType: ceremonyType,
        notes: notes,
        totalEstimated: estimatedCost,
        status: "pendiente",
        items: {
          create: [
            {
              description: `Paquete Base: ${pkg.name} (${pkg.minDuration} horas)`,
              quantity: 1,
              unitCost: estimatedCost
            }
          ]
        }
      }
    })
  } catch (error) {
    console.error("Error creating quote:", error)
    return { success: false, message: "Error interno al crear cotización" }
  }

  revalidatePath("/cliente")
  redirect("/cliente?quote_success=1")
}
