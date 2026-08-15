import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { generateContractPdf } from "@/lib/pdf/contract-generator"
import { FunnelData } from "@/components/funnel/FunnelWizard"
import { auth } from "@/lib/auth"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let booking = await db.bookingRequest.findUnique({
      where: { id: id },
      include: {
        client: {
          include: { user: true }
        },
        event: {
          include: {
            location: true
          }
        }
      }
    }) as any

    // Fallback para quotes legacy
    if (!booking) {
      const legacyQuote = await db.quote.findUnique({
        where: { id: id },
        include: { client: { include: { user: true } } }
      })
      if (legacyQuote) {
        booking = {
          id: legacyQuote.id,
          shortId: (legacyQuote as any).shortId || legacyQuote.id.slice(0, 8).toUpperCase(),
          clientName: legacyQuote.client?.user?.name || "Cliente Legacy",
          clientEmail: legacyQuote.client?.user?.email || "",
          clientPhone: "",
          status: legacyQuote.status,
          packageName: "Paquete Personalizado",
          requestedDate: legacyQuote.eventDate,
          baseAmount: legacyQuote.totalEstimated,
          depositAmount: 0,
          createdAt: legacyQuote.createdAt,
          source: "legacy",
        }
      }
    }

    if (!booking) {
      console.error(`[Contract API] Booking/Quote not found: ${id}`)
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Validar autorización (Admin, Cliente dueño, o Token firmado de URL pública)
    const session = await auth()
    const isAdmin = session?.user && ADMIN_ROLES.has(session.user.role as string)
    let isAuthorized = isAdmin

    if (!isAuthorized && session?.user) {
      const isOwner = booking.client?.userId === session.user.id || booking.clientEmail === session.user.email
      if (isOwner) isAuthorized = true
    }

    if (!isAuthorized) {
      const crypto = await import("crypto")
      const secret = process.env.AUTH_SECRET || "fallback_secret_vendetta_music_app_2026"
      const expectedToken = crypto.createHmac("sha256", secret).update(id).digest("hex")
      const token = req.nextUrl.searchParams.get("token")
      if (token === expectedToken) isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isQuote = booking.status === "pendiente" || req.nextUrl.searchParams.get("type") === "quote"
    // Se eliminó la validación estricta de datos legales para permitir generar y descargar el contrato con fallbacks genéricos


    console.log(`[Contract API] Processing booking ${booking.shortId} (Status: ${booking.status})`)
    console.log(`[Contract API] Signatures: Client=${!!booking.clientSignature}, Admin=${!!booking.adminSignature}`)

    // Obtener la firma administrativa actual como fallback
    const globalConfig = await db.globalConfig.findUnique({
      where: { id: "vendetta_config" }
    })
    console.log(`[Contract API] GlobalConfig fallback signature found: ${!!globalConfig?.adminSignature}`)

    // Mapear BookingRequest a FunnelData para el generador
    const funnelData: FunnelData = {
      bookingId: booking.id,
      shortId: booking.shortId || "",
      packageId: booking.packageId || "manual-arma",
      packageName: booking.packageName || "Paquete Personalizado",
      packagePrice: booking.baseAmount || 0,
      guestCount: booking.guestCount || 0,
      venueType: booking.venueType || "salon",
      // Valores desde BookingRequest
      bandHours: booking.bandHours ?? 0,
      djHours:   booking.djHours ?? 0,
      isDjWithTvs: booking.isDjWithTvs || false,
      hasTemplete: booking.hasTemplete || false,
      hasPista:    booking.hasPista || false,
      hasRobot:    booking.hasRobot || false,
      hasPantalla: booking.hasPantalla || false,
      clientProvidesAudio: booking.clientProvidesAudio || false,
      // Ubicación
      street: booking.event?.location?.address?.split(',')[0] || booking.calle || "",
      houseNumber: booking.numero || "",
      colonia: booking.colonia || "",
      municipio: booking.event?.location?.city || booking.municipio || booking.city || "",
      address: booking.event?.location?.address || booking.address || "",
      city: booking.event?.location?.city || booking.city || "",
      state: booking.event?.location?.state || booking.state || "México",
      isOutsideZone: booking.isOutsideZone || false,
      viaticosAmount: booking.viaticosAmount || 0,
      viaticosLabel: booking.isOutsideZone ? "Viáticos Foráneos" : "Zona Estándar",
      mapsLink: booking.event?.location?.mapsLink || booking.mapsLink || undefined,
      // Tiempos
      requestedDate: booking.requestedDate ? booking.requestedDate.toISOString() : new Date().toISOString(),
      startTime: booking.startTime || "21:00",
      endTime: booking.endTime || "23:00",
      // Pago
      paymentMethod: booking.paymentMethod || "transfer",
      depositAmount: booking.depositAmount || 0,
      // Cliente
      clientName: booking.client?.user?.name || booking.clientName || "Cliente Genérico",
      clientPhone: booking.clientPhone || "",
      clientEmail: booking.clientEmail || "",
      originalPrice: booking.originalPrice || 0,
      discountAmount: booking.discountAmount || 0,
      // IVA / Factura
      invoice: booking.event?.invoice || booking.invoice || false,
      ivaAmount: booking.event?.ivaAmount || 0,
    } as any

    const pdfBytes = await generateContractPdf(funnelData, booking.shortId || booking.id, {
      includeLegal: !isQuote,
      clientSignature: booking.clientSignature || undefined,
      adminSignature: (booking.adminSignature && booking.adminSignature.length > 10) 
        ? booking.adminSignature 
        : (globalConfig?.adminSignature || undefined),
      signedAt: booking.signedAt ? booking.signedAt.toISOString() : undefined,
      contractLegalText: (booking.venueType?.toLowerCase() === "bar" || booking.event?.venueType?.toLowerCase() === "bar") 
        ? ((globalConfig as any)?.contractBarLegalText || undefined)
        : (globalConfig?.contractLegalText || undefined),
      rfc: booking.client?.rfc || undefined,
      fiscalAddress: booking.client?.fiscalAddress || undefined,
      legalRepName: booking.client?.legalRepName || undefined,
      legalRepRole: booking.client?.legalRepRole || undefined,
      legalRepPower: booking.client?.legalRepPower || undefined,
      notificationAddress: booking.client?.notificationAddress || undefined,
      billingData: booking.client?.billingData || undefined
    })

    // Crear la respuesta con el PDF
    const prefix = isQuote ? "Cotizacion" : "Contrato"
    const filename = `${prefix}_${booking.shortId}_${booking.clientName.replace(/\s+/g, "_")}.pdf`
    
    return new NextResponse(new Uint8Array(pdfBytes) as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Error en API de Contrato PDF:", error)
    return NextResponse.json({ 
      error: "Error al generar el PDF del contrato", 
      details: error.message || String(error)
    }, { status: 500 })
  }
}
