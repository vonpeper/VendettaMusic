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
  locations: { id: string; name: string; address?: string; city?: string | null; state?: string | null; mapsLink?: string | null }[]
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
      <Label htmlFor={id} className="text-slate-700 font-semibold">{label}{required && " *"}</Label>
      <select id={id} name={name} defaultValue={defaultValue ?? ""}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white">
        <option value="" disabled className="text-slate-500">Seleccionar...</option>
        {options.map(o => <option key={o.value} value={o.value} className="text-slate-900">{o.label}</option>)}
      </select>
    </div>
  )
}

export function EventForm({ onClose, clients, locations, packages, staff = [], allMusicians = [], initialData }: EventFormProps) {
  const action = initialData?.id ? updateEventAction.bind(null, initialData.id) : createEventAction
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

  // Price & Discount auto-calculation
  const [originalPrice, setOriginalPrice] = useState<number>(
    typeof initialData?.bookingRequest?.originalPrice === "number"
      ? initialData.bookingRequest.originalPrice
      : parseFloat(initialData?.bookingRequest?.originalPrice) || parseFloat(initialData?.amount) || 0
  )
  const [discountAmount, setDiscountAmount] = useState<number>(
    typeof initialData?.bookingRequest?.discountAmount === "number"
      ? initialData.bookingRequest.discountAmount
      : parseFloat(initialData?.bookingRequest?.discountAmount) || 0
  )

  // Client Contact Details
  const [clientName, setClientName] = useState<string>(
    initialData?.bookingRequest?.clientName || initialData?.client?.user?.name || ""
  )
  const [clientPhone, setClientPhone] = useState<string>(
    initialData?.bookingRequest?.clientPhone || initialData?.client?.whatsapp || ""
  )
  const [clientEmail, setClientEmail] = useState<string>(
    initialData?.bookingRequest?.clientEmail || initialData?.client?.user?.email || ""
  )

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

  // Estados para dirección y viáticos
  const [viaticosAmount, setViaticosAmount] = useState<number>(
    typeof initialData?.bookingRequest?.viaticosAmount === "number"
      ? initialData.bookingRequest.viaticosAmount
      : parseFloat(initialData?.bookingRequest?.viaticosAmount) || 0
  )
  const [viaticosDetails, setViaticosDetails] = useState<{
    distanceKm: number;
    durationSec: number;
    tollCost: number;
    fuelCost: number;
    requiresManualQuote: boolean;
  } | null>(null)
  const [calculatingViaticos, setCalculatingViaticos] = useState(false)

  const [locationFree, setLocationFree] = useState(
    initialData?.locationId ? "" : (initialData?.bookingRequest?.address || "")
  )
  const [locationFreeCity, setLocationFreeCity] = useState(
    initialData?.locationId ? "" : (initialData?.bookingRequest?.city || "")
  )
  const [selectedLocationId, setSelectedLocationId] = useState(initialData?.locationId || "")

  useEffect(() => {
    let destination = ""

    if (selectedLocationId) {
      const loc = locations.find(l => l.id === selectedLocationId)
      if (loc && (loc.address || loc.city)) {
        destination = `${loc.address || ""}, ${loc.city || ""}, ${loc.state || ""}`.trim()
      }
    } else if (locationFree) {
      destination = `${locationFree}, ${locationFreeCity}`.trim()
    }

    if (!destination) return

    const delayDebounceFn = setTimeout(async () => {
      setCalculatingViaticos(true)
      try {
        const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(destination)}`)
        const data = await resp.json()
        if (data && typeof data.viaticosAmount === "number") {
          setViaticosAmount(data.viaticosAmount)
          setViaticosDetails({
            distanceKm: data.distanceKm || 0,
            durationSec: data.durationSec || 0,
            tollCost: data.tollCost || 0,
            fuelCost: data.fuelCost || 0,
            requiresManualQuote: !!data.requiresManualQuote
          })
          toast.success(`Viáticos calculados automáticamente: $${data.viaticosAmount.toLocaleString()}`)
          if (data.requiresManualQuote) {
            toast.warning("El destino seleccionado requiere cotización manual personalizada (distancia > 250km).")
          }
        }
      } catch (err) {
        console.error("Error al calcular viáticos:", err)
      } finally {
        setCalculatingViaticos(false)
      }
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [selectedLocationId, locationFree, locationFreeCity, locations])

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
        setClientName(newClientName)
        setClientPhone(newClientPhone)
        setClientEmail(newClientEmail)
        
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 admin-theme">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg text-slate-900 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 text-center border-b border-slate-200/60">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900">{initialData ? "¡Evento actualizado!" : "¡Evento creado!"}</h3>
            <p className="text-slate-500 text-sm mt-1">{state.message}</p>
          </div>

          {state.gigMessage && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <MessageCircle className="w-4 h-4" />
                  Mensaje de WhatsApp para los músicos
                </div>
                <button onClick={copyGigMessage}
                  className="flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors text-primary font-bold">
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap font-mono border border-slate-200/80 max-h-64 overflow-y-auto">
                {state.gigMessage}
              </pre>
              <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {sendNotif
                  ? "El mensaje fue enviado automáticamente por WhatsApp a los músicos."
                  : "Evolution API no configurada. Copia el mensaje y envíalo manualmente."}
              </p>
            </div>
          )}

          <div className="p-6 pt-0">
            <Button onClick={onClose} className="w-full font-bold text-white bg-primary hover:bg-primary/95">Cerrar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 admin-theme">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-[95vw] sm:w-full max-w-3xl max-h-[85vh] overflow-y-auto relative text-slate-900 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="border-b border-slate-200/60 sticky top-0 bg-white z-10">
          <div className="p-4 flex justify-center bg-slate-50">
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
              <h2 className="text-2xl font-heading font-bold text-slate-900">
                {initialData ? `Editando Evento: ${initialData.client?.user?.name || ''}` : "Nuevo Show / Evento"}
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">El evento se sincronizará automáticamente con Eventualidades.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
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
          {initialData?.bookingRequest?.id && (
            <input type="hidden" name="bookingRequestId" value={initialData.bookingRequest.id} />
          )}

          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Identidad del Evento</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col justify-between">
                <Label htmlFor="clientId" className="text-sm font-semibold text-slate-700">Cliente *</Label>
                <div className="flex gap-2">
                  <select 
                    id="clientId" 
                    name="clientId" 
                    required 
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white"
                  >
                    <option value="" disabled className="text-slate-500">Seleccionar cliente...</option>
                    {clientsList.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
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
                  <span className="text-slate-300">•</span>
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
              <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Datos de Contacto del Cliente (para Contrato/Logística)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-xs text-slate-700">Nombre del Cliente</Label>
                    <Input 
                      id="clientName" 
                      name="clientName" 
                      placeholder="Nombre de contacto"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-9 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="text-xs text-slate-700">Teléfono / WhatsApp</Label>
                    <Input 
                      id="clientPhone" 
                      name="clientPhone" 
                      placeholder="Ej. 521..."
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-9 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="text-xs text-slate-700">Correo Electrónico</Label>
                    <Input 
                      id="clientEmail" 
                      name="clientEmail" 
                      type="email"
                      placeholder="cliente@correo.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-9 text-xs" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="customName" className="text-slate-700 font-semibold">Nombre del Show / Evento (Opcional)</Label>
                <Input id="customName" name="customName" placeholder="Ej. Tributo Mentiras, Show Alquimia..."
                  defaultValue={initialData?.customName || ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400" />
                <p className="text-[10px] text-slate-500 italic">Este nombre es el que aparecerá en la Gira Artística pública.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 font-semibold">Fecha *</Label>
                <Input id="date" name="date" type="date" required 
                  defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <SelectField id="ceremonyType" name="ceremonyType" label="Tipo de Evento"
                defaultValue={initialData?.ceremonyType}
                options={CEREMONY_TYPES} />
              <div className="space-y-2">
                <Label htmlFor="guestCount" className="text-slate-700 font-semibold">Número de Invitados</Label>
                <Input id="guestCount" name="guestCount" type="number" min="0" placeholder="Ej. 200"
                  defaultValue={initialData?.guestCount}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400" />
              </div>

            </div>
          </fieldset>

          {/* Logística */}
          <fieldset className="border-t border-slate-200/80 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Logística y Ejecución</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationId" className="text-slate-700 font-semibold">Ubicación (catálogo)</Label>
                <select id="locationId" name="locationId" value={selectedLocationId}
                  onChange={(e) => {
                     setSelectedLocationId(e.target.value)
                     if (e.target.value) {
                       setLocationFree("")
                       setLocationFreeCity("")
                     }
                     const selectedLoc = locations.find(l => l.id === e.target.value)
                     if (selectedLoc?.mapsLink) {
                        const mapsInput = document.getElementById("mapsLink") as HTMLInputElement
                        if (mapsInput) mapsInput.value = selectedLoc.mapsLink
                     }
                  }}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white">
                  <option value="" className="text-slate-500">Sin ubicación en catálogo</option>
                  {locations.map(l => <option key={l.id} value={l.id} className="text-slate-900">{l.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationFree" className="text-slate-700 font-semibold">Dirección libre (si no está en catálogo)</Label>
                <Input id="locationFree" name="locationFree" placeholder="Ej. Hacienda San José, Querétaro"
                  value={locationFree}
                  onChange={(e) => {
                    setLocationFree(e.target.value)
                    if (e.target.value) {
                      setSelectedLocationId("")
                    }
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationFreeCity" className="text-slate-700 font-semibold">Ciudad / Municipio (para dirección libre)</Label>
                <Input id="locationFreeCity" name="locationFreeCity" placeholder="Ej. Querétaro, Toluca, CDMX..."
                  value={locationFreeCity}
                  onChange={(e) => {
                    setLocationFreeCity(e.target.value)
                    if (e.target.value) {
                      setSelectedLocationId("")
                    }
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceStart" className="text-slate-700 font-semibold">Inicio de Ejecución</Label>
                <Input id="performanceStart" name="performanceStart" type="time"
                  defaultValue={initialData?.performanceStart || ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceEnd" className="text-slate-700 font-semibold">Fin de Ejecución</Label>
                <Input id="performanceEnd" name="performanceEnd" type="time"
                  defaultValue={initialData?.performanceEnd || ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime" className="text-slate-700 font-semibold">Hora de llegada Musicians</Label>
                <Input id="arrivalTime" name="arrivalTime" type="time"
                  defaultValue={initialData?.arrivalTime || ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setupTime" className="text-slate-700 font-semibold">Hora de montaje</Label>
                <Input id="setupTime" name="setupTime" type="time"
                  defaultValue={initialData?.setupTime || ""}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <SelectField id="dressCode" name="dressCode" label="Vestimenta"
                defaultValue={initialData?.dressCode}
                options={DRESS_CODES} />
              <SelectField id="status" name="status" label="Estatus"
                options={STATUS_OPTIONS} defaultValue={initialData?.status || "agendado"} />
              <div className="col-span-1 md:col-span-2 mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Configuración y Requerimientos de Show</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bandHours" className="text-xs text-slate-700">Horas de Banda en Vivo</Label>
                    <Input 
                      id="bandHours" 
                      name="bandHours" 
                      type="number" 
                      min="0"
                      placeholder="Ej. 2"
                      defaultValue={initialData?.bookingRequest?.bandHours ?? 0}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-9 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="djHours" className="text-xs text-slate-700">Horas de DJ / Cabina</Label>
                    <Input 
                      id="djHours" 
                      name="djHours" 
                      type="number" 
                      min="0"
                      placeholder="Ej. 3"
                      defaultValue={initialData?.bookingRequest?.djHours ?? 0}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-9 text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="isDjWithTvs"
                      id="isDjWithTvs"
                      defaultChecked={initialData?.bookingRequest?.isDjWithTvs}
                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 bg-slate-50 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">DJ con Pantallas / TVs</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="hasTemplete"
                      id="hasTemplete"
                      defaultChecked={initialData?.bookingRequest?.hasTemplete}
                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 bg-slate-50 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">Requiere Templete</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="hasPista"
                      id="hasPista"
                      defaultChecked={initialData?.bookingRequest?.hasPista}
                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 bg-slate-50 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">Requiere Pista LED</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="hasRobot"
                      id="hasRobot"
                      defaultChecked={initialData?.bookingRequest?.hasRobot}
                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 bg-slate-50 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">Robot LED en Show</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="clientProvidesAudio"
                      id="clientProvidesAudio"
                      defaultChecked={initialData?.bookingRequest?.clientProvidesAudio}
                      className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 bg-slate-50 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">Audio provisto por Cliente</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="musicianNotes" className="text-slate-700 font-semibold">Notas para los músicos</Label>
              <textarea id="musicianNotes" name="musicianNotes" rows={2}
                placeholder="Instrucciones específicas del show..."
                defaultValue={initialData?.musicianNotes || ""}
                className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white" />
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200/80 rounded-xl bg-slate-50">
                {allMusicians.map(m => {
                  const isSelected = selectedMusicians.includes(m.id)
                  const isNotifying = notifyingIds.includes(m.id)
                  return (
                    <div key={m.id} className={`flex flex-col gap-1 p-2 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-200 text-slate-700'}`}>
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
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{m.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase">{m.instrument} {m.isTitular && "• Titular"}</span>
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
                            <span className="text-slate-500 font-medium">Incluir en notificación de grupo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Los músicos seleccionados serán vinculados al show. Puedes enviar notificaciones individuales usando el botón de avión de papel 🚀.
              </p>
            </div>
          </fieldset>

          {/* Finanzas */}
          <fieldset className="border-t border-slate-200/80 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Paquete y Finanzas</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageId" className="text-slate-700 font-semibold">Paquete</Label>
                <select id="packageId" name="packageId" defaultValue={initialData?.packageId || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white">
                  <option value="" className="text-slate-500">Personalizado</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-900">
                      {p.name} — ${(p.baseCostPerHour * p.minDuration).toLocaleString("es-MX")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice" className="text-slate-700 font-semibold">Precio de Lista Original (MXN)</Label>
                <Input id="originalPrice" name="originalPrice" type="number" step="0.01" min="0"
                  value={originalPrice || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setOriginalPrice(val);
                    setDiscountAmount(Math.max(0, val - amount));
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountAmount" className="text-slate-700 font-semibold">Descuento Aplicado (MXN)</Label>
                <Input id="discountAmount" name="discountAmount" type="number" step="0.01" min="0"
                  value={discountAmount || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setDiscountAmount(val);
                    setAmount(Math.max(0, originalPrice - val));
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-700 font-semibold">Total del Paquete (Precio Final MXN)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0"
                  value={amount || ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setAmount(val);
                    setDiscountAmount(Math.max(0, originalPrice - val));
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit" className="text-slate-700 font-semibold">Anticipo Pactado / Requerido (MXN)</Label>
                <Input id="deposit" name="deposit" type="number" step="0.01" min="0"
                  defaultValue={initialData?.deposit}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="viaticosAmount" className="text-slate-700 font-semibold">
                  Viáticos ($) {calculatingViaticos && <span className="text-[10px] text-blue-600 animate-pulse font-normal ml-1">(Calculando...)</span>}
                </Label>
                <Input id="viaticosAmount" name="viaticosAmount" type="number" step="0.01" min="0"
                  value={viaticosAmount || ""}
                  onChange={e => setViaticosAmount(parseFloat(e.target.value) || 0)}
                  className={calculatingViaticos ? "border-blue-500/40 bg-blue-500/5 transition-all text-slate-900 bg-slate-50" : "bg-slate-50 border-slate-200 text-slate-900 transition-all focus:bg-white"} />
                <input type="hidden" name="distanceKm" value={viaticosDetails?.distanceKm ?? initialData?.bookingRequest?.distanceKm ?? 0} />
                <input type="hidden" name="durationSec" value={viaticosDetails?.durationSec ?? initialData?.bookingRequest?.durationSec ?? 0} />
                <input type="hidden" name="tollCost" value={viaticosDetails?.tollCost ?? initialData?.bookingRequest?.tollCost ?? 0} />
                <input type="hidden" name="fuelCost" value={viaticosDetails?.fuelCost ?? initialData?.bookingRequest?.fuelCost ?? 0} />
                <input type="hidden" name="requiresManualQuote" value={String(viaticosDetails?.requiresManualQuote ?? initialData?.bookingRequest?.requiresManualQuote ?? false)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositMethod" className="text-slate-700 font-semibold">Método de pago anticipo / ingreso</Label>
                <select id="depositMethod" name="depositMethod" defaultValue={initialData?.depositMethod || initialData?.paymentMethod || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white">
                  <option value="" className="text-slate-500">Sin especificar</option>
                  <option value="Transferencia" className="text-slate-900">Transferencia</option>
                  <option value="Efectivo" className="text-slate-900">Efectivo</option>
                  <option value="Link de pago" className="text-slate-900">Link de pago</option>
                  <option value="Mercado Pago" className="text-slate-900">Mercado Pago</option>
                  <option value="Cheque" className="text-slate-900">Cheque</option>
                  <option value="Otro" className="text-slate-900">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalIncome" className="text-slate-700 font-semibold">Total Cobrado (Neto)</Label>
                <Input id="totalIncome" name="totalIncome" type="number" step="0.01" min="0" placeholder="Ej. 15000"
                  defaultValue={initialData?.totalIncome || initialData?.amount}
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white font-bold placeholder:text-slate-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentRef" className="text-slate-700 font-semibold">Referencia de Pago</Label>
                <Input id="paymentRef" name="paymentRef" defaultValue={initialData?.paymentRef || ""}
                  placeholder="Nº transferencia, folio, etc." className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400" />
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
              <span className="text-sm text-slate-600 font-medium">Requiere Factura (se aplica IVA 16%)</span>
            </label>

            {/* Resumen de IVA — solo visible cuando se requiere factura */}
            {requiresInvoice && amount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
                <div className="font-bold text-amber-700 text-[10px] uppercase tracking-widest mb-2">📄 Desglose con IVA</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Subtotal</div>
                    <div className="font-bold text-slate-900">${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">IVA 16%</div>
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
          <fieldset className="border-t border-slate-200/80 pt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Visibilidad Pública</legend>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublic" className="text-sm font-bold text-primary flex items-center gap-2">
                    ⚡ Show Público en Agenda
                  </Label>
                  <p className="text-[10px] text-slate-500 mt-0.5">Si se activa, el show aparecerá en la página principal con botones de "Ubicación" y "Reservar".</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isPublic" id="isPublic" defaultChecked={initialData?.isPublic} className="sr-only peer" />
                  <div className="w-11 h-6 bg-primary/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border/40 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mapsLink" className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
                  Link de Google Maps
                </Label>
                <Input id="mapsLink" name="mapsLink" defaultValue={initialData?.mapsLink || ""}
                  placeholder="https://maps.app.goo.gl/..."
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white h-9 text-xs" />
              </div>
            </div>
          </fieldset>

          {/* Notificación */}
          <fieldset className="border-t border-slate-200/80 pt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
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
              <span className="text-sm text-slate-600 font-medium">
                Enviar aviso de Gig por WhatsApp al guardar
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-2">
              {sendNotif
                ? "⚠️ Requiere Evolution API configurada — si no lo está, el mensaje se generará para copiar manualmente."
                : "El mensaje de Gig se generará al guardar para que lo puedas copiar y enviar manualmente."}
            </p>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-100">Cancelar</Button>
            <Button type="submit" disabled={isPending || isSubmitting} className="flex-1 font-bold text-white">
              {isPending || isSubmitting
                ? (initialData?.id ? "Actualizando..." : "Creando y sincronizando...") 
                : (initialData?.id ? "Guardar Cambios" : "Crear Evento")}
            </Button>
          </div>
        </form>
      </div>

      {/* Pop Up / Modal for creating a new client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 admin-theme">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-primary" />
                <span className="font-bold text-slate-900 text-sm uppercase tracking-wider">Crear Nuevo Cliente</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNewClientModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClientSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal_clientName" className="text-xs font-bold text-slate-700">Nombre Completo *</Label>
                <Input 
                  id="modal_clientName" 
                  type="text" 
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez González"
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-10 text-sm w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_clientPhone" className="text-xs font-bold text-slate-700">WhatsApp (12 o 13 dígitos) *</Label>
                <Input 
                  id="modal_clientPhone" 
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Ej. 5217222880045"
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-10 text-sm w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_clientEmail" className="text-xs font-bold text-slate-700">Correo Electrónico (Opcional)</Label>
                <Input 
                  id="modal_clientEmail" 
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Ej. juan@correo.com"
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400 h-10 text-sm w-full"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end border-t border-slate-200/60">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowNewClientModal(false)}
                  className="h-9.5 font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100"
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
