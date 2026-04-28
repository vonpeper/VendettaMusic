"use client"

import { useState } from "react"
import { createPackageAction, updatePackageAction, deletePackageAction } from "@/actions/packages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Package {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string | null
  includes: string | null
  active: boolean
}

export function PackagesManager({ initialPackages }: { initialPackages: Package[] }) {
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
    const res = await updatePackageAction(id, pkg)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Paquetes Disponibles</h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2 text-white">
          <Plus className="w-4 h-4" /> Nuevo Paquete
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-card border-primary/30">
          <CardHeader>
            <CardTitle>Crear Nuevo Paquete</CardTitle>
            <CardDescription>Configura los costos base y descripción del paquete.</CardDescription>
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
            <div className="space-y-2">
              <Label>¿Qué incluye? (Separado por comas)</Label>
              <textarea 
                value={formData.includes} 
                onChange={e => setFormData({...formData, includes: e.target.value})} 
                className="flex min-h-[80px] w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                placeholder="Staff, Audio, 2hrs DJ, 3hrs Banda..."
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map(pkg => (
          <Card key={pkg.id} className={`bg-card border-border/40 transition-all ${editingId === pkg.id ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                {editingId === pkg.id ? (
                  <Input 
                    value={pkg.name} 
                    onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, name: e.target.value} : p))}
                    className="h-8 font-bold text-lg bg-background w-2/3"
                  />
                ) : (
                  <CardTitle>{pkg.name}</CardTitle>
                )}
                <div className="flex gap-1">
                  {editingId === pkg.id ? (
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(pkg.id)} className="h-8 w-8 text-green-700">
                      <Check className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(pkg.id)} className="h-8 w-8 text-primary">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(pkg.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Costo/Hr</span>
                  {editingId === pkg.id ? (
                    <Input 
                      type="number"
                      value={pkg.baseCostPerHour} 
                      onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, baseCostPerHour: parseFloat(e.target.value)} : p))}
                      className="h-8 bg-background"
                    />
                  ) : (
                    <div className="text-foreground font-bold">${pkg.baseCostPerHour.toLocaleString()}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Min Horas</span>
                  {editingId === pkg.id ? (
                    <Input 
                      type="number"
                      value={pkg.minDuration} 
                      onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, minDuration: parseInt(e.target.value)} : p))}
                      className="h-8 bg-background"
                    />
                  ) : (
                    <div className="text-foreground font-bold">{pkg.minDuration}h</div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">Descripción</span>
                {editingId === pkg.id ? (
                  <Input 
                    value={pkg.description || ""} 
                    onChange={e => setPackages(prev => prev.map(p => p.id === pkg.id ? {...p, description: e.target.value} : p))}
                    className="h-8 bg-background"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </div>
              <div className="pt-2 border-t border-border/40">
                 <span className="text-[10px] uppercase text-primary font-bold">Incluye</span>
                 <p className="text-[11px] text-muted-foreground mt-1">{pkg.includes}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
