import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { buildGigMessage, sendWhatsApp } from "@/lib/notifications"
import { calcularViatcos } from "@/lib/viaticos"
import { findOrCreateClient } from "@/lib/clients"
import { formatDateMX } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      packageId, packageName, guestCount, venueType,
      address, city, state, mapsLink,
      requestedDate, startTime, endTime,
      baseAmount, depositAmount, paymentMethod,
      clientName, clientPhone, clientEmail,
      isPublic, clientProvidesAudio
    } = body

    // 1. Generar Short ID amigable
    const shortId = `VND-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Calcular viáticos
    const viaticos = calcularViatcos(city, state)

    console.log("📝 Intentando crear booking con data:", {
      packageName, clientName, shortId, city
    })

    // Crear BookingRequest
    const cleanDate = new Date(`${requestedDate}T12:00:00`)
    if (isNaN(cleanDate.getTime())) {
      throw new Error(`Fecha inválida recibida: ${requestedDate}`)
    }

    // 2. Sincronizar o crear cliente
    const clientId = await findOrCreateClient({
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      city: city,
      state: state
    })

    const booking = await db.bookingRequest.create({
      data: {
        shortId,
        packageId:     packageId || null,
        packageName:   packageName || "Sin Nombre",
        guestCount:    parseInt(guestCount) || 0,
        venueType:     venueType || "salon",
        calle:         body.street || null,
        numero:        body.houseNumber || null,
        colonia:       body.colonia || null,
        municipio:     body.municipio || city,
        address:       address || "No especificada",
        city:          city || "No especificada",
        state:         state || "México",
        isOutsideZone: Boolean(viaticos.isOutsideZone),
        viaticosAmount: parseFloat(viaticos.amount) || 0,
        mapsLink:      mapsLink || null,
        requestedDate: cleanDate,
        startTime:     startTime || "21:00",
        endTime:       endTime || "23:00",
        baseAmount:    parseFloat(baseAmount) || 0,
        depositAmount: parseFloat(depositAmount) || 0,
        paymentMethod: paymentMethod || "transfer",
        paymentStatus: "pending",
        clientName:    clientName || "ClienteAnónimo",
        clientPhone:   clientPhone || "",
        clientEmail:   clientEmail || null,
        clientId,
        isPublic:      Boolean(isPublic),
        clientProvidesAudio: Boolean(clientProvidesAudio),
        status:        "pendiente", // Nuevo estándar: pendiente
      }
    })

    console.log("✅ Booking creado exitosamente:", booking.id, "shortId:", shortId)

    // 4. Intentar enviar WhatsApp al admin (pero NO bloquear la respuesta si falla)
    const adminMessage = `🎸 *NUEVO PEDIDO — VENDETTA* 🎸
ID Seguimiento: ${shortId}

👤 *Cliente:* ${clientName}
📞 *Tel:* ${clientPhone}
📧 ${clientEmail}

📅 *Fecha:* ${formatDateMX(cleanDate, "EEEE, d 'de' MMMM")}
⏰ *Horario:* ${startTime} — ${endTime} hrs
📦 *Paquete:* ${packageName}
📍 *Ubicación:* ${body.street || ""} ${body.houseNumber || ""}, ${body.colonia || ""}, ${city}

✅ Verifica en: http://localhost:3005/admin/bookings/${booking.id}`

    try {
      const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER
      if (adminPhone) {
        const sid = await sendWhatsApp(adminPhone, adminMessage)
        if (sid) {
          await db.bookingRequest.update({
            where: { id: booking.id },
            data: { notifiedAdmin: true }
          }).catch(() => {})
        }
      }
    } catch (notifyErr) {
      console.error("⚠️ Error silencioso enviando notificación:", notifyErr)
    }

    return NextResponse.json({
      success:   true,
      bookingId: booking.id,
      shortId:   shortId,
      adminWhatsappUrl: `https://wa.me/${(process.env.ADMIN_WHATSAPP_NUMBER_RAW ?? "521XXXXXXXXXX").replace(/\D/g, "")}?text=${encodeURIComponent(adminMessage)}`
    })
  } catch (error) {
    console.error("POST /api/booking:", error)
    return NextResponse.json({ success: false, error: "Error al crear el booking." }, { status: 500 })
  }
}

// Confirmar booking (llamado desde admin)
export async function PATCH(req: NextRequest) {
  try {
    const { bookingId, action, adminNote } = await req.json()

    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (action === "confirm") {
      // 1. Crear o Vincular Lugar (Location)
      const { findOrCreateLocation } = await import("@/lib/locations")
      const locationId = await findOrCreateLocation({
        name:     booking.packageName || "Lugar del Evento",
        address:  `${booking.calle || ""} ${booking.numero || ""}`.trim() || booking.address,
        colonia:  booking.colonia,
        municipio: booking.municipio || booking.city,
        city:      booking.city,
        state:     booking.state,
        mapsLink:  booking.mapsLink
      })

      // 2. Actualizar status del booking
      await db.bookingRequest.update({
        where: { id: bookingId },
        data:  { status: "agendado", adminNote: adminNote || null } // Nuevo estándar: agendado
      })

      // 3. Crear Event automáticamente
      const event = await db.event.create({
        data: {
          date:             booking.requestedDate,
          guestCount:       booking.guestCount,
          performanceStart: booking.startTime,
          performanceEnd:   booking.endTime,
          amount:           booking.baseAmount,
          deposit:          booking.depositAmount,
          balance:          booking.baseAmount - booking.depositAmount,
          depositMethod:    booking.paymentMethod,
          status:           "agendado", // Nuevo estándar: agendado
          venueType:        booking.venueType,
          mapsLink:         booking.mapsLink,
          ceremonyType:     booking.venueType,
          clientId:         booking.clientId,
          locationId:       locationId, // Vínculo real al catálogo
          isPublic:         booking.isPublic,
          clientProvidesAudio: booking.clientProvidesAudio,
          source:           "funnel"
        }
      })

      // 4. Actualizar booking con el eventId
      await db.bookingRequest.update({
        where: { id: bookingId },
        data:  { eventId: event.id }
      })

      // 5. Notificar a los músicos
      const gig = {
        clientName:       booking.clientName,
        date:             booking.requestedDate,
        guestCount:       booking.guestCount,
        locationName:     booking.municipio || booking.city,
        locationAddress:  booking.address,
        performanceStart: booking.startTime,
        performanceEnd:   booking.endTime,
        packageName:      booking.packageName,
        isPublic:         booking.isPublic,
      }
      await notifyMusiciansFunnel(event.id, gig)

      return NextResponse.json({ success: true, eventId: event.id })
    }

      await db.bookingRequest.update({
        where: { id: bookingId },
        data:  { status: "cancelado", adminNote: adminNote || null }
      })

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("PATCH /api/booking:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// Actualizar campos de la cotización
export async function PUT(req: NextRequest) {
  try {
    const { bookingId, ...updates } = await req.json()

    // 1. Limpiar data de entrada
    const dataToUpdate: any = {}
    if (updates.packageName)   dataToUpdate.packageName   = updates.packageName
    if (updates.guestCount)    dataToUpdate.guestCount    = parseInt(updates.guestCount)
    if (updates.venueType)     dataToUpdate.venueType     = updates.venueType
    if (updates.address)       dataToUpdate.address       = updates.address
    if (updates.city)          dataToUpdate.city          = updates.city
    if (updates.mapsLink)      dataToUpdate.mapsLink      = updates.mapsLink
    if (updates.requestedDate) dataToUpdate.requestedDate = new Date(`${updates.requestedDate}T12:00:00`)
    if (updates.isPublic !== undefined) dataToUpdate.isPublic = Boolean(updates.isPublic)
    if (updates.clientProvidesAudio !== undefined) dataToUpdate.clientProvidesAudio = Boolean(updates.clientProvidesAudio)
    if (updates.startTime)     dataToUpdate.startTime     = updates.startTime
    if (updates.endTime)       dataToUpdate.endTime       = updates.endTime
    if (updates.baseAmount)    dataToUpdate.baseAmount    = parseFloat(updates.baseAmount)
    if (updates.depositAmount) dataToUpdate.depositAmount = parseFloat(updates.depositAmount)
    if (updates.adminNote)     dataToUpdate.adminNote     = updates.adminNote

    const booking = await db.bookingRequest.update({
      where: { id: bookingId },
      data: dataToUpdate
    })

    // 2. Si tiene evento sincronizado, actualizarlo también
    if (booking.eventId) {
      await db.event.update({
        where: { id: booking.eventId },
        data: {
          date:             booking.requestedDate,
          guestCount:       booking.guestCount,
          performanceStart: booking.startTime,
          performanceEnd:   booking.endTime,
          amount:           booking.baseAmount,
          deposit:          booking.depositAmount,
          balance:          booking.baseAmount - booking.depositAmount,
          venueType:        booking.venueType,
          mapsLink:         booking.mapsLink,
          isPublic:         booking.isPublic,
          clientProvidesAudio: booking.clientProvidesAudio,
        }
      })
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("PUT /api/booking:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

// Eliminar/Cancelar cotización
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get("id")

    if (!idParam) return NextResponse.json({ error: "IDs faltantes" }, { status: 400 })

    const ids = idParam.split(",").filter(Boolean)
    const results = []

    for (const id of ids) {
      const booking = await db.bookingRequest.findUnique({
        where: { id: id },
        include: { client: true }
      })

      if (!booking) {
        results.push({ id, status: "not_found" })
        continue
      }

      // 1. Si tiene evento, borrarlo (cascada borrará pagos/contratos en la BD)
      if (booking.eventId) {
        const event = await db.event.findUnique({
          where: { id: booking.eventId }
        })

        // 2. Borrar de Google Calendar si existe ID
        if (event?.googleCalendarId) {
          try {
            const { deleteFromGoogleCalendar } = await import("@/lib/notifications")
            await deleteFromGoogleCalendar(event.googleCalendarId)
          } catch (calErr) {
            console.error(`⚠️ Error borrando calendario para ${id}:`, calErr)
          }
        }

        await db.event.delete({ where: { id: booking.eventId } }).catch(e => console.error(`Error delete event ${booking.eventId}:`, e))
      }

      // 3. Borrar el BookingRequest
      await db.bookingRequest.delete({ where: { id: id } })
      results.push({ id, status: "deleted" })
    }

    return NextResponse.json({ success: true, count: results.filter(r => r.status === "deleted").length })
  } catch (error) {
    console.error("DELETE /api/booking:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}

async function notifyMusiciansFunnel(eventId: string, gig: any) {
  const musicians = await db.musicianProfile.findMany({
    where: { whatsapp: { not: null } },
    include: { user: true }
  })

  const message = buildGigMessage(gig)

  for (const m of musicians) {
    const phone = m.whatsapp ?? m.phone
    if (!phone) continue
    const sid = await sendWhatsApp(phone, message)
    await db.notification.create({
      data: {
        eventId,
        type:      "gig_created",
        channel:   "whatsapp",
        recipient: phone,
        message,
        status:    sid ? "sent" : "pendiente",
        twilioSid: sid,
      }
    })
  }
}
