"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, X, Calendar as CalendarIcon, Clock, User, Phone, MapPin, CreditCard } from "lucide-react"
import { toast } from "sonner"

const CEREMONY_TYPES = [
  { value: "boda",       label: "💒 Boda" },
  { value: "xv_anos",    label: "👸 XV Años" },
  { value: "cumpleanos", label: "🎂 Cumpleaños" },
  { value: "corporativo",label: "🏢 Corporativo" },
  { value: "festival",   label: "🎪 Festival" },
  { value: "happening",  label: "🎵 Happening" },
  { value: "bar",        label: "🍸 Bar" },
  { value: "otro",       label: "📋 Otro" },
]

const DRESS_CODES = [
  { value: "formal",        label: "🎩 Formal" },
  { value: "formal_casual", label: "👔 Formal Casual" },
  { value: "rock",          label: "🎸 Rock / Casual" },
  { value: "nocturno",      label: "🌙 Concierto Nocturno" },
]

interface Location {
  id: string
  name: string
  address: string
  mapsLink: string | null
  phone: string | null
  city: string | null
  state: string | null
}

interface Pkg {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
}

interface ClientOption {
  id: string
  name: string
  phone: string
  email: string
}

export function ManualQuoteForm({ 
  packages,
  clients = []
}: { 
  packages: Pkg[]
  clients?: ClientOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [requestedDates, setRequestedDates] = useState<string[]>([""])

  useEffect(() => {
    fetch("/api/admin/locations")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocations(data)
        } else {
          console.error("ManualQuoteForm: Expected array of locations but received", data)
          setLocations([])
        }
      })
      .catch(err => {
        console.error("ManualQuoteForm: Error fetching locations:", err)
        setLocations([])
      })
  }, [])
  
  const searchParams = useSearchParams()
  const reactivateId = searchParams.get("reactivateId")

  useEffect(() => {
    if (reactivateId) {
      setLoading(true)
      fetch(`/api/admin/booking-manual/${reactivateId}`)
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            if (data.requestedDate) {
              setRequestedDates([data.requestedDate.split("T")[0]])
            }
            // Pre-llenar el formulario con los datos de la reserva expirada
            setFormData({
              clientName: data.clientName || "",
              clientPhone: data.clientPhone || "",
              clientEmail: data.clientEmail || "",
              requestedDate: "",
              startTime: data.startTime || "21:00",
              endTime: data.endTime || "23:00",
              packageId: data.packageId || "manual-arma",
              calle: data.calle || "",
              numero: data.numero || "",
              colonia: data.colonia || "",
              municipio: data.municipio || "",
              state: data.state || "Estado de México",
              baseAmount: data.baseAmount || 0,
              depositAmount: data.depositAmount || 0,
              paymentMethod: data.paymentMethod || "transfer",
              venueType: data.venueType || "salon",
              guestCount: data.guestCount || 0,
              isPublic: data.isPublic || false,
              mapsLink: data.mapsLink || "",
              adminNote: `Reactivación de reserva ${data.shortId}. ${data.adminNote || ""}`,
              depositConfirmed: false, // Siempre empezamos sin confirmar depósito en nuevos datos
              clientProvidesAudio: data.clientProvidesAudio || false,
              locationId: "", // Podríamos intentar matchear pero mejor que lo elijan o se quede como manual
              venueName: data.venueName || "",
              venuePhone: data.venuePhone || "",
              bandHours: data.bandHours || 2,
              djHours: data.djHours || 0,
              isDjWithTvs: data.isDjWithTvs || false,
              hasTemplete: data.hasTemplete || false,
              hasPista: data.hasPista || false,
              hasRobot: data.hasRobot || false,
              originalPrice: data.originalPrice || 0,
              discountAmount: data.discountAmount || 0,
              viaticosAmount: data.viaticosAmount || 0,
              invoice: data.invoice || false,
              customName: data.customName || "",
              ceremonyType: data.ceremonyType || "",
              arrivalTime: data.arrivalTime || "",
              setupTime: data.setupTime || "",
              dressCode: data.dressCode || "",
              musicianNotes: data.musicianNotes || ""
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [reactivateId])


  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    requestedDate: "",
    startTime: "21:00",
    endTime: "23:00",
    packageId: "",
    calle: "",
    numero: "",
    colonia: "",
    municipio: "",
    state: "Estado de México",
    baseAmount: 0,
    depositAmount: 0,
    paymentMethod: "transfer",
    venueType: "salon",
    guestCount: 0,
    isPublic: false,
    mapsLink: "",
    adminNote: "Cotización manual registrada por administrador.",
    depositConfirmed: false,
    clientProvidesAudio: false,
    locationId: "",
    venueName: "",
    venuePhone: "",
    bandHours: 2,
    djHours: 0,
    isDjWithTvs: false,
    hasTemplete: false,
    hasPista: false,
    hasRobot: false,
    originalPrice: 0,
    discountAmount: 0,
    viaticosAmount: 0,
    invoice: false,
    customName: "",
    ceremonyType: "",
    arrivalTime: "",
    setupTime: "",
    dressCode: "",
    musicianNotes: ""
  })

  const [viaticosDetails, setViaticosDetails] = useState<{
    distanceKm: number;
    durationSec: number;
    tollCost: number;
    fuelCost: number;
    requiresManualQuote: boolean;
  } | null>(null)
  const [calculatingViaticos, setCalculatingViaticos] = useState(false)

  useEffect(() => {
    if (!formData.municipio || !formData.state) return

    const delayDebounceFn = setTimeout(async () => {
      setCalculatingViaticos(true)
      try {
        const destination = `${formData.calle || ""}, ${formData.colonia || ""}, ${formData.municipio}, ${formData.state}`.trim()
        const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(destination)}`)
        const data = await resp.json()
        if (data && typeof data.viaticosAmount === "number") {
          setFormData(prev => ({
            ...prev,
            viaticosAmount: data.viaticosAmount
          }))
          setViaticosDetails({
            distanceKm: data.distanceKm || 0,
            durationSec: data.durationSec || 0,
            tollCost: data.tollCost || 0,
            fuelCost: data.fuelCost || 0,
            requiresManualQuote: !!data.requiresManualQuote
          })
          toast.success(`Viáticos calculados automáticamente: $${data.viaticosAmount.toLocaleString()}`)
          if (data.requiresManualQuote) {
            toast.warning("El destino seleccionado requiere cotización manual personalizada (distancia > 250km).")
          }
        }
      } catch (err) {
        console.error("Error al calcular viáticos:", err)
      } finally {
        setCalculatingViaticos(false)
      }
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [formData.municipio, formData.state, formData.calle, formData.colonia])

  const handlePackageChange = (id: string | null) => {
    if (!id) return
    if (id === "manual-arma") {
      setFormData(prev => ({
        ...prev,
        packageId: "manual-arma",
        originalPrice: 0,
        baseAmount: 0,
        discountAmount: 0,
        depositAmount: 0
      }))
      return
    }
    const pkg = packages.find(p => p.id === id)
    if (pkg) {
      const price = pkg.baseCostPerHour * pkg.minDuration
      setFormData(prev => ({
        ...prev,
        packageId: id,
        originalPrice: price,
        baseAmount: price,
        discountAmount: 0,
        bandHours: pkg.minDuration,
        // Sugerimos 40% por defecto, el usuario puede bajar hasta 30%
        depositAmount: Math.round(price * 0.4)
      }))
    }
  }

  const handleLocationSelect = (id: string | null) => {
    if (!id) return
    const loc = locations.find(l => l.id === id)
    if (loc) {
      setFormData(prev => ({
        ...prev,
        locationId: id,
        venueName: loc.name || "",
        calle: loc.address || "",
        numero: "", 
        colonia: "",
        municipio: loc.city || "",
        state: loc.state || "Estado de México",
        mapsLink: loc.mapsLink || "",
        venuePhone: loc.phone || ""
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const validDates = requestedDates.filter(Boolean)
    if (validDates.length === 0) {
      toast.error("Por favor ingresa al menos una fecha para el evento")
      return
    }

    if (!formData.clientName || !formData.clientPhone || !formData.municipio || !formData.calle) {
      toast.error("Por favor completa los campos obligatorios (Nombre, Teléfono, Municipio, Calle)")
      return
    }

    if (!formData.packageId) {
      toast.error("Por favor selecciona un Paquete Base o 'Arma tu Show (Manual)'")
      return
    }

    // Validación de anticipo mínimo (30%)
    const minDeposit = formData.baseAmount * 0.3
    if (formData.depositAmount < minDeposit) {
      toast.error(`El anticipo mínimo permitido es del 30% ($${minDeposit.toLocaleString()})`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/booking-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          distanceKm: viaticosDetails?.distanceKm || 0,
          durationSec: viaticosDetails?.durationSec || 0,
          tollCost: viaticosDetails?.tollCost || 0,
          fuelCost: viaticosDetails?.fuelCost || 0,
          requiresManualQuote: viaticosDetails?.requiresManualQuote || false,
          requestedDates: validDates
        })
      })
      const json = await res.json()
      if (json.success) {
        const verb = validDates.length > 1 ? "Eventos confirmados" : "Evento confirmado"
        const pendingVerb = validDates.length > 1 ? "Cotizaciones guardadas" : "Cotización guardada"
        toast.success(formData.depositConfirmed ? `${verb} y publicados` : `${pendingVerb} como pendientes`)
        router.push("/admin/ventas")
        router.refresh()
      } else {
        console.error("ManualQuoteForm Failure:", json)
        toast.error(`Error: ${json.error || "Fallo en el servidor"}`)
        setLoading(false) // Liberar loading si falla el servidor con error conocido
      }
    } catch (err: any) {
      console.error("ManualQuoteForm Connection Error:", err)
      toast.error("Error de conexión o datos inválidos")
      setLoading(false)
    } finally {
      // Nota: No quitamos loading aquí si fue exitoso porque router.push es asíncrono 
      // y queremos mantener el feedback visual hasta que cambie la página.
      // Pero si hubo error (catch o else), ya lo liberamos arriba.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del Cliente */}
        <Card className="bg-card border-border/40">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
              <User className="w-4 h-4" /> Información del Cliente
            </h3>
            
            {clients && clients.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Seleccionar Cliente Existente (Opcional)</Label>
                <Select onValueChange={(val) => {
                  if (val === "new") {
                    setFormData(prev => ({
                      ...prev,
                      clientName: "",
                      clientPhone: "",
                      clientEmail: ""
                    }))
                  } else {
                    const selected = clients.find(c => c.id === val)
                    if (selected) {
                      setFormData(prev => ({
                        ...prev,
                        clientName: selected.name,
                        clientPhone: selected.phone,
                        clientEmail: selected.email
                      }))
                    }
                  }
                }}>
                  <SelectTrigger className="bg-primary/5 border-primary/20">
                    <SelectValue placeholder="Busca un cliente registrado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">-- Nuevo Cliente / Limpiar --</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.phone || "Sin Teléfono"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                required 
                value={formData.clientName} 
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  required 
                  value={formData.clientPhone} 
                  onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                  placeholder="10 dígitos"
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Opcional)</Label>
                <Input 
                  type="email"
                  value={formData.clientEmail} 
                  onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logística de Fecha */}
        <Card className="bg-card border-border/40">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
              <CalendarIcon className="w-4 h-4" /> Identidad y Horario del Show
            </h3>
            
            <div className="space-y-2">
              <Label>Nombre del Show / Evento (Opcional)</Label>
              <Input 
                value={formData.customName} 
                onChange={e => setFormData({...formData, customName: e.target.value})}
                placeholder="Ej. Tributo Mentiras, Show Alquimia..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={formData.ceremonyType} onValueChange={v => setFormData({...formData, ceremonyType: v ?? ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de evento..." />
                </SelectTrigger>
                <SelectContent>
                  {CEREMONY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/20">
              <Label>Fechas del Evento</Label>
              {requestedDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    required 
                    type="date"
                    value={date} 
                    onChange={e => {
                      const newDates = [...requestedDates]
                      newDates[idx] = e.target.value
                      setRequestedDates(newDates)
                    }}
                    className="flex-1"
                  />
                  {requestedDates.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => {
                        setRequestedDates(requestedDates.filter((_, i) => i !== idx))
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-dashed border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setRequestedDates([...requestedDates, ""])}
              >
                + Agregar otra fecha
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/20">
              <div className="space-y-2">
                <Label>Inicio Ejecución (HH:MM)</Label>
                <Input 
                  required 
                  type="time"
                  value={formData.startTime} 
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin Ejecución (HH:MM)</Label>
                <Input 
                  required 
                  type="time"
                  value={formData.endTime} 
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Llegada Musicians (HH:MM)</Label>
                <Input 
                  type="time"
                  value={formData.arrivalTime} 
                  onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Montaje (HH:MM)</Label>
                <Input 
                  type="time"
                  value={formData.setupTime} 
                  onChange={e => setFormData({...formData, setupTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/20">
              <Label>Vestimenta</Label>
              <Select value={formData.dressCode} onValueChange={v => setFormData({...formData, dressCode: v ?? ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el código de vestimenta..." />
                </SelectTrigger>
                <SelectContent>
                  {DRESS_CODES.map(code => (
                    <SelectItem key={code.value} value={code.value}>{code.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card className="bg-card border-border/40 md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4" /> Ubicación del Evento
            </h3>
            <div className="mb-6">
              <Label className="mb-2 block">Seleccionar del Catálogo (Opcional)</Label>
              <Select onValueChange={handleLocationSelect}>
                <SelectTrigger className="bg-primary/10 border-primary/20">
                  <SelectValue placeholder="Busca un lugar registrado..." />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter(loc => !loc.name.startsWith("Show -") || loc.id === formData.locationId)
                    .map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4 space-y-2">
                <Label>Nombre del Lugar (Salón, Jardín, etc) (Opcional)</Label>
                <Input 
                  value={formData.venueName} 
                  onChange={e => setFormData({...formData, venueName: e.target.value})}
                  placeholder="Ej. Hacienda del Sol"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Calle</Label>
                <Input 
                  required 
                  value={formData.calle} 
                  onChange={e => setFormData({...formData, calle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input 
                  required 
                  value={formData.numero} 
                  onChange={e => setFormData({...formData, numero: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Colonia</Label>
                <Input 
                  required 
                  value={formData.colonia} 
                  onChange={e => setFormData({...formData, colonia: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Municipio / Ciudad</Label>
                <Input 
                  required 
                  value={formData.municipio} 
                  onChange={e => setFormData({...formData, municipio: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Estado</Label>
                <Input 
                  required 
                  value={formData.state} 
                  onChange={e => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Link de Google Maps (Opcional)</Label>
                <Input 
                   value={formData.mapsLink} 
                   onChange={e => setFormData({...formData, mapsLink: e.target.value})}
                   placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono del Salón (WhatsApp)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.venuePhone} 
                    onChange={e => setFormData({...formData, venuePhone: e.target.value})}
                    placeholder="55..."
                  />
                  {formData.venuePhone && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`https://wa.me/${formData.venuePhone.replace(/\D/g, "")}`, "_blank")}
                      className="bg-green-600/10 border-green-600/20 text-green-500 hover:bg-green-600/20"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Show y Descuentos */}
        <Card className="bg-card border-border/40 md:col-span-2">
          <CardContent className="pt-6 space-y-6">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" /> Configuración de Show y Descuentos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Horas Banda</Label>
                <Input 
                  type="number"
                  value={formData.bandHours} 
                  onChange={e => setFormData({...formData, bandHours: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Horas DJ</Label>
                <Input 
                  type="number"
                  value={formData.djHours} 
                  onChange={e => setFormData({...formData, djHours: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio de Lista ($)</Label>
                <Input 
                  type="number"
                  value={formData.originalPrice} 
                  onChange={e => {
                    const original = parseFloat(e.target.value) || 0
                    setFormData(prev => {
                      const shouldSync = prev.baseAmount === 0 || prev.baseAmount === prev.originalPrice
                      const newBase = shouldSync ? original : prev.baseAmount
                      return {
                        ...prev,
                        originalPrice: original,
                        baseAmount: newBase,
                        discountAmount: Math.max(0, original - newBase),
                        depositAmount: prev.depositAmount === 0 || prev.depositAmount === Math.round(prev.baseAmount * 0.4)
                          ? Math.round(newBase * 0.4)
                          : prev.depositAmount
                      }
                    })
                  }}
                  className="border-blue-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Descuento ($)</Label>
                <Input 
                  type="number"
                  readOnly
                  value={formData.discountAmount} 
                  className="bg-muted text-primary font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.isDjWithTvs} 
                  onChange={e => setFormData({...formData, isDjWithTvs: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-bold group-hover:text-primary transition-colors">DJ con Pantallas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.hasTemplete} 
                  onChange={e => setFormData({...formData, hasTemplete: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-bold group-hover:text-primary transition-colors">Templete</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.hasPista} 
                  onChange={e => setFormData({...formData, hasPista: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-bold group-hover:text-primary transition-colors">Pista LED</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.hasRobot} 
                  onChange={e => setFormData({...formData, hasRobot: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-bold group-hover:text-primary transition-colors">Robot LED</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Paquete y Costos */}
        <Card className="bg-card border-border/40 md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" /> Inversión y Paquete
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Paquete Base</Label>
                <Select value={formData.packageId} onValueChange={handlePackageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paquete">
                      {formData.packageId && (
                        packages.find(p => p.id === formData.packageId)?.name || 
                        (formData.packageId === "manual-arma" ? "Arma tu Show (Manual)" : null)
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                    <SelectItem value="manual-arma">Arma tu Show (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Lugar (Venue)</Label>
                <Select value={formData.venueType} onValueChange={v => setFormData({...formData, venueType: v ?? ""})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">Salón</SelectItem>
                    <SelectItem value="terraza">Terraza</SelectItem>
                    <SelectItem value="jardin">Jardín</SelectItem>
                    <SelectItem value="residencia">Residencia</SelectItem>
                    <SelectItem value="bar">Restaurant / Bar</SelectItem>
                    <SelectItem value="festival">Festival / Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invitados Aproximados</Label>
                <Input 
                  type="number"
                  value={formData.guestCount} 
                  onChange={e => setFormData({...formData, guestCount: parseInt(e.target.value) || 0})}
                  placeholder="Ej. 150"
                />
              </div>
              <div className="space-y-4 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.isPublic} 
                    onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">¿Evento Público?</span>
                </label>
              </div>
              <div className="space-y-4 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.clientProvidesAudio} 
                    onChange={e => setFormData({...formData, clientProvidesAudio: e.target.checked})}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Cliente provee audio</span>
                </label>
              </div>
              <div className="space-y-4 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.invoice} 
                    onChange={e => setFormData({...formData, invoice: e.target.checked})}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm font-bold text-red-500 group-hover:text-red-400 transition-colors">¿Requiere Factura? (+16% IVA)</span>
                </label>
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-black">Monto FINAL PACTADO ($)</Label>
                <Input 
                  type="number"
                  value={formData.baseAmount} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0
                    setFormData(prev => ({
                      ...prev,
                      baseAmount: val,
                      discountAmount: Math.max(0, prev.originalPrice - val),
                      depositAmount: prev.depositAmount === 0 || prev.depositAmount === Math.round(prev.baseAmount * 0.4)
                        ? Math.round(val * 0.4)
                        : prev.depositAmount
                    }))
                  }}
                  className="bg-primary/5 border-primary shadow-inner"
                />
              </div>
              <div className="space-y-2 relative">
                <Label>Viáticos ($) {calculatingViaticos && <span className="text-[10px] text-blue-600 animate-pulse font-normal ml-1">(Calculando...)</span>}</Label>
                <Input 
                  type="number"
                  value={formData.viaticosAmount} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setFormData({...formData, viaticosAmount: parseFloat(e.target.value) || 0})}
                  className={calculatingViaticos ? "border-blue-500/40 bg-blue-500/5 transition-all" : "transition-all"}
                />
              </div>
              <div className="space-y-2">
                <Label>Anticipo Requerido ($)</Label>
                <Input 
                  type="number"
                  value={formData.depositAmount} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setFormData({...formData, depositAmount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v ?? ""})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-4 pt-4 border-t border-border/40">
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-blue-600/5 border border-border/40 rounded-2xl group transition-all hover:bg-blue-600/10">
                  <input 
                    type="checkbox" 
                    checked={formData.depositConfirmed} 
                    onChange={e => setFormData({...formData, depositConfirmed: e.target.checked})}
                    className="w-6 h-6 accent-primary rounded-lg"
                  />
                  <div>
                    <span className="text-base font-black text-foreground block">¿Anticipo ya recibido/confirmado en banco?</span>
                    <span className="text-xs text-muted-foreground">Si se marca, el evento se publicará inmediatamente en la agenda y Shows.</span>
                  </div>
                </label>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Notas Internas</Label>
                <Input 
                  value={formData.adminNote} 
                  onChange={e => setFormData({...formData, adminNote: e.target.value})}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Notas para los Músicos</Label>
                <textarea 
                  value={formData.musicianNotes} 
                  onChange={e => setFormData({...formData, musicianNotes: e.target.value})}
                  placeholder="Instrucciones específicas del show para los músicos..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 min-w-[200px] h-12 rounded-xl font-bold shadow-lg shadow-primary/20 text-white"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {formData.depositConfirmed ? "Confirmar y Publicar" : "Guardar Cotización"}
        </Button>
      </div>
    </form>
  )
}
