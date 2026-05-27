"use server";

import { db } from "@/lib/db";
import { isValidWhatsappPhone } from "@/lib/phone";

export async function getSystemDiagnostics() {
  const activeBookings = await db.bookingRequest.findMany({
    where: {
      status: { notIn: ["completed", "cancelled", "completado"] }
    },
    include: {
      client: { include: { user: true } },
      event: { include: { location: true } }
    },
    orderBy: { requestedDate: "asc" }
  });

  return activeBookings.map(b => {
    const flags = [];
    if (!b.clientId) flags.push("Sin ClientProfile asignado");
    if (!isValidWhatsappPhone(b.clientPhone)) flags.push("Teléfono inválido/vacío en Booking");
    if (!b.eventId) flags.push("Sin Evento creado (solo Booking)");
    if (b.eventId && !b.event?.locationId) flags.push("Evento sin Venue/Ubicación oficial");
    if (b.packageName?.toLowerCase().includes("full") && (b.venueType?.toLowerCase().includes("bar") || b.packageName.toLowerCase().includes("bar"))) flags.push("Paquete Full en evento de Bar");

    return {
      id: b.id,
      clientName: b.clientName,
      requestedDate: b.requestedDate,
      flags,
      hasIssues: flags.length > 0
    };
  });
}

export async function autoFixBooking(bookingId: string, fixType: string, value?: string) {
  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId }});
  if (!booking) throw new Error("Booking no encontrado");

  // TODO: Add logic to fix specific issues
  return { success: true };
}

export async function bulkAutoFix() {
  // Find all orphans without location
  const bookings = await db.bookingRequest.findMany({
    where: { eventId: null, status: "scheduled" }
  });

  let count = 0;
  for (const b of bookings) {
    // Generate event
    const newEvent = await db.event.create({
      data: {
        date: b.requestedDate,
        amount: b.baseAmount,
        deposit: b.depositAmount,
        startTime: b.startTime,
        packageId: b.packageId,
        customName: b.clientName + " Event",
      }
    });
    
    await db.bookingRequest.update({
      where: { id: b.id },
      data: { eventId: newEvent.id }
    });
    count++;
  }
  return { fixed: count };
}
