"use client"

import React, { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ClientCombobox, ClientData } from "@/components/admin/crm/ClientCombobox"
import { VenueCombobox, VenueData } from "@/components/admin/crm/VenueCombobox"
import { QuoteLineItems } from "@/components/admin/crm/QuoteLineItems"
import { FinancialSummary } from "@/components/admin/crm/FinancialSummary"
import { calculateQuoteTotals, AdditionalLineItem } from "@/lib/pricing"
import { saveUnifiedEventQuoteAction } from "@/actions/events"
import { toast } from "sonner"
import { 
  Calendar, 
  Users, 
  Sparkles, 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

const CEREMONY_TYPES = [
  { value: "boda",        label: "💒 Boda" },
  { value: "xv_anos",     label: "👸 XV Años" },
  { value: "cumpleanos",  label: "🎂 Cumpleaños / Aniversario" },
  { value: "corporativo", label: "🏢 Corporativo / Gala" },
  { value: "festival",    label: "🎪 Festival / Masivo" },
  { value: "happening",   label: "🎵 Happening / Fiesta Privada" },
  { value: "bar",         label: "🍸 Bar / Restaurante" },
  { value: "graduacion",  label: "🎓 Graduación" },
  { value: "otro",        label: "📋 Otro" },
]

const DRESS_CODES = [
  { value: "formal",        label: "🎩 Formal (Traje / Vestido)" },
  { value: "formal_casual", label: "👔 Formal Casual" },
  { value: "rock",          label: "🎸 Rock / Negro Elegante" },
  { value: "nocturno",      label: "🌙 Concierto Nocturno" },
]

const STATUS_OPTIONS = [
  { value: "pendiente",  label: "⏳ Cotización / Pendiente" },
  { value: "agendado",   label: "📅 Confirmado / Agendado" },
  { value: "completado", label: "✅ Evento Realizado" },
  { value: "cancelado",  label: "❌ Cancelado" },
]

export interface PackageOption {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description?: string | null
  includes?: string | null
}

export interface StaffOption {
  id: string
  name: string
}

interface UnifiedEventQuoteFormProps {
  mode?: "create" | "edit"
  targetId?: string // eventId or bookingId if editing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
  clients: ClientData[]
  venues: VenueData[]
  packages: PackageOption[]
  staff?: StaffOption[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function UnifiedEventQuoteForm({
  mode = "create",
  targetId,
  initialData,
  clients,
  venues,
  packages,
  staff = [],
  onSuccess
}: UnifiedEventQuoteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeStep, setActiveStep] = useState<number>(1)

  // 1. Estado Cliente
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialData?.clientId || initialData?.client?.id || null
  )
  const [clientName, setClientName] = useState<string>(
    initialData?.clientName || initialData?.client?.user?.name || ""
  )
  const [clientPhone, setClientPhone] = useState<string>(
    initialData?.clientPhone || initialData?.client?.whatsapp || ""
  )
  const [clientEmail, setClientEmail] = useState<string>(
    initialData?.clientEmail || initialData?.client?.user?.email || ""
  )
  const [clientCity, setClientCity] = useState<string>(
    initialData?.city || initialData?.client?.city || ""
  )

  // 2. Estado Operativo del Evento
  const [customName, setCustomName] = useState<string>(
    initialData?.customName || ""
  )
  const [ceremonyType, setCeremonyType] = useState<string>(
    initialData?.ceremonyType || ""
  )
  const [eventDate, setEventDate] = useState<string>(() => {
    if (initialData?.date) {
      return new Date(initialData.date).toISOString().split("T")[0]
    }
    if (initialData?.requestedDate) {
      return new Date(initialData.requestedDate).toISOString().split("T")[0]
    }
    return ""
  })
  const [startTime, setStartTime] = useState<string>(
    initialData?.startTime || initialData?.performanceStart || ""
  )
  const [endTime, setEndTime] = useState<string>(
    initialData?.endTime || initialData?.performanceEnd || ""
  )
  const [arrivalTime, setArrivalTime] = useState<string>(initialData?.arrivalTime || "")
  const [setupTime, setSetupTime] = useState<string>(initialData?.setupTime || "")
  const [guestCount, setGuestCount] = useState<number | null>(
    initialData?.guestCount !== undefined && initialData?.guestCount !== null ? Number(initialData.guestCount) : null
  )
  const [dressCode, setDressCode] = useState<string>(initialData?.dressCode || "")
  const [status, setStatus] = useState<string>(
    initialData?.status === "scheduled" ? "agendado" : initialData?.status || "pendiente"
  )
  const [musicianNotes, setMusicianNotes] = useState<string>(initialData?.musicianNotes || "")
  const [audioEngineer, setAudioEngineer] = useState<string>(initialData?.audioEngineer || "")

  // 3. Estado Venue
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    initialData?.locationId || initialData?.location?.id || null
  )
  const [venueName, setVenueName] = useState<string>(
    initialData?.location?.name || initialData?.venueName || ""
  )
  const [venueAddress, setVenueAddress] = useState<string>(
    initialData?.address || initialData?.location?.address || ""
  )
  const [venueCity, setVenueCity] = useState<string>(
    initialData?.city || initialData?.location?.city || ""
  )
  const [venueState, setVenueState] = useState<string>(
    initialData?.state || initialData?.location?.state || ""
  )
  const [mapsLink, setMapsLink] = useState<string>(
    initialData?.mapsLink || initialData?.location?.mapsLink || ""
  )

  // 4. Estado Cotización y Paquete
  const [packageId, setPackageId] = useState<string>(
    initialData?.packageId || ""
  )
  const selectedPackage = useMemo(() => {
    return packages.find(p => p.id === packageId) || null
  }, [packages, packageId])

  // Precio base ajustable
  const defaultPackagePrice = useMemo(() => {
    if (!selectedPackage) return 0
    return selectedPackage.baseCostPerHour * (selectedPackage.minDuration || 1)
  }, [selectedPackage])

  const [basePrice, setBasePrice] = useState<number | null>(() => {
    if (initialData?.amount !== undefined && initialData?.amount !== null) return Number(initialData.amount)
    if (initialData?.baseAmount !== undefined && initialData?.baseAmount !== null) return Number(initialData.baseAmount)
    return null
  })

  const isPriceModified = useMemo(() => {
    if (!selectedPackage || basePrice === null) return false
    return basePrice !== defaultPackagePrice
  }, [basePrice, defaultPackagePrice, selectedPackage])

  const [viaticosAmount, setViaticosAmount] = useState<number | null>(
    initialData?.viaticosAmount !== undefined && initialData?.viaticosAmount !== null ? Number(initialData.viaticosAmount) : null
  )
  const [discountAmount, setDiscountAmount] = useState<number | null>(
    initialData?.discountAmount !== undefined && initialData?.discountAmount !== null ? Number(initialData.discountAmount) : null
  )
  const [invoice, setInvoice] = useState<boolean>(
    Boolean(initialData?.invoice)
  )
  const [depositAmount, setDepositAmount] = useState<number | null>(() => {
    if (initialData?.deposit !== undefined && initialData?.deposit !== null) return Number(initialData.deposit)
    if (initialData?.depositAmount !== undefined && initialData?.depositAmount !== null) return Number(initialData.depositAmount)
    return null
  })
  const [additionalItems, setAdditionalItems] = useState<AdditionalLineItem[]>(() => {
    const raw = initialData?.lineItems || initialData?.items
    if (Array.isArray(raw)) {
      return raw.map((item: { id?: string; description?: string; quantity?: number; unitCost?: number }) => ({
        id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "item-" + Math.random().toString(36).substring(2, 9)),
        description: item.description || "",
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        unitCost: typeof item.unitCost === "number" ? item.unitCost : 0,
      }))
    }
    return []
  })

  // Cálculos consolidados en tiempo real mediante la fuente única de verdad
  const totals = useMemo(() => {
    return calculateQuoteTotals({
      basePrice,
      viaticosAmount,
      discountAmount,
      additionalItems,
      invoice,
      depositAmount
    })
  }, [basePrice, viaticosAmount, discountAmount, additionalItems, invoice, depositAmount])

  // Handlers para Comboboxes con limpieza absoluta de datos anteriores
  function handleSelectClient(client: ClientData | null) {
    if (client) {
      setSelectedClientId(client.id)
      setClientName(client.name ?? "")
      setClientPhone(client.phone ?? "")
      setClientEmail(client.email ?? "")
      setClientCity(client.city ?? "")
    } else {
      setSelectedClientId(null)
      setClientName("")
      setClientPhone("")
      setClientEmail("")
      setClientCity("")
    }
  }

  function handleAddNewClient(newClient: Omit<ClientData, "id">) {
    const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? "client-new-" + crypto.randomUUID() : "client-new-" + Math.random().toString(36).substring(2, 7)
    setSelectedClientId(tempId)
    setClientName(newClient.name ?? "")
    setClientPhone(newClient.phone ?? "")
    setClientEmail(newClient.email ?? "")
    setClientCity(newClient.city ?? "")
    toast.success(`Cliente "${newClient.name}" asignado`)
  }

  function handleSelectVenue(venue: VenueData | null, pendingAddress?: string) {
    if (venue) {
      setSelectedVenueId(venue.id)
      setVenueName(venue.name ?? "")
      setVenueAddress(venue.address ?? "")
      setVenueCity(venue.city ?? "")
      setVenueState(venue.state ?? "")
      setMapsLink(venue.mapsLink ?? "")
    } else {
      setSelectedVenueId(null)
      setVenueName("")
      setVenueAddress(pendingAddress ?? "")
      setVenueCity("")
      setVenueState("")
      setMapsLink("")
    }
  }

  function handleAddNewVenue(newVenue: Omit<VenueData, "id">) {
    const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? "venue-new-" + crypto.randomUUID() : "venue-new-" + Math.random().toString(36).substring(2, 7)
    setSelectedVenueId(tempId)
    setVenueName(newVenue.name ?? "")
    setVenueAddress(newVenue.address ?? "")
    setVenueCity(newVenue.city ?? "")
    setVenueState(newVenue.state ?? "")
    setMapsLink(newVenue.mapsLink ?? "")
    toast.success(`Locación "${newVenue.name}" asignada`)
  }

  function handlePackageChange(newPkgId: string) {
    setPackageId(newPkgId)
    const pkg = packages.find(p => p.id === newPkgId)
    if (pkg) {
      const price = pkg.baseCostPerHour * (pkg.minDuration || 1)
      setBasePrice(price)
    }
  }

  // Submit Handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!clientName.trim()) {
      toast.error("Por favor ingresa o selecciona el titular del evento")
      setActiveStep(1)
      return
    }

    if (!eventDate) {
      toast.error("Por favor selecciona una fecha válida para el evento")
      setActiveStep(2)
      return
    }

    if (totals.depositExceedsTotal) {
      toast.error(totals.depositError || "El anticipo solicitado no puede superar el total de la cotización.")
      setActiveStep(4)
      return
    }

    const sanitizedItems = additionalItems
      .filter(it => it.description && it.description.trim().length > 0)
      .map((it, idx) => ({
        id: it.id,
        description: it.description.trim(),
        quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
        unitCost: typeof it.unitCost === "number" && it.unitCost >= 0 ? it.unitCost : 0,
        order: idx
      }))

    startTransition(async () => {
      try {
        const payload = {
          mode,
          targetId,
          clientId: selectedClientId?.startsWith("client-new-") ? null : selectedClientId,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim() || null,
          clientEmail: clientEmail.trim().toLowerCase() || null,
          clientCity: clientCity.trim() || null,
          
          customName: customName.trim() || null,
          ceremonyType: ceremonyType || null,
          eventDate,
          startTime: startTime.trim() || null,
          endTime: endTime.trim() || null,
          arrivalTime: arrivalTime.trim() || null,
          setupTime: setupTime.trim() || null,
          guestCount: guestCount !== null ? guestCount : 0,
          dressCode: dressCode || null,
          status,
          musicianNotes: musicianNotes.trim() || null,
          audioEngineer: audioEngineer || null,

          locationId: selectedVenueId?.startsWith("venue-new-") ? null : selectedVenueId,
          venueName: venueName.trim() || null,
          venueAddress: venueAddress.trim() || null,
          venueCity: venueCity.trim() || null,
          venueState: venueState.trim() || null,
          mapsLink: mapsLink.trim() || null,

          packageId: packageId || null,
          packageName: selectedPackage?.name || null,
          basePrice: totals.basePrice,
          viaticosAmount: totals.viaticosAmount,
          discountAmount: totals.discountAmount,
          additionalItems: sanitizedItems,
          invoice,
          depositAmount: totals.depositAmount,
          totalAmount: totals.totalAmount,
          balanceAmount: totals.balanceAmount,
        }

        const res = await saveUnifiedEventQuoteAction(payload)

        if (res.success) {
          toast.success(
            mode === "edit"
              ? "Registro actualizado exitosamente"
              : "Evento / Cotización creada exitosamente"
          )
          if (onSuccess) {
            onSuccess()
          } else {
            router.push("/admin/ventas")
            router.refresh()
          }
        } else {
          toast.error(res.error || "Ocurrió un error al guardar el registro")
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error inesperado"
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      {/* Navegación por Pasos / Pestañas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-card p-1.5 rounded-2xl border border-border/40 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 1 ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          }`}
        >
          <span>1. Cliente</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 2 ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          }`}
        >
          <span>2. Evento</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 3 ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          }`}
        >
          <span>3. Venue</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 4 ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          }`}
        >
          <span>4. Cotización</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(5)}
          className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 5 ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
          }`}
        >
          <span>5. Confirmar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Principal de Captura */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECCIÓN 1: CLIENTE */}
          {activeStep === 1 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Datos del Cliente
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecciona un cliente existente para precargar sus datos o registra uno nuevo sin contraseñas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClientCombobox
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onSelectClient={handleSelectClient}
                  onAddNewClient={handleAddNewClient}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Nombre del Titular *</Label>
                    <Input
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Teléfono de Contacto</Label>
                    <Input
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="ej. 5512345678"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Correo Electrónico</Label>
                    <Input
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      type="email"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Ciudad / Zona</Label>
                    <Input
                      value={clientCity}
                      onChange={e => setClientCity(e.target.value)}
                      placeholder="ej. Toluca / CDMX"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setActiveStep(2)} className="gap-2 cursor-pointer font-bold">
                    Siguiente: Datos del Evento <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 2: DATOS DEL EVENTO */}
          {activeStep === 2 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Datos Operativos del Evento
                </CardTitle>
                <CardDescription className="text-xs">
                  Especifica fecha, horarios, tipo de evento y requerimientos logísticos de la banda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Nombre / Motivo del Show *</Label>
                    <Input
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="ej. Boda Mariana & Carlos"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Tipo de Celebración</Label>
                    <select
                      value={ceremonyType}
                      onChange={e => setCeremonyType(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {CEREMONY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Fecha del Evento *</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Hora Inicio Show</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Hora Fin Show</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Llegada Staff</Label>
                    <Input
                      type="time"
                      value={arrivalTime}
                      onChange={e => setArrivalTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Montaje Listo</Label>
                    <Input
                      type="time"
                      value={setupTime}
                      onChange={e => setSetupTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">No. Estimado de Invitados</Label>
                    <Input
                      type="number"
                      min="0"
                      value={guestCount === null ? "" : guestCount}
                      onChange={e => setGuestCount(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="ej. 150"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Código de Vestimenta</Label>
                    <select
                      value={dressCode}
                      onChange={e => setDressCode(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {DRESS_CODES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Estatus Administrativo</Label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {staff.length > 0 && (
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Ingeniero de Audio / Staff Asignado</Label>
                      <select
                        value={audioEngineer}
                        onChange={e => setAudioEngineer(e.target.value)}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Sin ingeniero asignado</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Notas Operativas para Músicos</Label>
                  <textarea
                    value={musicianNotes}
                    onChange={e => setMusicianNotes(e.target.value)}
                    placeholder="Acceso por estacionamiento trasero, prueba de sonido a las 18:00, etc..."
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(1)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button type="button" onClick={() => setActiveStep(3)} className="gap-2 cursor-pointer font-bold">
                    Siguiente: Venue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 3: VENUE */}
          {activeStep === 3 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Locación y Dirección
                </CardTitle>
                <CardDescription className="text-xs">
                  Asocia un lugar del catálogo o especifica una dirección tentativa sin generar registros sintéticos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VenueCombobox
                  venues={venues}
                  selectedVenueId={selectedVenueId}
                  venuePendingText={venueAddress}
                  onSelectVenue={handleSelectVenue}
                  onAddNewVenue={handleAddNewVenue}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Dirección Completa / Referencia</Label>
                    <Input
                      value={venueAddress}
                      onChange={e => setVenueAddress(e.target.value)}
                      placeholder="Calle, número, colonia..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Municipio o Ciudad</Label>
                    <Input
                      value={venueCity}
                      onChange={e => setVenueCity(e.target.value)}
                      placeholder="ej. Metepec, Valle de Bravo..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Estado</Label>
                    <Input
                      value={venueState}
                      onChange={e => setVenueState(e.target.value)}
                      placeholder="ej. México, CDMX..."
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Enlace de Google Maps</Label>
                    <Input
                      value={mapsLink}
                      onChange={e => setMapsLink(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(2)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button type="button" onClick={() => setActiveStep(4)} className="gap-2 cursor-pointer font-bold">
                    Siguiente: Cotización y Precios <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 4: SERVICIO Y COTIZACIÓN */}
          {activeStep === 4 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Paquete Musical y Cotización
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecciona el formato de banda base y personaliza los costos y adicionales sin checkboxes obsoletos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Paquete Base</Label>
                    <select
                      value={packageId}
                      onChange={e => handlePackageChange(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                    >
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.minDuration} hrs)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-muted-foreground">Precio Base Show</Label>
                      {isPriceModified && (
                        <button
                          type="button"
                          onClick={() => setBasePrice(defaultPackagePrice)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Restablecer a catálogo
                        </button>
                      )}
                    </div>
                    <CurrencyInput
                      value={basePrice}
                      onChange={setBasePrice}
                      placeholder="$0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Viáticos de Traslado</Label>
                    <CurrencyInput
                      value={viaticosAmount}
                      onChange={setViaticosAmount}
                      placeholder="$0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Descuento Especial</Label>
                    <CurrencyInput
                      value={discountAmount}
                      onChange={setDiscountAmount}
                      placeholder="$0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Anticipo Apartado</Label>
                    <CurrencyInput
                      value={depositAmount}
                      onChange={setDepositAmount}
                      placeholder="$0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-white cursor-pointer" htmlFor="invoice-toggle">
                      ¿Requiere Factura Fiscal?
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Calcula automáticamente el 16% de IVA sobre el subtotal.</p>
                  </div>
                  <input
                    id="invoice-toggle"
                    type="checkbox"
                    checked={invoice}
                    onChange={e => setInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Conceptos Adicionales de Producción */}
                <QuoteLineItems
                  items={additionalItems}
                  onChange={setAdditionalItems}
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(3)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button type="button" onClick={() => setActiveStep(5)} className="gap-2 cursor-pointer font-bold">
                    Siguiente: Resumen y Confirmar <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 5: RESUMEN Y CONFIRMAR */}
          {activeStep === 5 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmación y Guardado
                </CardTitle>
                <CardDescription className="text-xs">
                  Revisa la información consolidada antes de guardar en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs space-y-2 sm:space-y-0">
                  <div>
                    <span className="text-muted-foreground block">Titular:</span>
                    <span className="font-bold text-white text-sm">{clientName || "Sin cliente"}</span>
                    <span className="text-muted-foreground block mt-1">{clientPhone} • {clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Evento y Fecha:</span>
                    <span className="font-bold text-white text-sm">{customName || "Show Vendetta"}</span>
                    <span className="text-muted-foreground block mt-1">📅 {eventDate || "Sin fecha"} ({startTime} - {endTime} hrs)</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-white/5">
                    <span className="text-muted-foreground block">Locación:</span>
                    <span className="font-semibold text-white">{venueAddress || "Lugar por confirmar"} {venueCity ? `(${venueCity})` : ""}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(4)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Modificar Cotización
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    size="lg"
                    className="gap-2 font-bold px-8 cursor-pointer bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                  >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {mode === "edit" ? "Guardar Cambios" : "Crear Evento / Cotización"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Columna Lateral Sticky: Resumen Financiero */}
        <div className="lg:col-span-4">
          <FinancialSummary
            totals={totals}
            isPriceModified={isPriceModified}
            invoice={invoice}
          />
        </div>
      </div>
    </form>
  )
}
