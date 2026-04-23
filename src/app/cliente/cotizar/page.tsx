import { db } from "@/lib/db"
import { QuoteForm } from "@/components/forms/QuoteForm"

export default async function CotizarPage() {
  const packages = await db.package.findMany({
    where: { active: true },
    orderBy: { baseCostPerHour: 'asc' }
  })

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-border/40 pb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">Arma tu Fiesta Inolvidable</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Selecciona un paquete base y proporciónanos los detalles iniciales. Nuestro sistema estimará el costo y nuestro equipo de logística confirmará la viabilidad de la fecha.
        </p>
      </div>

      <QuoteForm packages={packages} />
    </div>
  )
}
