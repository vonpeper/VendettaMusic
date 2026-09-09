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
  const [dbPackages, config] = await Promise.all([
    db.package.findMany({
      include: { serviceItems: true },
      orderBy: { baseCostPerHour: "asc" }
    }),
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  ])

  return (
    <div className="flex flex-col min-h-screen pt-12">
      <PaquetesSection 
        dbPackages={dbPackages} 
        adminWhatsapp={config?.adminWhatsapp || process.env.ADMIN_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_ADMIN_WA || null}
      />
    </div>
  )
}
