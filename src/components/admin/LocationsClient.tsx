"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MapPin, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Phone, 
  Save, 
  Loader2, 
  Building2,
  Search,
  AlertCircle,
  Pencil
} from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  mapsLink: string | null
  phone: string | null
  city: string | null
  state: string | null
  active: boolean
}

export default function LocationsManager() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<Location>>({
    name: "",
    address: "",
    mapsLink: "",
    phone: "",
    city: "",
    state: "México",
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  async function fetchLocations() {
    try {
      // FORCE CACHE BREAK with timestamp and no-store
      const res = await fetch(`/api/admin/locations?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })
      
      const data = await res.json()
      
      if (Array.isArray(data)) {
        setLocations(data)
      } else {
        console.error("DIAGNOSTIC — API Error: Expected array but received:", typeof data, data, "Status:", res.status)
        setLocations([])
      }
    } catch (err) {
      console.error("DIAGNOSTIC — Fetch Failure:", err)
      setLocations([])
    } finally {
      setLoading(false)
    }
  }


  async function handleSave() {
    if (!formData.name || !formData.address) return
    setSaving(true)
    try {
      const isEditing = !!editingId
      const url = "/api/admin/locations"
      const method = isEditing ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        body: JSON.stringify(isEditing ? { ...formData, id: editingId } : formData),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        await fetchLocations()
        resetForm()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este lugar? Se desactivará del catálogo.")) return
    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE" })
      if (res.ok) await fetchLocations()
    } catch (err) {
      console.error(err)
    }
  }

  function resetForm() {
    setFormData({ name: "", address: "", mapsLink: "", phone: "", city: "", state: "México" })
    setEditingId(null)
  }

  const filtered = (Array.isArray(locations) ? locations : []).filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Formulario de Creación/Edición */}
      <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {editingId ? <Save className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {editingId ? "Editar Establecimiento" : "Registrar Nuevo Lugar"}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              {editingId ? "Modificando datos existentes" : "Añade un bar, restaurante o salón"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre del Lugar *</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Alquimia 73, Salon Imperial..."
              className="bg-card border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono de Reservación (Opcional)</Label>
            <Input 
              value={formData.phone || ""}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="Ej. +52 55 1234 5678"
              className="bg-card border-border/40"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Dirección Completa *</Label>
            <Input 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Calle, Número, Colonia, Ciudad..."
              className="bg-card border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label>Link de Google Maps</Label>
            <Input 
              value={formData.mapsLink || ""}
              onChange={e => setFormData({...formData, mapsLink: e.target.value})}
              placeholder="https://goo.gl/maps/..."
              className="bg-card border-border/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Ciudad</Label>
               <Input 
                 value={formData.city || ""}
                 onChange={e => setFormData({...formData, city: e.target.value})}
                 placeholder="Ej. CDMX"
                 className="bg-card border-border/40"
               />
             </div>
             <div className="space-y-2">
               <Label>Estado</Label>
               <Input 
                 value={formData.state || ""}
                 onChange={e => setFormData({...formData, state: e.target.value})}
                 placeholder="Ej. México"
                 className="bg-card border-border/40"
               />
             </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {editingId && (
            <Button variant="outline" onClick={resetForm} className="flex-1 border-border/40">
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving || !formData.name || !formData.address}
            className="flex-1 bg-primary hover:bg-primary/90 font-bold text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingId ? "Guardar Cambios" : "Registrar Establecimiento"}
          </Button>
        </div>
      </div>

      {/* Listado / Buscador */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Catálogo de Lugares
            <span className="text-xs bg-primary/10 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {locations.length}
            </span>
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lugar..."
              className="pl-9 bg-card border-border/40 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/40 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No se encontraron lugares en el catálogo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(loc => (
              <div 
                key={loc.id}
                className="group bg-white/[0.03] border border-border/40 rounded-xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{loc.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                        {loc.city}, {loc.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        setEditingId(loc.id)
                        setFormData(loc)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => handleDelete(loc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground leading-tight">
                    <span className="font-bold text-muted-foreground shrink-0">DIR:</span>
                    <span>{loc.address}</span>
                  </div>
                  {loc.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 text-green-500/60" />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                </div>

                {loc.mapsLink && (
                  <Button 
                    variant="link" 
                    className="mt-4 p-0 h-auto text-[10px] text-primary hover:no-underline flex items-center gap-1.5"
                    render={
                      <a href={loc.mapsLink} target="_blank" rel="noopener noreferrer">
                        Ver en Google Maps <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
