"use server"

import { db } from "@/lib/db"
import { findOrCreateClient } from "@/lib/clients"
import { z } from "zod"

const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  telefono: z.string().min(8, "Ingresa un teléfono válido"),
  email: z.string().email("Ingresa un correo válido"),
  fecha: z.string().optional(),
  tipo: z.string().optional(),
  mensaje: z.string().optional(),
})

export async function submitContactInquiry(formData: FormData) {
  try {
    const raw = {
      nombre: formData.get("nombre") as string,
      telefono: formData.get("telefono") as string,
      email: formData.get("email") as string,
      fecha: formData.get("fecha") as string,
      tipo: formData.get("tipo") as string,
      mensaje: formData.get("mensaje") as string,
    }

    const val = contactSchema.parse(raw)
    
    const clientId = await findOrCreateClient({
      name: val.nombre,
      email: val.email,
      whatsapp: val.telefono,
      city: "CDMX / Toluca",
    })

    const shortId = "VND-" + Math.random().toString(36).substring(2, 7).toUpperCase()
    
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
        requestedDate: val.fecha ? new Date(val.fecha) : new Date(),
        startTime: "20:00",
        endTime: "22:00",
        baseAmount: 0,
        depositAmount: 0,
        paymentMethod: "transfer",
        status: "pendiente",
        adminNote: val.mensaje ? `Mensaje de contacto: ${val.mensaje}` : null,
        clientId,
        requiresManualQuote: true
      }
    })

    return { success: true, shortId }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al procesar la solicitud" }
  }
}
