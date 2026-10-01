export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { UnifiedEventQuoteForm } from "@/components/admin/UnifiedEventQuoteForm"
import { ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { redirect } from "next/navigation"
import { parseInquiryDetails } from "@/lib/inquiry-parser"
import { isLocalCity } from "@/lib/viaticos"
import { calculateShowBasePrice } from "@/lib/pricing"

interface ManualBookingPageProps {
  searchParams?: Promise<{
    inquiryId?: string
    clientId?: string
    clientName?: string
    clientPhone?: string
    clientEmail?: string
    city?: string
  }>
}

export default async function ManualBookingPage({ searchParams }: ManualBookingPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const inquiryId = resolvedParams?.inquiryId
  const clientId = resolvedParams?.clientId
  const paramClientName = resolvedParams?.clientName
  const paramClientPhone = resolvedParams?.clientPhone
  const paramClientEmail = resolvedParams?.clientEmail
  const paramCity = resolvedParams?.city

  const [packages, clients, locations] = await Promise.all([
    db.package.findMany({
      orderBy: { baseCostPerHour: "asc" }
    }),
    db.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    db.location.findMany({
      orderBy: { name: "asc" }
    })
  ])

  const formattedPackages = packages.map(p => ({
    id: p.id,
    name: p.name,
    baseCostPerHour: p.baseCostPerHour,
    minDuration: p.minDuration,
    description: p.description,
    includes: p.includes
  }))

  const formattedClients = clients
    .filter(c => c.user)
    .map(c => ({
      id: c.id,
      name: c.user.name || "Sin Nombre",
      phone: c.whatsapp || "",
      email: c.user.email || "",
      city: c.city || "Toluca / CDMX",
      state: c.state || "México"
    }))

  const formattedVenues = locations.map(l => ({
    id: l.id,
    name: l.name,
    address: l.address,
    city: l.city,
    state: l.state,
    mapsLink: l.mapsLink,
    phone: l.phone
  }))

  let prefillInquiry: {
    clientName: string
    clientPhone?: string
    clientEmail?: string
    clientId?: string
    customName?: string
    ceremonyType?: string
    eventDate?: string
    startTime?: string
    endTime?: string
    arrivalTime?: string
    setupTime?: string
    guestCount?: number | null
    locationId?: string
    venueName?: string
    venueAddress?: string
    venueCity?: string
    venueState?: string
    mapsLink?: string
    packageId?: string
    packageName?: string
    basePrice?: number
    viaticosAmount?: number
    musicianNotes?: string
    originInquiryId?: string
    status?: string
    city?: string
  } | undefined = undefined

  if (inquiryId) {
    const inquiry = await db.contactInquiry.findUnique({
      where: { id: inquiryId },
      include: { convertedBooking: true }
    })

    if (inquiry) {
      // Si ya fue convertido previamente, redirigir a la cotización existente
      if (inquiry.convertedBooking) {
        redirect(`/admin/ventas/${inquiry.convertedBooking.id}`)
      }

      const parsed = parseInquiryDetails({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        eventType: inquiry.eventType,
        message: inquiry.message,
        defaultDurationHours: 2,
      })

      // Resolver Cliente Previo si coincide el teléfono
      let resolvedClientId = inquiry.matchedClientId || undefined
      if (!resolvedClientId && inquiry.phone) {
        const clean10 = inquiry.phone.replace(/\D/g, "").slice(-10)
        if (clean10.length === 10) {
          const matchClient = formattedClients.find(
            c => c.phone && c.phone.replace(/\D/g, "").slice(-10) === clean10
          )
          if (matchClient) resolvedClientId = matchClient.id
        }
      }

      // Resolver Paquete seleccionado
      let matchedPackageId: string | undefined = undefined
      let matchedPackageName: string | undefined = undefined
      let initialBasePrice: number | undefined = undefined

      if (parsed.packageKeyword) {
        const foundPkg = formattedPackages.find(p =>
          p.name.toLowerCase().includes(parsed.packageKeyword!.toLowerCase())
        )
        if (foundPkg) {
          matchedPackageId = foundPkg.id
          matchedPackageName = foundPkg.name
          const isOutside = parsed.city ? !isLocalCity(parsed.city) : false
          const localBase = foundPkg.baseCostPerHour * (foundPkg.minDuration || 2)
          initialBasePrice = calculateShowBasePrice(localBase, isOutside)
        }
      }

      // Resolver Venue / Ubicación en catálogo
      let matchedLocationId: string | undefined = undefined
      let venueName = parsed.venueName || parsed.city || ""
      let venueAddress = parsed.city || ""
      let venueCity = parsed.city || ""
      let venueState = "México"

      if (parsed.venueName || parsed.city) {
        const targetSearch = (parsed.venueName || parsed.city).toLowerCase()
        const foundLoc = formattedVenues.find(v =>
          v.name.toLowerCase().includes(targetSearch) ||
          targetSearch.includes(v.name.toLowerCase()) ||
          (v.city && targetSearch.includes(v.city.toLowerCase()))
        )
        if (foundLoc) {
          matchedLocationId = foundLoc.id
          venueName = foundLoc.name
          venueAddress = foundLoc.address || foundLoc.name
          venueCity = foundLoc.city || venueCity
          venueState = foundLoc.state || venueState
        }
      }

      // Fecha del evento formateada YYYY-MM-DD
      const eventDate = inquiry.requestedDate
        ? inquiry.requestedDate.toISOString().split("T")[0]
        : ""

      // Notas consolidadas
      const noteParts: string[] = []
      if (inquiry.message) noteParts.push(`Solicitud original: ${inquiry.message}`)
      if (parsed.notes) noteParts.push(`Requerimientos: ${parsed.notes}`)
      const musicianNotes = noteParts.join(" | ") || `Solicitud Web (${inquiry.eventType || "General"})`

      prefillInquiry = {
        clientId: resolvedClientId,
        clientName: inquiry.name,
        clientPhone: inquiry.phone || "",
        clientEmail: parsed.cleanEmail,
        city: parsed.city || venueCity,
        customName: parsed.customName,
        ceremonyType: parsed.ceremonyType,
        eventDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        arrivalTime: parsed.arrivalTime,
        setupTime: parsed.setupTime,
        guestCount: parsed.guestCount,
        locationId: matchedLocationId,
        venueName,
        venueAddress,
        venueCity,
        venueState,
        mapsLink: parsed.mapsLink || undefined,
        packageId: matchedPackageId,
        packageName: matchedPackageName,
        basePrice: initialBasePrice,
        viaticosAmount: parsed.viaticosAmount || undefined,
        musicianNotes,
        originInquiryId: inquiry.id,
        status: "pendiente"
      }
    }
  } else if (clientId) {
    const client = await db.clientProfile.findUnique({
      where: { id: clientId },
      include: { user: true }
    })

    if (client) {
      prefillInquiry = {
        clientId: client.id,
        clientName: client.user?.name || paramClientName || "",
        clientPhone: client.whatsapp || paramClientPhone || "",
        clientEmail: client.user?.email || paramClientEmail || "",
        city: client.city || paramCity || "",
        status: "pendiente"
      }
    }
  } else if (paramClientName || paramClientPhone || paramClientEmail) {
    // Si no viene clientId directo pero vienen datos (ej. desde una cotización sin ClientProfile vinculado todavía)
    let matchedClientId: string | undefined = undefined
    if (paramClientPhone) {
      const clean10 = paramClientPhone.replace(/\D/g, "").slice(-10)
      if (clean10.length === 10) {
        const found = await db.clientProfile.findFirst({
          where: {
            OR: [
              { whatsapp: { contains: clean10 } },
              ...(paramClientEmail ? [{ user: { email: paramClientEmail } }] : [])
            ]
          }
        })
        if (found) matchedClientId = found.id
      }
    }

    prefillInquiry = {
      clientId: matchedClientId,
      clientName: paramClientName || "",
      clientPhone: paramClientPhone || "",
      clientEmail: paramClientEmail || "",
      city: paramCity || "",
      status: "pendiente"
    }
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Link href="/admin/ventas">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-black text-foreground flex items-center gap-3">
                <ShieldCheck className="text-primary w-7 h-7" /> Nueva Cotización / Evento Manual
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                {prefillInquiry?.originInquiryId
                  ? `Convirtiendo prospecto de contacto de ${prefillInquiry.clientName} a cotización formal.` 
                  : prefillInquiry?.clientName
                    ? `Generando nueva cotización para ${prefillInquiry.clientName}.`
                    : "Formulario administrativo unificado con precarga de clientes, venues y conceptos adicionales."}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario Unificado */}
        <UnifiedEventQuoteForm
          mode="create"
          initialData={prefillInquiry}
          packages={formattedPackages}
          clients={formattedClients}
          venues={formattedVenues}
        />
      </div>
    </div>
  )
}
