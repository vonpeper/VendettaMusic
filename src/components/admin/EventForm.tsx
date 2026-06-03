"use client"

import { useActionState, useState, useEffect, useRef } from "react"
import { createEventAction, updateEventAction } from "@/actions/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, CheckCircle2, AlertCircle, Bell, MessageCircle, Copy, Check, Users, Send, Loader2, Plus, UserPlus } from "lucide-react"
import Image from "next/image"
import { notifySingleMusicianAction } from "@/actions/events"
import { toast } from "sonner"
import { createClienteAction, ensureGenericClienteAction } from "@/actions/clientes"

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
  locations: { id: string; name: string; mapsLink?: string | null }[]
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number }[]
  staff?: { id: string; name: string }[]
  allMusicians?: { id: string; name: string; instrument: string; isTitular: boolean }[]
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

export function EventForm({ onClose, clients, locations, packages, staff = [], allMusicians = [], initialData }: EventFormProps) {
  const action = initialData ? updateEventAction.bind(null, initialData.id) : createEventAction
  const [state, formAction, isPending] = useActionState(action, null) as [any, any, boolean]
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (state) {
      setIsSubmitting(false)
      if (!state.success) {
        toast.error(state.message || "Error al procesar la solicitud")
      }
    }
  }, [state])

  const [sendNotif, setSendNotif] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notifyingIds, setNotifyingIds] = useState<string[]>([])
  const notifyingIdsRef = useRef<string[]>([])

  // IVA auto-calculation
  const [amount, setAmount] = useState<number>(parseFloat(initialData?.amount) || 0)
  const [requiresInvoice, setRequiresInvoice] = useState<boolean>(initialData?.invoice || false)
  const ivaAmount = requiresInvoice ? Math.round(amount * 0.16 * 100) / 100 : 0
  const totalWithTax = amount + ivaAmount

  // Local clients list & selected state
  const [clientsList, setClientsList] = useState(clients)
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // New Client Popup Modal States
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)

  const currentMusicianIds = initialData?.musicians?.map((m: any) => m.musicianId) || []
  const [selectedMusicians, setSelectedMusicians] = useState<string[]>(
    currentMusicianIds.length > 0 
      ? currentMusicianIds 
      : allMusicians.filter(m => m.isTitular).map(m => m.id)
  )

  const [musiciansToNotify, setMusiciansToNotify] = useState<string[]>(
    currentMusicianIds.length > 0 
      ? currentMusicianIds 
      : allMusicians.filter(m => m.isTitular).map(m => m.id)
  )

  const toggleMusician = (id: string) => {
    setSelectedMusicians(prev => {
      const isCurrentlySelected = prev.includes(id)
      if (isCurrentlySelected) {
        setMusiciansToNotify(notifyPrev => notifyPrev.filter(mid => mid !== id))
        return prev.filter(mid => mid !== id)
      } else {
        setMusiciansToNotify(notifyPrev => [...notifyPrev, id])
        return [...prev, id]
      }
    })
  }

  const toggleNotifyMusician = (id: string) => {
    setMusiciansToNotify(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    )
  }

  async function handleNotifySingle(musicianId: string) {
    if (!initialData?.id) return
    if (notifyingIdsRef.current.includes(musicianId)) return

    notifyingIdsRef.current.push(musicianId)
    setNotifyingIds(prev => [...prev, musicianId])
    try {
      const res = await notifySingleMusicianAction(initialData.id, musicianId)
      if (res.success) {
        toast.success("Notificación enviada")
        // Automatically uncheck group notification for this musician to avoid duplicate on save
        setMusiciansToNotify(prev => prev.filter(id => id !== musicianId))
      } else {
        toast.error(res.error || "Error al enviar")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      notifyingIdsRef.current = notifyingIdsRef.current.filter(id => id !== musicianId)
      setNotifyingIds(prev => prev.filter(id => id !== musicianId))
    }
  }

  function copyGigMessage() {
    if (state?.gigMessage) {
      navigator.clipboard.writeText(state.gigMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSelectGenericClient() {
    setLoadingAction("generic")
    try {
      const res = await ensureGenericClienteAction()
      if (res.success && res.id) {
        if (!clientsList.some(c => c.id === res.id)) {
          setClientsList(prev => [...prev, { id: res.id, name: res.name! }])
        }
        setSelectedClientId(res.id)
        toast.success("Cliente Genérico seleccionado con éxito")
      } else {
        toast.error(res.message || "Error al habilitar cliente genérico")
      }
    } catch (err) {
      toast.error("Error de comunicación con el servidor")
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleCreateClientSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim()) {
      toast.error("El nombre del cliente es obligatorio.")
      return
    }
    setCreatingClient(true)
    try {
      const fd = new FormData()
      fd.append("name", newClientName)
      fd.append("email", newClientEmail)
      fd.append("whatsapp", newClientPhone)
      fd.append("type", "private")
      
      const res = await createClienteAction(null, fd)
      if (res.success && res.id) {
        toast.success("Cliente creado y vinculado correctamente.")
        // Add to list and select it
        setClientsList(prev => [...prev, { id: res.id, name: newClientName }])
        setSelectedClientId(res.id)
        
        // Reset states and close modal
        setNewClientName("")
        setNewClientEmail("")
        setNewClientPhone("")
        setShowNewClientModal(false)
      } else {
        toast.error(res.message || "Error al crear el cliente.")
      }
    } catch (err) {
      toast.error("Error interno al registrar cliente.")
    } finally {
      setCreatingClient(false)
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
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-[95vw] sm:w-full max-w-3xl max-h-[85vh] overflow-y-auto relative">

        {/* Header */}
        <div className="border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="p-4 flex justify-center bg-muted/20">
             <Image 
               src="/images/logo-vendetta-horizontal.png" 
               alt="Vendetta Music" 
               width={180} 
               height={45} 
               className="h-10 w-auto object-contain"
             />
          </div>
          <div className="flex items-center justify-between p-6">
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
        </div>

        {state && !state.success && (
          <div className="mx-6 mt-4 p-3 bg-destructive/20 border border-destructive/40 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} onSubmit={() => setIsSubmitting(true)} className="p-6 space-y-6">

          {/* Identidad */}
          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Identidad del Evento</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col justify-between">
                <Label htmlFor="clientId" className="text-sm font-semibold">Cliente *</Label>
                <div className="flex gap-2">
                  <select 
                    id="clientId" 
                    name="clientId" 
                    required 
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Seleccionar cliente...</option>
                    {clientsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-1.5 px-0.5">
                  <button 
                    type="button" 
                    onClick={() => setShowNewClientModal(true)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Crear Nuevo
                  </button>
                  <span className="text-muted-foreground/30">•</span>
                  <button 
                    type="button" 
                    onClick={handleSelectGenericClient}
                    disabled={loadingAction === "generic"}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {loadingAction === "generic" ? <Loader2 className="w-3 h-3 animate-spin" /> : "👤 Usar Genérico"}
                  </button>
                </div>
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

            </div>
          </fieldset>

          {/* Logística */}
          <fieldset className="border-t border-border/40 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Logística y Ejecución</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationId">Ubicación (catálogo)</Label>
                <select id="locationId" name="locationId" defaultValue={initialData?.locationId || ""}
                  onChange={(e) => {
                     const selectedLoc = locations.find(l => l.id === e.target.value)
                     if (selectedLoc?.mapsLink) {
                        const mapsInput = document.getElementById("mapsLink") as HTMLInputElement
                        if (mapsInput && !mapsInput.value) mapsInput.value = selectedLoc.mapsLink
                     }
                  }}
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
                <Label htmlFor="locationFreeCity">Ciudad / Municipio (para dirección libre)</Label>
                <Input id="locationFreeCity" name="locationFreeCity" placeholder="Ej. Querétaro, Toluca, CDMX..."
                  className="bg-background border-border/40 text-foreground" />
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

            {/* Gestión de Músicos Individual */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-primary font-bold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Convocatoria de Personal (Staff / Músicos)
                </Label>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {selectedMusicians.length} Seleccionados
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-border/20 rounded-xl bg-muted/10">
                {allMusicians.map(m => {
                  const isSelected = selectedMusicians.includes(m.id)
                  const isNotifying = notifyingIds.includes(m.id)
                  return (
                    <div key={m.id} className={`flex flex-col gap-1 p-2 rounded-lg border transition-all ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-transparent opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            name="musicianIds" 
                            value={m.id} 
                            checked={isSelected}
                            onChange={() => toggleMusician(m.id)}
                            className="sr-only" 
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{m.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{m.instrument} {m.isTitular && "• Titular"}</span>
                          </div>
                        </label>
                        
                        {initialData && isSelected && (
                          <button
                            type="button"
                            onClick={() => handleNotifySingle(m.id)}
                            disabled={isNotifying}
                            title="Enviar convocatoria individual por WhatsApp"
                            className="p-1.5 rounded-md hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                          >
                            {isNotifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="pl-7 mt-1">
                          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="notifyMusicianIds" 
                              value={m.id} 
                              checked={musiciansToNotify.includes(m.id)}
                              onChange={() => toggleNotifyMusician(m.id)}
                              className="rounded border-primary/30 text-primary h-3 w-3" 
                            />
                            <span className="text-muted-foreground font-medium">Incluir en notificación de grupo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Los músicos seleccionados serán vinculados al show. Puedes enviar notificaciones individuales usando el botón de avión de papel 🚀.
              </p>
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
                  value={amount || ""}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
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
              {/* Campos ocultos para IVA calculado automáticamente */}
              <input type="hidden" name="ivaAmount" value={ivaAmount} />
            </div>

            {/* Toggle Factura + Resumen IVA */}
            <label className="flex items-center gap-3 cursor-pointer mt-4">
              <input
                type="checkbox"
                name="invoice"
                className="sr-only peer"
                id="invoice"
                checked={requiresInvoice}
                onChange={e => setRequiresInvoice(e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-primary/10 rounded-full peer-checked:bg-primary transition-colors">
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${requiresInvoice ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-sm text-muted-foreground">Requiere Factura (se aplica IVA 16%)</span>
            </label>

            {/* Resumen de IVA — solo visible cuando se requiere factura */}
            {requiresInvoice && amount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
                <div className="font-bold text-amber-700 text-[10px] uppercase tracking-widest mb-2">📄 Desglose con IVA</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Subtotal</div>
                    <div className="font-bold text-foreground">${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">IVA 16%</div>
                    <div className="font-bold text-amber-600">${ivaAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-amber-500/20 rounded-lg py-1">
                    <div className="text-[10px] text-amber-800 uppercase font-black">Total</div>
                    <div className="font-black text-amber-700">${totalWithTax.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Nuevos controles de visibilidad pública (Movido al final) */}
          <fieldset className="border-t border-border/40 pt-4 bg-primary/5 rounded-xl p-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Visibilidad Pública</legend>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublic" className="text-sm font-bold text-primary flex items-center gap-2">
                    ⚡ Show Público en Agenda
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Si se activa, el show aparecerá en la página principal con botones de "Ubicación" y "Reservar".</p>
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
            <Button type="submit" disabled={isPending || isSubmitting} className="flex-1 font-bold text-white">
              {isPending || isSubmitting
                ? (initialData ? "Actualizando..." : "Creando y sincronizando...") 
                : (initialData ? "Guardar Cambios" : "Crear Evento")}
            </Button>
          </div>
        </form>
      </div>

      {/* Pop Up / Modal for creating a new client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-muted/40 p-5 border-b border-border/30 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground text-sm uppercase tracking-wider">Crear Nuevo Cliente</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNewClientModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClientSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal_clientName" className="text-xs font-bold text-foreground">Nombre Completo *</Label>
                <Input 
                  id="modal_clientName" 
                  type="text" 
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez González"
                  className="bg-background h-10 text-sm w-full border border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_clientPhone" className="text-xs font-bold text-foreground">WhatsApp (12 o 13 dígitos) *</Label>
                <Input 
                  id="modal_clientPhone" 
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Ej. 5217222880045"
                  className="bg-background h-10 text-sm w-full border border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_clientEmail" className="text-xs font-bold text-foreground">Correo Electrónico (Opcional)</Label>
                <Input 
                  id="modal_clientEmail" 
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Ej. juan@correo.com"
                  className="bg-background h-10 text-sm w-full border border-border"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end border-t border-border/10">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowNewClientModal(false)}
                  className="h-9.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={creatingClient}
                  className="h-9.5 font-semibold text-xs uppercase tracking-wider text-white gap-2"
                >
                  {creatingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {creatingClient ? "Registrando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
