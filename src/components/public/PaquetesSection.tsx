"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import * as Icons from "lucide-react"

const {
  Check, X, Sparkles, ArrowUpRight
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
  description?: string | null
  serviceItems?: ServiceItem[]
  includes?: string | null
  exclusions?: string | null
  active?: boolean | null
  isCustom?: boolean | null
}

// Estilos visuales por defecto para paquetes (Glass Card 2026)
const PACKAGE_STLYES: Record<number, any> = {
  0: { // Primer paquete (Essential)
    emoji: "🎸",
    gradient: "from-white/[0.08] via-white/[0.03] to-[#7777FF]/[0.04]",
    border: "border-[#7777FF]/30 hover:border-[#7777FF]/60",
    glow: "shadow-[0_20px_45px_-12px_rgba(119,119,255,0.25)]",
    accentColor: "text-[#7777FF]",
    badgeColor: "bg-[#7777FF]/15 text-[#7777FF] border-[#7777FF]/40",
    buttonClass: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    highlight: false
  },
  1: { // Segundo paquete (Experience - Highlight)
    emoji: "🎵",
    gradient: "from-[#6F0D2B]/35 via-white/[0.05] to-[#FF5A5F]/15",
    border: "border-[#FF5A5F]/50 hover:border-[#FF5A5F]/80",
    glow: "shadow-[0_24px_55px_-10px_rgba(255,90,95,0.35)]",
    accentColor: "text-[#FF5A5F]",
    badgeColor: "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-[#F2F0EB] border-[#FF5A5F]/60 shadow-md shadow-[#FF5A5F]/20",
    buttonClass: "bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] border border-white/25 shadow-lg shadow-[#FF5A5F]/25 hover:shadow-[#FF5A5F]/40",
    highlight: true
  },
  2: { // Tercer paquete (Festival Premium)
    emoji: "🏆",
    gradient: "from-[#20D5E5]/15 via-white/[0.04] to-white/[0.01]",
    border: "border-[#20D5E5]/35 hover:border-[#20D5E5]/65",
    glow: "shadow-[0_20px_45px_-12px_rgba(32,213,229,0.25)]",
    accentColor: "text-[#20D5E5]",
    badgeColor: "bg-[#20D5E5]/15 text-[#20D5E5] border-[#20D5E5]/40",
    buttonClass: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
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
interface PaquetesSectionProps {
  dbPackages: PackageData[]
  adminWhatsapp?: string | null
  viaticosConfig?: any
}

export function PaquetesSection({ dbPackages }: PaquetesSectionProps) {
  return (
    <section id="paquetes" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#07080D] via-[#15152B]/90 to-[#42112D]">
      {/* Concert ambient lights and grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#7777FF]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FF5A5F]/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 text-[#FF5A5F] font-semibold text-xs uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Nuestros Paquetes
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-black tracking-tight uppercase mb-4 text-[#F2F0EB]">
            Elige tu <span className="text-gradient-encore">Show en Vivo</span>
          </h2>
          <p className="text-[#F2F0EB]/70 max-w-xl mx-auto text-base md:text-lg font-normal">
            Producción musical de gira para tu boda o evento. Consulta disponibilidad y cotiza de inmediato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {dbPackages.map((pkg, i) => {
            const style = PACKAGE_STLYES[i % 3] || PACKAGE_STLYES[0]
            const isUnavailable = pkg.active === false
            const isEssential = pkg.name.toLowerCase().includes("essent")
            const pkgSlug = pkg.name.toLowerCase().includes("experience")
              ? "experience"
              : pkg.name.toLowerCase().includes("festival")
                ? "festival"
                : "essential"
            
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-3xl p-7 transition-all duration-300 backdrop-blur-xl bg-gradient-to-br ${style.gradient} border ${
                  isUnavailable 
                    ? "border-neutral-800 opacity-60 filter grayscale-[40%] cursor-not-allowed" 
                    : style.border
                } ${
                  !isUnavailable && style.highlight ? `shadow-2xl ${style.glow} lg:-translate-y-5 scale-[1.03]` : "hover:scale-[1.01] hover:shadow-xl"
                }`}
              >
                {style.highlight && !isUnavailable && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-semibold uppercase tracking-widest px-4 py-1 rounded-full border ${style.badgeColor}`}>
                    ★ Más Solicitado
                  </div>
                )}
                {isUnavailable && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-neutral-400 text-[9px] font-semibold uppercase tracking-wider px-3.5 py-0.5 rounded-full border border-neutral-700">
                    No Disponible
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-3xl mb-2">{style.emoji}</div>
                  <h3 className={`font-sans font-black text-2xl mb-2 ${style.accentColor}`}>{pkg.name}</h3>
                  <p className="text-sm text-[#F2F0EB]/80 leading-relaxed font-normal">
                    {pkg.name.toLowerCase().includes("essent")
                      ? "Formato acústico y compacto para eventos íntimos y bodas boutique."
                      : pkg.name.toLowerCase().includes("experience")
                        ? "Show completo con refuerzo de audio y diseño de iluminación para salones."
                        : pkg.name.toLowerCase().includes("festival")
                          ? "Producción de gran escala con escenario, templete y show concert-grade."
                          : (pkg.description || "Experiencia musical en vivo para celebraciones inolvidables.")}
                  </p>
                </div>

                {/* Formato y Alcance Técnico (Sin Precios Abiertos) */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Formato</div>
                      <div className="text-sm font-bold text-white">
                        {pkg.name.toLowerCase().includes("essent")
                          ? "Boutique & Íntimo"
                          : pkg.name.toLowerCase().includes("experience")
                            ? "Full Band & Salón"
                            : "Concert-Grade"}
                      </div>
                      <div className="text-xs text-primary font-semibold mt-0.5">Show en vivo de 2 horas</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Aforo Sugerido</div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-block ${
                        pkg.name.toLowerCase().includes("experience")
                          ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                          : pkg.name.toLowerCase().includes("festival")
                            ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/30"
                            : "text-gray-300 bg-white/5 border-white/10"
                      }`}>
                        {pkg.name.toLowerCase().includes("essent")
                          ? "Hasta 100 inv."
                          : pkg.name.toLowerCase().includes("experience")
                            ? "100 a 300 inv."
                            : "+300 inv."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${style.accentColor}`}>Alcance y Equipamiento</div>
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

                {isUnavailable ? (
                  <Button
                    disabled
                    className="w-full h-12 font-semibold text-xs uppercase tracking-wider rounded-xl gap-2 mt-auto bg-neutral-800 border border-neutral-700/50 text-neutral-500 cursor-not-allowed"
                  >
                    No Disponible
                  </Button>
                ) : (
                  <Button
                    asChild
                    className={`w-full h-12 font-semibold text-xs uppercase tracking-wider rounded-xl gap-2 cursor-pointer transition-all duration-300 mt-auto group ${
                      style.highlight
                        ? "bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] hover:from-[#7e1032] hover:to-[#ff6d72] text-[#F2F0EB] shadow-xl shadow-[#FF5A5F]/25 hover:scale-[1.02] border border-white/20"
                        : "bg-white/10 hover:bg-white/20 text-[#F2F0EB] border border-white/20 hover:border-white/40 hover:scale-[1.01]"
                    }`}
                  >
                    <Link href={`/cotizar?paquete=${pkgSlug}`}>
                      <Sparkles className="w-4 h-4 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                      <span>Cotizar Paquete</span>
                      <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
