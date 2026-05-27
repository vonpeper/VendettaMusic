"use client"

import { useState } from "react"
import { createPackageAction, updatePackageAction, deletePackageAction } from "@/actions/packages"
import { linkServiceToPackageAction, unlinkServiceFromPackageAction } from "@/actions/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2, Info, Package as PackageIcon, Zap, CheckCircle2, Sparkles, Music2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ExtrasManager } from "./ExtrasManager"

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
  maxDuration: number
  description: string | null
  includes: string | null
  active: boolean
  serviceItems: ServiceItem[]
}

interface Extra {
  id: string
  name: string
  description: string | null
  setupCost: number
  hourlyCost: number
}

export function PackagesManager({ 
  initialPackages, 
  serviceCatalog,
  initialExtras = []
}: { 
  initialPackages: Package[], 
  serviceCatalog: ServiceItem[],
  initialExtras?: Extra[]
}) {
  const [packages, setPackages] = useState(initialPackages)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [armaTab, setArmaTab] = useState<'costs' | 'inclusions'>('costs')

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
      maxDuration: pkg.maxDuration,
      description: pkg.description,
      includes: pkg.includes,
      active: pkg.active
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <PackageIcon className="w-5 h-5 text-primary" /> Paquetes Configurables
        </h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2 text-white w-full sm:w-auto justify-center h-10 font-semibold text-sm">
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
            <CardHeader className="bg-muted/30 border-b border-border/20 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start sm:items-center gap-3 w-full md:w-auto">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <PackageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === pkg.id ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <Input 
                          value={pkg.name} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, name: e.target.value} : p))}
                          className="h-9 font-bold text-base bg-background w-full sm:w-[240px] border border-border"
                        />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={pkg.active} 
                            onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, active: e.target.checked} : p))}
                            className="rounded border-border bg-background text-primary focus:ring-primary w-4.5 h-4.5"
                          />
                          <span className="text-xs font-semibold text-foreground">Disponible</span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl truncate">{pkg.name}</CardTitle>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-extrabold tracking-wider ${
                          pkg.active 
                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                            : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                        }`}>
                          {pkg.active ? "Disponible" : "No Disponible"}
                        </span>
                      </div>
                    )}
                    <CardDescription className="text-xs mt-0.5 truncate">ID: {pkg.id}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  {editingId === pkg.id ? (
                    <Button size="sm" onClick={() => handleUpdate(pkg.id)} className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-9 px-3 w-full md:w-auto justify-center">
                      <Check className="w-4 h-4" /> Finalizar Edición
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditingId(pkg.id)} className="gap-2 border-primary/30 text-primary hover:bg-primary/5 h-9 px-3 w-full md:w-auto justify-center font-bold">
                      <Pencil className="w-3.5 h-3.5" /> Editar Paquete
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(pkg.id)} className="h-9 w-9 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Info Panel */}
                <div className="lg:col-span-4 p-6 border-r border-border/20 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest leading-none">
                        {pkg.name.toLowerCase().includes("arma") ? "Costo/Hr Banda" : "Costo/Hr"}
                      </Label>
                      {editingId === pkg.id ? (
                        <Input 
                          type="number"
                          value={pkg.baseCostPerHour} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, baseCostPerHour: parseFloat(e.target.value)} : p))}
                          className="h-9 bg-background px-2"
                        />
                      ) : (
                        <div className="text-xl font-heading font-bold text-primary">${pkg.baseCostPerHour.toLocaleString()}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest leading-none">
                        {pkg.name.toLowerCase().includes("arma") ? "Min Horas" : "Min Horas"}
                      </Label>
                      {editingId === pkg.id ? (
                        <Input 
                          type="number"
                          value={pkg.minDuration} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, minDuration: parseInt(e.target.value)} : p))}
                          className="h-9 bg-background px-2"
                        />
                      ) : (
                        <div className="text-xl font-heading font-bold text-foreground">{pkg.minDuration}h</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest leading-none">
                        {pkg.name.toLowerCase().includes("arma") ? "Max Horas" : "Max Horas"}
                      </Label>
                      {editingId === pkg.id ? (
                        <Input 
                          type="number"
                          value={pkg.maxDuration ?? 5} 
                          onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, maxDuration: parseInt(e.target.value)} : p))}
                          className="h-9 bg-background px-2"
                        />
                      ) : (
                        <div className="text-xl font-heading font-bold text-foreground">{(pkg.maxDuration ?? 5)}h</div>
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

                {/* Services Zone or Custom Extras Editor */}
                <div className="lg:col-span-8 p-6 space-y-4">
                  {pkg.name.toLowerCase().includes("arma") ? (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
                        <div>
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] uppercase font-black tracking-widest">Configurador Exclusivo</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            Costos Unitarios de Personalización (Arma tu Show)
                          </h3>
                        </div>
                        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/30">
                          <button
                            onClick={() => setArmaTab('costs')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                              armaTab === 'costs' 
                                ? 'bg-background text-primary shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Costos del Funnel
                          </button>
                          <button
                            onClick={() => setArmaTab('inclusions')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                              armaTab === 'inclusions' 
                                ? 'bg-background text-primary shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Inclusiones en Web
                          </button>
                        </div>
                      </div>

                      {armaTab === 'costs' ? (
                        <div className="space-y-4">
                          <div className="p-5 bg-muted/20 border border-border/60 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
                              <Music2 className="w-4.5 h-4.5 text-foreground/80" /> Horas de Show (Banda)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground">Costo por Hora</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">$</span>
                                  <Input 
                                    type="number"
                                    disabled={editingId !== pkg.id}
                                    value={pkg.baseCostPerHour} 
                                    onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, baseCostPerHour: parseFloat(e.target.value) || 0} : p))}
                                    className="pl-7 bg-background h-10 text-sm font-semibold w-full border border-border"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground">Mínimo de Horas</Label>
                                <Input 
                                  type="number"
                                  disabled={editingId !== pkg.id}
                                  value={pkg.minDuration} 
                                  onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, minDuration: parseInt(e.target.value) || 0} : p))}
                                  className="bg-background h-10 text-sm font-semibold w-full border border-border"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground">Máximo de Horas</Label>
                                <Input 
                                  type="number"
                                  disabled={editingId !== pkg.id}
                                  value={pkg.maxDuration ?? 5} 
                                  onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, maxDuration: parseInt(e.target.value) || 0} : p))}
                                  className="bg-background h-10 text-sm font-semibold w-full border border-border"
                                />
                              </div>
                              <div className="bg-muted/30 border border-border/50 rounded-xl p-2.5 flex flex-col justify-center h-10">
                                <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider leading-none">Mínima Base</span>
                                <span className="text-sm font-bold text-foreground mt-1 leading-none">
                                  ${(pkg.baseCostPerHour * pkg.minDuration).toLocaleString("es-MX")}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-background/30 border border-border/20 px-4 py-3 rounded-xl gap-3">
                              <span className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                {editingId === pkg.id 
                                  ? "Modifica los límites u horas de la Banda arriba y haz clic en 'Finalizar Edición' a la derecha para guardar."
                                  : "Para editar las tarifas y límites de la banda presiona 'Editar Paquete' a la derecha."
                                }
                              </span>
                              {editingId !== pkg.id && (
                                <Button size="sm" variant="outline" onClick={() => setEditingId(pkg.id)} className="gap-2 border-border text-foreground hover:bg-muted/20 h-9 text-xs font-semibold px-3 w-full sm:w-auto">
                                  <Pencil className="w-3.5 h-3.5" /> Editar Banda
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-muted/25 border border-border/60 rounded-2xl">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" /> Modifica, Agrega o Elimina Costos Unitarios
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Configura las tarifas individuales de los servicios para personalizar el show (DJ, Templete, Pista de Cristal, Robots LED, Pantallas LED, Upgrades de Audio, etc.).
                            </p>
                          </div>
                          <ExtrasManager initialExtras={initialExtras} />
                        </div>
                      ) : (
                        <div className="space-y-4">
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
                                      : 'bg-background/40 border-border/20 hover:border-blue-600/20 hover:bg-blue-600/5'
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
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
                                  : 'bg-background/40 border-border/20 hover:border-blue-600/20 hover:bg-blue-600/5'
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
                    </>
                  )}
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
