import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import * as XLSX from "xlsx"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") // "bookings" | "clients"

  try {
    let data: any[] = []
    let fileName = "export.xlsx"

    if (type === "bookings") {
      const bookings = await db.bookingRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true }
      })
      
      data = bookings.map(b => ({
        "Folio": b.shortId || "S/F",
        "Fecha Registro": b.createdAt.toLocaleDateString('es-MX'),
        "Fecha Evento": b.requestedDate.toLocaleDateString('es-MX'),
        "Cliente": b.clientName,
        "Teléfono": b.clientPhone,
        "Email": b.clientEmail || "N/A",
        "Paquete": b.packageName,
        "Monto Base": b.baseAmount,
        "Viáticos": b.viaticosAmount,
        "Total": b.baseAmount + b.viaticosAmount,
        "Anticipo": b.depositAmount,
        "Estado": b.status.toUpperCase(),
        "Ubicación": b.address,
        "Municipio": b.city,
        "Notas Admin": b.adminNote || ""
      }))
      fileName = `Vendetta_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`
    } 
    else if (type === "clients") {
      const clients = await db.clientProfile.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" }
      })
      
      data = clients.map(c => ({
        "Nombre": c.user?.name || "N/A",
        "Email": c.user?.email || "N/A",
        "WhatsApp": c.whatsapp || c.phone || "N/A",
        "Ciudad": c.city || "N/A",
        "Estado": c.state || "N/A",
        "Empresa": c.company || "N/A",
        "Tipo": c.type || "N/A",
        "RFC": c.rfc || "N/A",
        "Notas": c.notes || "",
        "Fecha Registro": c.createdAt.toLocaleDateString('es-MX')
      }))
      fileName = `Vendetta_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`
    }
    else if (type === "events") {
      const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
      
      const [newEvents, legacyEvents] = await Promise.all([
        db.event.findMany({
          orderBy: { date: "desc" },
          include: { location: true, client: { include: { user: true } } }
        }),
        db.bandEvent.findMany({
          orderBy: [{ eventYear: "desc" }, { eventDate: "desc" }]
        })
      ])

      const mappedNew = newEvents.map(e => ({
        "Fecha": e.date.toLocaleDateString('es-MX'),
        "Mes": months[e.date.getUTCMonth()],
        "Año": e.date.getUTCFullYear(),
        "Cliente": e.customName || e.client?.user?.name || "Sin Nombre",
        "Ingreso Base": e.amount || 0,
        "IVA": e.ivaAmount || 0,
        "Total": e.totalIncome || e.amount || 0,
        "Tipo": e.ceremonyType || "Show",
        "Estado": e.status.toUpperCase(),
        "Ubicación": e.location?.name || e.mapsLink || "N/A",
        "Método Pago": e.paymentMethod || e.depositMethod || "N/A",
        "Factura": e.invoice || "No",
        "Notas": e.musicianNotes || "",
        "Fuente": e.source || "Manual"
      }))

      const mappedLegacy = legacyEvents.map(e => ({
        "Fecha": e.eventDate.toLocaleDateString('es-MX'),
        "Mes": e.eventMonth,
        "Año": e.eventYear,
        "Cliente": e.clientName,
        "Ingreso Base": e.baseIncome,
        "IVA": e.ivaAmount,
        "Total": e.totalIncome,
        "Tipo": e.eventType,
        "Estado": e.status.toUpperCase(),
        "Ubicación": e.location,
        "Método Pago": e.paymentMethod,
        "Factura": e.invoice || "No",
        "Notas": e.notes || "",
        "Fuente": e.source || "Legacy"
      }))

      data = [...mappedNew, ...mappedLegacy].sort((a,b) => {
        const dateA = new Date(a["Fecha"].split('/').reverse().join('-'))
        const dateB = new Date(b["Fecha"].split('/').reverse().join('-'))
        return dateB.getTime() - dateA.getTime()
      })

      // Añadir fila de Totales
      const totalBase = data.reduce((acc, curr) => acc + (curr["Ingreso Base"] || 0), 0)
      const totalIva = data.reduce((acc, curr) => acc + (curr["IVA"] || 0), 0)
      const totalFinal = data.reduce((acc, curr) => acc + (curr["Total"] || 0), 0)

      data.push({
        "Fecha": "---",
        "Mes": "TOTALES",
        "Año": "---",
        "Cliente": "---",
        "Ingreso Base": totalBase,
        "IVA": totalIva,
        "Total": totalFinal,
        "Tipo": "---",
        "Estado": "---",
        "Ubicación": "---",
        "Método Pago": "---",
        "Factura": "---",
        "Notas": "Sumatoria final del periodo",
        "Fuente": "---"
      })
      
      fileName = `Vendetta_Ingresos_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    // Crear Workbook y Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")

    // Generar Buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
