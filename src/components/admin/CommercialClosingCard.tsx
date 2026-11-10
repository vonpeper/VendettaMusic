"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Truck,
  Speaker,
  Percent,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Receipt,
  Plus,
  Trash2,
  Layers,
  Save
} from "lucide-react"
import { approveAndSendProposalAction, ApproveProposalLineItemInput } from "@/actions/ventas"
import { formatDateMX } from "@/lib/utils"
import { calculateEventHours } from "@/lib/pricing"
import { isLocalCity } from "@/lib/viaticos"
import { toast } from "sonner"
import Link from "next/link"
import { EventCostBreakdownCard } from "@/components/admin/EventCostBreakdownCard"

export interface PackageOption {
  id: string
  name: string
  baseCostPerHour?: number
  minDuration?: number
}

export interface ProductionItemDef {
  id: string
  name: string
  providerCost: number
  officeMargin: number
  clientPrice: number
  description: string
}

export const PRODUCTION_CATALOG: ProductionItemDef[] = [
  {
    id: "templete",
    name: "Templete Profesional",
    providerCost: 3500,
    officeMargin: 500,
    clientPrice: 4000,
    description: "Estructura modular antiderrapante para elevación escénica"
  },
  {
    id: "audio_500",
    name: "Audio hasta 500 pax (+ Iluminación)",
    providerCost: 6000,
    officeMargin: 1000,
    clientPrice: 7000,
    description: "Sistema line array profesional con refuerzo sonoro e iluminación de show"
  },
  {
    id: "pista_iluminada",
    name: "Pista Iluminada",
    providerCost: 7500,
    officeMargin: 1000,
    clientPrice: 8500,
    description: "Pista de baile LED con control DMX y patrones interactivos"
  },
  {
    id: "produccion_integral",
    name: "Producción Integral (LED + Iluminación + Templete)",
    providerCost: 16000,
    officeMargin: 2000,
    clientPrice: 18000,
    description: "Montaje completo con pantalla LED, iluminación robótica y templete"
  }
]

export interface InitialLineItem {
  id?: string
  description: string
  quantity: number
  unitCost: number
  lineTotal: number
}

interface CommercialClosingCardProps {
  bookingId: string
  shortId: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  currentStatus: string
  eventDate?: Date | string | null
  startTime?: string | null
  endTime?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  mapsLink?: string | null
  venueType?: string | null
  guestCount?: number
  isOutsideZone?: boolean
  distanceKm?: number
  initialTollCost?: number | null
  initialFuelCost?: number | null
  initialPackage?: string
  initialBase?: number
  initialViaticos?: number
  initialDiscount?: number
  initialDeposit?: number
  initialLineItemsTotal?: number
  initialLineItems?: InitialLineItem[]
  packagesList?: PackageOption[]
  initialCustomMusicianPay?: number | null
  initialStaffPay?: number | null
  musiciansCount?: number
  initialInvoice?: boolean
  isContractSigned?: boolean
}

export interface CustomClosingLineItem {
  id: string
  description: string
  quantity: number
  unitCost: number
}

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v)

const CORE_PACKAGES = [
  { key: "essential", label: "Essential", fullName: "Show Vendetta - Essential", defaultBase: 8500 },
  { key: "experience", label: "Experience", fullName: "Show Vendetta - Experience", defaultBase: 15500 },
  { key: "festival", label: "Festival", fullName: "Show Vendetta - Festival", defaultBase: 25000 },
]

export function CommercialClosingCard({
  bookingId,
  shortId,
  clientName,
  clientPhone,
  clientEmail,
  currentStatus,
  eventDate,
  startTime,
  endTime,
  city,
  state,
  address,
  mapsLink,
  venueType,
  guestCount,
  isOutsideZone = false,
  distanceKm,
  initialTollCost = null,
  initialFuelCost = null,
  initialPackage = "Show Vendetta - Experience",
  initialBase = 0,
  initialViaticos = 0,
  initialDiscount = 0,
  initialDeposit = 0,
  initialLineItemsTotal = 0,
  initialLineItems = [],
  packagesList = [],
  initialCustomMusicianPay,
  initialStaffPay = null,
  musiciansCount = 4,
  initialInvoice = false,
  isContractSigned = false
}: CommercialClosingCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Enlace y referencia de Google Maps
  const [currentMapsLink, setCurrentMapsLink] = useState<string>(
    mapsLink || (address?.startsWith("http") ? address : "")
  )

  const effectiveMapsUrl = useMemo(() => {
    if (currentMapsLink && currentMapsLink.trim().startsWith("http")) return currentMapsLink.trim()
    if (mapsLink && mapsLink.trim().startsWith("http")) return mapsLink.trim()
    if (address && address.trim().startsWith("http")) return address.trim()
    if (city) {
      const q = encodeURIComponent(`${address && address !== city ? `${address}, ` : ""}${city}, ${state || "México"}`)
      return `https://www.google.com/maps/search/?api=1&query=${q}`
    }
    return null
  }, [currentMapsLink, mapsLink, address, city, state])

  // Encontrar costo base predeterminado si es necesario
  const findDefaultPrice = (name: string) => {
    const pkg = packagesList.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
    if (pkg && pkg.baseCostPerHour) {
      return pkg.baseCostPerHour * (pkg.minDuration || 2)
    }
    const core = CORE_PACKAGES.find(c => name.toLowerCase().includes(c.key))
    return core?.defaultBase || 15500
  }

  const effectiveInitialBase = initialBase > 0 ? initialBase : findDefaultPrice(initialPackage)

  // Estados principales de cotización
  const [packageName, setPackageName] = useState(initialPackage)
  const [rawBaseAmount, setRawBaseAmount] = useState<number>(effectiveInitialBase)

  // Regla Foránea (+20% sobre show base) - Si la ciudad es local (ej. Toluca/Metepec), nunca es foráneo
  const isCityLocal = city ? isLocalCity(city, state || undefined) : false
  const initialForaneo = !isCityLocal && Boolean(isOutsideZone || (distanceKm !== undefined && distanceKm > 25))
  const [isForaneo, setIsForaneo] = useState<boolean>(initialForaneo)

  // Viáticos desglosados (Banda + Flete Producción)
  const [viaticosBanda, setViaticosBanda] = useState<number>(initialViaticos > 0 ? initialViaticos : 0)
  const [viaticosProduccion, setViaticosProduccion] = useState<number>(0)
  const totalViaticos = viaticosBanda + viaticosProduccion

  // Consulta de destino para auto-cálculo de viáticos
  const destinationQuery = useMemo(() => {
    if (currentMapsLink && currentMapsLink.trim().startsWith("http")) return currentMapsLink.trim()
    if (mapsLink && mapsLink.trim().startsWith("http")) return mapsLink.trim()
    const parts = [address && address !== "Dirección no especificada" ? address : "", city, state].filter(Boolean)
    return parts.join(", ") || city || address || ""
  }, [currentMapsLink, mapsLink, address, city, state])

  const [calculatingViaticos, setCalculatingViaticos] = useState<boolean>(false)
  const [viaticosInfo, setViaticosInfo] = useState<{
    distanceKm?: number
    tollCost?: number
    fuelCost?: number
  } | null>(() => {
    if (distanceKm || initialTollCost || initialFuelCost) {
      return {
        distanceKm: distanceKm ?? undefined,
        tollCost: initialTollCost !== null && initialTollCost !== undefined ? initialTollCost : undefined,
        fuelCost: initialFuelCost !== null && initialFuelCost !== undefined ? initialFuelCost : undefined,
      }
    }
    return null
  })

  const isConfirmed = useMemo(() => {
    const s = (currentStatus || "").toLowerCase()
    return (
      s === "confirmed" ||
      s === "confirmado" ||
      s === "agendado" ||
      s === "completado" ||
      Boolean(isContractSigned)
    )
  }, [currentStatus, isContractSigned])

  const handleAutoCalculateViaticos = async (explicitDestination?: string) => {
    if (isConfirmed) {
      toast.info("El evento ya cuenta con contrato firmado o estatus confirmado. Las condiciones y viáticos pactados no se recalculan automáticamente.")
      return
    }
    const dest = explicitDestination || destinationQuery
    if (!dest || !dest.trim()) {
      toast.error("Ingresa una dirección, municipio o link de Google Maps para calcular viáticos")
      return
    }

    setCalculatingViaticos(true)
    try {
      const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(dest.trim())}`)
      const data = await resp.json()

      if (data && typeof data.viaticosAmount === "number") {
        setViaticosBanda(data.viaticosAmount)
        setViaticosInfo({
          distanceKm: data.distanceKm,
          tollCost: data.tollCost,
          fuelCost: data.fuelCost,
        })

        if (data.isOutsideZone || (data.distanceKm && data.distanceKm > 25)) {
          if (!isCityLocal) {
            setIsForaneo(true)
          } else {
            setIsForaneo(false)
          }
        } else {
          setIsForaneo(false)
        }

        if (data.viaticosAmount === 0 && !data.isOutsideZone) {
          toast.success(`Ubicación en Zona Local: $0 MXN de viáticos (${data.distanceKm || 0} km)`)
        } else {
          const casetasStr = data.tollCost ? `, casetas: ${MXN(data.tollCost)}` : ""
          toast.success(`Viáticos calculados: ${MXN(data.viaticosAmount)} (${data.distanceKm || 0} km${casetasStr})`)
        }
      } else if (data && data.error) {
        toast.error(data.error)
      }
    } catch (err) {
      console.error("Error auto-calculating viáticos:", err)
      toast.error("No se pudo calcular viáticos automáticamente")
    } finally {
      setCalculatingViaticos(false)
    }
  }

  // Descuento siempre sanitizado como valor positivo
  const [discountAmount, setDiscountAmount] = useState<number>(Math.abs(initialDiscount))

  // Pre-cargar selección de producción a partir de initialLineItems
  const initialProductionIds = useMemo(() => {
    const set = new Set<string>()
    if (initialLineItems && initialLineItems.length > 0) {
      for (const li of initialLineItems) {
        const desc = (li.description || "").toLowerCase()
        if (desc.includes("integral") || desc.includes("led +")) {
          set.add("produccion_integral")
        } else if (desc.includes("templete")) {
          set.add("templete")
        } else if (desc.includes("pista")) {
          set.add("pista_iluminada")
        } else if (desc.includes("audio") && (desc.includes("500") || desc.includes("iluminación"))) {
          set.add("audio_500")
        }
      }
    }
    return set
  }, [initialLineItems])

  const [selectedProduction, setSelectedProduction] = useState<Set<string>>(initialProductionIds)

  // Conceptos adicionales personalizados interactivos con costos configurables
  const [customLineItems, setCustomLineItems] = useState<CustomClosingLineItem[]>(() => {
    if (!initialLineItems || initialLineItems.length === 0) return []
    return initialLineItems
      .filter(li => {
        const desc = (li.description || "").toLowerCase()
        const isCatalog =
          desc.includes("integral") ||
          desc.includes("templete") ||
          desc.includes("pista") ||
          (desc.includes("audio") && (desc.includes("500") || desc.includes("iluminación")))
        return !isCatalog
      })
      .map(li => ({
        id: li.id || `custom-${Math.random().toString(36).substring(2, 9)}`,
        description: li.description || "",
        quantity: typeof li.quantity === "number" && li.quantity > 0 ? li.quantity : 1,
        unitCost: typeof li.unitCost === "number" ? li.unitCost : Number(li.lineTotal) || 0,
      }))
  })

  const customLineItemsTotal = useMemo(() => {
    return customLineItems.reduce((acc, it) => acc + ((it.quantity || 1) * (it.unitCost || 0)), 0)
  }, [customLineItems])

  const handleAddCustomItem = () => {
    setCustomLineItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: "",
        quantity: 1,
        unitCost: 0
      }
    ])
  }

  const handleUpdateCustomItem = (
    id: string,
    field: "description" | "quantity" | "unitCost",
    val: string | number
  ) => {
    setCustomLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        if (field === "quantity") {
          const q = Math.max(1, Math.floor(Number(val) || 1))
          return { ...item, quantity: q }
        }
        if (field === "unitCost") {
          const c = Math.max(0, Number(val) || 0)
          return { ...item, unitCost: c }
        }
        if (field === "description") {
          return { ...item, description: String(val) }
        }
        return item
      })
    )
  }

  const handleRemoveCustomItem = (id: string) => {
    setCustomLineItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleProduction = (id: string) => {
    setSelectedProduction(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Cálculos de Producción
  const productionClientTotal = useMemo(() => {
    return PRODUCTION_CATALOG
      .filter(item => selectedProduction.has(item.id))
      .reduce((sum, item) => sum + item.clientPrice, 0)
  }, [selectedProduction])

  const productionProviderTotal = useMemo(() => {
    return PRODUCTION_CATALOG
      .filter(item => selectedProduction.has(item.id))
      .reduce((sum, item) => sum + item.providerCost, 0)
  }, [selectedProduction])

  const productionOfficeMarginTotal = useMemo(() => {
    return PRODUCTION_CATALOG
      .filter(item => selectedProduction.has(item.id))
      .reduce((sum, item) => sum + item.officeMargin, 0)
  }, [selectedProduction])

  // Recargo Foráneo (+20% aplica exclusivamente al show base)
  const foraneoSurcharge = isForaneo ? Math.round(rawBaseAmount * 0.20) : 0
  const effectiveShowBase = rawBaseAmount + foraneoSurcharge

  // Subtotal acordado (Base Show + Viáticos + Producción/Adicionales - Descuento)
  const totalLineItems = productionClientTotal + customLineItemsTotal
  const subtotal = Math.max(0, effectiveShowBase + totalViaticos + totalLineItems - discountAmount)

  // Facturación fiscal IVA (16%)
  const [hasInvoice, setHasInvoice] = useState<boolean>(Boolean(initialInvoice))
  const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16) : 0
  const totalAmount = subtotal + ivaAmount

  // Anticipo reactivo obligatorio del 50% (Default)
  const autoDeposit50 = Math.round(totalAmount * 0.50)

  // Sanidad de Datos: Descartar el valor anómalo $6,728 o valores desfasados del 30% anterior
  const isErroneousLegacy6728 = initialDeposit === 6728 && !hasInvoice
  const matchesAuto50 = initialDeposit > 0 && Math.abs(initialDeposit - autoDeposit50) <= 50
  const hasCustomDepositInitially = initialDeposit > 0 && !matchesAuto50 && !isErroneousLegacy6728 && Math.abs(initialDeposit - Math.round(totalAmount * 0.3)) > 50

  const [manualDeposit, setManualDeposit] = useState<boolean>(hasCustomDepositInitially)
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(
    hasCustomDepositInitially ? initialDeposit : autoDeposit50
  )

  const effectiveDeposit = manualDeposit ? customDepositAmount : autoDeposit50
  const balancePending = Math.max(0, totalAmount - effectiveDeposit)

  // Duración pactada reactiva (fallback 2h si no está definida o son idénticas)
  const durationHours = useMemo(() => {
    return calculateEventHours(startTime, endTime)
  }, [startTime, endTime])

  const isPendingApproval = currentStatus === "pendiente_aprobacion"
  const isApproved = currentStatus === "propuesta_enviada"
  const proposalUrl = `https://vendetta.mx/status/${shortId}`

  const handlePackageSelect = (pkg: typeof CORE_PACKAGES[number]) => {
    setPackageName(pkg.fullName)
    const suggestedPrice = findDefaultPrice(pkg.fullName)
    setRawBaseAmount(suggestedPrice)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proposalUrl)
    setCopiedLink(true)
    toast.success("Enlace de propuesta copiado al portapapeles")
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleApproveAndSend = async (options?: { saveOnly?: boolean }) => {
    if (effectiveShowBase <= 0) {
      toast.error("El precio base del show debe ser mayor a $0 para guardar la propuesta.")
      return
    }

    setLoading(true)
    const isSaveOnly = Boolean(options?.saveOnly)
    try {
      const lineItemsToSave: ApproveProposalLineItemInput[] = [
        ...PRODUCTION_CATALOG.filter(p => selectedProduction.has(p.id)).map(p => ({
          description: p.name,
          quantity: 1,
          unitCost: p.clientPrice,
          lineTotal: p.clientPrice
        })),
        ...customLineItems
          .filter(item => item.description.trim().length > 0)
          .map(item => ({
            description: item.description.trim(),
            quantity: item.quantity || 1,
            unitCost: item.unitCost || 0,
            lineTotal: (item.quantity || 1) * (item.unitCost || 0)
          }))
      ]

      const res = await approveAndSendProposalAction({
        bookingId,
        baseAmount: effectiveShowBase,
        viaticosAmount: totalViaticos,
        discountAmount,
        depositAmount: effectiveDeposit,
        invoice: hasInvoice,
        packageName,
        lineItems: lineItemsToSave,
        isOutsideZone: isForaneo,
        mapsLink: currentMapsLink?.trim() || undefined,
        customMusicianPay: initialCustomMusicianPay ?? undefined,
        saveOnly: isSaveOnly
      })

      if (res.success) {
        toast.success(
          res.message || (isSaveOnly ? "Cotización guardada exitosamente." : "Propuesta aprobada y enviada al cliente por WhatsApp.")
        )
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo procesar la solicitud.")
      }
    } catch (err) {
      console.error("Error saving proposal:", err)
      toast.error("Error de comunicación al procesar la cotización.")
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = eventDate ? formatDateMX(eventDate, "EEEE, d 'de' MMMM, yyyy") : "Fecha por confirmar"

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-xs p-5 sm:p-7 space-y-6">

      {/* 1. Header Compacto del Evento (Resumen Ejecutivo) */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-border/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-black text-sm tracking-wider px-2.5 py-0.5 rounded-lg bg-[#6F0D2B]/10 text-[#6F0D2B] dark:bg-[#6F0D2B]/20 dark:text-rose-400 border border-[#6F0D2B]/20">
              {shortId}
            </span>
            <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {clientName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isPendingApproval ? (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Pendiente de Aprobación
              </Badge>
            ) : isApproved ? (
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Propuesta Enviada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                {currentStatus}
              </Badge>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-border hover:bg-muted"
            >
              <Link href={`/status/${shortId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" />
                <span>Previsualizar</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0 rounded-lg border-border hover:bg-muted"
              title="Copiar enlace de propuesta para el cliente"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </div>
        </div>

        {/* 4 Datos Clave en Grid Compacto */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#6F0D2B]" /> Fecha
            </span>
            <span className="font-bold text-foreground block truncate capitalize">
              {formattedDate}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF5A5F]" /> Horario
            </span>
            <span className="font-mono font-bold text-foreground block truncate">
              {startTime || "21:00"} hrs — {endTime || "23:00"} hrs
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-400">
              Duración pactada: {durationHours} {durationHours === 1 ? "hora" : "horas"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" /> Ubicación
            </span>
            <span className="font-bold text-foreground block truncate" title={`${city || ""}, ${state || ""}`}>
              {city || "Por confirmar"}{state ? `, ${state}` : ""}
            </span>
            {address && address !== city && (
              <span className="text-[10px] text-muted-foreground block truncate" title={address}>
                {address}
              </span>
            )}
            {effectiveMapsUrl && (
              <a
                href={effectiveMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline mt-0.5"
                title="Abrir ubicación en Google Maps"
              >
                <ExternalLink className="w-3 h-3" /> 📍 Abrir en Google Maps
              </a>
            )}
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3 text-[#6F0D2B]" /> Aforo & Formato
            </span>
            <span className="font-bold text-foreground block truncate">
              {guestCount ? `${guestCount} pax` : "Aforo no esp."} • {venueType || "Social"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Selector Rápido de Paquete */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" /> 1. Formato de Espectáculo Sugerido
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {CORE_PACKAGES.map((pkg) => {
            const isSelected = packageName.toLowerCase().includes(pkg.key)
            return (
              <button
                key={pkg.key}
                type="button"
                onClick={() => handlePackageSelect(pkg)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6F0D2B]/5 dark:bg-[#6F0D2B]/15 border-[#6F0D2B] text-foreground shadow-xs ring-1 ring-[#6F0D2B]"
                    : "bg-slate-50/50 dark:bg-zinc-800/30 border-border text-foreground hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isSelected ? "text-[#6F0D2B] dark:text-rose-400" : "text-foreground"}`}>
                    {pkg.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#6F0D2B] dark:text-rose-400" />}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-1 font-semibold">
                  Tarifa Base: {MXN(pkg.defaultBase)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Regla Foránea (+20% al show base) y Precio Show */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" /> Regla Foránea (+20% al Show Base)
              </span>
              {distanceKm !== undefined && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                  {distanceKm} km {distanceKm > 25 ? "(>25 km detectado)" : "(Zona local)"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aplica exclusivamente al show base. No afecta a producción técnica ni viáticos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsForaneo(!isForaneo)}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:opacity-80 transition-opacity cursor-pointer self-start sm:self-auto"
          >
            {isForaneo ? (
              <>
                <ToggleRight className="w-6 h-6 text-[#6F0D2B] dark:text-rose-400" />
                <span className="text-[#6F0D2B] dark:text-rose-400 font-bold">Foráneo (+20% Activo)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                <span className="text-muted-foreground">Tarifa Local</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Precio Show Base ($) *
            </Label>
            <Input
              type="number"
              min={0}
              step={500}
              required
              value={rawBaseAmount || ""}
              onChange={(e) => setRawBaseAmount(Number(e.target.value) || 0)}
              placeholder="0"
              className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Show Efectivo al Cliente {isForaneo ? "(+20% Foráneo)" : ""}
            </Label>
            <div className="h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-border flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground text-xs">
                {isForaneo ? `Base ${MXN(rawBaseAmount)} + 20% (${MXN(foraneoSurcharge)})` : "Base directa"}
              </span>
              <span className="font-bold text-foreground">{MXN(effectiveShowBase)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Viáticos Desglosados */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#FF5A5F]" /> Viáticos Desglosados
            </span>
            <p className="text-[11px] text-muted-foreground">
              Asigna viáticos de traslado de músicos y flete de equipo técnico por separado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAutoCalculateViaticos()}
              disabled={calculatingViaticos || !destinationQuery}
              className="h-8 px-2.5 text-xs font-bold gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              title="Calcular ruta y casetas con Google Maps"
            >
              {calculatingViaticos ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {totalViaticos > 0 ? "Recalcular" : "Calcular Ruta"}
                </>
              )}
            </Button>
            <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted border border-border/60">
              Total: {MXN(totalViaticos)}
            </span>
          </div>
        </div>

        {/* Desglose de Ruta Detectada */}
        {(viaticosInfo?.distanceKm || distanceKm) ? (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
            <span className="bg-muted/70 px-2 py-0.5 rounded font-bold text-muted-foreground">
              🚗 {viaticosInfo?.distanceKm || distanceKm} km
            </span>
            {(viaticosInfo?.tollCost !== undefined && viaticosInfo.tollCost > 0) && (
              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                Casetas: {MXN(viaticosInfo.tollCost)}
              </span>
            )}
            {(viaticosInfo?.fuelCost !== undefined && viaticosInfo.fuelCost > 0) && (
              <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                Gasolina: {MXN(viaticosInfo.fuelCost)}
              </span>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Viáticos Músicos / Banda ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={200}
              value={viaticosBanda || ""}
              onChange={(e) => setViaticosBanda(Number(e.target.value) || 0)}
              placeholder="0"
              className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Viáticos Producción / Flete Equipo ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={200}
              value={viaticosProduccion || ""}
              onChange={(e) => setViaticosProduccion(Number(e.target.value) || 0)}
              placeholder="0"
              className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
            />
          </div>
        </div>

        {/* Enlace y gestión de Google Maps para cálculo certero de viáticos */}
        <div className="pt-2.5 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" /> Referencia de Ubicación & Google Maps
            </Label>
            {effectiveMapsUrl && (
              <a
                href={effectiveMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> 📍 Abrir en Google Maps
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={currentMapsLink}
              onChange={(e) => setCurrentMapsLink(e.target.value)}
              placeholder="Pega aquí el enlace de Google Maps (https://maps.app.goo.gl/...)"
              className="bg-white dark:bg-zinc-900 border-border h-9 rounded-xl text-xs font-mono focus:border-[#6F0D2B]"
            />
            {currentMapsLink !== (mapsLink || "") && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  const { updateBookingLocationAction } = await import("@/actions/ventas")
                  const res = await updateBookingLocationAction({
                    bookingId,
                    mapsLink: currentMapsLink
                  })
                  if (res.success) {
                    toast.success("Enlace de Google Maps guardado")
                  } else {
                    toast.error(res.error || "No se pudo guardar el enlace")
                  }
                }}
                className="h-9 px-3 text-xs shrink-0 rounded-xl"
              >
                Guardar Link
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Rider Técnico (>100 pax) */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Speaker className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" /> Rider Técnico & Producción {guestCount ? `(Aforo: ${guestCount} pax)` : ""}
              </span>
              {guestCount && guestCount > 100 ? (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                  Recomendado para &gt;100 pax
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Checkboxes sobrios para elementos técnicos. Precios contemplan costo con proveedor y margen de oficina.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted border border-border/60 self-start sm:self-auto">
            Total Producción: {MXN(productionClientTotal)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/50">
          {PRODUCTION_CATALOG.map((item) => {
            const isSelected = selectedProduction.has(item.id)
            return (
              <div
                key={item.id}
                onClick={() => toggleProduction(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? "bg-[#6F0D2B]/5 dark:bg-[#6F0D2B]/15 border-[#6F0D2B] text-foreground shadow-xs ring-1 ring-[#6F0D2B]"
                    : "bg-white dark:bg-zinc-900 border-border text-foreground hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-[#6F0D2B] dark:text-rose-400" : "text-foreground"}`}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-foreground">
                      {MXN(item.clientPrice)}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#6F0D2B] dark:text-rose-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {item.description}
                </p>
                <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between pt-1 border-t border-border/40">
                  <span>Proveedor: {MXN(item.providerCost)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Oficina: +{MXN(item.officeMargin)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5.1 Conceptos Adicionales Personalizados */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" /> Conceptos Adicionales Personalizados
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Horas extras, intervenciones especiales, audio extendido o servicios a la medida del cliente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted border border-border/60">
              Total Extras: {MXN(customLineItemsTotal)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomItem}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Concepto</span>
            </Button>
          </div>
        </div>

        {customLineItems.length === 0 ? (
          <div className="py-4 px-3 rounded-xl border border-dashed border-border/70 text-center space-y-1.5 bg-white/40 dark:bg-zinc-900/40">
            <p className="text-xs text-muted-foreground">
              No hay conceptos personalizados registrados.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddCustomItem}
              className="h-7 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Concepto
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            {customLineItems.map((item, idx) => {
              const lineTotal = (item.quantity || 1) * (item.unitCost || 0)
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Descripción del Concepto #{idx + 1}
                    </Label>
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateCustomItem(item.id, "description", e.target.value)}
                      placeholder="Ej. 1 Hora Extra de Banda, Saxofonista para Cóctel, etc."
                      className="bg-slate-50/50 dark:bg-zinc-800/50 border-border h-9 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:w-auto">
                    <div className="w-20 space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Cant.
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleUpdateCustomItem(item.id, "quantity", e.target.value)}
                        className="bg-slate-50/50 dark:bg-zinc-800/50 border-border h-9 rounded-lg text-xs font-mono text-center"
                      />
                    </div>

                    <div className="w-28 space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Precio ($)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={item.unitCost || ""}
                        onChange={(e) => handleUpdateCustomItem(item.id, "unitCost", e.target.value)}
                        placeholder="0"
                        className="bg-slate-50/50 dark:bg-zinc-800/50 border-border h-9 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="w-24 space-y-1 text-right">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Total
                      </Label>
                      <div className="h-9 flex items-center justify-end font-mono font-bold text-xs text-foreground">
                        {MXN(lineTotal)}
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCustomItem(item.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="Eliminar concepto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 6. Descuento / Cortesía y Facturación Fiscal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">
            Descuento / Ajuste de Cortesía ($)
          </Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={discountAmount || ""}
            onChange={(e) => setDiscountAmount(Math.max(0, Math.abs(Number(e.target.value) || 0)))}
            placeholder="0"
            className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
          />
        </div>

        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer" onClick={() => setHasInvoice(!hasInvoice)}>
              <Receipt className="w-3.5 h-3.5 text-[#6F0D2B] dark:text-rose-400" /> Facturación Fiscal (CFDI 4.0)
            </Label>
            <button
              type="button"
              onClick={() => setHasInvoice(!hasInvoice)}
              className="flex items-center gap-1 text-xs font-bold text-foreground cursor-pointer"
            >
              {hasInvoice ? (
                <>
                  <ToggleRight className="w-6 h-6 text-[#6F0D2B] dark:text-rose-400" />
                  <span className="text-[#6F0D2B] dark:text-rose-400 text-xs font-bold">+16% IVA</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Sin Factura</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {hasInvoice ? `IVA agregado: ${MXN(ivaAmount)} (pasivo fiscal, excluido de utilidad)` : "Precio neto sin IVA fiscal"}
          </p>
        </div>
      </div>

      {/* 7. Anticipo: 50% Obligatorio Autocalculado con Toggle para Ajuste Manual */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Anticipo Obligatorio de Apartado (50%)
            </span>
            <p className="text-[11px] text-muted-foreground">
              {manualDeposit ? "Ajuste manual personalizado activo" : "50% autocalculado sobre total pactado"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !manualDeposit
              setManualDeposit(next)
              if (!next) {
                setCustomDepositAmount(autoDeposit50)
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:opacity-80 transition-opacity cursor-pointer"
          >
            {manualDeposit ? (
              <>
                <ToggleRight className="w-6 h-6 text-[#6F0D2B] dark:text-rose-400" />
                <span className="text-[#6F0D2B] dark:text-rose-400 font-bold">Personalizado</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                <span className="text-muted-foreground">Automático (50%)</span>
              </>
            )}
          </button>
        </div>

        {manualDeposit ? (
          <div className="pt-2 border-t border-border/50">
            <Label className="text-[11px] font-bold text-foreground mb-1.5 block">
              Monto Manual de Anticipo ($)
            </Label>
            <Input
              type="number"
              min={0}
              max={totalAmount}
              step={500}
              value={customDepositAmount || ""}
              onChange={(e) => setCustomDepositAmount(Number(e.target.value) || 0)}
              className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
            />
          </div>
        ) : null}
      </div>

      {/* 8. Resumen Financiero Ejecutivo (Lo que verá el cliente) */}
      <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-zinc-800/50 border border-border space-y-2 text-xs">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Formato de Show:</span>
          <span className="text-foreground font-bold">{packageName}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Show Vendetta {isForaneo ? "(Incluye +20% foráneo)" : ""}:</span>
          <span className="text-foreground font-mono font-bold">{MXN(effectiveShowBase)}</span>
        </div>
        {totalViaticos > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Viáticos Totales (Banda + Flete):</span>
            <span className="text-foreground font-mono font-bold">{MXN(totalViaticos)}</span>
          </div>
        )}
        {totalLineItems > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Producción y Adicionales:</span>
            <span className="text-foreground font-mono font-bold">{MXN(totalLineItems)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
            <span>Descuento aplicado:</span>
            <span className="font-mono font-bold">-{MXN(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-foreground pt-1.5 border-t border-border/60">
          <span>Subtotal Cliente:</span>
          <span className="font-mono font-bold text-foreground">{MXN(subtotal)}</span>
        </div>
        {hasInvoice && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>IVA Facturado (16% CFDI 4.0):</span>
            <span className="text-foreground font-mono font-bold">+{MXN(ivaAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-foreground pt-2 border-t border-border text-sm font-black">
          <span>Total Pactado con Cliente:</span>
          <span className="text-[#6F0D2B] dark:text-rose-400 font-mono text-base">{MXN(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Anticipo para Apartar (50%):</span>
          <span className="text-foreground font-bold font-mono">{MXN(effectiveDeposit)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Saldo a Liquidar el Día del Show:</span>
          <span className="text-foreground font-mono font-bold">{MXN(balancePending)}</span>
        </div>
      </div>

      {/* 9. Desglose Operativo y Nómina Sugerida (Ganancias de Dueño & Oficina) */}
      <div className="pt-2">
        <EventCostBreakdownCard
          bookingId={bookingId}
          hours={durationHours}
          isBar={(venueType?.toLowerCase().includes("bar") || packageName.toLowerCase().includes("bar")) ?? false}
          baseShowPrice={Math.max(0, effectiveShowBase - discountAmount)}
          listPrice={effectiveShowBase}
          discountAmount={discountAmount}
          initialMusicianPay={initialCustomMusicianPay}
          initialStaffPay={initialStaffPay}
        />
      </div>

      {/* 10. Botón de Cierre y Aprobación / Estado Confirmado */}
      {isConfirmed ? (
        <div className="space-y-2.5">
          <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-200 gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✅ Evento Confirmado & Propuesta Aprobada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleApproveAndSend({ saveOnly: true })}
              disabled={loading || effectiveShowBase <= 0}
              className="h-10 rounded-xl text-xs font-bold border-border hover:bg-muted gap-2 cursor-pointer shadow-2xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar Cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleApproveAndSend({ saveOnly: false })}
              disabled={loading}
              className="h-10 rounded-xl text-xs font-semibold border-border hover:bg-muted text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Reenviar
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleApproveAndSend({ saveOnly: true })}
              disabled={loading || effectiveShowBase <= 0}
              className="h-12 sm:col-span-1 rounded-xl font-bold text-xs uppercase tracking-wider gap-2 border-border hover:bg-muted text-foreground cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-primary" />}
              Guardar Cambios
            </Button>
            <Button
              type="button"
              onClick={() => handleApproveAndSend({ saveOnly: false })}
              disabled={loading || effectiveShowBase <= 0}
              className={`h-12 sm:col-span-2 rounded-xl font-bold uppercase text-xs sm:text-sm tracking-wider gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50 ${
                isApproved
                  ? "bg-cyan-700 hover:bg-cyan-800 text-white"
                  : "bg-[#6F0D2B] hover:bg-[#580a22] text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : isApproved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Actualizar y Reenviar
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Aprobar y Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Usa <strong className="text-foreground font-bold">Guardar Cambios</strong> para actualizar la cotización internamente, o <strong className="text-foreground font-bold">Aprobar y Enviar</strong> para despachar la propuesta oficial con el folio <code className="font-mono">/status/{shortId}</code> por WhatsApp.
      </p>
    </div>
  )
}

