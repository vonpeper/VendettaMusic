import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { findOrCreateClient } from "@/lib/clients"
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
      requestedDate, startTime, endTime,
      packageId, baseAmount, depositAmount,
      paymentMethod, adminNote,
      calle, numero, colonia, municipio, state,
      venueType, mapsLink, isPublic,
      depositConfirmed, clientProvidesAudio,
      locationId // Capturamos locationId si viene del catálogo
    } = data
    
    // Safeguards for numeric fields
    const normalizedBaseAmount = Number(baseAmount) || 0
    const normalizedDepositAmount = Number(depositAmount) || 0

    // Obtener nombre del paquete si no es manual
    let packageName = "Paquete Personalizado"
    if (packageId !== "manual-arma") {
      const pkg = await db.package.findUnique({ where: { id: packageId } })
      if (pkg) packageName = pkg.name
    }

    // Generar IDs manualmente para evitar fallos del conector custom
    const bookingId = crypto.randomUUID()
    const eventId = crypto.randomUUID()
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
    const shortId = `VND-${randomHex}`

    // Sincronizar cliente (email ya es opcional aquí)
    const clientId = await findOrCreateClient({
      name: clientName,
      email: clientEmail || null,
      phone: clientPhone,
      city: municipio,
      state: state
    })

    // Definir estado inicial
    const computedStatus = depositConfirmed ? "agendado" : "pendiente"

    // Date Handling - Robust parsing
    let dateStr = requestedDate
    if (dateStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("/")
      dateStr = `${y}-${m}-${d}`
    }

    const dateObj = new Date(`${dateStr}T12:00:00`)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ success: false, error: `Fecha inválida: ${requestedDate}` }, { status: 400 })
    }

    // Crear BookingRequest
    const booking = await db.bookingRequest.create({
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
        status: computedStatus || "pending",
        source: "manual"
      }
    })

    // Si está confirmado por anticipo, crear el Evento inmediatamente para que salga en Agenda/Shows
    if (depositConfirmed) {
      await db.event.create({
        data: {
          id:               eventId,
          date:             dateObj,
          guestCount:       Number(data.guestCount) || 0,
          performanceStart: startTime || "21:00",
          performanceEnd:   endTime || "23:00",
          amount:           normalizedBaseAmount,
          deposit:          normalizedDepositAmount,
          balance:          normalizedBaseAmount - normalizedDepositAmount,
          depositMethod:    paymentMethod,
          status:           "agendado",
          venueType:        venueType || "salon",
          mapsLink:         mapsLink || null,
          ceremonyType:     venueType || "salon",
          clientId:         clientId,
          locationId:       locationId || null,
          isPublic:         Boolean(isPublic),
          clientProvidesAudio: Boolean(clientProvidesAudio),
        }
      })

      // Vincular el evento a la reserva
      await db.bookingRequest.update({
        where: { id: bookingId },
        data: { eventId: eventId }
      })
    }

    return NextResponse.json({ success: true, id: bookingId, shortId, status: computedStatus })
  } catch (error: any) {
    console.error("POST /api/admin/booking-manual ERROR:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error desconocido en el servidor",
      details: error.stack 
    }, { status: 500 })
  }
}
