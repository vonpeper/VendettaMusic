"use client"

import { useState, useEffect } from "react"
import { FunnelData }  from "./FunnelWizard"
import { Button }      from "@/components/ui/button"
import { Input }       from "@/components/ui/input"
import { Label }       from "@/components/ui/label"
import { MapPin, AlertTriangle, CheckCircle2, Car, ExternalLink } from "lucide-react"
import { ESTADOS_MUNICIPIOS } from "@/lib/municipios"

interface Props {
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
  onBack: () => void
  viaticosConfig?: {
    zona2Rate?: number
    zona3Rate?: number
    zona2Cities?: string
    zona3Cities?: string
  }
}

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

export default function Step2_Ubicacion({ data, onNext, onBack, viaticosConfig }: Props) {
  const [street,      setStreet]      = useState(data.street      ?? "")
  const [houseNumber, setHouseNumber] = useState(data.houseNumber ?? "")
  const [colonia,     setColonia]     = useState(data.colonia     ?? "")
  const [zipCode,     setZipCode]     = useState(data.zipCode     ?? "")
  const [city,        setCity]        = useState(data.city        ?? "")
  const [state,       setState]       = useState(data.state       ?? "Estado de México")
  const [mapsLink,    setMapsLink]    = useState(data.mapsLink    ?? "")
  const [isPublic,    setIsPublic]    = useState(data.isPublic    ?? (data.venueType === "bar" || data.venueType === "festival"))
  
  // Detectar si la ciudad actual no pertenece a la lista de municipios sugeridos para el estado actual
  const [isManualCity, setIsManualCity] = useState(
    data.city === "Otro municipio / cotización manual" || 
    (data.city ? !(ESTADOS_MUNICIPIOS[data.state ?? "Estado de México"] || []).includes(data.city) : false)
  )

  const [vehicleKey, setVehicleKey] = useState(data.vehicleType ?? "escape_2014")
  const [viaticos, setViaticos] = useState(null as any)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Auto‑verificar si cambian ciudad o vehículo y obtener viáticos vía API
  useEffect(() => {
    const fetchViaticos = async () => {
      if (!city || city.trim().length <= 2) {
        setViaticos(null)
        return
      }
      setLoading(true)
      try {
        const destination = `${city}, ${state}`
        const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(destination)}&vehicle=${vehicleKey}`)
        const resData = await resp.json()
        if (!resp.ok || resData.error) {
          console.error('Error viáticos API', resData)
          setViaticos(null)
          return
        }
        
        const { viaticosAmount, tollCost, fuelCost, distanceKm, durationSec, requiresManualQuote, label, description } = resData
        
        setViaticos({
          isOutsideZone: viaticosAmount > 0 || requiresManualQuote,
          amount: viaticosAmount,
          fuelCost: fuelCost || 0,
          tollCost: tollCost || 0,
          distanceKm: distanceKm || 0,
          durationSec: durationSec || 0,
          requiresManualQuote: !!requiresManualQuote,
          label: requiresManualQuote 
            ? 'Logística Extendida (Cotización Personalizada)' 
            : (label || (viaticosAmount > 0 ? 'Viáticos' : 'Zona 1 (Local - Sin viáticos)')),
          description: requiresManualQuote
            ? 'Este destino requiere cotización personalizada por logística extendida.'
            : (description || `Distancia ${distanceKm?.toFixed(1) ?? '-'} km, Peaje ${tollCost ?? 0} MXN`)
        })
      } catch (e) {
        console.error('Fetch viáticos failed', e)
        setViaticos(null)
      } finally {
        setLoading(false)
      }
    }
    fetchViaticos()
  }, [city, state, vehicleKey, viaticosConfig])

  function handleNext() {
    if (!city || !city.trim()) { 
      setError("Ingresa el municipio para calcular viáticos.")
      return 
    }
    if (!viaticos) { 
      setError("Escribe la ciudad para calcular viáticos o espera a que se complete el cálculo.")
      return 
    }
    
    onNext({
      street,
      houseNumber,
      colonia,
      zipCode,
      city,
      municipio: city,
      state,
      address: `${street} ${houseNumber}, Col. ${colonia}, CP ${zipCode}, ${city}, ${state}`,
      isOutsideZone:  viaticos.isOutsideZone,
      viaticosAmount: viaticos.amount,
      viaticosLabel:  viaticos.label,
      mapsLink:       mapsLink.trim() || undefined,
      isPublic,
      vehicleType:    vehicleKey,
      // Nuevos campos detallados
      distanceKm:     viaticos.distanceKm,
      durationSec:    viaticos.durationSec,
      tollCost:       viaticos.tollCost,
      fuelCost:       viaticos.fuelCost,
      requiresManualQuote: viaticos.requiresManualQuote
    })
  }

  const totalConViaticos = (data.packagePrice ?? 0) + (viaticos?.amount ?? 0)

  return (
    <div>
      {/* Resumen de Paquete Seleccionado */}
      <div className="mb-8 p-6 rounded-[2rem] border border-primary/20 bg-primary/5 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle2 className="w-24 h-24 text-primary" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Paquete Seleccionado</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{data.packageName}</h3>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">{MXN(data.packagePrice ?? 0)}</div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold">Precio Base</div>
            </div>
          </div>

          {data.packageIncludes && (
            <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Lo que incluye:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {data.packageIncludes.split(/[,\n]/).filter(item => item.trim()).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    <span>{item.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 mb-6">
        {/* Zona Check (Municipio/Estado) */}
        <div className="bg-card/30 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <MapPin className="w-3 h-3" /> 1. Verificación de Zona
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-white font-bold text-xs uppercase tracking-wider">Estado</Label>
              <div className="relative">
                <select
                  id="state"
                  value={state}
                  onChange={e => { 
                    const val = e.target.value
                    setState(val)
                    setCity("")
                    setIsManualCity(false)
                    setError("")
                  }}
                  className="w-full bg-[#161616]/80 border border-white/15 h-12 px-3 text-base focus:border-primary focus:outline-none rounded-xl text-white cursor-pointer appearance-none pr-10"
                >
                  {Object.keys(ESTADOS_MUNICIPIOS).map(st => (
                    <option key={st} value={st} className="bg-[#161616] text-white">{st}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {isManualCity ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="city" className="text-white font-bold text-xs uppercase tracking-wider">Escribe tu municipio</Label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsManualCity(false)
                      setCity("")
                      setError("")
                    }}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    Elegir de la lista
                  </button>
                </div>
                <Input
                  id="city"
                  value={city === "Otro municipio / cotización manual" ? "" : city}
                  onChange={e => { 
                    setCity(e.target.value)
                    setError("")
                  }}
                  placeholder="Ej. Metepec"
                  className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="city" className="text-white font-bold text-xs uppercase tracking-wider">Municipio / Delegación</Label>
                <div className="relative">
                  <select
                    id="city"
                    value={city}
                    onChange={e => { 
                      const val = e.target.value
                      if (val === "Otro municipio / cotización manual") {
                        setIsManualCity(true)
                        setCity("")
                      } else {
                        setCity(val)
                      }
                      setError("")
                    }}
                    className="w-full bg-[#161616]/80 border border-white/15 h-12 px-3 text-base focus:border-primary focus:outline-none rounded-xl text-white cursor-pointer appearance-none pr-10"
                  >
                    <option value="" disabled className="bg-[#161616] text-white">Selecciona...</option>
                    {(ESTADOS_MUNICIPIOS[state] || []).map(m => (
                      <option key={m} value={m} className="bg-[#161616] text-white">{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dirección Física */}
        <div className="bg-card/30 p-5 rounded-2xl border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
             <MapPin className="w-3 h-3" /> 2. Detalles de la Dirección
           </div>
           <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street" className="text-white font-bold text-xs uppercase tracking-wider">Calle</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={e => { setStreet(e.target.value); setError("") }}
                  placeholder="Ej. Av. Juárez"
                  className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseNumber" className="text-white font-bold text-xs uppercase tracking-wider">Número</Label>
                <Input
                  id="houseNumber"
                  value={houseNumber}
                  onChange={e => { setHouseNumber(e.target.value); setError("") }}
                  placeholder="123"
                  className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="colonia" className="text-white font-bold text-xs uppercase tracking-wider">Colonia</Label>
              <Input
                id="colonia"
                value={colonia}
                onChange={e => { setColonia(e.target.value); setError("") }}
                placeholder="Ej. Centro"
                className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-white font-bold text-xs uppercase tracking-wider">Código Postal</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={e => { setZipCode(e.target.value); setError("") }}
                placeholder="Ej. 52140"
                className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Google Maps Link */}
        <div className="bg-card/30 p-5 rounded-2xl border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
             <ExternalLink className="w-3 h-3" /> 3. Ubicación Digital (Opcional)
           </div>
           <div className="space-y-2">
             <Label htmlFor="mapsLink" className="text-white font-bold text-xs uppercase tracking-wider">Link de Google Maps</Label>
             <Input
               id="mapsLink"
               value={mapsLink}
               onChange={e => setMapsLink(e.target.value)}
               placeholder="https://goo.gl/maps/..."
               className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
             />
             <p className="text-[9px] text-gray-500 font-medium">Pegar el link compartido de Maps nos ayuda a llegar más rápido.</p>
           </div>
        </div>

        {/* Visibilidad del Evento */}
        <div className="bg-card/30 p-5 rounded-2xl border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
             <CheckCircle2 className="w-3 h-3" /> 4. Visibilidad en Agenda
           </div>
           <label className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-black/20 cursor-pointer hover:bg-white/[0.03] transition-all group">
             <div className="pt-0.5">
               <input 
                 type="checkbox" 
                 checked={isPublic} 
                 onChange={e => setIsPublic(e.target.checked)}
                 className="w-4 h-4 accent-primary rounded" 
               />
             </div>
             <div className="flex-1">
               <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">¿Es un evento abierto al público?</div>
               <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                 Si lo marcas como público (ej. un show en un Bar o Festival), aparecerá en nuestra agenda con el nombre del lugar y dirección para que tus invitados nos encuentren. Si es privado, solo mostraremos el municipio.
               </p>
             </div>
           </label>
        </div>
      </div>

      {/* Cargando viáticos */}
      {loading && (
        <div className="flex items-center justify-center py-4 text-sm text-primary/70 animate-pulse font-bold">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calculando viáticos en tiempo real...
        </div>
      )}

      {/* Resultado de viáticos */}
      {viaticos && !loading && (
        <div className={`rounded-[2rem] border p-6 mb-8 transition-all duration-500 ${
          viaticos.requiresManualQuote
            ? "border-amber-500/40 bg-amber-950/20 shadow-lg shadow-amber-950/20"
            : viaticos.isOutsideZone
              ? "border-yellow-500/40 bg-yellow-900/10 shadow-lg shadow-yellow-900/20"
              : "border-green-500/40 bg-green-900/10 shadow-lg shadow-green-900/20"
        }`}>
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${
              viaticos.requiresManualQuote 
                ? "bg-amber-500/20" 
                : viaticos.isOutsideZone 
                  ? "bg-yellow-500/20" 
                  : "bg-green-500/20"
            }`}>
              {viaticos.requiresManualQuote
                ? <AlertTriangle className="w-6 h-6 text-amber-400 animate-bounce" />
                : viaticos.isOutsideZone
                  ? <Car className="w-6 h-6 text-yellow-400" />
                  : <CheckCircle2 className="w-6 h-6 text-green-400" />
              }
            </div>
            <div>
              <div className={`font-black text-lg uppercase tracking-tight ${
                viaticos.requiresManualQuote 
                  ? "text-amber-300" 
                  : viaticos.isOutsideZone 
                    ? "text-yellow-300" 
                    : "text-green-300"
              }`}>
                {viaticos.label}
              </div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed font-medium">{viaticos.description}</div>
            </div>
          </div>

          {/* Desglose de precio final en este paso */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-400">Subtotal Paquete</span>
              <span className="text-white">{MXN(data.packagePrice ?? 0)}</span>
            </div>
            
            {viaticos.requiresManualQuote ? (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-amber-400 font-bold">Viáticos Logística</span>
                <span className="text-amber-300 font-bold">Por cotizar (Logística extendida)</span>
              </div>
            ) : viaticos.isOutsideZone ? (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-400">Viáticos Logística</span>
                <span className="text-yellow-300 font-bold">+{MXN(viaticos.amount)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-400">Viáticos Logística</span>
                <span className="text-green-400 font-bold">¡Gratis! ($0)</span>
              </div>
            )}

            <div className="flex justify-between items-end pt-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">
                  {viaticos.requiresManualQuote ? "Total Estimado (Sin Viáticos)" : "Total Estimado"}
                </span>
                <span className="text-3xl font-black text-primary tracking-tighter">
                  {viaticos.requiresManualQuote ? MXN(data.packagePrice ?? 0) : MXN(totalConViaticos)}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">
                {viaticos.requiresManualQuote ? "MXN + Viáticos" : "MXN"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Aviso zonas locales */}
      {!viaticos && !loading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 mb-8">
          <p className="text-xs text-gray-500 font-medium flex items-start gap-3 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-gray-300">Zona Preferencial Vendetta:</strong> Toluca, Metepec, Zinacantepec, Ocoyoacac, Lerma y alrededores no generan cargos de viáticos adicionales.
            </span>
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-white/15 h-12">
          ← Atrás
        </Button>
        <Button onClick={handleNext} disabled={loading} className="flex-1 font-black h-12">
          Continuar → Fecha
        </Button>
      </div>
    </div>
  )
}
