"use client"

import { useState } from "react"
import { createServiceItemAction, updateServiceItemAction, deleteServiceItemAction } from "@/actions/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2, Sparkles, Star, Mic2, Volume2, Lightbulb, Monitor, Users, Cpu, Clock, Music2, Quote, Zap } from "lucide-react"
import { toast } from "sonner"

const ICON_OPTIONS = [
  { name: "Check", icon: Check },
  { name: "Sparkles", icon: Sparkles },
  { name: "Star", icon: Star },
  { name: "Music2", icon: Music2 },
  { name: "Mic2", icon: Mic2 },
  { name: "Volume2", icon: Volume2 },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Monitor", icon: Monitor },
  { name: "Users", icon: Users },
  { name: "Cpu", icon: Cpu },
  { name: "Clock", icon: Clock },
  { name: "Quote", icon: Quote },
  { name: "Zap", icon: Zap },
]

interface ServiceItem {
  id: string
  name: string
  category: string
  icon: string | null
  description: string | null
  order: number
  active: boolean
}

export function ServicesManager({ initialServices }: { initialServices: ServiceItem[] }) {
  const [services, setServices] = useState(initialServices)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "Inclusión",
    icon: "Check",
    description: "",
    order: 0
  })

  async function handleCreate() {
    setLoading("new")
    const res = await createServiceItemAction(formData)
    if (res.success) {
      toast.success("Servicio creado")
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function handleUpdate(id: string) {
    setLoading(id)
    const service = services.find(s => s.id === id)
    if (!service) return
    const res = await updateServiceItemAction(id, {
      name: service.name,
      category: service.category,
      icon: service.icon,
      description: service.description,
      order: service.order
    })
    if (res.success) {
      toast.success("Servicio actualizado")
      setEditingId(null)
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio del catálogo?")) return
    setLoading(id)
    const res = await deleteServiceItemAction(id)
    if (res.success) {
      toast.success("Servicio eliminado")
      setServices(prev => prev.filter(s => s.id !== id))
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <Zap className="w-5 h-5 text-primary" /> Catálogo Maestro de Servicios
        </h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2 text-white">
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-card border-primary/30">
          <CardHeader>
            <CardTitle>Crear Nuevo Servicio</CardTitle>
            <CardDescription>Este servicio podrá ser seleccionado para cualquier paquete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Servicio</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Audio Electro-Voice" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-background border border-border/40 rounded-md p-2 text-sm text-foreground"
                >
                  <option value="Inclusión">Inclusión (Default)</option>
                  <option value="Extra">Extra / Adicional</option>
                  <option value="Personalización">Personalización</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-5 gap-2 p-2 border border-border/40 rounded-md bg-background">
                   {ICON_OPTIONS.map(opt => (
                     <button 
                       key={opt.name}
                       type="button"
                       onClick={() => setFormData({...formData, icon: opt.name})}
                       className={`p-2 rounded-md flex items-center justify-center hover:bg-primary/10 transition-colors ${formData.icon === opt.name ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                     >
                       <opt.icon className="w-4 h-4 text-foreground" />
                     </button>
                   ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción (Opcional)</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalles técnicos..." className="bg-background" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading === "new"}>
                {loading === "new" ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar en Catálogo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map(service => {
          const IconComp = ICON_OPTIONS.find(o => o.name === service.icon)?.icon || Check
          
          return (
            <Card key={service.id} className={`bg-card/50 border-border/40 transition-all ${editingId === service.id ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    {editingId === service.id ? (
                      <Button size="icon" variant="ghost" onClick={() => handleUpdate(service.id)} className="h-7 w-7 text-green-500">
                        <Check className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(service.id)} className="h-7 w-7 text-primary/60">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(service.id)} className="h-7 w-7 text-destructive/60">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  {editingId === service.id ? (
                    <Input 
                      value={service.name} 
                      onChange={e => setServices(prev => prev.map(s => s.id === service.id ? {...s, name: e.target.value} : s))}
                      className="h-8 font-bold text-sm bg-background"
                    />
                  ) : (
                    <div className="font-bold text-sm text-foreground">{service.name}</div>
                  )}
                  <div className="text-[10px] text-primary font-black uppercase tracking-widest">{service.category}</div>
                </div>

                {editingId === service.id ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Cambiar Icono</Label>
                    <div className="grid grid-cols-5 gap-1 p-1 border border-border/40 rounded-md bg-background">
                      {ICON_OPTIONS.map(opt => (
                        <button 
                          key={opt.name}
                          type="button"
                          onClick={() => setServices(prev => prev.map(s => s.id === service.id ? {...s, icon: opt.name} : s))}
                          className={`p-1.5 rounded flex items-center justify-center hover:bg-primary/10 ${service.icon === opt.name ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                        >
                          <opt.icon className="w-3 h-3 text-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    {service.description || "Sin descripción"}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
