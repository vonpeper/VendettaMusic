"use client"

import { useState } from "react"
import { createPackageAction, updatePackageAction, deletePackageAction } from "@/actions/packages"
import { linkServiceToPackageAction, unlinkServiceFromPackageAction } from "@/actions/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2, Info, Package as PackageIcon, Zap, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ServiceItem {
  id: string
  name: string
  category: string
  icon: string | null
}

interface Package {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string | null
  includes: string | null
  active: boolean
  serviceItems: ServiceItem[]
}

export function PackagesManager({ initialPackages, serviceCatalog }: { initialPackages: Package[], serviceCatalog: ServiceItem[] }) {
  const [packages, setPackages] = useState(initialPackages)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    baseCostPerHour: 0,
    minDuration: 1,
    description: "",
    includes: ""
  })

  async function handleCreate() {
    setLoading("new")
    const res = await createPackageAction(formData)
    if (res.success) {
      toast.success("Paquete creado")
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function handleUpdate(id: string) {
    setLoading(id)
    const pkg = packages.find(p => p.id === id)
    if (!pkg) return
    const res = await updatePackageAction(id, {
      name: pkg.name,
      baseCostPerHour: pkg.baseCostPerHour,
      minDuration: pkg.minDuration,
      description: pkg.description,
      includes: pkg.includes
    })
    if (res.success) {
      toast.success("Paquete actualizado")
      setEditingId(null)
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este paquete?")) return
    setLoading(id)
    const res = await deletePackageAction(id)
    if (res.success) {
      toast.success("Paquete eliminado")
      setPackages(prev => prev.filter(p => p.id !== id))
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function toggleService(packageId: string, serviceId: string, isLinked: boolean) {
    setLoading(`${packageId}-${serviceId}`)
    const res = isLinked 
      ? await unlinkServiceFromPackageAction(packageId, serviceId)
      : await linkServiceToPackageAction(packageId, serviceId)
    
    if (res.success) {
      toast.success(isLinked ? "Servicio removido" : "Servicio agregado")
      // Update local state
      setPackages(prev => prev.map(p => {
        if (p.id === packageId) {
          const newServices = isLinked 
            ? p.serviceItems.filter(s => s.id !== serviceId)
            : [...p.serviceItems, serviceCatalog.find(s => s.id === serviceId)!]
          return { ...p, serviceItems: newServices }
        }
        return p
      }))
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PackageIcon className="w-5 h-5 text-primary" /> Paquetes Configurables
        </h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2 text-white">
          <Plus className="w-4 h-4" /> Nuevo Paquete
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-card border-primary/30">
          <CardHeader>
            <CardTitle>Crear Nuevo Paquete</CardTitle>
            <CardDescription>Configura los costos base y descripción inicial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Paquete</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Paquete Vendetta 10" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Costo Base por Hora</Label>
                <Input type="number" value={formData.baseCostPerHour} onChange={e => setFormData({...formData, baseCostPerHour: parseFloat(e.target.value)})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Duración Mínima (Horas)</Label>
                <Input type="number" value={formData.minDuration} onChange={e => setFormData({...formData, minDuration: parseInt(e.target.value)})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Descripción Corta</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Para bodas y eventos grandes..." className="bg-background" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading === "new"}>
                {loading === "new" ? <Loader2 className="animate-spin w-4 h-4" /> : "Crear Paquete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {packages.map(pkg => (
          <Card key={pkg.id} className={`bg-card/30 border-border/40 overflow-hidden transition-all ${editingId === pkg.id ? 'ring-2 ring-primary bg-card/60' : ''}`}>
            <CardHeader className="bg-muted/30 border-b border-border/20">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <PackageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    {editingId === pkg.id ? (
                      <Input 
                        value={pkg.name} 
                        onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, name: e.target.value} : p))}
                        className="h-8 font-bold text-lg bg-background w-[300px]"
                      />
                    ) : (
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    )}
                    <CardDescription className="text-xs">ID: {pkg.id}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === pkg.id ? (
                    <Button size="sm" onClick={() => handleUpdate(pkg.id)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-4 h-4" /> Finalizar Edición
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditingId(pkg.id)} className="gap-2 border-primary/40 hover:bg-primary/10">
                      <Pencil className="w-3 h-3" /> Editar Paquete
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(pkg.id)} className="h-9 w-9 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Info Panel */}
                <div className="lg:col-span-4 p-6 border-r border-border/20 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Costo/Hr</Label>
                      {editingId === pkg.id ? (
                        <Input 
                          type="number"
                          value={pkg.baseCostPerHour} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, baseCostPerHour: parseFloat(e.target.value)} : p))}
                          className="h-9 bg-background"
                        />
                      ) : (
                        <div className="text-2xl font-heading font-bold text-primary">${pkg.baseCostPerHour.toLocaleString()}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Min Horas</Label>
                      {editingId === pkg.id ? (
                        <Input 
                          type="number"
                          value={pkg.minDuration} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, minDuration: parseInt(e.target.value)} : p))}
                          className="h-9 bg-background"
                        />
                      ) : (
                        <div className="text-2xl font-heading font-bold text-foreground">{pkg.minDuration}h</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Descripción</Label>
                    {editingId === pkg.id ? (
                      <textarea 
                        value={pkg.description || ""} 
                        onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, description: e.target.value} : p))}
                        className="w-full min-h-[80px] rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description || "Sin descripción disponible."}</p>
                    )}
                  </div>
                </div>

                {/* Services Zone */}
                <div className="lg:col-span-8 p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs uppercase text-primary font-black tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Zona de Servicios (Inclusiones)
                    </Label>
                    <div className="text-[10px] text-muted-foreground italic">
                      Selecciona qué servicios del catálogo incluye este paquete
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {serviceCatalog.map(service => {
                      const isLinked = pkg.serviceItems.some(s => s.id === service.id)
                      const isLoading = loading === `${pkg.id}-${service.id}`
                      
                      return (
                        <button
                          key={service.id}
                          disabled={isLoading}
                          onClick={() => toggleService(pkg.id, service.id, isLinked)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left group ${
                            isLinked 
                              ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20' 
                              : 'bg-background/40 border-border/20 hover:border-primary/20 hover:bg-primary/5'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                            isLinked ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                          }`}>
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (isLinked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold truncate ${isLinked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {service.name}
                            </div>
                            <div className="text-[9px] uppercase opacity-60 tracking-tighter">{service.category}</div>
                          </div>
                        </button>
                      )
                    })}
                    {serviceCatalog.length === 0 && (
                      <div className="col-span-full p-4 border border-dashed border-border/40 rounded-xl text-center text-muted-foreground text-xs">
                        No hay servicios en el catálogo. Créalos abajo.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-[10px] text-blue-500/80 leading-snug">
                      <strong>Tip:</strong> Estos servicios aparecerán con sus iconos correspondientes en la web pública. El orden del catálogo define el orden de aparición.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {packages.length === 0 && (
           <div className="p-12 text-center border-2 border-dashed border-border/40 rounded-3xl">
              <PackageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No hay paquetes registrados.</p>
           </div>
        )}
      </div>
    </div>
  )
}
