import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { generateContractPdf } from "@/lib/pdf/contract-generator"
import { FunnelData } from "@/components/funnel/FunnelWizard"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await db.bookingRequest.findUnique({
      where: { id: id }
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Mapear BookingRequest a FunnelData para el generador
    const funnelData: FunnelData = {
      packageId: booking.packageId || "manual-arma",
      packageName: booking.packageName || "Paquete Personalizado",
      packagePrice: booking.baseAmount || 0,
      guestCount: booking.guestCount || 0,
      venueType: booking.venueType || "salon",
      // Valores por defecto para opciones que podrían no estar en BookingRequest
      bandHours: 2,
      djHours: 0,
      isDjWithTvs: false,
      hasTemplete: false,
      hasPista: false,
      hasRobot: false,
      hasPantalla: false,
      // Ubicación
      street: booking.calle || "",
      houseNumber: booking.numero || "",
      colonia: booking.colonia || "",
      municipio: booking.municipio || booking.city || "",
      address: booking.address || "",
      city: booking.city || "",
      state: booking.state || "México",
      isOutsideZone: booking.isOutsideZone || false,
      viaticosAmount: booking.viaticosAmount || 0,
      viaticosLabel: booking.isOutsideZone ? "Viáticos Foráneos" : "Zona Estándar",
      mapsLink: booking.mapsLink || undefined,
      // Tiempos
      requestedDate: booking.requestedDate ? booking.requestedDate.toISOString() : new Date().toISOString(),
      startTime: booking.startTime || "21:00",
      endTime: booking.endTime || "23:00",
      // Pago
      paymentMethod: booking.paymentMethod || "transfer",
      depositAmount: booking.depositAmount || 0,
      // Cliente
      clientName: booking.clientName || "Cliente Genérico",
      clientPhone: booking.clientPhone || "",
      clientEmail: booking.clientEmail || "",
      adminNote: booking.adminNote || undefined
    }

    const isQuote = booking.status === "pendiente"
    const pdfBytes = await generateContractPdf(funnelData, booking.shortId, { 
      includeLegal: !isQuote 
    })

    // Crear la respuesta con el PDF
    const prefix = isQuote ? "Cotizacion" : "Contrato"
    const filename = `${prefix}_${booking.shortId}_${booking.clientName.replace(/\s+/g, "_")}.pdf`
    
    return new NextResponse(pdfBytes, {
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
