import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { findOrCreateClient } from "@/lib/clients"
import { findOrCreateLocation } from "@/lib/locations"
import { assignDefaultMusicians } from "@/lib/musicians"
import crypto from "crypto"
import { auth } from "@/lib/auth"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const {
      clientName, clientPhone, clientEmail,
      requestedDate, requestedDates, startTime, endTime,
      packageId, baseAmount, depositAmount,
      paymentMethod, adminNote,
      calle, numero, colonia, municipio, state,
      venueType, mapsLink, isPublic,
      depositConfirmed, clientProvidesAudio,
      locationId, venueName, venuePhone,
      bandHours, djHours, isDjWithTvs, hasTemplete, hasPista, hasRobot,
      originalPrice, discountAmount, viaticosAmount, invoice,
      distanceKm, durationSec, tollCost, fuelCost, requiresManualQuote,
      customName, ceremonyType, arrivalTime, setupTime, dressCode, musicianNotes
    } = data
    
    // Safeguards for numeric fields
    const normalizedBaseAmount = Number(baseAmount) || 0
    const normalizedDepositAmount = Number(depositAmount) || 0

    // Normalizar fechas a procesar
    let datesToProcess: string[] = []
    if (Array.isArray(requestedDates) && requestedDates.length > 0) {
      datesToProcess = requestedDates
    } else if (requestedDate) {
      datesToProcess = [requestedDate]
    }

    if (datesToProcess.length === 0) {
      return NextResponse.json({ success: false, error: "No se proporcionaron fechas válidas" }, { status: 400 })
    }

    // Obtener nombre del paquete si no es manual
    let packageName = "Paquete Personalizado"
    if (packageId !== "manual-arma") {
      const pkg = await db.package.findUnique({ where: { id: packageId } })
      if (pkg) packageName = pkg.name
    }

    // Sincronizar cliente (email ya es opcional aquí) - Se hace una sola vez
    const clientId = await findOrCreateClient({
      name: clientName,
      email: clientEmail || null,
      whatsapp: clientPhone,
      city: municipio,
      state: state
    })

    // Definir estado inicial
    const computedStatus = depositConfirmed ? "agendado" : "pendiente"

    // --- Asegurar que el Lugar (Location) esté en el catálogo --- Se hace una sola vez
    let finalLocationId = locationId
    if (!finalLocationId && calle) {
      const cleanVenueName = (venueName && venueName.trim() !== "") ? venueName.trim() : ""
      const isPlaceholderName = ["essential", "festival premium", "experience", "premium", "show", "sin nombre", "por definir", "no especificada", "no especificado"].includes(cleanVenueName.toLowerCase())
      
      const locName = (cleanVenueName !== "" && !isPlaceholderName) 
        ? cleanVenueName 
        : `Show - ${clientName} (Manual)`

      finalLocationId = await findOrCreateLocation({
        name: locName,
        address: `${calle} ${numero || ""}, ${colonia || ""}`.trim(),
        city: municipio,
        state: state,
        mapsLink: mapsLink
      })

      // Si tenemos teléfono del lugar, actualizarlo en la locación
      if (venuePhone && finalLocationId) {
        await db.location.update({
          where: { id: finalLocationId },
          data: { phone: venuePhone }
        }).catch(() => {})
      }
    }

    const createdBookings = []

    for (const rawDate of datesToProcess) {
      // Date Handling - Robust parsing
      let dateStr = rawDate
      if (dateStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split("/")
        dateStr = `${y}-${m}-${d}`
      }

      const dateObj = new Date(`${dateStr}T12:00:00`)
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ success: false, error: `Fecha inválida: ${rawDate}` }, { status: 400 })
      }

      // Generar IDs manualmente para evitar fallos del conector custom
      const bookingId = crypto.randomUUID()
      const eventId = crypto.randomUUID()
      const quoteId = crypto.randomUUID()
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
      const shortId = `VND-${randomHex}`

      // --- Crear Cotización (Quote) ---
      await db.quote.create({
        data: {
          id: quoteId,
          clientId,
          status: computedStatus,
          totalEstimated: normalizedBaseAmount,
          guestCount: Number(data.guestCount) || 0,
          ceremonyType: venueType || "show",
          notes: adminNote || "",
          eventDate: dateObj,
          items: {
            create: [
              {
                description: `Cotización Manual: ${packageName}`,
                quantity: 1,
                unitCost: normalizedBaseAmount
              }
            ]
          }
        }
      })

      // Crear BookingRequest
      await db.bookingRequest.create({
        data: {
          id: bookingId,
          shortId,
          clientName,
          clientPhone,
          clientEmail: clientEmail || "",
          clientId,
          requestedDate: dateObj,
          startTime: startTime || "21:00",
          endTime: endTime || "23:00",
          packageName,
          packageId: packageId === "manual-arma" ? null : packageId,
          baseAmount: normalizedBaseAmount,
          depositAmount: normalizedDepositAmount,
          paymentMethod: paymentMethod || "transfer",
          adminNote: adminNote || "",
          calle: calle || "",
          numero: numero || "",
          colonia: colonia || "",
          municipio: municipio || "",
          city: municipio || "Desconocida",
          state: state || "México",
          address: `${calle || ""} ${numero || ""}, ${colonia || ""}, ${municipio || ""}`.trim() || "Dirección no especificada",
          venueType: venueType || "salon",
          isPublic: Boolean(isPublic),
          clientProvidesAudio: Boolean(clientProvidesAudio),
          mapsLink: mapsLink || null,
          status: computedStatus || "pendiente",
          source: "manual",
          bandHours: parseInt(bandHours) || 2,
          djHours: parseInt(djHours) || 0,
          isDjWithTvs: Boolean(isDjWithTvs),
          hasTemplete: Boolean(hasTemplete),
          hasPista: Boolean(hasPista),
          hasRobot: Boolean(hasRobot),
          originalPrice: parseFloat(originalPrice) || 0,
          discountAmount: parseFloat(discountAmount) || 0,
          viaticosAmount: parseFloat(viaticosAmount) || 0,
          distanceKm: parseFloat(distanceKm) || null,
          durationSec: parseInt(durationSec) || null,
          tollCost: parseFloat(tollCost) || null,
          fuelCost: parseFloat(fuelCost) || null,
          requiresManualQuote: Boolean(requiresManualQuote),
          invoice: Boolean(invoice),
          customName: customName || null,
          ceremonyType: ceremonyType || null,
          arrivalTime: arrivalTime || null,
          setupTime: setupTime || null,
          dressCode: dressCode || null,
          musicianNotes: musicianNotes || null,
        }
      })

      // Si está confirmado por anticipo, crear el Evento inmediatamente para que salga en Agenda/Shows
      if (depositConfirmed) {
        await db.event.create({
          data: {
            id:               eventId,
            quoteId:          quoteId,
            date:             dateObj,
            guestCount:       Number(data.guestCount) || 0,
            startTime:        startTime || "21:00",
            performanceStart: startTime || "21:00",
            performanceEnd:   endTime || "23:00",
            amount:           normalizedBaseAmount,
            deposit:          normalizedDepositAmount,
            balance:          normalizedBaseAmount - normalizedDepositAmount,
            depositMethod:    paymentMethod,
            status:           "agendado",
            venueType:        venueType || "salon",
            mapsLink:         mapsLink || null,
            ceremonyType:     ceremonyType || venueType || "show",
            totalIncome:      normalizedBaseAmount,
            clientId:         clientId,
            locationId:       finalLocationId || null,
            isPublic:         Boolean(isPublic),
            clientProvidesAudio: Boolean(clientProvidesAudio),
            setupTime:        setupTime || null,
            arrivalTime:      arrivalTime || null,
            dressCode:        dressCode || null,
            customName:       customName || null,
            musicianNotes:    musicianNotes || adminNote || null,
            invoice:          Boolean(invoice),
            ivaAmount:        Boolean(invoice) ? Math.round((normalizedBaseAmount + (parseFloat(viaticosAmount) || 0)) * 0.16 * 100) / 100 : 0,
          }
        })

        // Vincular el evento a la reserva
        await db.bookingRequest.update({
          where: { id: bookingId },
          data: { eventId: eventId }
        })

        // Asignar automáticamente los músicos titulares
        await assignDefaultMusicians(eventId, db)

        // Sincronizar automáticamente con Google Calendar
        const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
        syncEventToGoogleCalendar(eventId).catch(e => console.error("Error syncing event to Google Calendar:", e))
      }

      createdBookings.push({ id: bookingId, shortId })
    }

    return NextResponse.json({ 
      success: true, 
      count: createdBookings.length, 
      bookings: createdBookings, 
      status: computedStatus 
    })
  } catch (error: any) {
    console.error("POST /api/admin/booking-manual ERROR:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error desconocido en el servidor",
      details: error.stack 
    }, { status: 500 })
  }
}
