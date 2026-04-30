import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PackagesManager } from "@/components/admin/PackagesManager"
import { ExtrasManager } from "@/components/admin/ExtrasManager"
import { ServicesManager } from "@/components/admin/ServicesManager"
import { Box, Sparkles, Zap } from "lucide-react"

export default async function AdminPaquetesPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }

  const packages = await db.package.findMany({
    include: { serviceItems: true },
    orderBy: { createdAt: "desc" }
  })

  const extras = await db.packageService.findMany({
    orderBy: { createdAt: "desc" }
  })

  const serviceCatalog = await db.serviceItem.findMany({
    orderBy: { name: "asc" }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Box className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Catálogo de Servicios</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">
          Gestión de Paquetes
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra los paquetes base que aparecen en el funnel de ventas y cotizador.
        </p>
      </div>

      <PackagesManager 
        initialPackages={packages as any} 
        serviceCatalog={serviceCatalog as any}
      />

      <div className="border-t border-border/40 my-8" />

      <ServicesManager initialServices={serviceCatalog as any} />

      <div className="border-t border-border/40 my-8" />

      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Servicios Adicionales (Funnel)
          </h2>
          <p className="text-muted-foreground mt-2">
            Configura los servicios y costos extras que el cliente puede elegir al "Armar su Show".
          </p>
        </div>
        <ExtrasManager initialExtras={extras as any} />
      </div>
    </div>
  )
}
