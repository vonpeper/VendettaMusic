"use client"

import { useState, useEffect } from "react"
import { FunnelData }  from "./FunnelWizard"
import { Button }      from "@/components/ui/button"
import { Input }       from "@/components/ui/input"
import { Label }       from "@/components/ui/label"
import { MapPin, AlertTriangle, CheckCircle2, Car, ExternalLink } from "lucide-react"
import { calcularViatcos } from "@/lib/viaticos"

interface Props {
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
  onBack: () => void
  viaticosConfig?: {
    zona2Rate?: number
    zona3Rate?: number
  }
}

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default function Step2_Ubicacion({ data, onNext, onBack, viaticosConfig }: Props) {
  const [street,      setStreet]      = useState(data.street      ?? "")
  const [houseNumber, setHouseNumber] = useState(data.houseNumber ?? "")
  const [colonia,     setColonia]     = useState(data.colonia     ?? "")
  const [zipCode,     setZipCode]     = useState(data.zipCode     ?? "")
  const [city,        setCity]        = useState(data.city        ?? "")
  const [state,       setState]       = useState(data.state       ?? "Estado de México")
  const [mapsLink,    setMapsLink]    = useState(data.mapsLink    ?? "")
  const [isPublic,    setIsPublic]    = useState(data.isPublic    ?? (data.venueType === "bar" || data.venueType === "festival"))
  
  const [viaticos, setViaticos] = useState(() =>
    city ? calcularViatcos(city, state, viaticosConfig) : null
  )
  const [error, setError] = useState("")
  const [isLocating, setIsLocating] = useState(false)

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.")
      return
    }

    setIsLocating(true)
    setError("")

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        if (!res.ok) throw new Error("Error al consultar la API de mapas.")
        const data = await res.json()
        
        // Nominatim puede regresar city, town, village o county
        const geoCity = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ""
        const geoState = data.address?.state || ""
        const geoZip = data.address?.postcode || ""
        const geoStreet = data.address?.road || ""
        const geoSuburb = data.address?.suburb || data.address?.neighbourhood || ""

        if (geoCity) setCity(geoCity)
        if (geoState) setState(geoState)
        if (geoZip) setZipCode(geoZip)
        if (geoStreet) setStreet(geoStreet)
        if (geoSuburb) setColonia(geoSuburb)

      } catch (err) {
        console.error(err)
        setError("No pudimos obtener la dirección exacta. Por favor escríbela manualmente.")
      } finally {
        setIsLocating(false)
      }
    }, (err) => {
      console.error(err)
      setError("Permiso de ubicación denegado o error de GPS.")
      setIsLocating(false)
    }, { timeout: 10000 })
  }

  // Auto-verificar si cambia la ciudad
  useEffect(() => {
    if (city.length > 2) {
      setViaticos(calcularViatcos(city, state, viaticosConfig))
    } else {
      setViaticos(null)
    }
  }, [city, state, viaticosConfig])

  function handleNext() {
    if (!city.trim())    { setError("Ingresa el municipio para calcular viáticos."); return }
    if (!viaticos)       { setError("Escribe la ciudad para calcular viáticos."); return }
    
    onNext({
      street,
      houseNumber,
      colonia,
      zipCode,
      city,
      municipio: city, // Sincronizar campo nuevo
      state,
      address: `${street} ${houseNumber}, Col. ${colonia}, CP ${zipCode}, ${city}, ${state}`, // Full address legacy
      isOutsideZone:  viaticos.isOutsideZone,
      viaticosAmount: viaticos.amount,
      viaticosLabel:  viaticos.label,
      mapsLink:       mapsLink.trim() || undefined,
      isPublic,
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
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
               <MapPin className="w-3 h-3" /> 1. Verificación de Zona
             </div>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={handleGeolocate} 
               disabled={isLocating}
               className="h-8 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
             >
               {isLocating ? "📍 Localizando..." : "📍 Usar mi ubicación actual"}
             </Button>
           </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-white font-bold text-xs uppercase tracking-wider">Municipio / Delegación</Label>
              <Input
                id="city"
                value={city}
                onChange={e => { 
                  const val = e.target.value
                  setCity(val)
                  setError("")
                }}
                onBlur={() => {
                  if (city.length > 2) setViaticos(calcularViatcos(city, state, viaticosConfig))
                }}
                placeholder="Ej. Metepec"
                className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-white font-bold text-xs uppercase tracking-wider">Estado</Label>
              <Input
                id="state"
                value={state}
                onChange={e => { setState(e.target.value); setError("") }}
                placeholder="Estado de México"
                className="bg-card/50 border-white/15 h-12 text-base focus:border-primary rounded-xl"
              />
            </div>
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

      {/* Resultado de viáticos */}
      {viaticos && (
        <div className={`rounded-[2rem] border p-6 mb-8 transition-all duration-500 ${
          viaticos.isOutsideZone
            ? "border-yellow-500/40 bg-yellow-900/10 shadow-lg shadow-yellow-900/20"
            : "border-green-500/40 bg-green-900/10 shadow-lg shadow-green-900/20"
        }`}>
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${viaticos.isOutsideZone ? "bg-yellow-500/20" : "bg-green-500/20"}`}>
              {viaticos.isOutsideZone
                ? <Car className="w-6 h-6 text-yellow-400" />
                : <CheckCircle2 className="w-6 h-6 text-green-400" />
              }
            </div>
            <div>
              <div className={`font-black text-lg uppercase tracking-tight ${viaticos.isOutsideZone ? "text-yellow-300" : "text-green-300"}`}>
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
            {viaticos.isOutsideZone && (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-400">Viáticos Logística</span>
                <span className="text-yellow-300">+{MXN(viaticos.amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Total Estimado</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{MXN(totalConViaticos)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">MXN</span>
            </div>
          </div>
        </div>
      )}

      {/* Aviso zonas locales */}
      {!viaticos && (
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
        <Button onClick={handleNext} className="flex-1 font-black h-12">
          Continuar → Fecha
        </Button>
      </div>
    </div>
  )
}
