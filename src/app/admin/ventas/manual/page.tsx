export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { UnifiedEventQuoteForm } from "@/components/admin/UnifiedEventQuoteForm"
import { ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { redirect } from "next/navigation"

interface ManualBookingPageProps {
  searchParams?: Promise<{
    inquiryId?: string
  }>
}

export default async function ManualBookingPage({ searchParams }: ManualBookingPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const inquiryId = resolvedParams?.inquiryId

  let prefillInquiry: {
    clientName: string
    clientPhone?: string
    clientEmail?: string
    clientId?: string
    customName?: string
    eventDate?: string
    musicianNotes?: string
    originInquiryId?: string
    status?: string
  } | undefined = undefined

  if (inquiryId) {
    const inquiry = await db.contactInquiry.findUnique({
      where: { id: inquiryId }
    })

    if (inquiry) {
      // Si ya fue convertido previamente, redirigir a la cotización existente
      if (inquiry.convertedBookingId) {
        redirect(`/admin/ventas/${inquiry.convertedBookingId}`)
      }

      prefillInquiry = {
        clientName: inquiry.name,
        clientPhone: inquiry.phone || "",
        clientEmail: inquiry.email || "",
        clientId: inquiry.matchedClientId || undefined,
        customName: inquiry.eventType ? `Consulta: ${inquiry.eventType}` : "",
        eventDate: inquiry.requestedDate ? inquiry.requestedDate.toISOString().split("T")[0] : "",
        musicianNotes: inquiry.message ? `Solicitud Web (${inquiry.eventType || "General"}): ${inquiry.message}` : "",
        originInquiryId: inquiry.id,
        status: "pendiente"
      }
    }
  }

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
                {prefillInquiry 
                  ? `Convirtiendo prospecto de contacto de ${prefillInquiry.clientName} a cotización formal.` 
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
