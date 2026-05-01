"use client"

import { useActionState, useState } from "react"
import { createEventAction, updateEventAction } from "@/actions/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, CheckCircle2, AlertCircle, Bell, MessageCircle, Copy, Check } from "lucide-react"

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

const STATUS_OPTIONS = [
  { value: "pendiente",  label: "⏳ Pendiente" },
  { value: "agendado",   label: "📅 Agendado" },
  { value: "completado", label: "✅ Completado" },
  { value: "cancelado",  label: "❌ Cancelado" },
]

interface EventFormProps {
  onClose: () => void
  clients: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number }[]
  staff?: { id: string; name: string }[]
  initialData?: any
}

function SelectField({ id, name, label, options, defaultValue, required }: {
  id: string; name: string; label: string; required?: boolean
  options: { value: string; label: string }[]
  defaultValue?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && " *"}</Label>
      <select id={id} name={name} defaultValue={defaultValue ?? ""}
        className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="" disabled>Seleccionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function EventForm({ onClose, clients, locations, packages, staff = [], initialData }: EventFormProps) {
  const action = initialData ? updateEventAction.bind(null, initialData.id) : createEventAction
  const [state, formAction, isPending] = useActionState(action, null)
  const [sendNotif, setSendNotif] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyGigMessage() {
    if (state?.gigMessage) {
      navigator.clipboard.writeText(state.gigMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Success screen
  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm p-4">
        <div className="bg-card border border-green-500/30 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="p-6 text-center border-b border-border/40">
            <CheckCircle2 className="w-14 h-14 text-green-700 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground">{initialData ? "¡Evento actualizado!" : "¡Evento creado!"}</h3>
            <p className="text-muted-foreground text-sm mt-1">{state.message}</p>
          </div>

          {state.gigMessage && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <MessageCircle className="w-4 h-4" />
                  Mensaje de WhatsApp para los músicos
                </div>
                <button onClick={copyGigMessage}
                  className="flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <pre className="text-xs text-muted-foreground bg-card rounded-xl p-4 whitespace-pre-wrap font-mono border border-border/40 max-h-64 overflow-y-auto">
                {state.gigMessage}
              </pre>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {sendNotif
                  ? "El mensaje fue enviado automáticamente por WhatsApp a los músicos."
                  : "Evolution API no configurada. Copia el mensaje y envíalo manualmente."}
              </p>
            </div>
          )}

          <div className="p-6 pt-0">
            <Button onClick={onClose} className="w-full font-bold text-white">Cerrar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm p-4">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {initialData ? `Editando Evento: ${initialData.client?.user?.name || ''}` : "Nuevo Show / Evento"}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">El evento se sincronizará automáticamente con Eventualidades.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {state && !state.success && (
          <div className="mx-6 mt-4 p-3 bg-destructive/20 border border-destructive/40 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="p-6 space-y-6">

          {/* Identidad */}
          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Identidad del Evento</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente (Opcional)</Label>
                <select id="clientId" name="clientId" defaultValue={initialData?.clientId || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">(Sin cliente asignado)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="customName">Nombre del Show / Evento (Opcional)</Label>
                <Input id="customName" name="customName" placeholder="Ej. Tributo Mentiras, Show Alquimia..."
                  defaultValue={initialData?.customName || ""}
                  className="bg-background border-border/40 text-foreground" />
                <p className="text-[10px] text-muted-foreground italic">Este nombre es el que aparecerá en la Gira Artística pública.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input id="date" name="date" type="date" required 
                  defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : ""}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <SelectField id="ceremonyType" name="ceremonyType" label="Tipo de Evento"
                defaultValue={initialData?.ceremonyType}
                options={CEREMONY_TYPES} />
              <div className="space-y-2">
                <Label htmlFor="guestCount">Número de Invitados</Label>
                <Input id="guestCount" name="guestCount" type="number" min="0" placeholder="Ej. 200"
                  defaultValue={initialData?.guestCount}
                  className="bg-background border-border/40 text-foreground" />
              </div>

              {/* Nuevos controles de visibilidad pública */}
              <div className="col-span-1 md:col-span-2 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublic" className="text-sm font-bold text-primary flex items-center gap-2">
                      ⚡ Show Público en Agenda
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Si se activa, el show aparecerá en la página principal con botones de "Ubucación" y "Reservar".</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="isPublic" id="isPublic" defaultChecked={initialData?.isPublic} className="sr-only peer" />
                    <div className="w-11 h-6 bg-primary/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border/40 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mapsLink" className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    Link de Google Maps
                  </Label>
                  <Input id="mapsLink" name="mapsLink" defaultValue={initialData?.mapsLink || ""}
                    placeholder="https://maps.app.goo.gl/..."
                    className="bg-background h-9 text-xs border-primary/20" />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Logística */}
          <fieldset className="border-t border-border/40 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Logística y Ejecución</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationId">Ubicación (catálogo)</Label>
                <select id="locationId" name="locationId" defaultValue={initialData?.locationId || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Sin ubicación en catálogo</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationFree">Dirección libre (si no está en catálogo)</Label>
                <Input id="locationFree" name="locationFree" placeholder="Ej. Hacienda San José, Querétaro"
                  className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceStart">Inicio de Ejecución</Label>
                <Input id="performanceStart" name="performanceStart" type="time"
                  defaultValue={initialData?.performanceStart || ""}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceEnd">Fin de Ejecución</Label>
                <Input id="performanceEnd" name="performanceEnd" type="time"
                  defaultValue={initialData?.performanceEnd || ""}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Hora de llegada Musicians</Label>
                <Input id="arrivalTime" name="arrivalTime" type="time"
                  defaultValue={initialData?.arrivalTime || ""}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setupTime">Hora de montaje</Label>
                <Input id="setupTime" name="setupTime" type="time"
                  defaultValue={initialData?.setupTime || ""}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <SelectField id="dressCode" name="dressCode" label="Vestimenta"
                defaultValue={initialData?.dressCode}
                options={DRESS_CODES} />
              <SelectField id="status" name="status" label="Estatus"
                options={STATUS_OPTIONS} defaultValue={initialData?.status || "agendado"} />
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="musicianNotes">Notas para los músicos</Label>
              <textarea id="musicianNotes" name="musicianNotes" rows={2}
                placeholder="Instrucciones específicas del show..."
                defaultValue={initialData?.musicianNotes || ""}
                className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            
            <div className="space-y-2 mt-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
              <Label htmlFor="bitacora" className="text-primary font-bold flex items-center gap-2">
                📓 Bitácora / Observaciones del Show
              </Label>
              <p className="text-[10px] text-muted-foreground mb-2">Redacta aquí los highlights, horarios reales de llegada, incidentes u observaciones generales del evento.</p>
              <textarea id="bitacora" name="bitacora" rows={4}
                placeholder="Ej. El vocalista llegó 15 mins tarde, el audio falló al inicio pero se solucionó..."
                defaultValue={initialData?.bitacora || ""}
                className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            
            <div className="space-y-2 mt-4">
              <SelectField id="audioEngineer" name="audioEngineer" label="Ingeniero en Audio / Staff Asignado"
                defaultValue={initialData?.audioEngineer || ""}
                options={[{ value: "", label: "Ninguno" }, ...staff.map(s => ({ value: s.name, label: s.name }))]} />
            </div>
          </fieldset>

          {/* Finanzas */}
          <fieldset className="border-t border-border/40 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Paquete y Finanzas</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageId">Paquete</Label>
                <select id="packageId" name="packageId" defaultValue={initialData?.packageId || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Personalizado</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${(p.baseCostPerHour * p.minDuration).toLocaleString("es-MX")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Total del Paquete (MXN)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0"
                  defaultValue={initialData?.amount}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Anticipo recibido (MXN)</Label>
                <Input id="deposit" name="deposit" type="number" step="0.01" min="0"
                  defaultValue={initialData?.deposit}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositMethod">Método de pago anticipo / ingreso</Label>
                <select id="depositMethod" name="depositMethod" defaultValue={initialData?.depositMethod || initialData?.paymentMethod || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Sin especificar</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Link de pago">Link de pago</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ivaAmount">IVA (Opcional)</Label>
                <Input id="ivaAmount" name="ivaAmount" type="number" step="0.01" min="0"
                  defaultValue={initialData?.ivaAmount || 0}
                  className="bg-background border-border/40 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalIncome">Total Cobrado (Neto)</Label>
                <Input id="totalIncome" name="totalIncome" type="number" step="0.01" min="0" placeholder="Ej. 15000"
                  defaultValue={initialData?.totalIncome || initialData?.amount}
                  className="bg-background border-border/40 text-foreground font-bold text-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentRef">Referencia de Pago</Label>
                <Input id="paymentRef" name="paymentRef" defaultValue={initialData?.paymentRef || ""}
                  placeholder="Nº transferencia, folio, etc." className="bg-background border-border/40" />
              </div>
              <input type="hidden" name="source" value={initialData?.source || "manual"} />
              <input type="hidden" name="paymentMethod" value={initialData?.depositMethod || ""} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer mt-4">
              <input type="checkbox" name="invoice" className="sr-only peer" id="invoice" defaultChecked={initialData?.invoice} />
              <div className="relative w-10 h-5 bg-primary/10 rounded-full peer-checked:bg-primary transition-colors">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-sm text-muted-foreground">Requiere Factura (se aplica IVA 16%)</span>
            </label>
          </fieldset>

          {/* Notificación */}
          <fieldset className="border-t border-border/40 pt-4 bg-white/[0.02] rounded-xl p-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" /> Notificación a Músicos
            </legend>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendNotification" id="sendNotification"
                checked={sendNotif} onChange={e => setSendNotif(e.target.checked)}
                className="sr-only peer" />
              <div className="relative w-10 h-5 bg-primary/10 rounded-full peer-checked:bg-primary transition-colors">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-sm text-muted-foreground">
                Enviar aviso de Gig por WhatsApp al guardar
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground mt-2">
              {sendNotif
                ? "⚠️ Requiere Evolution API configurada — si no lo está, el mensaje se generará para copiar manualmente."
                : "El mensaje de Gig se generará al guardar para que lo puedas copiar y enviar manualmente."}
            </p>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border/40">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 font-bold text-white">
              {isPending 
                ? (initialData ? "Actualizando..." : "Creando y sincronizando...") 
                : (initialData ? "Guardar Cambios" : "Crear Evento")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
