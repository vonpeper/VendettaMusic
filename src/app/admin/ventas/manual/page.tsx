export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { UnifiedEventQuoteForm } from "@/components/admin/UnifiedEventQuoteForm"
import { ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ManualBookingPage() {
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
                Formulario administrativo unificado con precarga de clientes, venues y conceptos adicionales.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario Unificado */}
        <UnifiedEventQuoteForm
          mode="create"
          packages={formattedPackages}
          clients={formattedClients}
          venues={formattedVenues}
        />
      </div>
    </div>
  )
}
