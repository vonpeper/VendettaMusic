"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import {
  Check, X, ChevronRight, MapPin, Sparkles, Music2,
  Mic2, Lightbulb, Users, Volume2, Monitor, Star,
  Plus, Minus, Loader2, ArrowRight, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { calcularViatcos } from "@/lib/viaticos"
import Image from "next/image"

// --- Datos de paquetes --------------------------------------------------------
const PACKAGES = [
  {
    id:    "61a5477c-de10-4788-a8bd-1dfa8b57d256",
    name:  "Essential",
    emoji: "🎸",
    tagline: "El show perfecto para eventos íntimos y celebraciones privadas.",
    gradient: "from-violet-900/70 via-violet-800/40 to-violet-900/30",
    border:   "border-violet-500/40 hover:border-violet-400/70",
    glow:     "shadow-violet-500/10",
    accentColor: "text-violet-300",
    badgeColor:  "bg-violet-500/20 text-violet-200 border-violet-400/30",
    highlight: false,
    basePrice: 7600,
    includes: [
      { icon: Volume2,    text: "Audio Electro-Voice (2 tops + 1 sub + consola digital)" },
      { icon: Music2,     text: "Backline completo (batería, amps, microfonía)" },
      { icon: Lightbulb,  text: "Iluminación básica RGB" },
      { icon: Users,      text: "4 integrantes + Ingeniero + Staff" },
      { icon: Music2,     text: "Repertorio Pop Rock (Inglés/Español)" },
      { icon: Sparkles,   text: "2 horas de show (2 sets)" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Iluminación robótica", "Viáticos"],
  },
  {
    id:    "clx-experience-id",
    name:  "Experience",
    emoji: "🎵",
    tagline: "Audio profesional para eventos medianos con toda la producción.",
    gradient: "from-red-900/80 via-rose-800/50 to-red-900/40",
    border:   "border-red-500/60",
    glow:     "shadow-red-500/20",
    accentColor: "text-red-300",
    badgeColor:  "bg-red-500/20 text-red-200 border-red-400/40",
    highlight: true,
    basePrice: 15500,
    includes: [
      { icon: Sparkles,  text: "Todo lo del paquete Essential" },
      { icon: Volume2,   text: "Audio profesional (100 a 300 personas)" },
      { icon: Volume2,   text: "Mejora en calidad y cobertura de sonido" },
      { icon: Mic2,      text: "Monitoreo inalámbrico profesional" },
      { icon: Music2,    text: "2 horas de show potente" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Viáticos"],
  },
  {
    id:    "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62",
    name:  "Festival Premium",
    emoji: "🏆",
    tagline: "La experiencia completa: producción a nivel concierto.",
    gradient: "from-amber-900/70 via-yellow-800/40 to-amber-900/30",
    border:   "border-amber-500/40 hover:border-amber-400/70",
    glow:     "shadow-amber-500/10",
    accentColor: "text-amber-300",
    badgeColor:  "bg-amber-500/20 text-amber-200 border-amber-400/30",
    highlight: false,
    basePrice: 25500,
    includes: [
      { icon: Sparkles,   text: "Todo lo del paquete Experience" },
      { icon: Monitor,    text: "Pantalla LED 3×2 m" },
      { icon: Lightbulb,  text: "Iluminación robótica avanzada" },
      { icon: Star,       text: "Templete (Escenario)" },
      { icon: Users,      text: "Producción completa tipo concierto" },
      { icon: Music2,     text: "2 horas de máxima experiencia" },
    ],
    notIncludes: ["Viáticos"],
  },
]

// --- Extras personalizables ---------------------------------------------------
const EXTRAS = [
  {
    id:      "show_hours",
    label:   "Horas de Show",
    desc:    "Mínimo 2 horas, máximo 5",
    icon:    "⏱",
    type:    "stepper",
    pricePerUnit: 4000,
    unit:    "hr",
    min: 2, max: 5,
    default: 2,
  },
  {
    id:      "dj_hours",
    label:   "DJ (hora)",
    desc:    "Música en recesos entre sets — excluye DJ+Pantallas",
    icon:    "🎧",
    type:    "stepper",
    pricePerUnit: 800,
    unit:    "hr",
    min: 0, max: 4,
    default: 0,
    mutuallyExcludes: "dj_tv_hours",
  },
  {
    id:      "dj_tv_hours",
    label:   "DJ + Pantallas 45\"",
    desc:    "Visuales en TVs durante el DJ set — excluye DJ simple",
    icon:    "📺",
    type:    "stepper",
    pricePerUnit: 1500,
    unit:    "hr",
    min: 0, max: 4,
    default: 0,
    mutuallyExcludes: "dj_hours",
  },
  {
    id:      "templete",
    label:   "Templete",
    desc:    "1.5m alto · 7m × 4m · Montaje incluido",
    icon:    "🏗️",
    type:    "toggle",
    price:   3500,
    default: false,
  },
  {
    id:      "pista",
    label:   "Pista Iluminada 25 m²",
    desc:    "Cuadros LED que pulsan con la música",
    icon:    "✨",
    type:    "toggle",
    price:   7500,
    default: false,
  },
  {
    id:      "audio_med",
    label:   "Audio 120 – 300 personas",
    desc:    "Sistema ampliado para eventos medianos",
    icon:    "🔊",
    type:    "toggle",
    price:   8000,
    default: false,
  },
  {
    id:      "audio_large",
    label:   "Audio 300 – 800 personas",
    desc:    "Line Array profesional para grandes eventos",
    icon:    "📢",
    type:    "toggle",
    price:   10000,
    default: false,
  },
]

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

// --- Modal de ubicación + precio ---------------------------------------------
function LocationModal({
  pkg,
  onClose,
  isCustom = false,
}: {
  pkg: (typeof PACKAGES)[0]
  onClose: () => void
  isCustom?: boolean
}) {
  const [city,         setCity]         = useState("")
  const [state,        setState]        = useState("Estado de México")
  const [checked,      setChecked]      = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [viaticos,     setViaticos]     = useState<{ isOutsideZone: boolean; amount: number; label: string; description: string } | null>(null)

  // Personalizador
  const [steppers, setSteppers] = useState<Record<string, number>>({
    show_hours: 2,
    dj_hours:   0,
    dj_tv_hours:0,
  })
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    templete:   false,
    pista:      false,
    audio_med:  false,
    audio_large:false,
  })

  // Detecta si hay algún extra seleccionado (para cobrar staff)
  function hasAnyExtra() {
    if (steppers.show_hours > 2)  return true
    if (steppers.dj_hours > 0)    return true
    if (steppers.dj_tv_hours > 0) return true
    return Object.values(toggles).some(Boolean)
  }

  const STAFF_FEE = 600

  function calcPrice() {
    const base = pkg.basePrice
    const viat = viaticos?.isOutsideZone ? viaticos.amount : 0
    const extraMult = viaticos?.isOutsideZone ? 1.20 : 1.00

    let extras = 0
    extras += (steppers.show_hours  - 2) * 4000  // horas extra sobre las 2 base
    extras += steppers.dj_hours     * 800
    extras += steppers.dj_tv_hours  * 1500
    if (toggles.templete)    extras += 3500
    if (toggles.pista)       extras += 7500
    if (toggles.audio_med)   extras += 8000
    if (toggles.audio_large) extras += 10000

    const staff = hasAnyExtra() ? STAFF_FEE : 0

    return {
      base:    Math.round(base   * extraMult),
      extras:  Math.round(extras * extraMult),
      staff,
      viaticos: viat,
      total:   Math.round((base + extras) * extraMult) + staff + viat,
    }
  }

  async function handleCheck() {
    if (!city.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // simular delay
    const result = calcularViatcos(city, state)
    setViaticos(result)
    setLoading(false)
    setChecked(true)
  }

  const price = calcPrice()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8 sticky top-0 bg-[#0d0d0d] z-10">
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
              {isCustom ? "Show Personalizado" : `Apartar fecha — ${pkg.emoji} ${pkg.name}`}
            </div>
            <h3 className="text-xl font-heading font-black text-white">
              ¿Dónde será tu evento?
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Ubicación */}
          {!checked ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa la ciudad o municipio del evento para calcular el precio final con viáticos.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-white">Ciudad / Municipio</label>
                  <Input
                    placeholder="Ej. Metepec, Toluca, CDMX..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCheck()}
                    className="bg-white/5 border-white/15 h-11"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-white">Estado</label>
                  <Input
                    placeholder="Estado de México"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="bg-white/5 border-white/15 h-11"
                  />
                </div>
              </div>
              <Button onClick={handleCheck} disabled={!city.trim() || loading} className="w-full h-12 font-bold">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando zona...</>
                  : <><MapPin className="w-4 h-4 mr-2" /> Verificar ubicación</>}
              </Button>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Zona local sin viáticos: Toluca, Metepec, Zinacantepec, Ocoyoacac, Lerma y Valle de Toluca.
              </p>
            </div>
          ) : (
            <>
              {/* Resultado ubicación */}
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${
                viaticos?.isOutsideZone
                  ? "border-yellow-500/40 bg-yellow-900/10"
                  : "border-green-500/40 bg-green-900/10"
              }`}>
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${viaticos?.isOutsideZone ? "text-yellow-400" : "text-green-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${viaticos?.isOutsideZone ? "text-yellow-300" : "text-green-300"}`}>
                    📍 {city} — {viaticos?.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{viaticos?.description}</div>
                </div>
                <button onClick={() => setChecked(false)} className="text-xs text-muted-foreground hover:text-white underline shrink-0">Cambiar</button>
              </div>

              {/* Personalizador (Solo para Arma tu Show) */}
              {isCustom && (
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Personaliza tu show
                  </h4>
                  <div className="space-y-2">
                    {EXTRAS.map(extra => {
                      const isOutside = viaticos?.isOutsideZone ?? false

                      if (extra.type === "stepper") {
                        const count   = steppers[extra.id] ?? 0
                        const isActive = count > 0
                        const unitPrice = Math.round((extra.pricePerUnit ?? 0) * (isOutside ? 1.20 : 1))

                        // Exclusividad mutua DJ ↔ DJ+Pantallas
                        const excludes   = (extra as any).mutuallyExcludes as string | undefined
                        const otherCount = excludes ? (steppers[excludes] ?? 0) : 0
                        const isDisabled = otherCount > 0

                        return (
                          <div key={extra.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                            isDisabled ? "border-white/5 bg-white/1 opacity-40" :
                            isActive   ? "border-primary/40 bg-primary/5" : "border-white/8 bg-white/2"
                          }`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xl shrink-0">{extra.icon}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-white leading-tight">{extra.label}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {isDisabled ? "⚠️ No disponible cuando se usa la otra opción de DJ" : extra.desc}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className="text-xs text-muted-foreground font-mono">
                                {MXN(unitPrice)}/hr
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setSteppers(p => ({ ...p, [extra.id]: Math.max(0, (p[extra.id] ?? 0) - 1) }))}
                                  disabled={isDisabled || count <= (extra.id === "show_hours" ? 2 : 0)}
                                  className="w-7 h-7 rounded-lg border border-white/15 hover:bg-white/10 flex items-center justify-center disabled:opacity-30"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-black text-white w-5 text-center">{count}</span>
                                <button
                                  onClick={() => setSteppers(p => ({ ...p, [extra.id]: Math.min(extra.max ?? 99, (p[extra.id] ?? 0) + 1) }))}
                                  disabled={isDisabled || count >= (extra.max ?? 99)}
                                  className="w-7 h-7 rounded-lg border border-white/15 hover:bg-white/10 flex items-center justify-center disabled:opacity-30"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // toggle
                      const isOn = toggles[extra.id] ?? false
                      const rawPrice = (extra as any).price as number
                      const unitPrice = Math.round(rawPrice * (isOutside ? 1.20 : 1))
                      return (
                        <button
                          key={extra.id}
                          onClick={() => setToggles(p => ({ ...p, [extra.id]: !p[extra.id] }))}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                            isOn ? "border-primary/40 bg-primary/5" : "border-white/8 bg-white/2 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{extra.icon}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white leading-tight">{extra.label}</div>
                              <div className="text-[10px] text-muted-foreground">{extra.desc}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-sm font-bold text-white">{MXN(unitPrice)}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isOn ? "border-primary bg-primary" : "border-white/30"
                            }`}>
                              {isOn && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resumen de precio */}
              <div className="bg-black/60 border border-white/8 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Resumen de precio</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paquete {pkg.name} ({viaticos?.isOutsideZone ? "+20% foráneo" : "zona local"})</span>
                  <span className="text-white font-bold">{MXN(price.base)}</span>
                </div>
                {price.extras > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Extras personalizados</span>
                    <span className="text-white font-bold">{MXN(price.extras)}</span>
                  </div>
                )}
                {price.staff > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      👷 Staff técnico adicional
                    </span>
                    <span className="text-white font-bold">{MXN(price.staff)}</span>
                  </div>
                )}
                {price.viaticos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400/80">Viáticos (3 vehículos + casetas)</span>
                    <span className="text-yellow-300 font-bold">{MXN(price.viaticos)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3 mt-1">
                  <span className="font-black text-white text-lg">Total estimado</span>
                  <span className="font-black text-primary text-2xl">{MXN(price.total)}</span>
                </div>
                {price.staff > 0 && (
                  <p className="text-[10px] text-blue-400/70 flex items-center gap-1">
                    ✓ Incluye $600 de staff técnico por personalización del show
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  * El precio final puede variar según la duración confirmada y condiciones específicas del evento.
                </p>
              </div>

              {/* CTA */}
              <Link href={`/cotizar?pkg=${pkg.id}&city=${encodeURIComponent(city)}&step=1`}>
                <Button size="lg" className="w-full h-14 font-black text-base gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Continuar y apartar fecha
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sección principal --------------------------------------------------------
export function PaquetesSection() {
  const [selectedPkg,  setSelectedPkg]  = useState<(typeof PACKAGES)[0] | null>(null)
  const [isCustomShow, setIsCustomShow] = useState(false)

  function openPackage(pkg: (typeof PACKAGES)[0], custom = false) {
    setIsCustomShow(custom)
    setSelectedPkg(pkg)
  }

  return (
    <>
      {selectedPkg && (
        <LocationModal
          pkg={selectedPkg}
          isCustom={isCustomShow}
          onClose={() => setSelectedPkg(null)}
        />
      )}

      <section id="paquetes" className="py-24 md:py-32 relative overflow-hidden">
        {/* Fondo foto concierto duotono */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover opacity-[0.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        {/* Glow decorativo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Encabezado */}
          <div className="text-center mb-16 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Nuestros Paquetes
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight uppercase mb-4 animated-title pr-4">
              Elige tu Show
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
              Producción de primer nivel sin costos ocultos. Presiona <strong className="text-white">Apartar Fecha</strong> para ver el precio según tu ubicación.
            </p>
          </div>

          {/* Cards de paquetes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 bg-gradient-to-br ${
                  pkg.gradient
                } ${
                  pkg.border
                } ${
                  pkg.highlight
                    ? `shadow-2xl ${pkg.glow} lg:-translate-y-5 scale-[1.03]`
                    : "hover:scale-[1.01] hover:shadow-xl"
                }`}
              >
                {pkg.highlight && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
                    pkg.badgeColor
                  }`}>
                    ★ Más Solicitado
                  </div>
                )}

                {/* Nombre */}
                <div className="mb-6">
                  <div className="text-3xl mb-2">{pkg.emoji}</div>
                  <h3 className={`font-heading font-black text-2xl mb-2 ${pkg.accentColor}`}>{pkg.name}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{pkg.tagline}</p>
                </div>

                {/* Incluye */}
                <div className="flex-1 mb-6">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${pkg.accentColor}`}>¿Qué incluye?</div>
                  <ul className="space-y-2.5">
                    {pkg.includes.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${pkg.badgeColor}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-sm text-white/80 leading-snug">{item.text}</span>
                      </li>
                    ))}
                  </ul>

                  {pkg.notIncludes.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {pkg.notIncludes.map((item, j) => (
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

                {/* CTA */}
                <Button
                  onClick={() => openPackage(pkg)}
                  className={`w-full h-12 font-black gap-2 ${
                    pkg.highlight
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  Apartar Fecha <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>


        </div>
      </section>
    </>
  )
}
