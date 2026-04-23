"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

function getMonthName(date: Date): string {
  return MONTHS[date.getMonth()]
}

const BandEventSchema = z.object({
  clientName:    z.string().min(1, "El nombre del cliente es obligatorio"),
  eventDate:     z.string().min(1, "La fecha es obligatoria"),
  baseIncome:    z.coerce.number().min(0).default(0),
  ivaAmount:     z.coerce.number().min(0).default(0),
  totalIncome:   z.coerce.number().min(0).default(0),
  eventType:     z.string().default("show"),
  status:        z.string().default("completado"),
  location:      z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentRef:    z.string().optional(),
  invoice:       z.coerce.boolean().default(false),
  notes:         z.string().optional(),
})

export async function createBandEventAction(prevState: any, formData: FormData) {
  try {
    const raw = {
      clientName:    formData.get("clientName"),
      eventDate:     formData.get("eventDate"),
      baseIncome:    formData.get("baseIncome"),
      ivaAmount:     formData.get("ivaAmount"),
      totalIncome:   formData.get("totalIncome"),
      eventType:     formData.get("eventType"),
      status:        formData.get("status"),
      location:      formData.get("location"),
      paymentMethod: formData.get("paymentMethod"),
      paymentRef:    formData.get("paymentRef"),
      invoice:       formData.get("invoice") === "on",
      notes:         formData.get("notes"),
    }

    const parsed = BandEventSchema.safeParse(raw)
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ")
      return { success: false, message: msg }
    }

    const data = parsed.data
    const date = new Date(data.eventDate + "T12:00:00")
    const base = data.baseIncome
    const iva  = data.ivaAmount
    const total = data.totalIncome > 0 ? data.totalIncome : base + iva

    await db.bandEvent.create({
      data: {
        eventDate:     date,
        eventMonth:    getMonthName(date),
        eventYear:     date.getFullYear(),
        clientName:    data.clientName,
        baseIncome:    base,
        ivaAmount:     iva,
        totalIncome:   total,
        eventType:     data.eventType,
        status:        data.status,
        location:      data.location,
        paymentMethod: data.paymentMethod,
        paymentRef:    data.paymentRef,
        invoice:       data.invoice,
        notes:         data.notes,
        source:        "manual",
      }
    })

    revalidatePath("/admin/eventualidades")
    return { success: true, message: "Evento registrado exitosamente." }
  } catch (error) {
    console.error("createBandEvent:", error)
    return { success: false, message: "Error interno al crear el evento." }
  }
}

export async function updateBandEventAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string
    if (!id) return { success: false, message: "ID inválido." }

    const raw = {
      clientName:    formData.get("customName") || formData.get("clientName"),
      eventDate:     formData.get("date") || formData.get("eventDate"),
      baseIncome:    formData.get("amount") || formData.get("baseIncome"),
      ivaAmount:     formData.get("ivaAmount"),
      totalIncome:   formData.get("totalIncome"),
      eventType:     formData.get("ceremonyType") || formData.get("eventType"),
      status:        formData.get("status"),
      location:      formData.get("locationFree") || formData.get("location"),
      paymentMethod: formData.get("depositMethod") || formData.get("paymentMethod"),
      paymentRef:    formData.get("paymentRef"),
      invoice:       formData.get("invoice") === "on",
      notes:         formData.get("musicianNotes") || formData.get("notes"),
    }

    const parsed = BandEventSchema.safeParse(raw)
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ")
      return { success: false, message: msg }
    }

    const data = parsed.data
    const date = new Date(data.eventDate + "T12:00:00")
    const base = data.baseIncome
    const iva  = data.ivaAmount
    const total = data.totalIncome > 0 ? data.totalIncome : base + iva

    await db.bandEvent.update({
      where: { id },
      data: {
        eventDate:     date,
        eventMonth:    getMonthName(date),
        eventYear:     date.getFullYear(),
        clientName:    data.clientName,
        baseIncome:    base,
        ivaAmount:     iva,
        totalIncome:   total,
        eventType:     data.eventType,
        status:        data.status,
        location:      data.location,
        paymentMethod: data.paymentMethod,
        paymentRef:    data.paymentRef,
        invoice:       data.invoice,
        notes:         data.notes,
      }
    })

    revalidatePath("/admin/eventualidades")
    return { success: true, message: "Evento actualizado correctamente." }
  } catch (error: any) {
    console.error("updateBandEvent:", error)
    return { success: false, message: `Error al actualizar: ${error?.message || "Error desconocido"}` }
  }
}

/**
 * Acción rápida para cambiar estatus en tabla legada
 */
export async function updateBandEventStatusAction(id: string, newStatus: string) {
  try {
    await db.bandEvent.update({
      where: { id },
      data: { status: newStatus }
    })
    revalidatePath("/admin/eventualidades")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating band event status:", error)
    return { success: false, error: `No se pudo actualizar: ${error?.message || "Error desconocido"}` }
  }
}

export async function deleteBandEventAction(id: string) {
  try {
    await db.bandEvent.delete({ where: { id } })
    revalidatePath("/admin/eventualidades")
    return { success: true }
  } catch (error) {
    console.error("deleteBandEvent:", error)
    return { success: false, message: "Error al eliminar el evento." }
  }
}
