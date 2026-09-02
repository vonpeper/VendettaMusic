"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"

const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio").max(100),
  telefono: z.string().min(8, "Ingresa un teléfono válido").max(20),
  email: z.string().email("Ingresa un correo válido").max(100),
  fecha: z.string().optional(),
  tipo: z.string().optional(),
  mensaje: z.string().optional(),
})

export async function submitContactInquiry(formData: FormData) {
  try {
    const raw = {
      nombre: (formData.get("nombre") as string || "").trim(),
      telefono: (formData.get("telefono") as string || "").trim(),
      email: (formData.get("email") as string || "").trim().toLowerCase(),
      fecha: formData.get("fecha") as string || undefined,
      tipo: (formData.get("tipo") as string || "").trim(),
      mensaje: (formData.get("mensaje") as string || "").trim(),
    }

    const val = contactSchema.parse(raw)
    const cleanPhone = val.telefono.replace(/\D/g, "")
    const last10 = cleanPhone.slice(-10)

    // Protección anti-spam: evitar crear solicitudes idénticas en los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentDuplicate = await db.bookingRequest.findFirst({
      where: {
        clientEmail: val.email,
        createdAt: { gte: fiveMinutesAgo }
      }
    })

    if (recentDuplicate) {
      return { success: true, shortId: recentDuplicate.shortId }
    }

    // Buscar si ya existe un cliente registrado previamente (sin crear uno nuevo)
    let existingClientId: string | null = null
    if (last10.length === 10) {
      const matchByPhone = await db.clientProfile.findFirst({
        where: { whatsapp: { contains: last10 } }
      })
      if (matchByPhone) {
        existingClientId = matchByPhone.id
      }
    }

    if (!existingClientId && val.email) {
      const matchByUser = await db.user.findUnique({
        where: { email: val.email },
        include: { clientProfile: true }
      })
      if (matchByUser?.clientProfile) {
        existingClientId = matchByUser.clientProfile.id
      }
    }

    const shortId = "VND-" + crypto.randomBytes(2).toString("hex").toUpperCase()
    
    // Almacenar como solicitud preliminar (lead) sin crear cuentas ni registros de evento definitivos
    await db.bookingRequest.create({
      data: {
        shortId,
        clientName: val.nombre,
        clientPhone: val.telefono,
        clientEmail: val.email,
        packageName: val.tipo || "Consulta General",
        venueType: "salon",
        address: "Por definir",
        city: "CDMX / Toluca",
        requestedDate: val.fecha ? new Date(`${val.fecha}T12:00:00`) : new Date(),
        startTime: "20:00",
        endTime: "22:00",
        baseAmount: 0,
        depositAmount: 0,
        paymentMethod: "transfer",
        status: "pendiente",
        source: "contacto",
        adminNote: val.mensaje ? `Mensaje de contacto web: ${val.mensaje}` : "Consulta enviada desde formulario de contacto.",
        clientId: existingClientId,
        requiresManualQuote: true
      }
    })

    return { success: true, shortId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al procesar la solicitud"
    return { success: false, error: message }
  }
}
