export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { UnifiedEventQuoteForm } from "@/components/admin/UnifiedEventQuoteForm"
import { ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { redirect } from "next/navigation"
import { parseInquiryDetails } from "@/lib/inquiry-parser"
import { isLocalCity, calcularViatcos } from "@/lib/viaticos"
import { calculateShowBasePrice, calculateEventHours } from "@/lib/pricing"

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

  const [packages, clients, locations, globalConfig] = await Promise.all([
    db.package.findMany({
      orderBy: { baseCostPerHour: "asc" }
    }),
    db.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    db.location.findMany({
      orderBy: { name: "asc" }
    }),
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
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
    bandHours?: number
    basePrice?: number
    viaticosAmount?: number
    depositAmount?: number
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

      // Resolver Venue / Ubicación en catálogo primero para asegurar ciudad y estado
      let matchedLocationId: string | undefined = undefined
      let venueName = parsed.venueName || ""
      let venueCity = parsed.city || ""
      let venueState = parsed.state || "Estado de México"
      let venueAddress = venueName ? venueName : (venueCity ? "Pendiente por confirmar" : "")

      // Solo emparejar con el catálogo de venues si el lead especificó un NOMBRE DE LUGAR real (no solo municipio/ciudad)
      if (parsed.venueName && parsed.venueName.trim().length > 2) {
        const targetSearch = parsed.venueName.toLowerCase().trim()
        const foundLoc = formattedVenues.find(v =>
          v.name.toLowerCase() === targetSearch ||
          v.name.toLowerCase().includes(targetSearch) ||
          targetSearch.includes(v.name.toLowerCase())
        )
        if (foundLoc) {
          matchedLocationId = foundLoc.id
          venueName = foundLoc.name
          venueAddress = foundLoc.address || foundLoc.name
          venueCity = foundLoc.city || venueCity
          venueState = foundLoc.state || venueState
        }
      }

      // Resolver Paquete seleccionado con fallback robusto a Essential
      let matchedPackageId: string | undefined = undefined
      let matchedPackageName: string | undefined = undefined
      let initialBasePrice: number | undefined = undefined

      let targetPkg = undefined
      if (parsed.packageKeyword) {
        targetPkg = formattedPackages.find(p =>
          p.name.toLowerCase().includes(parsed.packageKeyword!.toLowerCase())
        )
      }
      if (!targetPkg) {
        targetPkg = formattedPackages.find(p => p.name.toLowerCase().includes("essential")) || formattedPackages[0]
      }

      const effectiveCity = venueCity || parsed.city || ""
      const isOutside = effectiveCity ? !isLocalCity(effectiveCity, venueState) : false
      const durationHours = (parsed.startTime && parsed.endTime ? calculateEventHours(parsed.startTime, parsed.endTime) : null) || targetPkg?.minDuration || 2

      if (targetPkg) {
        matchedPackageId = targetPkg.id
        matchedPackageName = targetPkg.name
        const localBase = targetPkg.baseCostPerHour * durationHours
        initialBasePrice = calculateShowBasePrice(localBase, isOutside)
      }

      // Resolver Viáticos automáticos si no vienen especificados
      let initialViaticos: number | undefined = parsed.viaticosAmount || undefined
      if (initialViaticos === undefined && effectiveCity) {
        const viatResult = calcularViatcos(effectiveCity, venueState, globalConfig || undefined)
        initialViaticos = viatResult.amount
      }

      // Sugerir 50% de anticipo estimado sobre base + viáticos
      const initialDeposit = (initialBasePrice !== undefined || initialViaticos !== undefined)
        ? Math.round(((initialBasePrice || 0) + (initialViaticos || 0)) * 0.5)
        : undefined

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
        city: effectiveCity,
        customName: parsed.customName,
        ceremonyType: parsed.ceremonyType,
        eventDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        bandHours: durationHours,
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
        viaticosAmount: initialViaticos,
        depositAmount: initialDeposit,
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
      const defaultPkg = formattedPackages.find(p => p.name.toLowerCase().includes("essential")) || formattedPackages[0]
      const city = client.city || paramCity || ""
      const isOutside = city ? !isLocalCity(city) : false
      const initialBase = defaultPkg ? calculateShowBasePrice(defaultPkg.baseCostPerHour * (defaultPkg.minDuration || 2), isOutside) : undefined
      const initialViat = city ? calcularViatcos(city, undefined, globalConfig || undefined).amount : undefined
      const initialDep = (initialBase !== undefined || initialViat !== undefined) ? Math.round(((initialBase || 0) + (initialViat || 0)) * 0.5) : undefined

      prefillInquiry = {
        clientId: client.id,
        clientName: client.user?.name || paramClientName || "",
        clientPhone: client.whatsapp || paramClientPhone || "",
        clientEmail: client.user?.email || paramClientEmail || "",
        city,
        packageId: defaultPkg?.id,
        packageName: defaultPkg?.name,
        basePrice: initialBase,
        viaticosAmount: initialViat,
        depositAmount: initialDep,
        bandHours: defaultPkg?.minDuration || 2,
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

    const defaultPkg = formattedPackages.find(p => p.name.toLowerCase().includes("essential")) || formattedPackages[0]
    const city = paramCity || ""
    const isOutside = city ? !isLocalCity(city) : false
    const initialBase = defaultPkg ? calculateShowBasePrice(defaultPkg.baseCostPerHour * (defaultPkg.minDuration || 2), isOutside) : undefined
    const initialViat = city ? calcularViatcos(city, undefined, globalConfig || undefined).amount : undefined
    const initialDep = (initialBase !== undefined || initialViat !== undefined) ? Math.round(((initialBase || 0) + (initialViat || 0)) * 0.5) : undefined

    prefillInquiry = {
      clientId: matchedClientId,
      clientName: paramClientName || "",
      clientPhone: paramClientPhone || "",
      clientEmail: paramClientEmail || "",
      city,
      packageId: defaultPkg?.id,
      packageName: defaultPkg?.name,
      basePrice: initialBase,
      viaticosAmount: initialViat,
      depositAmount: initialDep,
      bandHours: defaultPkg?.minDuration || 2,
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
