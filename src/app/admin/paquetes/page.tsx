import { db } from "@/lib/db"
import { PackagesManager } from "@/components/admin/PackagesManager"
import { Box } from "lucide-react"

export default async function AdminPaquetesPage() {
  const packages = await db.package.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Box className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Catálogo de Servicios</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">
          Gestión de Paquetes
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra los paquetes base que aparecen en el funnel de ventas y cotizador. Los cambios se reflejan automáticamente en el sitio público.
        </p>
      </div>

      <PackagesManager initialPackages={packages as any} />
    </div>
  )
}
