"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio").max(100),
  telefono: z.string().min(8, "Ingresa un teléfono válido").max(25),
  email: z.string().email("Ingresa un correo válido").max(100),
  fecha: z.string().optional(),
  tipo: z.string().optional(),
  mensaje: z.string().optional(),
})

/**
 * Registra una consulta de contacto pública exclusivamente como ContactInquiry (lead).
 * No crea User, ClientProfile, BookingRequest ni Event.
 */
export async function submitContactInquiry(formData: FormData) {
  try {
    const raw = {
      nombre: (formData.get("nombre") as string || "").trim(),
      telefono: (formData.get("telefono") as string || "").trim(),
      email: (formData.get("email") as string || "").trim().toLowerCase(),
      fecha: (formData.get("fecha") as string || "").trim() || undefined,
      tipo: (formData.get("tipo") as string || "").trim() || undefined,
      mensaje: (formData.get("mensaje") as string || "").trim() || undefined,
    }

    const val = contactSchema.parse(raw)
    const cleanPhone = val.telefono.replace(/\D/g, "")
    const last10 = cleanPhone.slice(-10)

    // Anti-spam: Evitar duplicados idénticos en los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentDuplicate = await db.contactInquiry.findFirst({
      where: {
        email: val.email,
        createdAt: { gte: fiveMinutesAgo }
      }
    })

    if (recentDuplicate) {
      return { success: true, inquiryId: recentDuplicate.id }
    }

    // Detectar si coincide con un cliente existente (solo guardar la referencia, sin crear nada)
    let matchedClientId: string | null = null
    if (last10.length === 10) {
      const matchByPhone = await db.clientProfile.findFirst({
        where: { whatsapp: { contains: last10 } }
      })
      if (matchByPhone) {
        matchedClientId = matchByPhone.id
      }
    }

    if (!matchedClientId && val.email) {
      const matchByUser = await db.user.findUnique({
        where: { email: val.email },
        include: { clientProfile: true }
      })
      if (matchByUser?.clientProfile) {
        matchedClientId = matchByUser.clientProfile.id
      }
    }

    let parsedDate: Date | null = null
    if (val.fecha) {
      const d = new Date(`${val.fecha}T12:00:00`)
      if (!isNaN(d.getTime())) {
        parsedDate = d
      }
    }

    const inquiry = await db.contactInquiry.create({
      data: {
        name: val.nombre,
        phone: val.telefono,
        email: val.email,
        requestedDate: parsedDate,
        eventType: val.tipo || null,
        message: val.mensaje || null,
        status: "new",
        matchedClientId
      }
    })

    return { success: true, inquiryId: inquiry.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al procesar el mensaje de contacto"
    return { success: false, error: message }
  }
}

/**
 * Convierte un ContactInquiry en una solicitud / cotización formal (BookingRequest)
 * Acción administrativa explícita e idempotente.
 */
export async function convertInquiryToBookingAction(inquiryId: string) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Se requiere sesión de administrador." }
    }

    const inquiry = await db.contactInquiry.findUnique({
      where: { id: inquiryId }
    })

    if (!inquiry) {
      return { success: false, error: "Prospecto no encontrado" }
    }

    // Idempotencia: Si ya fue convertido, retornar el ID existente
    if (inquiry.convertedBookingId) {
      const existing = await db.bookingRequest.findUnique({
        where: { id: inquiry.convertedBookingId }
      })
      if (existing) {
        return { success: true, bookingId: existing.id, shortId: existing.shortId }
      }
    }

    const shortId = "VND-" + crypto.randomBytes(2).toString("hex").toUpperCase()

    const booking = await db.$transaction(async (tx) => {
      const newBooking = await tx.bookingRequest.create({
        data: {
          shortId,
          clientName: inquiry.name,
          clientPhone: inquiry.phone || "",
          clientEmail: inquiry.email,
          packageName: inquiry.eventType || "Consulta General",
          venueType: "salon",
          address: "Por definir",
          city: "Toluca / CDMX",
          requestedDate: inquiry.requestedDate || new Date(),
          startTime: "21:00",
          endTime: "23:00",
          baseAmount: 0,
          depositAmount: 0,
          paymentMethod: "transfer",
          status: "pendiente",
          source: "contacto",
          adminNote: inquiry.message ? `Mensaje de contacto: ${inquiry.message}` : null,
          clientId: inquiry.matchedClientId,
          requiresManualQuote: true
        }
      })

      await tx.contactInquiry.update({
        where: { id: inquiryId },
        data: {
          status: "converted",
          convertedBookingId: newBooking.id
        }
      })

      return newBooking
    })

    revalidatePath("/admin/ventas")
    return { success: true, bookingId: booking.id, shortId: booking.shortId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al convertir el prospecto"
    return { success: false, error: message }
  }
}
