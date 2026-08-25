"use client"

import { Button } from "@/components/ui/button"
import * as Icons from "lucide-react"
import Image from "next/image"

const {
  Check, X, Sparkles, Music2,
  Mic2, Lightbulb, Users, Volume2, Monitor, Star,
  MessageCircle, ArrowUpRight
} = Icons

// Helper to get Lucide icon from string
const getIcon = (name: string | null) => {
  if (!name) return Check
  const Icon = (Icons as any)[name]
  return Icon || Check
}

interface ServiceItem {
  id: string
  name: string
  icon: string | null
  category: string
}

interface PackageData {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string | null
  serviceItems: ServiceItem[]
  includes?: string
  exclusions?: string
  active?: boolean
}

// Estilos visuales por defecto para paquetes
const PACKAGE_STLYES: Record<number, any> = {
  0: { // Primer paquete
    emoji: "🎸",
    gradient: "from-violet-900/70 via-violet-800/40 to-violet-900/30",
    border: "border-violet-500/40 hover:border-violet-400/70",
    glow: "shadow-violet-500/10",
    accentColor: "text-violet-300",
    badgeColor: "bg-violet-500/20 text-violet-200 border-violet-400/30",
    highlight: false
  },
  1: { // Segundo paquete (Highlight)
    emoji: "🎵",
    gradient: "from-red-900/80 via-rose-800/50 to-red-900/40",
    border: "border-red-500/60",
    glow: "shadow-red-500/20",
    accentColor: "text-red-300",
    badgeColor: "bg-red-500/20 text-red-200 border-red-400/40",
    highlight: true
  },
  2: { // Tercer paquete
    emoji: "🏆",
    gradient: "from-amber-900/70 via-yellow-800/40 to-amber-900/30",
    border: "border-amber-500/40 hover:border-amber-400/70",
    glow: "shadow-amber-500/10",
    accentColor: "text-amber-300",
    badgeColor: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    highlight: false
  }
}

const HARDCODED_FEATURES: Record<string, { includes: {icon: string, text: string}[], notIncludes: string[] }> = {
  "Essential": {
    includes: [
      { icon: "Volume2",    text: "Audio Electro-Voice (2 tops + 1 sub + consola digital)" },
      { icon: "Music2",     text: "Backline completo (batería, amps, microfonía)" },
      { icon: "Lightbulb",  text: "Iluminación básica RGB" },
      { icon: "Users",      text: "4 integrantes + Ingeniero + Staff" },
      { icon: "Music2",     text: "Repertorio Pop Rock (Inglés/Español)" },
      { icon: "Sparkles",   text: "2 horas de show (2 sets)" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Iluminación robótica", "Viáticos"]
  },
  "Experience": {
    includes: [
      { icon: "Sparkles",  text: "Todo lo del paquete Essential" },
      { icon: "Volume2",   text: "Audio profesional (100 a 300 personas)" },
      { icon: "Volume2",   text: "Mejora en calidad y cobertura de sonido" },
      { icon: "Mic2",      text: "Monitoreo inalámbrico profesional" },
      { icon: "Music2",    text: "2 horas de show potente" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Viáticos"]
  },
  "Festival Premium": {
    includes: [
      { icon: "Sparkles",   text: "Todo lo del paquete Experience" },
      { icon: "Monitor",    text: "Pantalla LED 3×2 m" },
      { icon: "Lightbulb",  text: "Iluminación robótica avanzada" },
      { icon: "Star",       text: "Templete (Escenario)" },
      { icon: "Users",      text: "Producción completa tipo concierto" },
      { icon: "Music2",     text: "2 horas de máxima experiencia" },
    ],
    notIncludes: ["Viáticos"]
  },
  "Bar": {
    includes: [
      { icon: "Volume2",    text: "Audio EV" },
      { icon: "Music2",     text: "Backline completo" },
      { icon: "Users",      text: "4 integrantes + Ing. en audio + Staff" },
      { icon: "Sparkles",   text: "2 turnos de 45 mins" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Iluminación robótica", "Viáticos"]
  }
}

export function PaquetesSection({ dbPackages }: { dbPackages: PackageData[]; viaticosConfig?: any }) {
  const WHATSAPP_PHONE = "527222417045"

  return (
    <section id="paquetes" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Nuestros Paquetes
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight uppercase mb-4 animated-title pr-4">
            Elige tu Show
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
            Producción musical de primer nivel para tu evento. Consulta disponibilidad y cotiza de inmediato por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {dbPackages.map((pkg, i) => {
            const style = PACKAGE_STLYES[i % 3] || PACKAGE_STLYES[0]
            const isUnavailable = pkg.active === false
            const isEssential = pkg.name.toLowerCase().includes("essent")
            const waMessage = encodeURIComponent(`¡Hola Vendetta! Me interesa cotizar el paquete "${pkg.name}" para mi evento. ¿Me podrían dar información de disponibilidad y detalles?`)
            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${waMessage}`
            
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 bg-gradient-to-br ${style.gradient} ${
                  isUnavailable 
                    ? "border-neutral-800 opacity-60 filter grayscale-[40%] cursor-not-allowed" 
                    : style.border
                } ${
                  !isUnavailable && style.highlight ? `shadow-2xl ${style.glow} lg:-translate-y-5 scale-[1.03]` : "hover:scale-[1.01] hover:shadow-xl"
                }`}
              >
                {style.highlight && !isUnavailable && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border ${style.badgeColor}`}>
                    ★ Más Solicitado
                  </div>
                )}
                {isUnavailable && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-neutral-400 text-[9px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full border border-neutral-700">
                    No Disponible
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-3xl mb-2">{style.emoji}</div>
                  <h3 className={`font-heading font-black text-2xl mb-2 ${style.accentColor}`}>{pkg.name}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{pkg.description}</p>
                </div>

                {/* Precios: Solo se despliega para Essentia */}
                {isEssential ? (
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Inversión</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">Desde $8,500</span>
                      <span className="text-xs text-primary font-bold">MXN</span>
                    </div>
                    <div className="text-xs text-primary font-semibold mt-1">2 horas de show</div>
                  </div>
                ) : (
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Inversión</div>
                    <div className="text-lg font-black text-white/90">Cotización personalizada</div>
                    <div className="text-xs text-muted-foreground mt-1">Atención directa a la medida</div>
                  </div>
                )}

                <div className="flex-1 mb-6">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${style.accentColor}`}>¿Qué incluye?</div>
                  <ul className="space-y-2.5">
                    {HARDCODED_FEATURES[pkg.name] ? (
                      HARDCODED_FEATURES[pkg.name].includes.map((item, j) => {
                        const IconComp = getIcon(item.icon)
                        return (
                          <li key={j} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                              <IconComp className="w-2.5 h-2.5" />
                            </div>
                            <span className="text-sm text-white/80 leading-snug">{item.text}</span>
                          </li>
                        )
                      })
                    ) : pkg.serviceItems && pkg.serviceItems.length > 0 ? (
                      pkg.serviceItems.map((item) => {
                        const IconComp = getIcon(item.icon)
                        return (
                          <li key={item.id} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                              <IconComp className="w-2 h-2" />
                            </div>
                            <span className="text-sm text-white/80 leading-snug">{item.name}</span>
                          </li>
                        )
                      })
                    ) : (
                      pkg.includes?.split(',').map((inc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                            <Check className="w-2 h-2" />
                          </div>
                          <span className="text-sm text-white/80 leading-snug">{inc.trim()}</span>
                        </li>
                      ))
                    )}
                  </ul>

                  {HARDCODED_FEATURES[pkg.name]?.notIncludes.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {HARDCODED_FEATURES[pkg.name].notIncludes.map((item, j) => (
                        <li key={j} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
                            <X className="w-2.5 h-2.5 text-white/30" />
                          </div>
                          <span className="text-xs text-white/30">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <a
                  href={isUnavailable ? undefined : waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-auto"
                >
                  <Button
                    disabled={isUnavailable}
                    className={`w-full h-12 font-black gap-2 cursor-pointer transition-all duration-300 ${
                      isUnavailable
                        ? "bg-neutral-800 border border-neutral-700/50 text-neutral-500 cursor-not-allowed"
                        : style.highlight
                          ? "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl shadow-[#25D366]/20 hover:scale-[1.02]"
                          : "bg-white/10 hover:bg-[#25D366] text-white hover:text-white border border-white/20 hover:border-[#25D366]"
                    }`}
                  >
                    {isUnavailable ? "No Disponible" : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Cotizar por WhatsApp</span>
                        <ArrowUpRight className="w-4 h-4 opacity-70" />
                      </>
                    )}
                  </Button>
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

