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
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number; description: string | null; includes: string | null }[]
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
}

export default function Step1_Paquete({ packages, data, onNext }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<string>(data.packageId ?? "")
  const [guests,      setGuests]       = useState<number>(data.guestCount ?? 100)
  const [venueType,   setVenueType]    = useState<string>(data.venueType ?? "salon")
  const [bandHrs,     setBandHrs]      = useState<number>(data.bandHours ?? 2)
  const [djHrs,       setDjHrs]        = useState<number>(data.djHours ?? 0)
  const [djTvs,       setDjTvs]        = useState<boolean>(data.isDjWithTvs ?? false)
  const [templete,    setTemplete]     = useState<boolean>(data.hasTemplete ?? false)
  const [pista,       setPista]        = useState<boolean>(data.hasPista ?? false)
  const [robot,       setRobot]        = useState<boolean>(data.hasRobot ?? false)
  const [promoCode,   setPromoCode]    = useState<string>(data.promoCode ?? "")
  const [error,       setError]        = useState("")

  const pkg = packages.find(p => p.id === selectedPkg)
  const isCustom = selectedPkg === "custom" || 
                   pkg?.isCustom === true || 
                   pkg?.name?.toLowerCase().includes("arma") ||
                   pkg?.name?.toLowerCase().includes("personal")
  
  const discountAmount = (promoCode.toUpperCase() === "CLIENTEVIP" && pkg?.name === "Essential") ? 1000 : 0

  // Calclular precio total dinámico
  const calculateTotal = () => {
    if (!pkg) return 0
    
    let total = 0
    
    // 1. Banda (Tarifa especial para Arma tu Show: $4,000/hr)
    if (isCustom) {
      total = 4000 * bandHrs
    } else {
      total = (pkg.baseCostPerHour || 0) * (pkg.minDuration || 1)
    }

    // 2. Invitados (Audio Fee - Solo si no es local, o basado en reglas de audio)
    // El usuario menciona que viáticos no están incluídos, pero el audio fee se mantiene por capacidad
    if (guests > 300) {
      total += 10000
    } else if (guests > 100) {
      total += 7500
    }

    // 3. DJ
    if (isCustom && djHrs > 0) {
      const djRate = djTvs ? 1500 : 800
      total += djRate * djHrs
    }

    // 4. Extras
    if (isCustom) {
      if (templete) total += 3800
      if (pista)    total += 7500
      if (robot)    total += 700
    }

    return total - discountAmount
  }

  const currentTotal = calculateTotal()

  function handleNext() {
    if (!selectedPkg) { setError("Selecciona un paquete para continuar."); return }
    if (!venueType)   { setError("Selecciona el tipo de venue."); return }
    
    const pkg = packages.find(p => p.id === selectedPkg)!
    
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
      hasTemplete:  templete,
      hasPista:     pista,
      hasRobot:     robot,
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
              const features = FEATURES[p.name] ?? ["Opción personalizable"]
              const basePrice = p.baseCostPerHour * p.minDuration
              return (
                <button
                  key={p.id}
                  onClick={() => { 
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
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelect
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-white/10 bg-card/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {p.name}
                        {p.name.includes("Premium") && <Sparkles className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map(f => (
                          <span key={f} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 capitalize">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-black text-white">
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
               guests <= 300 ? "⚠️ Upgrade de audio Pro necesario (+$7,500)." : 
               "🔥 Sistema Line Array Festival necesario (+$10,000)."}
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
                  <Button variant="ghost" size="icon" onClick={() => setBandHrs(Math.max(2, bandHrs - 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">-</Button>
                  <span className="text-xl font-black text-white w-10 text-center">{bandHrs}h</span>
                  <Button variant="ghost" size="icon" onClick={() => setBandHrs(bandHrs + 1)} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">+</Button>
                </div>
                <p className="text-[10px] text-gray-500 font-bold tracking-tight">* Mínimo 2 horas para contratación.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-primary" /> 3. Horas de DJ
                </label>
                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit">
                  <Button variant="ghost" size="icon" onClick={() => setDjHrs(Math.max(0, djHrs - 1))} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">-</Button>
                  <span className="text-xl font-black text-white w-10 text-center">{djHrs}h</span>
                  <Button variant="ghost" size="icon" onClick={() => setDjHrs(djHrs + 1)} className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary/20">+</Button>
                </div>
                {djHrs > 0 && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group mt-2">
                    <input type="checkbox" checked={djTvs} onChange={e => setDjTvs(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">¿Incluir 2 Pantallas LED de 45"?</span>
                      <span className="text-[9px] text-primary font-black">+$700 por hora extra</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Equipamiento */}
            <div className="space-y-4">
              <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> 4. Equipamiento y Base
              </label>
              <div className="grid grid-cols-1 gap-2">
                 {/* Ítem fijo de 2 horas base */}
                 <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary bg-primary/20 shadow-lg shadow-primary/10 cursor-default">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        <span className="text-xs font-black text-white uppercase tracking-tighter">2 Horas de Música en Vivo</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Contratación mínima obligatoria</span>
                    </div>
                    <span className="text-xs text-primary font-black">$8,000</span>
                 </div>

                 {[
                   { id: 'templete', label: 'Templete', price: 3800, state: templete, set: setTemplete },
                   { id: 'pista', label: 'Pista Iluminada', price: 7500, state: pista, set: setPista },
                   { id: 'robot', label: 'Robot LED (Batucada)', price: 700, state: robot, set: setRobot },
                 ].map(ex => (
                  <button 
                    key={ex.id}
                    onClick={() => ex.set(!ex.state)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      ex.state 
                        ? "border-primary bg-primary/20 shadow-lg shadow-primary/10" 
                        : "border-white/5 bg-black/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black text-white uppercase tracking-tighter">{ex.label}</span>
                      <span className="text-[10px] text-gray-500">Un pago único</span>
                    </div>
                    <span className="text-xs text-primary font-black">+${ex.price.toLocaleString()}</span>
                  </button>
                 ))}
                 <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/10 opacity-40 grayscale cursor-not-allowed">
                    <span className="text-xs font-bold text-gray-600">Pantalla LED 3x2</span>
                    <span className="text-[9px] text-gray-600 uppercase tracking-tighter">Próximamente</span>
                 </div>
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
