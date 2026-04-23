import { db } from "@/lib/db"
import { ManualQuoteForm } from "@/components/admin/ManualQuoteForm"
import { ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ManualBookingPage() {
  const packages = await db.package.findMany({
    orderBy: { baseCostPerHour: "asc" }
  })

  // Mapeamos para que el componente reciba lo que espera
  const formattedPackages = packages.map(p => ({
    id: p.id,
    name: p.name,
    baseCostPerHour: p.baseCostPerHour,
    minDuration: p.minDuration
  }))

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/ventas">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-black text-white flex items-center gap-3">
                <ShieldCheck className="text-primary w-8 h-8" /> Cotización Manual
              </h1>
              <p className="text-muted-foreground text-sm">Registra un evento captado por fuera del sitio web.</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <ManualQuoteForm packages={formattedPackages} />
      </div>
    </div>
  )
}
