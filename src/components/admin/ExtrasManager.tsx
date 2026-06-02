"use client"

import { useState } from "react"
import { createExtraAction, updateExtraAction, deleteExtraAction, initializeDefaultExtrasAction } from "@/actions/extras"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Pencil, Trash2, Plus, X, Check, Loader2, Sparkles, Wand2, RadioTower, Box, Users } from "lucide-react"
import { toast } from "sonner"

interface Extra {
  id: string
  name: string
  description: string | null
  setupCost: number
  hourlyCost: number
  active?: boolean
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
      hourlyCost: extra.hourlyCost,
      active: extra.active
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

  // Clasificar extras para mostrarlos agrupados tal como en el funnel
  const djExtra = extras.find(e => e.name.toLowerCase().includes("dj") && !e.name.toLowerCase().includes("pantalla"))
  const djTvsExtra = extras.find(e => e.name.toLowerCase().includes("dj") && e.name.toLowerCase().includes("pantalla"))
  
  const templeteExtra = extras.find(e => e.name.toLowerCase().includes("templete") || e.name.toLowerCase().includes("escenario"))
  const pistaExtra = extras.find(e => e.name.toLowerCase().includes("pista"))
  const robotExtra = extras.find(e => e.name.toLowerCase().includes("robot") || e.name.toLowerCase().includes("batucada"))
  const pantallaExtra = extras.find(e => e.name.toLowerCase().includes("pantalla") && e.name.includes("3x2"))
  
  const audioMediumExtra = extras.find(e => e.name.toLowerCase().includes("audio") && (e.name.includes(">100") || e.name.toLowerCase().includes("pro")))
  const audioLargeExtra = extras.find(e => e.name.toLowerCase().includes("audio") && (e.name.includes(">300") || e.name.toLowerCase().includes("festival")))

  // Obtener IDs clasificados para filtrar la sección de "Otros"
  const classifiedIds = new Set([
    djExtra?.id, djTvsExtra?.id, templeteExtra?.id, pistaExtra?.id,
    robotExtra?.id, pantallaExtra?.id, audioMediumExtra?.id, audioLargeExtra?.id
  ].filter(Boolean))

  const otherExtras = extras.filter(e => !classifiedIds.has(e.id))

  function renderExtraRow(extra: Extra | undefined, defaultName: string, defaultDesc: string) {
    if (!extra) {
      // Si el extra no existe en la base de datos, mostramos un renglón para poder crearlo
      return (
        <div key={`empty-${defaultName}`} className="flex flex-col lg:grid lg:grid-cols-[2fr_1.1fr_1.2fr_1.2fr_1fr] gap-4 items-start lg:items-center p-4 rounded-xl border border-dashed border-border/40 bg-muted/5 opacity-60">
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-sm font-bold text-muted-foreground/80 truncate">{defaultName}</span>
            <span className="text-xs text-muted-foreground/60 line-clamp-1">{defaultDesc}</span>
          </div>
          <div className="text-xs text-muted-foreground/60 italic font-medium lg:block hidden">No inicializado</div>
          <div className="text-xs text-muted-foreground/40 lg:block hidden">-</div>
          <div className="text-xs text-muted-foreground/40 lg:block hidden">-</div>
          <div className="flex lg:justify-end w-full lg:w-auto mt-2 lg:mt-0">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                setLoading(`create-${defaultName}`)
                const defaultSetupCost = defaultName.includes("Templete") ? 3800 : defaultName.includes("Pista") ? 7500 : defaultName.includes("Robot") ? 700 : (defaultName.includes("Pantalla") && !defaultName.includes("DJ")) ? 15000 : 0
                const defaultHourlyCost = defaultName.includes("DJ") ? (defaultName.includes("Pantalla") ? 1500 : 800) : 0
                const res = await createExtraAction({
                  name: defaultName,
                  description: defaultDesc,
                  setupCost: defaultSetupCost,
                  hourlyCost: defaultHourlyCost
                })
                if (res.success) {
                  toast.success(`Servicio "${defaultName}" pre-creado exitosamente.`)
                  window.location.reload()
                } else {
                  toast.error(res.error)
                }
                setLoading(null)
              }}
              className="text-xs font-semibold h-9 px-3 w-full lg:w-auto text-blue-600 border-blue-600/20 bg-blue-600/5 hover:bg-blue-600/10 transition-colors"
              disabled={loading === `create-${defaultName}`}
            >
              {loading === `create-${defaultName}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Pre-crear"}
            </Button>
          </div>
        </div>
      )
    }

    const isEditing = editingId === extra.id
    const isUpdating = loading === extra.id

    return (
      <div 
        key={extra.id}
        className={`flex flex-col lg:grid lg:grid-cols-[2fr_1.1fr_1.2fr_1.2fr_1fr] gap-4 p-4 rounded-xl border transition-all ${
          isEditing 
            ? "border-blue-600 bg-card ring-1 ring-blue-600/20 shadow-md" 
            : extra.active !== false 
              ? "border-border/60 bg-card/10 hover:border-border/100 hover:bg-card/25" 
              : "border-border/40 bg-muted/20 opacity-70 filter grayscale-[10%]"
        }`}
      >
        {/* Servicio Column */}
        <div className="flex flex-col min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <Input 
                value={extra.name} 
                onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, name: e.target.value} : p))}
                className="h-9 font-bold bg-background text-sm text-foreground w-full border border-border focus:border-blue-600"
                placeholder="Nombre del servicio"
              />
              <Input 
                value={extra.description || ""} 
                onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, description: e.target.value} : p))}
                className="h-9 text-xs bg-background text-muted-foreground w-full border border-border focus:border-blue-600"
                placeholder="Descripción del servicio..."
              />
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground text-sm uppercase tracking-tight block truncate">{extra.name}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-extrabold tracking-wider lg:hidden ${
                  extra.active !== false 
                    ? "bg-green-500/10 text-green-600 border-green-500/20" 
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}>
                  {extra.active !== false ? "Disponible" : "Agotado"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{extra.description || "Sin descripción registrada."}</p>
            </div>
          )}
        </div>
 
        {/* Disponibilidad Column (Desktop Only, mobile gets inline status) */}
        <div className="hidden lg:flex items-center gap-2">
          {isEditing ? (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={extra.active !== false} 
                onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, active: e.target.checked} : p))}
                className="rounded border-border bg-background text-blue-600 focus:ring-blue-600 w-4.5 h-4.5 cursor-pointer"
              />
              <span className="text-xs font-semibold text-foreground">Disponible</span>
            </label>
          ) : (
            <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase font-extrabold tracking-wider ${
              extra.active !== false 
                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}>
              {extra.active !== false ? "Disponible" : "Agotado"}
            </span>
          )}
        </div>

        {/* Inline editing switch for Mobile */}
        {isEditing && (
          <div className="flex lg:hidden items-center gap-2 mt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={extra.active !== false} 
                onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, active: e.target.checked} : p))}
                className="rounded border-border bg-background text-blue-600 focus:ring-blue-600 w-4.5 h-4.5 cursor-pointer"
              />
              <span className="text-xs font-semibold text-foreground">Disponible</span>
            </label>
          </div>
        )}

        {/* Costo Setup Column */}
        <div className="flex flex-col lg:block">
          {isEditing ? (
            <div className="space-y-1.5 lg:space-y-0 w-full">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider lg:hidden">Costo Fijo (Setup)</span>
              <div className="relative w-full max-w-[150px] lg:max-w-[120px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">$</span>
                <Input 
                  type="number"
                  value={extra.setupCost} 
                  onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, setupCost: parseFloat(e.target.value) || 0} : p))}
                  className="h-9 pl-7 pr-2 text-sm bg-background text-foreground border border-border/80 focus:border-blue-600 w-full font-semibold"
                />
              </div>
            </div>
          ) : (
            <div className="flex lg:block items-center justify-between text-xs lg:text-sm font-semibold text-muted-foreground lg:text-foreground lg:font-bold">
              <span className="lg:hidden text-[10px] font-bold text-muted-foreground/60 uppercase">Costo Fijo Setup:</span>
              <span className="text-foreground font-bold">${extra.setupCost.toLocaleString("es-MX")}</span>
            </div>
          )}
        </div>

        {/* Costo por Hora Column */}
        <div className="flex flex-col lg:block mt-1 lg:mt-0">
          {isEditing ? (
            <div className="space-y-1.5 lg:space-y-0 w-full">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider lg:hidden">Costo por Hora</span>
              <div className="relative w-full max-w-[150px] lg:max-w-[120px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">$</span>
                <Input 
                  type="number"
                  value={extra.hourlyCost} 
                  onChange={e => setExtras(prev => prev.map(p => p.id === extra.id ? {...p, hourlyCost: parseFloat(e.target.value) || 0} : p))}
                  className="h-9 pl-7 pr-2 text-sm bg-background text-foreground border border-border/80 focus:border-blue-600 w-full font-semibold"
                />
              </div>
            </div>
          ) : (
            <div className="flex lg:block items-center justify-between text-xs lg:text-sm font-semibold text-muted-foreground lg:text-foreground lg:font-bold">
              <span className="lg:hidden text-[10px] font-bold text-muted-foreground/60 uppercase">Costo por Hora:</span>
              <span className="text-foreground font-bold">${extra.hourlyCost.toLocaleString("es-MX")}/h</span>
            </div>
          )}
        </div>

        {/* Acciones Column */}
        <div className="flex items-center gap-2 lg:justify-end border-t lg:border-t-0 border-border/10 pt-3 lg:pt-0 mt-3 lg:mt-0 w-full lg:w-auto">
          {isEditing ? (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isUpdating} 
                onClick={() => handleUpdate(extra.id)} 
                className="h-9 flex-1 lg:flex-none px-3 gap-1.5 text-green-600 border-green-600/30 bg-green-600/5 hover:bg-green-600/10 text-xs font-bold justify-center"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Guardar
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setEditingId(null)} 
                className="h-9 flex-1 lg:flex-none px-3 gap-1.5 text-muted-foreground hover:bg-muted/10 text-xs font-bold justify-center"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditingId(extra.id)} 
                className="h-9 flex-1 lg:flex-none px-3 gap-1.5 text-blue-600 border-blue-600/20 hover:text-blue-700 hover:bg-blue-600/5 text-xs font-bold justify-center"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleDelete(extra.id)} 
                className="h-9 flex-1 lg:flex-none px-3 gap-1.5 text-destructive/80 border-destructive/20 hover:text-destructive hover:bg-destructive/5 text-xs font-bold justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-muted/45 p-5 rounded-2xl border border-border/40 gap-4">
        <div className="flex items-center gap-3">
           <Sparkles className="w-5 h-5 text-blue-600" />
           <div className="flex flex-col">
             <span className="font-bold text-foreground text-sm uppercase tracking-wider">Servicios Adicionales (Extras)</span>
             <span className="text-xs text-muted-foreground mt-0.5">Controla la disponibilidad y los precios individuales de los servicios adicionales.</span>
           </div>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="gap-2 border-blue-600/40 text-blue-600 hover:bg-blue-600/10 h-9.5 font-bold text-xs uppercase tracking-wider w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Agregar Extra Custom
        </Button>
      </div>

      {/* Adding card */}
      {isAdding && (
        <Card className="bg-card border-blue-600/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Configurar Nuevo Extra</CardTitle>
            <CardDescription>Define el nombre y los costos base para el arma tu show.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Nombre del Servicio</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Pista de Cristal LED" className="bg-background border-border text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Descripción</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Setup premium de 5x5m..." className="bg-background border-border text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Costo Fijo / Instalación ($)</Label>
                <Input type="number" value={formData.setupCost} onChange={e => setFormData({...formData, setupCost: parseFloat(e.target.value) || 0})} className="bg-background border-border text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Costo por Hora ($)</Label>
                <Input type="number" value={formData.hourlyCost} onChange={e => setFormData({...formData, hourlyCost: parseFloat(e.target.value) || 0})} className="bg-background border-border text-sm h-10" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-9.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading === "new"} className="h-9.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs uppercase tracking-wider text-white border-none">
                {loading === "new" ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar Servicio"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de Control de Audio Dinámico (Umbrales de Invitados) */}
      <Card className="bg-card border border-blue-600/20 overflow-hidden shadow-lg rounded-2xl">
        <CardHeader className="bg-blue-600/5 border-b border-blue-600/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground uppercase tracking-wider">Audio Dinámico por Aforo</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Configura el costo fijo de instalación del equipo de audio según la cantidad de invitados en el cotizador dinámico.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Umbral 1: 0 - 100 Invitados */}
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-green-600 tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Base</span>
                  <span className="text-xs font-bold text-muted-foreground">0 - 100 Personas</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">Audio Estándar</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sistema de audio Electro-Voice de alta fidelidad. Cobertura acústica ideal y balanceada para salones medianos y aforo estándar.
                </p>
              </div>
              <div className="pt-2 border-t border-border/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Costo de Setup:</span>
                <span className="text-sm font-black text-green-500">¡Incluido ($0)!</span>
              </div>
            </div>

            {/* Umbral 2: 101 - 300 Invitados */}
            <div className="bg-muted/30 border border-blue-600/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-amber-700 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Upgrade Pro</span>
                  <span className="text-xs font-bold text-muted-foreground">101 - 300 Personas</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">Audio Upgrade Pro</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Refuerzo de graves y subwoofers adicionales para garantizar la presión sonora y calidad acústica en aforos medianos.
                </p>
              </div>
              <div className="pt-2 border-t border-border/10">
                {audioMediumExtra ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Costo Fijo Setup:</span>
                      <div className="relative w-[120px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">$</span>
                        <Input 
                          type="number"
                          value={audioMediumExtra.setupCost}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            setExtras(prev => prev.map(ex => ex.id === audioMediumExtra.id ? { ...ex, setupCost: val } : ex))
                          }}
                          className="h-8 pl-6 pr-1 text-xs bg-background text-foreground border border-border/80 text-right font-bold w-full focus:border-blue-600"
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdate(audioMediumExtra.id)} 
                      disabled={loading === audioMediumExtra.id}
                      className="w-full text-[10px] font-bold h-7.5 bg-blue-600/10 border border-blue-600/20 text-blue-600 hover:bg-blue-600/20 uppercase tracking-widest"
                    >
                      {loading === audioMediumExtra.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Guardar Costo"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground italic">No inicializado</div>
                )}
              </div>
            </div>

            {/* Umbral 3: 301+ Invitados */}
            <div className="bg-muted/30 border border-blue-600/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-rose-700 tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Festival</span>
                  <span className="text-xs font-bold text-muted-foreground">301+ Personas</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">Audio Line Array (Festival)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sistema aéreo Line Array tipo concierto para eventos grandes en haciendas, jardines y espacios abiertos masivos.
                </p>
              </div>
              <div className="pt-2 border-t border-border/10">
                {audioLargeExtra ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Costo Fijo Setup:</span>
                      <div className="relative w-[120px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">$</span>
                        <Input 
                          type="number"
                          value={audioLargeExtra.setupCost}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            setExtras(prev => prev.map(ex => ex.id === audioLargeExtra.id ? { ...ex, setupCost: val } : ex))
                          }}
                          className="h-8 pl-6 pr-1 text-xs bg-background text-foreground border border-border/80 text-right font-bold w-full focus:border-blue-600"
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdate(audioLargeExtra.id)} 
                      disabled={loading === audioLargeExtra.id}
                      className="w-full text-[10px] font-bold h-7.5 bg-blue-600/10 border border-blue-600/20 text-blue-600 hover:bg-blue-600/20 uppercase tracking-widest"
                    >
                      {loading === audioLargeExtra.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Guardar Costo"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground italic">No inicializado</div>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Grid of Tables */}
      <div className="space-y-8">
        
        {/* DJ Category */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/20">
            <RadioTower className="w-4 h-4 text-blue-600" /> Horas de DJ Adicionales
          </h3>
          <div className="space-y-2.5">
            {/* Table Header on Desktop */}
            <div className="hidden lg:grid grid-cols-[2fr_1.1fr_1.2fr_1.2fr_1fr] gap-4 px-4 py-2 border-b border-border/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <div>Servicio</div>
              <div>Disponibilidad</div>
              <div>Costo Setup (Fijo)</div>
              <div>Costo por Hora</div>
              <div className="text-right">Acciones</div>
            </div>
            {renderExtraRow(djExtra, "DJ (Hora Extra)", "DJ continuo en descansos o extensión de horario")}
            {renderExtraRow(djTvsExtra, "DJ con Pantallas (Hora Extra)", "DJ con 2 pantallas LED de 45 pulgadas")}
          </div>
        </div>

        {/* Equipamiento Category */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/20">
            <Box className="w-4 h-4 text-blue-600" /> Equipamiento y Escenario (Extras)
          </h3>
          <div className="space-y-2.5">
            {/* Table Header on Desktop */}
            <div className="hidden lg:grid grid-cols-[2fr_1.1fr_1.2fr_1.2fr_1fr] gap-4 px-4 py-2 border-b border-border/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <div>Servicio</div>
              <div>Disponibilidad</div>
              <div>Costo Setup (Fijo)</div>
              <div>Costo por Hora</div>
              <div className="text-right">Acciones</div>
            </div>
            {renderExtraRow(templeteExtra, "Templete", "Escenario elevado para la banda")}
            {renderExtraRow(pistaExtra, "Pista Iluminada", "Pista LED premium para la pista de baile")}
            {renderExtraRow(robotExtra, "Robot LED (Batucada)", "Show visual con robots LED durante la batucada")}
            {renderExtraRow(pantallaExtra, "Pantalla LED 3x2", "Pantalla LED gigante detrás del escenario")}
          </div>
        </div>

        {/* Other custom extras */}
        {otherExtras.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/20">
              <Plus className="w-4 h-4 text-blue-600" /> Otros Extras
            </h3>
            <div className="space-y-2.5">
              {/* Table Header on Desktop */}
              <div className="hidden lg:grid grid-cols-[2fr_1.1fr_1.2fr_1.2fr_1fr] gap-4 px-4 py-2 border-b border-border/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <div>Servicio</div>
                <div>Disponibilidad</div>
                <div>Costo Setup (Fijo)</div>
                <div>Costo por Hora</div>
                <div className="text-right">Acciones</div>
              </div>
              {otherExtras.map(ex => renderExtraRow(ex, ex.name, ex.description || ""))}
            </div>
          </div>
        )}

        {extras.length === 0 && (
          <Card className="border-2 border-dashed border-border/40 bg-card/5 p-12 text-center">
            <CardHeader className="items-center pb-2">
              <Wand2 className="w-12 h-12 text-blue-600/30 animate-pulse mb-3" />
              <CardTitle className="text-lg">¿Sin Rubros Configurables?</CardTitle>
              <CardDescription className="max-w-md">
                No hay servicios adicionales o costos del "Arma tu show" registrados en la base de datos de extras.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button 
                onClick={async () => {
                  setLoading("init")
                  const res = await initializeDefaultExtrasAction()
                  if (res.success) {
                    toast.success("¡Rubros e inyecciones de costos pre-cargados con éxito!")
                    window.location.reload()
                  } else {
                    toast.error(res.error)
                  }
                  setLoading(null)
                }}
                disabled={loading === "init"}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-xs uppercase tracking-widest text-white px-5 py-3.5 rounded-lg border-none"
              >
                {loading === "init" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Pre-cargar Rubros por Defecto de Arma tu Show
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
