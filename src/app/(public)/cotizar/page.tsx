import { db } from "@/lib/db"
import { DirectQuoteForm } from "@/components/public/DirectQuoteForm"
import { Metadata } from "next"
import { Sparkles, ShieldCheck, MapPin, Music } from "lucide-react"

export const metadata: Metadata = {
  title: "Personaliza tu Propuesta | Vendetta Live Music",
  description: "Llena este formulario para personalizar la propuesta para tu evento y recibir los detalles por WhatsApp con disponibilidad inmediata.",
  alternates: {
    canonical: "/cotizar",
  }
}

export const dynamic = "force-dynamic"

interface CotizarPageProps {
  searchParams?: Promise<{
    paquete?: string
    package?: string
  }>
}

export default async function CotizarPage({ searchParams }: CotizarPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const initialPackage = resolvedParams?.paquete || resolvedParams?.package || null
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  const adminWhatsapp =
    config?.adminWhatsapp ||
    process.env.ADMIN_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "5217222880045"

  return (
    <div className="min-h-screen bg-[#070709] text-foreground pb-24">
      {/* Header del Cotizador */}
      <section className="relative pt-32 md:pt-40 pb-12 overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-[#070709]">
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 md:w-[600px] h-36 bg-primary/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.25em] mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Propuesta a tu Medida
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight leading-tight">
            Personaliza la propuesta para tu evento con <span className="text-primary italic">Vendetta</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Llena este formulario para personalizar la propuesta para tu evento y recibir los detalles directamente a tu WhatsApp con disponibilidad inmediata.
          </p>

          {/* Badges rápidos de confianza */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Disponibilidad en tiempo real
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Toluca, Metepec, CDMX y alrededores
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4 text-amber-400" /> Pop & Rock en vivo
            </span>
          </div>
        </div>
      </section>

      {/* Contenedor del Formulario Directo */}
      <main className="container mx-auto px-4 max-w-2xl mt-10">
        <DirectQuoteForm adminWhatsapp={adminWhatsapp} initialPackage={initialPackage} />
      </main>
    </div>
  )
}
