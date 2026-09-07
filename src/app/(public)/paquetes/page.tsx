import { db } from "@/lib/db"
import { PaquetesSection } from "@/components/public/PaquetesSection"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Paquetes y Precios | Vendetta Live Music",
  description: "Conoce nuestros paquetes musicales para tu boda o evento. Cotiza directamente por WhatsApp con disponibilidad inmediata.",
  alternates: {
    canonical: "/paquetes",
  }
}

export const dynamic = "force-dynamic"

export default async function PaquetesPage() {
  const dbPackages = await db.package.findMany({
    include: { serviceItems: true },
    orderBy: { baseCostPerHour: "asc" }
  })

  return (
    <div className="flex flex-col min-h-screen pt-12">
      <PaquetesSection dbPackages={dbPackages} />
    </div>
  )
}
