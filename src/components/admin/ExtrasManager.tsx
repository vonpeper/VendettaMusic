"use client"

import { useState } from "react"
import { createExtraAction, updateExtraAction, deleteExtraAction } from "@/actions/extras"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface Extra {
  id: string
  name: string
  description: string | null
  setupCost: number
  hourlyCost: number
}

export function ExtrasManager({ initialExtras }: { initialExtras: Extra[] }) {
  const [extras, setExtras] = useState(initialExtras)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    setupCost: 0,
    hourlyCost: 0
  })

  async function handleCreate() {
    setLoading("new")
    const res = await createExtraAction(formData)
    if (res.success) {
      toast.success("Servicio adicional creado")
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  async function handleUpdate(id: string) {
    setLoading(id)
    const extra = extras.find(e => e.id === id)
    if (!extra) return
    const res = await updateExtraAction(id, {
      name: extra.name,
      description: extra.description,
      setupCost: extra.setupCost,
      hourlyCost: extra.hourlyCost
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
    if (!confirm("¿Eliminar este servicio adicional?")) return
    setLoading(id)
    const res = await deleteExtraAction(id)
    if (res.success) {
      toast.success("Servicio eliminado")
      setExtras(prev => prev.filter(e => e.id !== id))
    } else {
      toast.error(res.error)
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-primary" />
           <h2 className="text-2xl font-bold text-foreground">Servicios Adicionales (Extras)</h2>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4" /> Agregar Extra
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-card border-primary/30 shadow-xl">
          <CardHeader>
            <CardTitle>Configurar Nuevo Extra</CardTitle>
            <CardDescription>Define el nombre y los costos base para el arma tu show.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Servicio</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Pista de Cristal LED" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Setup premium de 5x5m..." className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Costo Fijo / Instalación ($)</Label>
                <Input type="number" value={formData.setupCost} onChange={e => setFormData({...formData, setupCost: parseFloat(e.target.value)})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Costo por Hora ($)</Label>
                <Input type="number" value={formData.hourlyCost} onChange={e => setFormData({...formData, hourlyCost: parseFloat(e.target.value)})} className="bg-background" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading === "new"}>
                {loading === "new" ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar Servicio"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extras.map(extra => (
          <Card key={extra.id} className={`bg-card/50 border-border/40 transition-all ${editingId === extra.id ? 'ring-2 ring-primary border-transparent' : ''}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  {editingId === extra.id ? (
                    <Input 
                      value={extra.name} 
                      onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, name: e.target.value} : p))}
                      className="h-8 font-bold bg-background mb-2"
                    />
                  ) : (
                    <div className="font-bold text-foreground">{extra.name}</div>
                  )}
                  {editingId === extra.id ? (
                    <Input 
                      value={extra.description || ""} 
                      onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, description: e.target.value} : p))}
                      className="h-8 text-xs bg-background"
                      placeholder="Descripción..."
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground line-clamp-1">{extra.description}</div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  {editingId === extra.id ? (
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(extra.id)} className="h-7 w-7 text-green-500">
                      <Check className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(extra.id)} className="h-7 w-7 text-primary/60 hover:text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(extra.id)} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase text-muted-foreground font-black">Fijo/Setup</span>
                  {editingId === extra.id ? (
                    <Input 
                      type="number"
                      value={extra.setupCost} 
                      onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, setupCost: parseFloat(e.target.value)} : p))}
                      className="h-7 text-xs bg-background"
                    />
                  ) : (
                    <div className="text-xs font-bold text-foreground">${extra.setupCost.toLocaleString()}</div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase text-muted-foreground font-black">Por Hora</span>
                  {editingId === extra.id ? (
                    <Input 
                      type="number"
                      value={extra.hourlyCost} 
                      onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, hourlyCost: parseFloat(e.target.value)} : p))}
                      className="h-7 text-xs bg-background"
                    />
                  ) : (
                    <div className="text-xs font-bold text-foreground">${extra.hourlyCost.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
