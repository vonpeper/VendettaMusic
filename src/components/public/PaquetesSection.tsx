"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import * as Icons from "lucide-react"
import Link from "next/link"
import { calcularViatcos } from "@/lib/viaticos"
import Image from "next/image"

const {
  Check, X, ChevronRight, MapPin, Sparkles, Music2,
  Mic2, Lightbulb, Users, Volume2, Monitor, Star,
  Plus, Minus, Loader2, ArrowRight, AlertCircle, Zap
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
}

// Estilos visuales por defecto para paquetes (se pueden personalizar en el futuro)
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

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

// --- Modal de ubicación + precio ---------------------------------------------
function LocationModal({
  pkg,
  onClose,
  isCustom = false,
}: {
  pkg: PackageData & { emoji?: string; accentColor?: string; badgeColor?: string }
  onClose: () => void
  isCustom?: boolean
}) {
  const [city,         setCity]         = useState("")
  const [state,        setState]        = useState("Estado de México")
  const [checked,      setChecked]      = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [viaticos,     setViaticos]     = useState<{ isOutsideZone: boolean; amount: number; label: string; description: string } | null>(null)
  const [isLocating,   setIsLocating]   = useState(false)

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        if (!res.ok) throw new Error("Error")
        const data = await res.json()
        const geoCity = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ""
        const geoState = data.address?.state || ""
        if (geoCity) setCity(geoCity)
        if (geoState) setState(geoState)
      } catch (err) {
        console.error("Geolocate error:", err)
      } finally {
        setIsLocating(false)
      }
    }, () => setIsLocating(false), { timeout: 10000 })
  }

  function calcPrice() {
    const base = pkg.baseCostPerHour * pkg.minDuration
    const viat = viaticos?.isOutsideZone ? viaticos.amount : 0
    const extraMult = viaticos?.isOutsideZone ? 1.20 : 1.00
    return {
      base:    Math.round(base * extraMult),
      viaticos: viat,
      total:   Math.round(base * extraMult) + viat,
    }
  }

  async function handleCheck() {
    if (!city.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = calcularViatcos(city, state)
    setViaticos(result)
    setLoading(false)
    setChecked(true)
  }

  const price = calcPrice()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/8 sticky top-0 bg-[#0d0d0d] z-10">
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
              Apartar fecha — {pkg.emoji || "✨"} {pkg.name}
            </div>
            <h3 className="text-xl font-heading font-black text-white">¿Dónde será tu evento?</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!checked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ingresa la ubicación para calcular viáticos y precio final.</p>
                <Button variant="outline" size="sm" onClick={handleGeolocate} disabled={isLocating} className="h-8 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                  {isLocating ? "📍 Localizando..." : "📍 Autocompletar"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ej. Metepec, Toluca..." value={city} onChange={e => setCity(e.target.value)} className="bg-white/5 border-white/15 h-11" />
                <Input placeholder="Estado de México" value={state} onChange={e => setState(e.target.value)} className="bg-white/5 border-white/15 h-11" />
              </div>
              <Button onClick={handleCheck} disabled={!city.trim() || loading} className="w-full h-12 font-bold">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />} Verificar ubicación
              </Button>
            </div>
          ) : (
            <>
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${viaticos?.isOutsideZone ? "border-yellow-500/40 bg-yellow-900/10" : "border-green-500/40 bg-green-900/10"}`}>
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${viaticos?.isOutsideZone ? "text-yellow-400" : "text-green-400"}`} />
                <div className="flex-1">
                  <div className={`font-bold text-sm ${viaticos?.isOutsideZone ? "text-yellow-300" : "text-green-300"}`}>📍 {city} — {viaticos?.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{viaticos?.description}</div>
                </div>
                <button onClick={() => setChecked(false)} className="text-xs text-muted-foreground hover:text-white underline">Cambiar</button>
              </div>

              <div className="bg-black/60 border border-white/8 rounded-2xl p-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paquete {pkg.name} ({pkg.minDuration}h)</span>
                  <span className="text-white font-bold">{MXN(price.base)}</span>
                </div>
                {price.viaticos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400/80">Viáticos (Logística + Transporte)</span>
                    <span className="text-yellow-300 font-bold">{MXN(price.viaticos)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3 mt-1">
                  <span className="font-black text-white text-lg">Total estimado</span>
                  <span className="font-black text-primary text-2xl">{MXN(price.total)}</span>
                </div>
              </div>

              <Link href={`/cotizar?pkg=${pkg.id}&city=${encodeURIComponent(city)}&step=1`}>
                <Button size="lg" className="w-full h-14 font-black text-base gap-2">
                  <ArrowRight className="w-5 h-5" /> Continuar y apartar fecha
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function PaquetesSection({ dbPackages }: { dbPackages: PackageData[] }) {
  const [selectedPkg, setSelectedPkg] = useState<any>(null)

  return (
    <>
      {selectedPkg && (
        <LocationModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
        />
      )}

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
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight uppercase mb-4 animated-title pr-4">
              Elige tu Show
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
              Producción de primer nivel sin costos ocultos. Presiona <strong className="text-white">Apartar Fecha</strong> para ver el precio según tu ubicación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {dbPackages.map((pkg, i) => {
              const style = PACKAGE_STLYES[i % 3] || PACKAGE_STLYES[0]
              
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 bg-gradient-to-br ${style.gradient} ${style.border} ${
                    style.highlight ? `shadow-2xl ${style.glow} lg:-translate-y-5 scale-[1.03]` : "hover:scale-[1.01] hover:shadow-xl"
                  }`}
                >
                  {style.highlight && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border ${style.badgeColor}`}>
                      ★ Más Solicitado
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="text-3xl mb-2">{style.emoji}</div>
                    <h3 className={`font-heading font-black text-2xl mb-2 ${style.accentColor}`}>{pkg.name}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="flex-1 mb-6">
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${style.accentColor}`}>¿Qué incluye?</div>
                    <ul className="space-y-2.5">
                      {pkg.serviceItems.map((item) => {
                        const IconComp = getIcon(item.icon)
                        return (
                          <li key={item.id} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                              <IconComp className="w-2 h-2" />
                            </div>
                            <span className="text-sm text-white/80 leading-snug">{item.name}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <Button
                    onClick={() => setSelectedPkg({ ...pkg, ...style })}
                    className={`w-full h-12 font-black gap-2 ${
                      style.highlight ? "bg-red-600 hover:bg-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    Apartar Fecha <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
