"use client"

import { useActionState, useEffect, useState } from "react"
import { createEventAction, updateEventAction } from "@/actions/events"
import { updateBandEventAction } from "@/actions/band-events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, CheckCircle2, AlertCircle, Calculator } from "lucide-react"

const EVENT_TYPES = ["show","eventualidad","corporativo","social","festival","privado","otro"]
const STATUSES   = ["pendiente", "agendado", "completado", "cancelado"]

interface Location {
  id: string
  name: string
  address: string
}

export function BandEventForm({ onClose, editing }: any) {
  const isEditing = !!editing
  // Si estamos editando, respetamos la bandera. Si no existe la bandera, es legado (false).
  // Si es nuevo registro (no editing), es true por defecto (nueva tabla).
  const isNewModel = isEditing ? (!!editing.isNewModel) : true 
  
  const action = isEditing 
    ? (isNewModel ? updateEventAction.bind(null, editing.id) : updateBandEventAction)
    : createEventAction

  const [state, formAction, isPending] = useActionState(action, null)
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    fetch("/api/admin/locations")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLocations(data) })
      .catch(console.error)
  }, [])

  const [base, setBase]   = useState(editing?.baseIncome  ?? 0)
  const [iva,  setIva]    = useState(editing?.ivaAmount   ?? 0)
  const [total, setTotal] = useState(editing?.totalIncome ?? 0)
  const [manualTotal, setManualTotal] = useState(false)

  useEffect(() => {
    if (!manualTotal) setTotal(parseFloat((base + iva).toFixed(2)))
  }, [base, iva, manualTotal])

  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm">
        <div className="bg-card border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle2 className="w-14 h-14 text-green-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">{state.message || (isEditing ? "Actualizado" : "Creado")}</h3>
          <Button onClick={onClose} className="mt-4 w-full text-white">Cerrar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm p-4">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {isEditing ? "Editar Eventualidad" : "Registrar Ingreso / Eventualidad"}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">Control rápido de shows e ingresos unificado.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {state && !state.success && (
          <div className="mx-6 mt-4 p-3 bg-destructive/20 border border-destructive/40 rounded-lg flex items-center gap-3 text-sm text-foreground">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="p-6 space-y-6">
          <input type="hidden" name="source" value="eventualidad" />
          {isEditing && !isNewModel && <input type="hidden" name="id" value={editing.id} />}
          
          <fieldset className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customName">Nombre del Cliente / Referencia *</Label>
                <Input id="customName" name="customName" required defaultValue={editing?.customName || editing?.clientName}
                  placeholder="Ej. María González, Empresa XYZ..." className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input id="date" name="date" type="date" required
                  defaultValue={editing?.eventDate || editing?.date} className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ceremonyType">Tipo</Label>
                <select id="ceremonyType" name="ceremonyType" defaultValue={editing?.ceremonyType || editing?.eventType || "show"}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationFree">Ubicación / Lugar</Label>
                <div className="flex gap-2">
                  <Input id="locationFree" name="locationFree" defaultValue={editing?.location || ""}
                    placeholder="Ej. Hacienda San José..." className="bg-background border-border/40 flex-1" />
                  <select 
                    className="bg-background border border-border/40 rounded-md px-2 text-xs text-foreground max-w-[140px]"
                    onChange={(e) => {
                      const input = document.getElementById("locationFree") as HTMLInputElement
                      if (input) input.value = e.target.value
                    }}
                  >
                    <option value="">(Catálogo)</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estatus</Label>
                <select id="status" name="status" defaultValue={editing?.status || "completed"}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground capitalize">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border/40 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5" /> Finanzas
            </legend>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ivaAmount">IVA (MXN)</Label>
                <Input id="ivaAmount" name="ivaAmount" type="number" step="0.01" min="0"
                  value={iva} onChange={e => { setIva(parseFloat(e.target.value)||0); setManualTotal(false) }}
                  className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Subtotal / Base</Label>
                <Input id="amount" name="amount" type="number" step="0.01"
                  value={base} onChange={e => { setBase(parseFloat(e.target.value)||0); setManualTotal(false) }}
                  className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalIncome">Total Cobrado (Neto)</Label>
                <Input id="totalIncome" name="totalIncome" type="number" step="0.01"
                  value={total} onChange={e => { setManualTotal(true); setTotal(parseFloat(e.target.value)||0) }}
                  className="bg-background border-border/40 font-bold text-primary" />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border/40 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depositMethod">Método de Pago</Label>
                <select id="depositMethod" name="depositMethod" defaultValue={editing?.paymentMethod || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground">
                  <option value="">Sin especificar</option>
                  {["Efectivo","Transferencia","Link de pago","Otro"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentRef">Referencia de Pago</Label>
                <Input id="paymentRef" name="paymentRef" defaultValue={editing?.paymentRef || ""} className="bg-background border-border/40" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border-t border-border/40 pt-4">
            <Label htmlFor="musicianNotes">Notas</Label>
            <textarea id="musicianNotes" name="musicianNotes" rows={2} defaultValue={editing?.notes}
              className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground" />
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 font-bold text-white">
              {isPending ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
