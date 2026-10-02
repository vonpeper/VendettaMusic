"use client"

import React, { useState, useEffect, useMemo, useTransition } from "react"
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
import { calculateQuoteTotals, calculateShowBasePrice, formatCurrencyMXN, calculateEventHours, AdditionalLineItem } from "@/lib/pricing"
import { isLocalCity } from "@/lib/viaticos"
import { ESTADOS_MUNICIPIOS } from "@/lib/municipios"
import { saveUnifiedEventQuoteAction } from "@/actions/events"
import { Toggle } from "@/components/ui/Toggle"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { normalizeTimeTo24h, addMinutesToTime } from "@/lib/inquiry-parser"

function normalizeStateName(rawState?: string): string {
  if (!rawState) return "Estado de México"
  const s = rawState.toLowerCase().trim()
  if (s.includes("cdmx") || s.includes("ciudad de m") || s.includes("distrito federal") || s === "df") {
    return "Ciudad de México"
  }
  if (s.includes("méxico") || s.includes("mexico") || s.includes("edomex")) {
    return "Estado de México"
  }
  const matched = Object.keys(ESTADOS_MUNICIPIOS).find(k => k.toLowerCase() === s)
  return matched || rawState
}
import { 
  Calendar, 
  Users, 
  Sparkles, 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  CalendarPlus,
  X,
  Car,
  Navigation,
  Clock
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
  onSuccess,
  onCancel
}: UnifiedEventQuoteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeStep, setActiveStep] = useState<number>(1)

  // 1. Estado Cliente
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialData?.clientId || initialData?.client?.id || initialData?.bookingRequest?.clientId || initialData?.bookingRequest?.client?.id || null
  )

  const initialPreselectedClient = useMemo(() => {
    const rawId = initialData?.clientId || initialData?.client?.id || initialData?.bookingRequest?.clientId || initialData?.bookingRequest?.client?.id
    if (!rawId || !clients) return null
    return clients.find(c => c.id === rawId) || null
  }, [initialData, clients])

  const [clientName, setClientName] = useState<string>(
    initialData?.clientName || initialData?.client?.user?.name || initialData?.bookingRequest?.clientName || initialData?.bookingRequest?.client?.user?.name || initialPreselectedClient?.name || ""
  )
  const [clientPhone, setClientPhone] = useState<string>(
    initialData?.clientPhone || initialData?.client?.whatsapp || initialData?.bookingRequest?.clientPhone || initialData?.bookingRequest?.client?.whatsapp || initialPreselectedClient?.phone || ""
  )
  const [clientEmail, setClientEmail] = useState<string>(
    initialData?.clientEmail || initialData?.client?.user?.email || initialData?.bookingRequest?.clientEmail || initialData?.bookingRequest?.client?.user?.email || initialPreselectedClient?.email || ""
  )
  const [clientCity, setClientCity] = useState<string>(
    initialData?.city || initialData?.clientCity || initialData?.client?.city || initialData?.bookingRequest?.city || initialData?.bookingRequest?.clientCity || initialData?.bookingRequest?.client?.city || initialPreselectedClient?.city || ""
  )

  // Sincronizar automáticamente datos del cliente si selectedClientId existe pero los campos de texto están vacíos
  useEffect(() => {
    if (selectedClientId && clients && clients.length > 0) {
      const match = clients.find(c => c.id === selectedClientId)
      if (match) {
        setClientName(prev => (!prev?.trim() && match.name ? match.name : prev))
        setClientPhone(prev => (!prev?.trim() && match.phone ? match.phone : prev))
        setClientEmail(prev => (!prev?.trim() && match.email ? match.email : prev))
        setClientCity(prev => (!prev?.trim() && match.city ? match.city : prev))
      }
    }
  }, [selectedClientId, clients])

  // 2. Estado Operativo del Evento
  const [customName, setCustomName] = useState<string>(
    initialData?.customName || initialData?.bookingRequest?.customName || ""
  )
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    if (initialData?.isPublic !== undefined && initialData?.isPublic !== null) {
      return Boolean(initialData.isPublic)
    }
    if (initialData?.bookingRequest?.isPublic !== undefined && initialData?.bookingRequest?.isPublic !== null) {
      return Boolean(initialData.bookingRequest.isPublic)
    }
    const cType = initialData?.ceremonyType || initialData?.bookingRequest?.ceremonyType || ""
    return cType === "bar" || cType === "festival"
  })
  const [ceremonyType, setCeremonyType] = useState<string>(
    initialData?.ceremonyType || initialData?.bookingRequest?.ceremonyType || ""
  )
  const [eventDate, setEventDate] = useState<string>(() => {
    if (initialData?.eventDate) {
      return typeof initialData.eventDate === "string" ? initialData.eventDate.split("T")[0] : new Date(initialData.eventDate).toISOString().split("T")[0]
    }
    if (initialData?.date) {
      return typeof initialData.date === "string" ? initialData.date.split("T")[0] : new Date(initialData.date).toISOString().split("T")[0]
    }
    if (initialData?.requestedDate) {
      return typeof initialData.requestedDate === "string" ? initialData.requestedDate.split("T")[0] : new Date(initialData.requestedDate).toISOString().split("T")[0]
    }
    if (initialData?.bookingRequest?.requestedDate) {
      return typeof initialData.bookingRequest.requestedDate === "string" ? initialData.bookingRequest.requestedDate.split("T")[0] : new Date(initialData.bookingRequest.requestedDate).toISOString().split("T")[0]
    }
    return ""
  })
  const [additionalDates, setAdditionalDates] = useState<string[]>([])
  const [newAdditionalDate, setNewAdditionalDate] = useState<string>("")

  // Horarios Operativos Normalizados
  const initialRawStart = initialData?.startTime || initialData?.performanceStart || initialData?.bookingRequest?.startTime || ""
  const initialNormStart = initialRawStart ? normalizeTimeTo24h(initialRawStart) : ""

  const initialRawEnd = initialData?.endTime || initialData?.performanceEnd || initialData?.bookingRequest?.endTime || ""
  const initialNormEnd = initialRawEnd ? normalizeTimeTo24h(initialRawEnd) : (initialNormStart ? addMinutesToTime(initialNormStart, 120) : "")

  const [startTime, setStartTime] = useState<string>(initialNormStart)
  const [endTime, setEndTime] = useState<string>(initialNormEnd)

  const showDuration = useMemo(() => {
    if (!startTime || !endTime) return null
    return calculateEventHours(startTime, endTime)
  }, [startTime, endTime])

  const [arrivalTime, setArrivalTime] = useState<string>(() => {
    const rawArrival = initialData?.arrivalTime || initialData?.bookingRequest?.arrivalTime
    if (rawArrival) return normalizeTimeTo24h(rawArrival)
    if (initialNormStart) return addMinutesToTime(initialNormStart, -60)
    return ""
  })

  const [setupTime, setSetupTime] = useState<string>(() => {
    const rawSetup = initialData?.setupTime || initialData?.bookingRequest?.setupTime
    if (rawSetup) return normalizeTimeTo24h(rawSetup)
    if (initialNormStart) return addMinutesToTime(initialNormStart, -10)
    return ""
  })

  const [guestCount, setGuestCount] = useState<number | null>(() => {
    const g = initialData?.guestCount !== undefined && initialData?.guestCount !== null
      ? initialData.guestCount
      : initialData?.bookingRequest?.guestCount
    return g !== undefined && g !== null ? Number(g) : null
  })
  const [dressCode, setDressCode] = useState<string>(
    initialData?.dressCode || initialData?.bookingRequest?.dressCode || ""
  )
  const [status, setStatus] = useState<string>(() => {
    const s = initialData?.status || initialData?.bookingRequest?.status || "pendiente"
    return s === "scheduled" ? "agendado" : s
  })
  const [musicianNotes, setMusicianNotes] = useState<string>(
    initialData?.musicianNotes || initialData?.bookingRequest?.musicianNotes || ""
  )
  const [audioEngineer, setAudioEngineer] = useState<string>(
    initialData?.audioEngineer || initialData?.bookingRequest?.audioEngineer || ""
  )

  // 3. Estado Venue
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    initialData?.locationId || initialData?.location?.id || null
  )
  const [venueName, setVenueName] = useState<string>(
    initialData?.venueName || initialData?.location?.name || ""
  )
  const [venueAddress, setVenueAddress] = useState<string>(
    initialData?.venueAddress || initialData?.address || initialData?.location?.address || ""
  )
  const [venueCity, setVenueCity] = useState<string>(
    initialData?.venueCity || initialData?.city || initialData?.location?.city || "Toluca"
  )
  const [venueState, setVenueState] = useState<string>(
    initialData?.venueState || initialData?.state || initialData?.location?.state || "Estado de México"
  )
  const [mapsLink, setMapsLink] = useState<string>(
    initialData?.mapsLink || initialData?.location?.mapsLink || ""
  )

  const [isCustomCity, setIsCustomCity] = useState(false)

  const selectedStateKey = useMemo(() => {
    return normalizeStateName(venueState)
  }, [venueState])

  const availableMunicipios = useMemo(() => {
    return ESTADOS_MUNICIPIOS[selectedStateKey] || [
      "Otro municipio / cotización manual",
    ]
  }, [selectedStateKey])

  const isCityInList = useMemo(() => {
    return availableMunicipios.some(m => m.toLowerCase() === venueCity.toLowerCase())
  }, [availableMunicipios, venueCity])

  function handleStateChange(newState: string) {
    setVenueState(newState)
    setIsCustomCity(false)
    const list = ESTADOS_MUNICIPIOS[newState]
    const defaultMuni = list && list.length > 0 ? list[0] : "Toluca"
    setVenueCity(defaultMuni)
    if (defaultMuni && defaultMuni !== "Otro municipio / cotización manual") {
      handleAutoCalculateViaticos(`${defaultMuni}, ${newState}`)
    }
  }

  function handleCityChange(newCity: string) {
    setVenueCity(newCity)
    if (newCity && newCity !== "Otro municipio / cotización manual" && newCity !== "__custom__") {
      handleAutoCalculateViaticos(`${newCity}, ${venueState}`)
    }
  }

  // 4. Estado Cotización y Paquete
  const [packageId, setPackageId] = useState<string>(
    initialData?.packageId || ""
  )
  const selectedPackage = useMemo(() => {
    return packages.find(p => p.id === packageId) || null
  }, [packages, packageId])

  // Detección de zona foránea (+20%)
  const isOutsideZone = useMemo(() => {
    const city = venueCity || clientCity
    if (!city) return false
    return !isLocalCity(city, venueState)
  }, [venueCity, clientCity, venueState])

  // Precio base ajustable (aplica +20% automáticamente para foráneo)
  const defaultPackagePrice = useMemo(() => {
    if (!selectedPackage) return 0
    const local = selectedPackage.baseCostPerHour * (selectedPackage.minDuration || 1)
    return calculateShowBasePrice(local, isOutsideZone)
  }, [selectedPackage, isOutsideZone])

  const [basePrice, setBasePrice] = useState<number | null>(() => {
    if (initialData?.basePrice !== undefined && initialData?.basePrice !== null) return Number(initialData.basePrice)
    if (initialData?.amount !== undefined && initialData?.amount !== null) return Number(initialData.amount)
    if (initialData?.baseAmount !== undefined && initialData?.baseAmount !== null) return Number(initialData.baseAmount)
    if (initialData?.packageId) {
      const pkg = packages.find(p => p.id === initialData.packageId)
      if (pkg) {
        return pkg.baseCostPerHour * (pkg.minDuration || 1)
      }
    }
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

  const draftKey = useMemo(() => `vendetta_event_draft_${mode}_${targetId || "new"}`, [mode, targetId])

  // Restaurar borrador si el usuario refrescó la página por error de skew
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = sessionStorage.getItem(draftKey)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved && saved.clientName && !initialData?.clientName) {
          toast.info("Se restauró tu borrador anterior automáticamente.", { duration: 4000 })
          if (saved.clientName) setClientName(saved.clientName)
          if (saved.clientPhone) setClientPhone(saved.clientPhone)
          if (saved.clientEmail) setClientEmail(saved.clientEmail)
          if (saved.clientCity) setClientCity(saved.clientCity)
          if (saved.selectedClientId) setSelectedClientId(saved.selectedClientId)
          if (saved.customName) setCustomName(saved.customName)
          if (saved.isPublic !== undefined) setIsPublic(Boolean(saved.isPublic))
          if (saved.ceremonyType) setCeremonyType(saved.ceremonyType)
          if (saved.eventDate) setEventDate(saved.eventDate)
          if (saved.startTime) setStartTime(saved.startTime)
          if (saved.endTime) setEndTime(saved.endTime)
          if (saved.arrivalTime) setArrivalTime(saved.arrivalTime)
          if (saved.setupTime) setSetupTime(saved.setupTime)
          if (saved.guestCount !== undefined) setGuestCount(saved.guestCount)
          if (saved.venueName) setVenueName(saved.venueName)
          if (saved.venueAddress) setVenueAddress(saved.venueAddress)
          if (saved.venueCity) setVenueCity(saved.venueCity)
          if (saved.venueState) setVenueState(saved.venueState)
          if (saved.packageId) setPackageId(saved.packageId)
          if (saved.basePrice !== undefined && saved.basePrice !== null) setBasePrice(saved.basePrice)
          if (saved.viaticosAmount !== undefined && saved.viaticosAmount !== null) setViaticosAmount(saved.viaticosAmount)
          if (saved.discountAmount !== undefined && saved.discountAmount !== null) setDiscountAmount(saved.discountAmount)
          if (saved.depositAmount !== undefined && saved.depositAmount !== null) setDepositAmount(saved.depositAmount)
          if (saved.invoice !== undefined) setInvoice(saved.invoice)
          if (saved.additionalItems?.length) setAdditionalItems(saved.additionalItems)
        }
      }
    } catch {}
  }, [draftKey, initialData])

  // Guardar borrador en caliente mientras el usuario teclea
  useEffect(() => {
    if (typeof window === "undefined" || !clientName) return
    const draft = {
      selectedClientId, clientName, clientPhone, clientEmail, clientCity,
      customName, isPublic, ceremonyType, eventDate, startTime, endTime, arrivalTime, setupTime,
      guestCount, dressCode, status, musicianNotes, audioEngineer,
      selectedVenueId, venueName, venueAddress, venueCity, venueState, mapsLink,
      packageId, basePrice, viaticosAmount, discountAmount, invoice, depositAmount,
      additionalItems
    }
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {}
  }, [
    draftKey, selectedClientId, clientName, clientPhone, clientEmail, clientCity,
    customName, isPublic, ceremonyType, eventDate, startTime, endTime, arrivalTime, setupTime,
    guestCount, dressCode, status, musicianNotes, audioEngineer,
    selectedVenueId, venueName, venueAddress, venueCity, venueState, mapsLink,
    packageId, basePrice, viaticosAmount, discountAmount, invoice, depositAmount,
    additionalItems
  ])

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

      // Intentar calcular viáticos de inmediato si el venue tiene ubicación
      const dest = [venue.address, venue.city, venue.state].filter(Boolean).join(", ") || venue.name
      if (dest) {
        handleAutoCalculateViaticos(dest)
      }
    } else {
      setSelectedVenueId(null)
      setVenueName("")
      if (pendingAddress !== undefined) {
        setVenueAddress(pendingAddress)
      } else if (!venueAddress) {
        setVenueAddress("Pendiente por confirmar")
      }
      setMapsLink("")
      // Preservar ciudad y estado para mantener el cálculo de viáticos
      const fallbackCity = venueCity || clientCity || "Toluca"
      const fallbackState = venueState || "Estado de México"
      handleAutoCalculateViaticos(`${fallbackCity}, ${fallbackState}`)
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

    const dest = [newVenue.address, newVenue.city, newVenue.state].filter(Boolean).join(", ") || newVenue.name
    if (dest) {
      handleAutoCalculateViaticos(dest)
    }
  }

  function handlePackageChange(newPkgId: string) {
    setPackageId(newPkgId)
    const pkg = packages.find(p => p.id === newPkgId)
    if (pkg) {
      const localBase = pkg.baseCostPerHour * (pkg.minDuration || 1)
      const price = calculateShowBasePrice(localBase, isOutsideZone)
      setBasePrice(price)
    }
  }

  const [calculatingViaticos, setCalculatingViaticos] = useState(false)

  async function handleAutoCalculateViaticos(explicitDestination?: string) {
    const rawDest = explicitDestination || [venueAddress, venueCity, venueState].filter(Boolean).join(", ") || venueCity || venueName || clientCity
    const dest = typeof rawDest === "string" ? rawDest.trim() : ""
    if (!dest) {
      toast.error("Ingresa la dirección, ciudad o locación para calcular viáticos")
      return
    }
    setCalculatingViaticos(true)
    try {
      const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(dest)}`)
      const data = await resp.json()
      if (data && typeof data.viaticosAmount === "number") {
        setViaticosAmount(data.viaticosAmount)
        if (data.viaticosAmount === 0 && !data.isOutsideZone) {
          toast.success(`Ubicación en Zona Local: $0 MXN de viáticos (${data.distanceKm || 0} km)`)
        } else {
          const detailParts = []
          if (data.distanceKm) detailParts.push(`${data.distanceKm} km`)
          if (data.tollCost) detailParts.push(`casetas: $${data.tollCost.toLocaleString()}`)
          const detailStr = detailParts.length > 0 ? ` (${detailParts.join(", ")})` : ""
          toast.success(`Viáticos calculados: ${formatCurrencyMXN(data.viaticosAmount, false)}${detailStr}`)
        }
      } else if (data && data.error) {
        toast.error(data.error)
      }
    } catch (err) {
      console.error("Error al calcular viáticos:", err)
      toast.error("Error al calcular viáticos automáticos")
    } finally {
      setCalculatingViaticos(false)
    }
  }

  function handleGoToPricingStep() {
    if (viaticosAmount === null && (venueCity || venueAddress || venueName || clientCity)) {
      handleAutoCalculateViaticos()
    }
    setActiveStep(4)
  }

  function handleAddDate() {
    if (!newAdditionalDate) return
    if (newAdditionalDate === eventDate) {
      toast.error("Esta fecha ya es la fecha principal del evento")
      return
    }
    if (additionalDates.includes(newAdditionalDate)) {
      toast.error("Esta fecha ya está agregada")
      return
    }
    setAdditionalDates([...additionalDates, newAdditionalDate].sort())
    setNewAdditionalDate("")
  }

  function handleRemoveDate(dateToRemove: string) {
    setAdditionalDates(additionalDates.filter(d => d !== dateToRemove))
  }

  function handleStartTimeChange(newStart: string) {
    setStartTime(newStart)
    const norm = normalizeTimeTo24h(newStart)
    if (norm && /^\d{2}:\d{2}$/.test(norm)) {
      // Auto-actualizar fin si estaba vacío o correspondía al default 2h
      setEndTime(prev => {
        if (!prev || (startTime && prev === addMinutesToTime(normalizeTimeTo24h(startTime), 120))) {
          return addMinutesToTime(norm, 120)
        }
        return prev
      })
      // Auto-actualizar llegada de músicos (-60m) si estaba vacía o correspondía al default anterior
      setArrivalTime(prev => {
        if (!prev || (startTime && prev === addMinutesToTime(normalizeTimeTo24h(startTime), -60))) {
          return addMinutesToTime(norm, -60)
        }
        return prev
      })
      // Auto-actualizar término de montaje (-10m) si estaba vacío o correspondía al default anterior
      setSetupTime(prev => {
        if (!prev || (startTime && prev === addMinutesToTime(normalizeTimeTo24h(startTime), -10))) {
          return addMinutesToTime(norm, -10)
        }
        return prev
      })
    }
  }

  function handleSyncDefaultSchedules() {
    const norm = normalizeTimeTo24h(startTime || "21:00")
    if (!startTime) {
      setStartTime(norm)
    }
    setArrivalTime(addMinutesToTime(norm, -60))
    setSetupTime(addMinutesToTime(norm, -10))
    if (!endTime) {
      setEndTime(addMinutesToTime(norm, 120))
    }
    toast.success("Horarios sincronizados: Llegada 1h antes, Montaje 10m antes")
  }

  function handleGoToEventStep() {
    let effectiveName = clientName.trim()
    if (!effectiveName && selectedClientId && clients && clients.length > 0) {
      const match = clients.find(c => c.id === selectedClientId)
      if (match?.name) {
        effectiveName = match.name
        setClientName(effectiveName)
      }
    }
    if (!effectiveName && !selectedClientId) {
      toast.error("Por favor ingresa o selecciona el titular del evento")
      return
    }
    setActiveStep(2)
  }

  function handleGoToVenueStep() {
    if (!customName.trim()) {
      toast.error("El nombre o motivo del show es obligatorio (ej. Boda, XV Años, Vizzio Metepec, Terraza 609)")
      return
    }
    if (!eventDate) {
      toast.error("Por favor selecciona una fecha válida para el evento")
      return
    }
    setActiveStep(3)
  }

  // Submit Handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 1. Fallback de cliente si clientName estuviera vacío pero hay selectedClientId
    let effectiveClientName = clientName.trim()
    let effectiveClientPhone = clientPhone.trim()
    let effectiveClientEmail = clientEmail.trim()
    let effectiveClientCity = clientCity.trim()

    if (selectedClientId) {
      if (clients && clients.length > 0) {
        const match = clients.find(c => c.id === selectedClientId)
        if (match) {
          if (!effectiveClientName && match.name) {
            effectiveClientName = match.name.trim()
            setClientName(effectiveClientName)
          }
          if (!effectiveClientPhone && match.phone) {
            effectiveClientPhone = match.phone.trim()
            setClientPhone(effectiveClientPhone)
          }
          if (!effectiveClientEmail && match.email) {
            effectiveClientEmail = match.email.trim()
            setClientEmail(effectiveClientEmail)
          }
          if (!effectiveClientCity && match.city) {
            effectiveClientCity = match.city.trim()
            setClientCity(effectiveClientCity)
          }
        }
      }
      if (!effectiveClientName && initialData?.clientName) {
        effectiveClientName = initialData.clientName.trim()
        setClientName(effectiveClientName)
      }
      if (!effectiveClientName && initialData?.client?.user?.name) {
        effectiveClientName = initialData.client.user.name.trim()
        setClientName(effectiveClientName)
      }
      if (!effectiveClientName && initialData?.bookingRequest?.clientName) {
        effectiveClientName = initialData.bookingRequest.clientName.trim()
        setClientName(effectiveClientName)
      }
      if (!effectiveClientName && initialData?.bookingRequest?.client?.user?.name) {
        effectiveClientName = initialData.bookingRequest.client.user.name.trim()
        setClientName(effectiveClientName)
      }
    }

    // SI HAY CLIENTE ASIGNADO, NUNCA BLOQUEAR:
    if (!effectiveClientName && !selectedClientId) {
      toast.error("Por favor ingresa o selecciona el titular del evento")
      setActiveStep(1)
      return
    }

    if (!effectiveClientName && selectedClientId) {
      effectiveClientName = "Cliente Asignado"
      setClientName(effectiveClientName)
    }

    // 2. Fallback de nombre o motivo de show si estuviera vacío
    let effectiveCustomName = customName.trim()
    if (!effectiveCustomName) {
      effectiveCustomName = effectiveClientName && effectiveClientName !== "Cliente Asignado" ? `Evento de ${effectiveClientName}` : "Evento Vendetta"
      setCustomName(effectiveCustomName)
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
          clientName: effectiveClientName,
          clientPhone: effectiveClientPhone || null,
          clientEmail: effectiveClientEmail ? effectiveClientEmail.toLowerCase() : null,
          clientCity: effectiveClientCity || null,
          
          customName: effectiveCustomName,
          isPublic,
          ceremonyType: ceremonyType || null,
          eventDate,
          additionalDates: mode === "create" ? additionalDates : [],
          startTime: startTime.trim() ? normalizeTimeTo24h(startTime.trim()) : null,
          endTime: endTime.trim() ? normalizeTimeTo24h(endTime.trim()) : null,
          arrivalTime: arrivalTime.trim() ? normalizeTimeTo24h(arrivalTime.trim()) : null,
          setupTime: setupTime.trim() ? normalizeTimeTo24h(setupTime.trim()) : null,
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
          originInquiryId: initialData?.originInquiryId || null,
        }

        let res: any
        try {
          res = await saveUnifiedEventQuoteAction(payload)
        } catch (actionErr: any) {
          console.warn("⚠️ Server Action falló (posible skew de deploy), ejecutando fallback REST API:", actionErr)
          const fallbackResp = await fetch("/api/admin/events/save-unified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          res = await fallbackResp.json()
        }

        if (res && res.success) {
          try {
            sessionStorage.removeItem(draftKey)
          } catch {}
          const count = "createdCount" in res ? (res.createdCount as number) : 1
          toast.success(
            mode === "edit"
              ? "Registro actualizado exitosamente"
              : count > 1
              ? `¡Se registraron exitosamente ${count} eventos independientes para la temporada!`
              : "Evento / Cotización creada exitosamente"
          )
          const targetBookingId = "bookingId" in res ? res.bookingId : undefined
          router.refresh()
          if (onSuccess) {
            onSuccess()
          } else if (targetBookingId) {
            router.push(`/admin/ventas/${targetBookingId}`)
          } else {
            router.push("/admin/ventas")
          }
        } else {
          toast.error(res?.error || "Ocurrió un error al guardar el registro")
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error inesperado"
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      {/* Barra Superior de Acción y Guardado Rápido */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/70 backdrop-blur-xs p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2.5">
          <Badge variant={mode === "edit" ? "default" : "secondary"} className="uppercase font-bold text-[10px] tracking-wider px-2 py-0.5">
            {mode === "edit" ? "Modo Edición Rápida" : "Nueva Cotización / Evento"}
          </Badge>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {mode === "edit"
              ? "Guarda tus modificaciones directamente desde cualquier paso con el botón de guardar."
              : "Completa la información o navega entre los pasos requeridos."}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs h-9 cursor-pointer">
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 cursor-pointer h-9 px-4 text-xs"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {mode === "edit" ? "Guardar Cambios" : "Guardar Cotización"}
          </Button>
        </div>
      </div>

      {/* Navegación por Pasos / Pestañas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 1 ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>1. Cliente</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 2 ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>2. Evento</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 3 ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>3. Venue</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 4 ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>4. Cotización</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(5)}
          className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStep === 5 ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
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
                    <Label className="text-xs font-semibold text-muted-foreground">
                      {selectedClientId ? "Nombre del Titular (Asignado)" : "Nombre del Titular *"}
                    </Label>
                    <Input
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="mt-1"
                    />
                    {selectedClientId && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Vinculado al perfil del cliente. Puedes ajustar este contacto sin duplicar registros.
                      </p>
                    )}
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    Paso 1 de 5: Datos del Cliente
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2 font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {mode === "edit" ? "Guardar Cambios" : "Guardar Cotización"}
                    </Button>
                    <Button type="button" onClick={handleGoToEventStep} className="gap-2 cursor-pointer font-bold" variant="outline">
                      Siguiente: Datos del Evento <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 2: DATOS DEL EVENTO */}
          {activeStep === 2 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Datos Operativos del Evento
                </CardTitle>
                <CardDescription className="text-xs">
                  Especifica fecha, horarios, tipo de evento y requerimientos logísticos de la banda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Nombre / Motivo del Show <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="ej. Boda Mariana & Carlos, Vizzio Metepec, Terraza 609"
                      className={`mt-1 ${!customName.trim() ? "border-amber-500/60 focus:border-amber-500" : ""}`}
                    />
                    {!customName.trim() && (
                      <p className="text-[11px] text-amber-500 font-medium mt-1">
                        Obligatorio. Especifica el nombre o motivo para no registrar eventos genéricos.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Tipo de Celebración</Label>
                    <select
                      value={ceremonyType}
                      onChange={e => {
                        const val = e.target.value
                        setCeremonyType(val)
                        if (val === "bar" || val === "festival") {
                          setIsPublic(true)
                        }
                      }}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {CEREMONY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Switch Show Público / Agenda */}
                <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <Label htmlFor="isPublicSwitch" className="text-sm font-bold text-foreground cursor-pointer">
                        Publicar en Agenda (Show Público / Cartelera)
                      </Label>
                      {isPublic ? (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          Visible en Web y Agenda
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full">
                          Evento Privado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Actívalo para shows en bares, festivales o conciertos abiertos. Si está desactivado, el evento se mantendrá privado (bodas, XV años, corporativos).
                    </p>
                  </div>
                  <Toggle
                    id="isPublicSwitch"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Fecha del Evento *</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
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

                {/* Fechas adicionales para Bares / Temporadas (solo en modo creación) */}
                {mode === "create" && (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarPlus className="w-4 h-4 text-primary" />
                        <Label className="text-xs font-bold text-foreground">
                          Fechas Adicionales / Temporada (Bares y Residencias)
                        </Label>
                      </div>
                      {additionalDates.length > 0 && (
                        <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                          {1 + additionalDates.length} eventos a registrar
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Si el bar o cliente te solicitó múltiples fechas (ej. Terraza 609, Vizzio Lounge), agrégalas aquí para crear todos los eventos en un solo registro con la misma locación, horarios y costos.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        value={newAdditionalDate}
                        onChange={(e) => setNewAdditionalDate(e.target.value)}
                        className="w-48 text-xs bg-background"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddDate}
                        disabled={!newAdditionalDate}
                        className="gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Fecha
                      </Button>
                    </div>

                    {additionalDates.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                        {additionalDates.map((dateStr) => (
                          <span
                            key={dateStr}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-card border border-border/60 shadow-xs text-foreground"
                          >
                            📅 {dateStr}
                            <button
                              type="button"
                              onClick={() => handleRemoveDate(dateStr)}
                              className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer ml-1 p-0.5 rounded hover:bg-muted"
                              title="Eliminar fecha"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Módulo Especial de Horarios Operativos */}
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/80 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <Label className="text-sm font-bold text-foreground block">
                          Horarios del Evento y Montaje
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          Organiza los tiempos de actuación de la banda y la logística técnica previa.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncDefaultSchedules}
                      className="text-xs font-semibold text-primary hover:text-primary/90 flex items-center gap-1.5 cursor-pointer bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95"
                      title="Calcula automáticamente: Músicos 1h antes y Montaje 10m antes del show"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-calcular horarios (-1h músicos / -10m montaje)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bloque 1: Show / Actuación Musical */}
                    <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            🎸 Show en Vivo
                          </span>
                          {showDuration !== null && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              {showDuration} {showDuration === 1 ? "hora" : "horas"} de música
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Horario de actuación
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Hora Inicio Show *</Label>
                          <Input
                            type="time"
                            value={startTime}
                            onChange={e => handleStartTimeChange(e.target.value)}
                            className="mt-1.5 h-11 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Hora Fin Show</Label>
                          <Input
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="mt-1.5 h-11 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Logística y Montaje */}
                    <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          🚚 Logística Previa
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Preparación en el recinto
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">Llegada Músicos</Label>
                            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30 bg-primary/10 py-0.5 px-2 font-bold">
                              1h antes
                            </Badge>
                          </div>
                          <Input
                            type="time"
                            value={arrivalTime}
                            onChange={e => setArrivalTime(e.target.value)}
                            className="mt-1.5 h-11 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">Término Montaje</Label>
                            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30 bg-primary/10 py-0.5 px-2 font-bold">
                              10m antes
                            </Badge>
                          </div>
                          <Input
                            type="time"
                            value={setupTime}
                            onChange={e => setSetupTime(e.target.value)}
                            className="mt-1.5 h-11 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-0.5">
                    <span>💡</span> Por default la llegada de músicos es 1 hora antes del show y el término del montaje es 10 minutos antes. Puedes ajustarlos con total libertad.
                  </p>
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(1)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2 font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {mode === "edit" ? "Guardar Cambios" : "Guardar Cotización"}
                    </Button>
                    <Button type="button" onClick={handleGoToVenueStep} className="gap-2 cursor-pointer font-bold" variant="outline">
                      Siguiente: Venue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 3: VENUE */}
          {activeStep === 3 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
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
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold text-muted-foreground">Dirección Completa / Referencia</Label>
                      <button
                        type="button"
                        onClick={() => setVenueAddress("Pendiente por confirmar")}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Marcar como Pendiente
                      </button>
                    </div>
                    <Input
                      value={venueAddress}
                      onChange={e => setVenueAddress(e.target.value)}
                      placeholder="Calle, número, colonia o 'Pendiente por confirmar'..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Estado</Label>
                    <select
                      value={Object.keys(ESTADOS_MUNICIPIOS).find(k => k.toLowerCase() === selectedStateKey.toLowerCase()) || (venueState ? "Otro" : "Estado de México")}
                      onChange={e => {
                        const val = e.target.value
                        if (val === "Otro") {
                          setVenueState("Otro")
                        } else {
                          handleStateChange(val)
                        }
                      }}
                      className="w-full h-10 px-3 mt-1 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {Object.keys(ESTADOS_MUNICIPIOS).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                      <option value="Otro">Otro Estado (Cotización manual)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold text-muted-foreground">Municipio o Alcaldía</Label>
                      {isCustomCity && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCity(false)
                            const first = availableMunicipios[0] || "Toluca"
                            handleCityChange(first)
                          }}
                          className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Ver Lista
                        </button>
                      )}
                    </div>
                    {isCustomCity ? (
                      <Input
                        value={venueCity}
                        onChange={e => setVenueCity(e.target.value)}
                        onBlur={() => {
                          if (venueCity) handleAutoCalculateViaticos(`${venueCity}, ${venueState}`)
                        }}
                        placeholder="Escribe el nombre del municipio..."
                        className="h-10"
                      />
                    ) : (
                      <select
                        value={isCityInList ? venueCity : "__custom__"}
                        onChange={e => {
                          if (e.target.value === "__custom__") {
                            setIsCustomCity(true)
                          } else {
                            handleCityChange(e.target.value)
                          }
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {availableMunicipios.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="__custom__">Otro municipio / Escribir a mano...</option>
                      </select>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Enlace de Google Maps (Opcional)</Label>
                    <Input
                      value={mapsLink}
                      onChange={e => setMapsLink(e.target.value)}
                      placeholder="https://maps.app.goo.gl/... (opcional si el cliente aún no define ubicación)"
                      className="mt-1"
                    />
                    {!mapsLink && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        ℹ️ Enlace opcional. Si el cliente tiene desconfianza o aún no tiene lugar, se le indicará que esta información queda pendiente por definir.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-primary" /> Cálculo de Viáticos de Traslado
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {viaticosAmount !== null ? (
                        viaticosAmount === 0 ? (
                          <span className="text-emerald-500 font-semibold">📍 Zona Local (Valle de Toluca / Metepec) — $0 MXN</span>
                        ) : (
                          <span className="text-primary font-semibold">🚗 Viáticos estimados: {formatCurrencyMXN(viaticosAmount, false)}</span>
                        )
                      ) : isOutsideZone ? (
                        <span className="text-amber-500 font-medium">⚠️ Zona Foránea detectada (+20% show y viáticos de traslado)</span>
                      ) : (
                        <span>Calcula automáticamente kilometraje, combustible y casetas según la ubicación.</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={calculatingViaticos || (!venueCity && !venueAddress && !venueName && !clientCity)}
                    onClick={() => handleAutoCalculateViaticos()}
                    className="shrink-0 text-xs h-8 gap-1.5 font-bold cursor-pointer"
                  >
                    {calculatingViaticos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-primary" />}
                    {calculatingViaticos ? "Calculando..." : (viaticosAmount !== null ? "Recalcular Viáticos" : "Calcular Viáticos")}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(2)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2 font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {mode === "edit" ? "Guardar Cambios" : "Guardar Cotización"}
                    </Button>
                    <Button type="button" onClick={handleGoToPricingStep} className="gap-2 cursor-pointer font-bold" variant="outline">
                      Siguiente: Cotización y Precios <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 4: SERVICIO Y COTIZACIÓN */}
          {activeStep === 4 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
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
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Precio Base Show</Label>
                        {isOutsideZone ? (
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.2 rounded border border-amber-500/20">
                            +20% Foráneo
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">
                            Local Toluca
                          </span>
                        )}
                      </div>
                      {isPriceModified && (
                        <button
                          type="button"
                          onClick={() => setBasePrice(defaultPackagePrice)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Restablecer ({formatCurrencyMXN(defaultPackagePrice, false)})
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
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-muted-foreground">Viáticos de Traslado</Label>
                      <button
                        type="button"
                        onClick={() => handleAutoCalculateViaticos()}
                        disabled={calculatingViaticos || (!venueCity && !venueAddress && !venueName && !clientCity)}
                        className="text-[10px] text-primary hover:underline font-bold disabled:opacity-40 disabled:no-underline cursor-pointer"
                      >
                        {calculatingViaticos ? "Calculando..." : "Calcular ruta"}
                      </button>
                    </div>
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

                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer" htmlFor="invoice-toggle">
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(3)} className="gap-2 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2 font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {mode === "edit" ? "Guardar Cambios" : "Guardar Cotización"}
                    </Button>
                    <Button type="button" onClick={() => setActiveStep(5)} className="gap-2 cursor-pointer font-bold" variant="outline">
                      Siguiente: Resumen y Confirmar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 5: RESUMEN Y CONFIRMAR */}
          {activeStep === 5 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmación y Guardado
                </CardTitle>
                <CardDescription className="text-xs">
                  Revisa la información consolidada antes de guardar en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border text-xs space-y-2 sm:space-y-0">
                  <div>
                    <span className="text-muted-foreground block">Titular:</span>
                    <span className="font-bold text-foreground text-sm">{clientName || "Sin cliente"}</span>
                    <span className="text-muted-foreground block mt-1">{clientPhone} • {clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Evento y Fecha:</span>
                    <span className="font-bold text-foreground text-sm">{customName || "Show Vendetta"}</span>
                    <span className="text-muted-foreground block mt-1">📅 {eventDate || "Sin fecha"} ({startTime} - {endTime} hrs)</span>
                    {additionalDates.length > 0 && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                        <span className="font-bold text-primary block mb-1">
                          Fechas adicionales de la temporada ({additionalDates.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-foreground">
                          {additionalDates.map(d => (
                            <span key={d} className="px-2 py-0.5 rounded bg-background/80 border border-border/50">
                              {d}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                          Se crearán {1 + additionalDates.length} eventos independientes con esta configuración.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-border/40">
                    <span className="text-muted-foreground block">Locación:</span>
                    <span className="font-semibold text-foreground">{venueAddress || "Lugar por confirmar"} {venueCity ? `(${venueCity})` : ""}</span>
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
                    className="gap-2 font-bold px-8 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20"
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {mode === "edit"
                      ? "Guardar Cambios"
                      : additionalDates.length > 0
                      ? `Crear ${1 + additionalDates.length} Eventos`
                      : "Crear Evento / Cotización"}
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
