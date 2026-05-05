import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { notifyWhatsApp, notifyClientBookingClosed, notifyMusicians } from "@/lib/notifications"
import { calcularViatcos } from "@/lib/viaticos"
import { findOrCreateClient } from "@/lib/clients"
import { formatDateMX } from "@/lib/utils"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { getAppUrl } from "@/lib/url"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

// --- 🛡️ IN-MEMORY RATE LIMITER (Anti-Spam) ---
const bookingAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_BOOKINGS = 3
const BOOKING_LOCKOUT_MS = 10 * 60 * 1000 // 10 minutos

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check por IP
    // En Vercel / Cloudflare usamos headers, si no, intentamos sacar la IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown-ip"
    const now = Date.now()
    const record = bookingAttempts.get(ip)

    if (record) {
      if (now - record.firstAttempt < BOOKING_LOCKOUT_MS) {
        if (record.count >= MAX_BOOKINGS) {
          console.warn(`🛑 Spam bloqueado para IP: ${ip}`)
          return NextResponse.json({ success: false, error: "Demasiadas cotizaciones recientes. Por favor, intenta de nuevo en unos minutos o contáctanos por WhatsApp." }, { status: 429 })
        }
        record.count += 1
        bookingAttempts.set(ip, record)
      } else {
        bookingAttempts.set(ip, { count: 1, firstAttempt: now })
      }
    } else {
      bookingAttempts.set(ip, { count: 1, firstAttempt: now })
    }

    const body = await req.json()

    const {
      packageId, packageName, guestCount, venueType,
      address, city, state, zipCode, mapsLink,
      requestedDate, startTime, endTime,
      baseAmount, depositAmount, paymentMethod,
      clientName, clientPhone, clientEmail,
      isPublic, clientProvidesAudio
    } = body

    // 1. Generar Short ID amigable
    const shortId = `VND-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Calcular viáticos
    const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })
    const viaticos = calcularViatcos(city, state, {
      zona2Rate: config?.zona2Rate || 1500,
      zona3Rate: config?.zona3Rate || 3000
    })

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
        zipCode:       zipCode || body.zipCode || null,
        municipio:     body.municipio || city,
        address:       address || "No especificada",
        city:          city || "No especificada",
        state:         state || "México",
        isOutsideZone: Boolean(viaticos.isOutsideZone),
        viaticosAmount: viaticos.amount || 0,
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
        // Campos de Personalización
        bandHours:     body.bandHours || 2,
        djHours:       body.djHours || 0,
        isDjWithTvs:   Boolean(body.isDjWithTvs),
        hasTemplete:   Boolean(body.hasTemplete),
        hasPista:      Boolean(body.hasPista),
        hasRobot:      Boolean(body.hasRobot),
      }
    })

    console.log("✅ Booking creado exitosamente:", booking.id, "shortId:", shortId)

    try {
      const adminPhone = config?.adminWhatsapp || process.env.ADMIN_WHATSAPP_NUMBER
      if (adminPhone) {
        const baseUrl = getAppUrl()
        const adminLink = `${baseUrl}/admin/bookings/${booking.id}`
        
        await notifyWhatsApp({
          to: adminPhone,
          type: "admin_booking",
          data: {
            folio:       shortId,
            clientName:  clientName,
            clientPhone: clientPhone,
            clientEmail: clientEmail || "N/A",
            date:        formatDateMX(cleanDate, "EEEE, d 'de' MMMM"),
            time:        `${startTime} — ${endTime} hrs`,
            package:     packageName,
            location:    `${body.street || ""} ${body.houseNumber || ""}, ${body.colonia || ""}, CP ${zipCode || ""}, ${city}`,
            adminLink:   adminLink
          }
        })
      }
    } catch (notifyErr) {
      console.error("⚠️ Error silencioso enviando notificación admin:", notifyErr)
    }

    return NextResponse.json({
      success:   true,
      bookingId: booking.id,
      shortId:   shortId
    })
  } catch (error) {
    console.error("POST /api/booking:", error)
    return NextResponse.json({ success: false, error: "Error al crear el booking." }, { status: 500 })
  }
}

// Confirmar booking (llamado desde admin)
export async function PATCH(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const { bookingId, action, adminNote, musicianIds } = await req.json()

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

      // 3. Crear Cotización (Legacy compatibility)
      const quoteId = crypto.randomUUID()
      await db.quote.create({
        data: {
          id: quoteId,
          clientId: booking.clientId!,
          status: "agendado",
          totalEstimated: booking.baseAmount,
          guestCount: booking.guestCount,
          ceremonyType: booking.venueType,
          notes: booking.adminNote || "",
          eventDate: booking.requestedDate,
          items: {
            create: [
              {
                description: `Confirmación Web: ${booking.packageName}`,
                quantity: 1,
                unitCost: booking.baseAmount
              }
            ]
          }
        }
      })

      // 4. Crear Event automáticamente
      const event = await db.event.create({
        data: {
          quoteId:          quoteId, // Vincular a la cotización
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

      // 5. Crear filas EventMusician para los músicos convocados
      //    (necesario para que /confirmar/<musicianId>/<eventId> y el webhook "CONFIRMO" puedan marcarlos)
      const targetMusicianIds: string[] = Array.isArray(musicianIds) && musicianIds.length > 0
        ? musicianIds
        : (await db.musicianProfile.findMany({
            where: { whatsapp: { not: null } },
            select: { id: true },
          })).map(m => m.id)

      for (const mId of targetMusicianIds) {
        await db.eventMusician.upsert({
          where:  { id: `${event.id}-${mId}` }, // determinístico → idempotente
          create: { id: `${event.id}-${mId}`, eventId: event.id, musicianId: mId, status: "pending" },
          update: { status: "pending" },
        }).catch(e => console.error("EventMusician upsert:", e))
      }

      // 6. Notificar a los músicos (template + confirmLink por músico) — único lugar central
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
      await notifyMusicians(event.id, gig, db, targetMusicianIds)
        .catch(e => console.error("notifyMusicians:", e))
      
      // 7. Notificar al CLIENTE (Cierre de venta)
      await notifyClientBookingClosed(booking).catch(e => console.error("Error notificado cliente closure:", e))

      return NextResponse.json({ success: true, eventId: event.id })
    }

    if (action === "cancel" || action === "reject") {
      await db.bookingRequest.update({
        where: { id: bookingId },
        data:  { status: "cancelado", adminNote: adminNote || null }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("PATCH /api/booking:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// Actualizar campos de la cotización
export async function PUT(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

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
    if (updates.viaticosAmount !== undefined) dataToUpdate.viaticosAmount = parseFloat(updates.viaticosAmount)
    if (updates.adminNote)     dataToUpdate.adminNote     = updates.adminNote
    // Campos de Personalización
    if (updates.bandHours !== undefined)   dataToUpdate.bandHours   = parseInt(updates.bandHours)
    if (updates.djHours !== undefined)     dataToUpdate.djHours     = parseInt(updates.djHours)
    if (updates.isDjWithTvs !== undefined) dataToUpdate.isDjWithTvs = Boolean(updates.isDjWithTvs)
    if (updates.hasTemplete !== undefined) dataToUpdate.hasTemplete = Boolean(updates.hasTemplete)
    if (updates.hasPista !== undefined)    dataToUpdate.hasPista    = Boolean(updates.hasPista)
    if (updates.hasRobot !== undefined)    dataToUpdate.hasRobot    = Boolean(updates.hasRobot)

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
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

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

