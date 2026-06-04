
"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function signContractAction(bookingId: string, signatureBase64: string) {
  try {
    // 0. Verificar si ya fue firmado para evitar duplicados y múltiples alertas
    const existingBooking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      select: { clientSignature: true }
    })

    if (existingBooking?.clientSignature) {
      console.log(`[signContractAction] Booking ${bookingId} already signed. Skipping to prevent duplicate alerts.`)
      return { success: true, message: "Contrato firmado digitalmente con éxito." }
    }

    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "unknown"

    // 1. Obtener la firma del administrador (Vendetta) desde la configuración global
    const config = await db.globalConfig.findUnique({
      where: { id: "vendetta_config" }
    })

    // 2. Actualizar el BookingRequest con ambas firmas y metadatos
    const updatedBooking = await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        clientSignature: signatureBase64,
        adminSignature: config?.adminSignature || null,
        signedAt: new Date(),
        signedIp: ip,
        status: "agendado" // Aseguramos que pase a agendado si firma
      },
      include: {
        event: true
      }
    })

    // Sincronizar con el modelo de Contrato si existe
    if (updatedBooking.eventId) {
       // Buscar si ya existe un contrato para este evento
       const existingContract = await db.contract.findFirst({
         where: { eventId: updatedBooking.eventId }
       })

       if (existingContract) {
         await db.contract.update({
           where: { id: existingContract.id },
           data: { status: "signed" }
         })
       } else {
         await db.contract.create({
           data: {
             eventId: updatedBooking.eventId,
             status: "signed"
           }
         })
       }
    }

    // Alerta al Admin
    const { dispatchAdminAlert } = await import("@/lib/notifications")
    const { getAppUrl } = await import("@/lib/url")
    const appUrl = getAppUrl()
    await dispatchAdminAlert(`✅ *CONTRATO FIRMADO*\nEl cliente *${updatedBooking.clientName}* ha firmado el contrato para el evento del *${updatedBooking.requestedDate.toLocaleDateString("es-MX", { day: 'numeric', month: 'long' })}*.\n\nEl evento ya puede pasar a Confirmado. Revisa y cambia el estatus aquí:\n${appUrl}/admin/ventas/${updatedBooking.id}\n\nFolio: ${updatedBooking.shortId}`)

    revalidatePath(`/status/${updatedBooking.shortId}`)
    revalidatePath(`/admin/ventas/${bookingId}`)
    
    return { success: true, message: "Contrato firmado digitalmente con éxito." }
  } catch (error) {
    console.error("Error signing contract:", error)
    return { success: false, error: "Hubo un error al procesar tu firma. Intenta de nuevo." }
  }
}

export async function saveAdminSignatureAction(signatureBase64: string) {
  try {
    console.log(`[Signature Action] Saving admin signature. Length: ${signatureBase64.length}`)
    if (signatureBase64.length < 100) {
      console.warn("[Signature Action] Signature data seems too short or empty")
    }

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { adminSignature: signatureBase64 },
      create: { id: "vendetta_config", adminSignature: signatureBase64 }
    })
    
    revalidatePath("/admin/configuracion")
    return { success: true, message: "Firma de Vendetta actualizada correctamente." }
  } catch (error) {
    console.error("Error saving admin signature:", error)
    return { success: false, error: "Error al guardar la firma administrativa." }
  }
}
