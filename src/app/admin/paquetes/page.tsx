export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminPaquetesClient } from "@/components/admin/AdminPaquetesClient"
import { Box } from "lucide-react"

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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-3 text-blue-600 mb-2">
          <Box className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-bold uppercase tracking-widest">Catálogo de Servicios</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
          Gestión de Paquetes
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
          Administra los paquetes base de la banda, las tarifas de personalización de "Arma tu Show", y los costos de los servicios adicionales.
        </p>
      </div>

      <AdminPaquetesClient 
        initialPackages={packages as any} 
        serviceCatalog={serviceCatalog as any}
        initialExtras={extras as any}
      />
    </div>
  )
}
