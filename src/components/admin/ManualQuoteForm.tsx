"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, X, Calendar as CalendarIcon, Clock, User, Phone, MapPin, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface Location {
  id: string
  name: string
  address: string
  mapsLink: string | null
  phone: string | null
  city: string | null
  state: string | null
}

export function ManualQuoteForm({ packages }: { packages: Pkg[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])

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
    locationId: ""
  })

  const handlePackageChange = (id: string) => {
    const pkg = packages.find(p => p.id === id)
    if (pkg) {
      const price = pkg.baseCostPerHour * pkg.minDuration
      setFormData(prev => ({
        ...prev,
        packageId: id,
        baseAmount: price,
        // Sugerimos 40% por defecto, el usuario puede bajar hasta 30%
        depositAmount: Math.round(price * 0.4)
      }))
    }
  }

  const handleLocationSelect = (id: string) => {
    const loc = locations.find(l => l.id === id)
    if (loc) {
      // Intentar parsear dirección básica
      const [calle, ...rest] = loc.address.split(",")
      setFormData(prev => ({
        ...prev,
        locationId: id,
        calle: calle.trim(),
        numero: "", 
        colonia: rest[0]?.trim() || "",
        municipio: loc.city || "",
        state: loc.state || "Estado de México",
        mapsLink: loc.mapsLink || ""
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.clientName || !formData.clientPhone || !formData.requestedDate || !formData.municipio || !formData.calle) {
      toast.error("Por favor completa los campos obligatorios (Nombre, Teléfono, Fecha, Municipio, Calle)")
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
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (json.success) {
        toast.success(formData.depositConfirmed ? "Evento confirmado y publicado" : "Cotización guardada como pendiente")
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
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                required 
                value={formData.clientName} 
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <CalendarIcon className="w-4 h-4" /> Fecha y Horario
            </h3>
            <div className="space-y-2">
              <Label>Fecha del Evento</Label>
              <Input 
                required 
                type="date"
                value={formData.requestedDate} 
                onChange={e => setFormData({...formData, requestedDate: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inicio (HH:MM)</Label>
                <Input 
                  required 
                  value={formData.startTime} 
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin (HH:MM)</Label>
                <Input 
                  required 
                  value={formData.endTime} 
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
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
                <SelectTrigger className="bg-primary/5 border-primary/20">
                  <SelectValue placeholder="Busca un lugar registrado..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="md:col-span-4 space-y-2">
                <Label>Link de Google Maps (Opcional)</Label>
                <Input 
                  value={formData.mapsLink} 
                  onChange={e => setFormData({...formData, mapsLink: e.target.value})}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
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
                <Select value={formData.venueType} onValueChange={v => setFormData({...formData, venueType: v})}>
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
              <div className="space-y-2">
                <Label>Monto Total ($)</Label>
                <Input 
                  type="number"
                  value={formData.baseAmount} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setFormData({...formData, baseAmount: parseFloat(e.target.value) || 0})}
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
                <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v})}>
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
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-primary/5 border border-primary/20 rounded-2xl group transition-all hover:bg-primary/10">
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
