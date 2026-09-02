import { Prisma } from "@prisma/client"
import { calculateQuoteTotals, AdditionalLineItem } from "./pricing"
import { findOrCreateClient } from "./clients"
import { findOrCreateLocation } from "./locations"
import { generateUniqueShortId } from "./folios"

export interface CreateQuoteInput {
  clientId?: string | null
  clientName: string
  clientPhone?: string | null
  clientEmail?: string | null
  clientCity?: string | null

  customName?: string | null
  ceremonyType?: string | null
  eventDate: string // YYYY-MM-DD
  startTime?: string | null
  endTime?: string | null
  arrivalTime?: string | null
  setupTime?: string | null
  guestCount?: number
  dressCode?: string | null
  status?: "pendiente" | "agendado" | "completado" | "cancelado"
  musicianNotes?: string | null
  audioEngineer?: string | null

  locationId?: string | null
  venueName?: string | null
  venueAddress?: string | null
  venueCity?: string | null
  venueState?: string | null
  mapsLink?: string | null

  packageId?: string | null
  packageName?: string | null
  basePrice: number
  viaticosAmount?: number | null
  discountAmount?: number | null
  additionalItems?: Array<{
    id?: string
    description: string
    quantity: number
    unitCost: number
    order?: number
  }>
  invoice?: boolean
  depositAmount?: number | null
  paymentMethod?: string | null
  originInquiryId?: string | null
}

export interface UpdateQuoteInput extends CreateQuoteInput {
  targetId: string
}

/**
 * Servicio de dominio para crear una cotización / evento unificado dentro de una transacción Prisma.
 * Es completamente independiente de la capa HTTP y es utilizado directamente por Server Actions y pruebas.
 */
export async function createUnifiedQuote(
  tx: Prisma.TransactionClient,
  input: CreateQuoteInput
) {
  const dateObj = new Date(`${input.eventDate}T12:00:00`)
  if (isNaN(dateObj.getTime())) {
    throw new Error("Fecha del evento inválida")
  }

  // 1. Cálculo canónico de totales y validación de anticipo
  const totals = calculateQuoteTotals({
    basePrice: input.basePrice,
    viaticosAmount: input.viaticosAmount,
    discountAmount: input.discountAmount,
    additionalItems: (input.additionalItems || []) as AdditionalLineItem[],
    invoice: Boolean(input.invoice),
    depositAmount: input.depositAmount
  })

  if (totals.depositExceedsTotal) {
    throw new Error(
      (input.depositAmount || 0) < 0
        ? "El anticipo solicitado no puede ser negativo"
        : "El anticipo solicitado no puede superar el total del evento"
    )
  }

  // 2. Resolver o registrar Cliente
  let finalClientId = input.clientId || null
  if (!finalClientId && input.clientName) {
    finalClientId = await findOrCreateClient({
      name: input.clientName,
      email: input.clientEmail || null,
      whatsapp: input.clientPhone || null,
      city: input.clientCity || null
    }, tx)
  }

  // 3. Resolver o registrar Venue / Ubicación
  let finalLocationId = input.locationId || null
  if (!finalLocationId && input.venueName) {
    finalLocationId = await findOrCreateLocation({
      name: input.venueName,
      address: input.venueAddress || input.venueName,
      city: input.venueCity || null,
      state: input.venueState || "México",
      mapsLink: input.mapsLink || null
    }, tx)
  }

  // 4. Generar Folio Criptográficamente Seguro (80 bits de entropía)
  const shortId = await generateUniqueShortId(tx)

  // 5. Crear Evento ÚNICAMENTE si el estatus es 'agendado' o 'completado'.
  // Si es 'pendiente', NO se crea ningún Event en base de datos.
  let createdEventId: string | null = null
  const quoteStatus = input.status || "pendiente"

  if (quoteStatus === "agendado" || quoteStatus === "completado") {
    const newEvent = await tx.event.create({
      data: {
        customName: input.customName || `Evento ${input.clientName}`,
        ceremonyType: input.ceremonyType || "boda",
        date: dateObj,
        startTime: input.startTime || "",
        performanceStart: input.startTime || "",
        performanceEnd: input.endTime || "",
        arrivalTime: input.arrivalTime || null,
        setupTime: input.setupTime || null,
        guestCount: input.guestCount || 0,
        dressCode: input.dressCode || "",
        musicianNotes: input.musicianNotes || null,
        audioEngineer: input.audioEngineer || null,
        package: input.packageId ? { connect: { id: input.packageId } } : undefined,
        location: finalLocationId ? { connect: { id: finalLocationId } } : undefined,
        client: finalClientId ? { connect: { id: finalClientId } } : undefined,
        amount: totals.subtotal,
        deposit: totals.depositAmount,
        balance: totals.balanceAmount,
        ivaAmount: totals.ivaAmount,
        totalWithTax: totals.totalAmount,
        totalIncome: 0,
        invoice: Boolean(input.invoice),
        status: quoteStatus === "completado" ? "completado" : "scheduled",
        mapsLink: input.mapsLink || null,
        source: "admin"
      }
    })
    createdEventId = newEvent.id
  }

  // 6. Crear Registro de Cotización (BookingRequest)
  const newBooking = await tx.bookingRequest.create({
    data: {
      shortId,
      clientName: input.clientName,
      clientPhone: input.clientPhone || "",
      clientEmail: input.clientEmail || null,
      clientId: finalClientId || null,
      customName: input.customName || null,
      ceremonyType: input.ceremonyType || "",
      requestedDate: dateObj,
      startTime: input.startTime || "",
      endTime: input.endTime || "",
      arrivalTime: input.arrivalTime || null,
      setupTime: input.setupTime || null,
      guestCount: input.guestCount || 0,
      dressCode: input.dressCode || "",
      musicianNotes: input.musicianNotes || null,
      venueType: input.venueName ? "custom" : "",
      packageId: input.packageId || null,
      packageName: input.packageName || "",
      baseAmount: totals.basePrice,
      viaticosAmount: totals.viaticosAmount,
      discountAmount: totals.discountAmount,
      invoice: Boolean(input.invoice),
      depositAmount: totals.depositAmount,
      paymentMethod: input.paymentMethod || "",
      paymentStatus: "pending",
      address: input.venueAddress || input.venueName || "",
      city: input.venueCity || "",
      state: input.venueState || "",
      mapsLink: input.mapsLink || null,
      status: quoteStatus,
      eventId: createdEventId,
      source: input.originInquiryId ? "contacto" : "admin"
    }
  })

  // 7. Guardar Conceptos Adicionales en BookingLineItem
  if (input.additionalItems && input.additionalItems.length > 0) {
    await tx.bookingLineItem.createMany({
      data: input.additionalItems.map((item, idx) => ({
        bookingRequestId: newBooking.id,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineTotal: item.quantity * item.unitCost,
        order: item.order ?? idx
      }))
    })
  }

  // 8. Vincular ContactInquiry si proviene de una conversión
  if (input.originInquiryId) {
    await tx.contactInquiry.update({
      where: { id: input.originInquiryId },
      data: {
        status: "converted",
        convertedBookingId: newBooking.id
      }
    })
  }

  return {
    bookingId: newBooking.id,
    eventId: createdEventId,
    shortId
  }
}

/**
 * Convierte explícitamente una cotización existente en un evento agendado de forma idempotente.
 */
export async function convertQuoteToEvent(
  tx: Prisma.TransactionClient,
  bookingId: string
) {
  const booking = await tx.bookingRequest.findUnique({
    where: { id: bookingId }
  })

  if (!booking) {
    throw new Error("Cotización no encontrada")
  }

  // Idempotencia: Si ya tiene un evento vinculado, retornar ese evento
  if (booking.eventId) {
    const existingEvent = await tx.event.findUnique({
      where: { id: booking.eventId }
    })
    if (existingEvent) {
      return { eventId: existingEvent.id, isNew: false }
    }
  }

  // Crear nuevo Evento
  const newEvent = await tx.event.create({
    data: {
      customName: booking.customName || `Evento ${booking.clientName}`,
      ceremonyType: booking.ceremonyType || "boda",
      date: booking.requestedDate,
      startTime: booking.startTime || "",
      performanceStart: booking.startTime || "",
      performanceEnd: booking.endTime || "",
      arrivalTime: booking.arrivalTime || null,
      setupTime: booking.setupTime || null,
      guestCount: booking.guestCount || 0,
      dressCode: booking.dressCode || "",
      musicianNotes: booking.musicianNotes || null,
      package: booking.packageId ? { connect: { id: booking.packageId } } : undefined,
      client: booking.clientId ? { connect: { id: booking.clientId } } : undefined,
      amount: booking.baseAmount + (booking.viaticosAmount || 0) - (booking.discountAmount || 0),
      deposit: booking.depositAmount,
      balance: Math.max(0, (booking.baseAmount + (booking.viaticosAmount || 0) - (booking.discountAmount || 0)) - booking.depositAmount),
      totalWithTax: booking.baseAmount + (booking.viaticosAmount || 0) - (booking.discountAmount || 0),
      totalIncome: 0,
      invoice: booking.invoice,
      status: "scheduled",
      source: booking.source || "admin"
    }
  })

  // Vincular a BookingRequest
  await tx.bookingRequest.update({
    where: { id: bookingId },
    data: {
      eventId: newEvent.id,
      status: "agendado"
    }
  })

  return { eventId: newEvent.id, isNew: true }
}
