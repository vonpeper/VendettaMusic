"use client"

import { useState, useEffect } from "react"
import { FunnelData }  from "./FunnelWizard"
import { Button }      from "@/components/ui/button"
import { Check, Music2, Users, Clock, Monitor, Box, RadioTower, Sparkles } from "lucide-react"

const VENUE_TYPES = [
  { value: "salon",      label: "🏛️ Salón de Eventos",   desc: "Espacio interior con A/C" },
  { value: "terraza",    label: "🌿 Terraza",             desc: "Semi-exterior, cielo abierto" },
  { value: "jardin",     label: "🌳 Jardín / Hacienda",   desc: "Exterior amplio" },
  { value: "residencia", label: "🏠 Residencia Privada",  desc: "Casa particular" },
  { value: "bar",        label: "🍹 Restaurant / Bar",   desc: "Espacio comercial" },
  { value: "festival",   label: "🏟️ Festival / Público", desc: "Evento masivo o abierto" },
]

interface Props {
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number; maxDuration?: number; description: string | null; includes: string | null; isCustom?: boolean; active?: boolean }[]
  extras?: { id: string; name: string; setupCost: number; hourlyCost: number; description: string | null; active?: boolean }[]
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
}

export default function Step1_Paquete({ packages, extras = [], data, onNext }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<string>(data.packageId ?? "")
  const [guests,      setGuests]       = useState<number>(data.guestCount ?? 100)
  const [venueType,   setVenueType]    = useState<string>(data.venueType ?? "salon")
  const [bandHrs,     setBandHrs]      = useState<number>(data.bandHours ?? 2)
  const [djHrs,       setDjHrs]        = useState<number>(data.djHours ?? 0)
  const [djTvs,       setDjTvs]        = useState<boolean>(data.isDjWithTvs ?? false)
  const [promoCode,   setPromoCode]    = useState<string>(data.promoCode ?? "")
  const [error,       setError]        = useState("")

  // --- LOGICA DINAMICA DE SERVICIOS ADICIONALES (EXTRAS) ---
  const defaultExtras = [
    { id: "templete", name: "Templete", setupCost: 3800, hourlyCost: 0, description: "Un pago único" },
    { id: "pista", name: "Pista Iluminada", setupCost: 7500, hourlyCost: 0, description: "Un pago único" },
    { id: "robot", name: "Robot LED (Batucada)", setupCost: 700, hourlyCost: 0, description: "Un pago único" },
  ]
  const activeExtrasList = extras && extras.length > 0 ? extras : defaultExtras

  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(() => {
    const init: string[] = []
    if (data.hasTemplete) {
      const tId = activeExtrasList.find(e => e.name.toLowerCase().includes("templete") || e.name.toLowerCase().includes("escenario"))?.id || "templete"
      init.push(tId)
    }
    if (data.hasPista) {
      const pId = activeExtrasList.find(e => e.name.toLowerCase().includes("pista"))?.id || "pista"
      init.push(pId)
    }
    if (data.hasRobot) {
      const rId = activeExtrasList.find(e => e.name.toLowerCase().includes("robot") || e.name.toLowerCase().includes("batucada"))?.id || "robot"
      init.push(rId)
    }
    return init
  })

  const pkg = packages.find(p => p.id === selectedPkg)
  const isCustom = selectedPkg === "custom" || 
                   pkg?.isCustom === true || 
                   pkg?.name?.toLowerCase().includes("arma") ||
                   pkg?.name?.toLowerCase().includes("personal")
  
  const discountAmount = (promoCode.toUpperCase() === "CLIENTEVIP" && pkg?.name === "Essential") ? 1000 : 0

  const formatMXN = (v: number) => "$" + Math.round(v).toLocaleString("es-MX")

  // --- DETECTAR COSTOS DINÁMICOS DE BANDA, DJ Y AUDIO FEE ---
  const djExtra = activeExtrasList.find(e => e.name.toLowerCase().includes("dj") && !e.name.toLowerCase().includes("pantalla"))
  const djTvsExtra = activeExtrasList.find(e => e.name.toLowerCase().includes("dj") && e.name.toLowerCase().includes("pantalla"))
  const audioMediumExtra = activeExtrasList.find(e => e.name.toLowerCase().includes("audio") && (e.name.includes(">100") || e.name.toLowerCase().includes("pro")))
  const audioLargeExtra = activeExtrasList.find(e => e.name.toLowerCase().includes("audio") && (e.name.includes(">300") || e.name.toLowerCase().includes("festival")))

  const bandHourRate = pkg?.baseCostPerHour || 4000
  const djRateDefault = djExtra ? djExtra.hourlyCost : 800
  const djTvsRateDefault = djTvsExtra ? djTvsExtra.hourlyCost : 1500
  const audioMediumFee = audioMediumExtra ? audioMediumExtra.setupCost : 7500
  const audioLargeFee = audioLargeExtra ? audioLargeExtra.setupCost : 10000

  // Calclular precio total dinámico
  const calculateTotal = () => {
    if (!pkg) return 0
    
    let total = 0
    
    // 1. Banda (Tarifa especial para Arma tu Show - Leída dinámicamente del costo por hora del paquete en la BD)
    if (isCustom) {
      total = bandHourRate * bandHrs
    } else {
      total = (pkg.baseCostPerHour || 0) * (pkg.minDuration || 1)
    }

    // 2. Invitados (Audio Fee - Basado dinámicamente en los extras)
    if (guests > 300) {
      total += audioLargeFee
    } else if (guests > 100) {
      total += audioMediumFee
    }

    // 3. DJ (Basado dinámicamente en los extras)
    if (isCustom && djHrs > 0) {
      const djRate = djTvs ? djTvsRateDefault : djRateDefault
      total += djRate * djHrs
    }

    // 4. Extras dinámicos de la base de datos
    if (isCustom) {
      activeExtrasList.forEach(ex => {
        // Excluir rubros de DJ y Audio de la suma genérica (ya que se calculan arriba)
        const isDjOrAudio = ex.name.toLowerCase().includes("dj") || ex.name.toLowerCase().includes("audio upgrade")
        if (selectedExtraIds.includes(ex.id) && !isDjOrAudio) {
          total += (ex.setupCost || 0) + ((ex.hourlyCost || 0) * (bandHrs || 0))
        }
      })
    }

    return total - discountAmount
  }

  const currentTotal = calculateTotal()

  function handleNext() {
    if (!selectedPkg) { setError("Selecciona un paquete para continuar."); return }
    if (!venueType)   { setError("Selecciona el tipo de venue."); return }
    
    const pkg = packages.find(p => p.id === selectedPkg)!

    // Extraer booleanos basados en nombres de los extras seleccionados para compatibilidad
    const hasTempleteSelected = selectedExtraIds.some(id => {
      const ex = activeExtrasList.find(e => e.id === id)
      return ex?.name.toLowerCase().includes("templete") || ex?.name.toLowerCase().includes("escenario")
    })
    const hasPistaSelected = selectedExtraIds.some(id => {
      const ex = activeExtrasList.find(e => e.id === id)
      return ex?.name.toLowerCase().includes("pista")
    })
    const hasRobotSelected = selectedExtraIds.some(id => {
      const ex = activeExtrasList.find(e => e.id === id)
      return ex?.name.toLowerCase().includes("robot") || ex?.name.toLowerCase().includes("batucada")
    })
    
    onNext({
      packageId:    selectedPkg,
      packageName:  pkg.name,
      packagePrice: currentTotal,
      packageIncludes: pkg.includes || "",
      guestCount:   guests,
      venueType:    venueType,
      bandHours:    bandHrs,
      djHours:      djHrs,
      isDjWithTvs:  djTvs,
      hasTemplete:  hasTempleteSelected,
      hasPista:     hasPistaSelected,
      hasRobot:     hasRobotSelected, // mantenemos robot actual
      hasPantalla:  false, // Coming soon
      promoCode:    promoCode.toUpperCase(),
      discountAmount: discountAmount
    })
    setError("")
  }

  const sorted = [...packages].sort((a, b) =>
    (a.baseCostPerHour * a.minDuration) - (b.baseCostPerHour * b.minDuration)
  )

  const FEATURES: Record<string, string[]> = {
    "Essential":       ["🔊 Audio EV", "🎸 Backline", "💡 Ilum. Básica", "👥 4 Integrantes", "⏱️ 2 Horas"],
    "Experience":      ["🔊 Audio Pro", "🎤 Monitoreo Inalámbrico", "🎸 Backline Gira", "💡 Ilum. Expandida", "⏱️ 2 Horas"],
    "Festival Premium":["🖥️ Pantalla LED", "🤖 Robótica", "🏟️ Templete", "🎭 Producción", "⏱️ 2 Horas"],
    "Bar":             ["🔊 Audio EV", "🎸 Backline completo", "👥 4 Integrantes + Staff", "⏱️ 2x 45 min"],
  }

  return (
    <div className="space-y-8">
      {!isCustom && (
        <>
          <div>
            <h2 className="text-3xl font-heading font-black text-white tracking-tight">
              Elige tu <span className="text-primary">Experiencia</span>
            </h2>
            <p className="text-muted-foreground mt-2">Selecciona un paquete base o personaliza tu propio show.</p>
          </div>

          {/* Grid de Paquetes */}
          <div className="grid gap-3">
            {sorted.map(p => {
              const isSelect = selectedPkg === p.id
              const isUnavailable = p.active === false
              const features = FEATURES[p.name] ?? ["Opción personalizable"]
              const basePrice = p.baseCostPerHour * p.minDuration
              return (
                <button
                  key={p.id}
                  disabled={isUnavailable}
                  onClick={() => { 
                    if (isUnavailable) return;
                    setSelectedPkg(p.id); 
                    setError(""); 
                    // Si es un paquete estándar, reseteamos a sus horas mínimas
                    if (!["custom", "arma-tu-show"].includes(p.id) && 
                        !p.name.toLowerCase().includes("arma") && 
                        !p.name.toLowerCase().includes("personal")) {
                      setBandHrs(p.minDuration); 
                      setDjHrs(0); 
                    }
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition-all relative ${
                    isUnavailable
                      ? "border-white/5 bg-white/5 opacity-55 cursor-not-allowed filter grayscale-[30%]"
                      : isSelect
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-white/10 bg-card/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {p.name}
                        {p.name.includes("Premium") && <Sparkles className="w-3 h-3 text-primary" />}
                        {isUnavailable && (
                          <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                            No Disponible
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map(f => (
                          <span key={f} className={`text-[10px] border px-2 py-0.5 rounded capitalize ${
                            isUnavailable 
                              ? "bg-white/5 border-white/5 text-gray-500" 
                              : "bg-white/5 border-white/10 text-gray-400"
                          }`}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-xl font-black ${isUnavailable ? "text-neutral-500 line-through" : "text-white"}`}>
                         {p.name.toLowerCase().includes("arma") || p.name.toLowerCase().includes("custom") || p.id === "custom"
                           ? "$0" 
                           : `$${basePrice.toLocaleString()}`}
                       </div>
                       <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                         {p.name.toLowerCase().includes("arma") || p.name.toLowerCase().includes("custom") || p.id === "custom"
                           ? "Arma tu show" 
                           : "Desde"}
                       </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {isCustom && (
        <div className="mb-4">
          <h2 className="text-3xl font-heading font-black text-white tracking-tight">
            Arma tu <span className="text-primary">Show</span> 🎸
          </h2>
          <p className="text-muted-foreground mt-2">Configura cada detalle de tu evento. El precio se actualiza en tiempo real.</p>
        </div>
      )}

      {/* SECCIÓN DE PERSONALIZACIÓN - MOVIDA AL PRINCIPIO PARA VISIBILIDAD TOTAL */}
      {(isCustom || selectedPkg === "custom") && (
        <div className="space-y-8 p-6 bg-primary/5 border border-primary/20 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest mb-4">
            <Sparkles className="w-4 h-4" /> Personaliza tu experiencia
          </div>
          
          {/* Invitados y Audio logic */}
          <div className="space-y-4">
            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> 1. Audio por Invitados
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min={20} max={500} step={10} 
                value={guests} 
                onChange={e => setGuests(parseInt(e.target.value))}
                className="flex-1 accent-red-600"
              />
              <div className="w-20 text-center bg-black/40 rounded-xl p-2 border border-white/10">
                <div className="text-xl font-black text-white">{guests}</div>
                <div className="text-[9px] text-gray-500 uppercase">Per.</div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {guests <= 100 ? "✓ Audio estándar incluido (Hasta 100 personas)." : 
               guests <= 300 ? `⚠️ Upgrade de audio Pro necesario (+${formatMXN(audioMediumFee)}).` : 
               `🔥 Sistema Line Array Festival necesario (+${formatMXN(audioLargeFee)}).`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
            {/* Banda y DJ Horas */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> 2. Horas de Show (Banda)
                </label>
                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit">
                  <Button variant="ghost" size="icon" onClick={() => setBandHrs(Math.max(pkg?.minDuration || 2, bandHrs - 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">-</Button>
                  <span className="text-xl font-black text-white w-10 text-center">{bandHrs}h</span>
                  <Button variant="ghost" size="icon" onClick={() => setBandHrs(Math.min(pkg?.maxDuration || 5, bandHrs + 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">+</Button>
                </div>
                <p className="text-[10px] text-gray-500 font-bold tracking-tight">* Mínimo {pkg?.minDuration || 2} horas para contratación. Máximo {pkg?.maxDuration || 5} horas.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-primary" /> 3. Horas de DJ
                </label>
                {(djExtra as any)?.active === false ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-black/25 p-2 rounded-2xl border border-white/5 w-fit opacity-50 cursor-not-allowed">
                      <Button variant="ghost" size="icon" disabled className="h-8 w-8 rounded-full border border-white/10">-</Button>
                      <span className="text-xl font-black text-gray-500 w-10 text-center">0h</span>
                      <Button variant="ghost" size="icon" disabled className="h-8 w-8 rounded-full border border-white/10">+</Button>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase inline-block">
                      No Disponible
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit">
                      <Button variant="ghost" size="icon" onClick={() => setDjHrs(Math.max(0, djHrs - 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">-</Button>
                      <span className="text-xl font-black text-white w-10 text-center">{djHrs}h</span>
                      <Button variant="ghost" size="icon" onClick={() => setDjHrs(Math.min(5, djHrs + 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">+</Button>
                    </div>
                    {djHrs > 0 && (
                      (djTvsExtra as any)?.active === false ? (
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-not-allowed opacity-50 group mt-2">
                          <input type="checkbox" disabled checked={false} className="w-4 h-4 rounded" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-500">¿Incluir 2 Pantallas LED de 45"?</span>
                            <span className="text-[9px] text-red-400 font-black">No disponible</span>
                          </div>
                        </label>
                      ) : (
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group mt-2">
                          <input type="checkbox" checked={djTvs} onChange={e => setDjTvs(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">¿Incluir 2 Pantallas LED de 45"?</span>
                            <span className="text-[9px] text-primary font-black">+{formatMXN(djTvsRateDefault - djRateDefault)} por hora extra</span>
                          </div>
                        </label>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Equipamiento */}
            <div className="space-y-4">
              <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> 4. Equipamiento y Base
              </label>
              <div className="grid grid-cols-1 gap-2">
                 {/* Ítem fijo de horas base de la banda, dinámico según baseCostPerHour y minDuration del paquete */}
                 <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary bg-primary/20 shadow-lg shadow-primary/10 cursor-default">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        <span className="text-xs font-black text-white uppercase tracking-tighter">
                          {pkg?.minDuration || 2} Horas de Música en Vivo
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">Contratación mínima obligatoria</span>
                    </div>
                    <span className="text-xs text-primary font-black">
                      {formatMXN(bandHourRate * (pkg?.minDuration || 2))}
                    </span>
                 </div>

                 {activeExtrasList.map(ex => {
                   // Excluir rubros de DJ, Audio y Hora Extra de la lista (se manejan arriba)
                   const isDjOrAudio = ex.name.toLowerCase().includes("dj") || ex.name.toLowerCase().includes("audio upgrade")
                   const isHoraExtra = ex.name.toLowerCase().includes("hora extra") || ex.name.toLowerCase().includes("hora adicional")
                   if (isDjOrAudio || isHoraExtra) return null

                   const isSel = selectedExtraIds.includes(ex.id)
                   const isExtraUnavailable = (ex as any).active === false
                   const setup = ex.setupCost || 0
                   const hourly = ex.hourlyCost || 0
                   
                   // Formato limpio del precio
                   let priceDisplay: string
                   if (setup > 0 && hourly > 0) {
                     // Muestra el costo proyectado total (setup + hourly × horas)
                     const projected = setup + (hourly * bandHrs)
                     priceDisplay = `+${formatMXN(projected)}`
                   } else if (hourly > 0) {
                     // Solo costo por hora — muestra proyectado
                     priceDisplay = `+${formatMXN(hourly * bandHrs)}`
                   } else {
                     // Solo pago único
                     priceDisplay = `+${formatMXN(setup)}`
                   }

                   return (
                    <button 
                      key={ex.id}
                      type="button"
                      disabled={isExtraUnavailable}
                      onClick={() => {
                        if (isExtraUnavailable) return
                        setSelectedExtraIds(prev => 
                          prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                        )
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left relative ${
                        isExtraUnavailable
                          ? "border-white/5 bg-white/5 opacity-55 cursor-not-allowed filter grayscale-[30%]"
                          : isSel 
                            ? "border-primary bg-primary/20 shadow-lg shadow-primary/10" 
                            : "border-white/5 bg-black/40 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase tracking-tighter">{ex.name}</span>
                          {isExtraUnavailable && (
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                              Agotado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {ex.description || (hourly > 0 ? "Precio variable por hora" : "Un pago único")}
                        </span>
                      </div>
                      <span className={`text-xs font-black ${isExtraUnavailable ? "text-neutral-500 line-through" : "text-primary"}`}>
                        {isExtraUnavailable ? "No disponible" : priceDisplay}
                      </span>
                    </button>
                   )
                 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selección de Venue (Tipo de Lugar) */}
      <div className="space-y-4">
        <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          🏢 Tipo de Venue
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {VENUE_TYPES.map(vt => (
            <button
              key={vt.value}
              onClick={() => { setVenueType(vt.value); setError(""); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                venueType === vt.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-white/10 bg-card/40 hover:border-white/20"
              }`}
            >
              <div className="font-bold text-white text-xs">{vt.label}</div>
              <div className="text-[9px] text-muted-foreground mt-1 leading-tight">{vt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Código de Descuento */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          🎫 ¿Tienes un código promocional?
        </label>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Introduce tu código"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-gray-600 focus:border-primary/50 outline-none transition-all uppercase"
          />
        </div>
        {promoCode.toUpperCase() === "CLIENTEVIP" && (
          <div className={`text-[11px] font-bold flex items-center gap-1.5 ${pkg?.name === 'Essential' ? 'text-green-400' : 'text-yellow-500'}`}>
            {pkg?.name === 'Essential' ? (
              <>✅ Código CLIENTEVIP aplicado: -$1,000 de descuento.</>
            ) : (
              <>⚠️ El código es válido pero solo aplica para el paquete Essential.</>
            )}
          </div>
        )}
      </div>

      {/* Footer del Paso */}
      <div className="sticky bottom-4 z-20 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-black text-white">
            {currentTotal === 0 ? "SIN COSTO" : `$${currentTotal.toLocaleString()}`}
          </div>
          <div className="text-[9px] text-primary font-black uppercase tracking-widest">Total Estimado</div>
        </div>
        <Button onClick={handleNext} className="h-14 px-8 font-black text-base rounded-2xl flex-1 max-w-[200px]">
          Continuar →
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
    </div>
  )
}
