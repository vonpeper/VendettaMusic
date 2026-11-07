"use client"

import { useState, useMemo } from "react"
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
  Lock,
  Percent,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Receipt
} from "lucide-react"
import { approveAndSendProposalAction, ApproveProposalLineItemInput } from "@/actions/ventas"
import { formatDateMX } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

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
  venueType?: string | null
  guestCount?: number
  isOutsideZone?: boolean
  distanceKm?: number
  initialPackage?: string
  initialBase?: number
  initialViaticos?: number
  initialDiscount?: number
  initialDeposit?: number
  initialLineItemsTotal?: number
  initialLineItems?: InitialLineItem[]
  packagesList?: PackageOption[]
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
  venueType,
  guestCount,
  isOutsideZone = false,
  distanceKm,
  initialPackage = "Show Vendetta - Experience",
  initialBase = 0,
  initialViaticos = 0,
  initialDiscount = 0,
  initialDeposit = 0,
  initialLineItemsTotal = 0,
  initialLineItems = [],
  packagesList = []
}: CommercialClosingCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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

  // Regla Foránea (+20% sobre show base)
  const initialForaneo = Boolean(isOutsideZone || (distanceKm !== undefined && distanceKm > 25))
  const [isForaneo, setIsForaneo] = useState<boolean>(initialForaneo)

  // Viáticos desglosados (Banda + Flete Producción)
  const [viaticosBanda, setViaticosBanda] = useState<number>(initialViaticos > 0 ? initialViaticos : 0)
  const [viaticosProduccion, setViaticosProduccion] = useState<number>(0)
  const totalViaticos = viaticosBanda + viaticosProduccion

  const [discountAmount, setDiscountAmount] = useState<number>(initialDiscount)

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

  // Otros line items que no pertenecen al catálogo de producción
  const otherLineItems = useMemo(() => {
    if (!initialLineItems) return []
    return initialLineItems.filter(li => {
      const desc = (li.description || "").toLowerCase()
      const isCatalog =
        desc.includes("integral") ||
        desc.includes("templete") ||
        desc.includes("pista") ||
        (desc.includes("audio") && (desc.includes("500") || desc.includes("iluminación")))
      return !isCatalog
    })
  }, [initialLineItems])

  const otherLineItemsTotal = useMemo(() => {
    return otherLineItems.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0)
  }, [otherLineItems])

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

  // Subtotal acordado
  const totalLineItems = productionClientTotal + otherLineItemsTotal
  const subtotal = Math.max(0, effectiveShowBase + totalViaticos + totalLineItems - discountAmount)

  // Anticipo reactivo (30%)
  const autoDeposit30 = Math.round(subtotal * 0.3)
  const hasCustomDepositInitially = initialDeposit > 0 && Math.abs(initialDeposit - autoDeposit30) > 100

  const [manualDeposit, setManualDeposit] = useState(hasCustomDepositInitially)
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(
    initialDeposit > 0 ? initialDeposit : autoDeposit30
  )

  const effectiveDeposit = manualDeposit ? customDepositAmount : autoDeposit30
  const balancePending = Math.max(0, subtotal - effectiveDeposit)

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

  const handleApproveAndSend = async () => {
    if (effectiveShowBase <= 0) {
      toast.error("El precio base del show debe ser mayor a $0 para aprobar la propuesta.")
      return
    }

    setLoading(true)
    try {
      const lineItemsToSave: ApproveProposalLineItemInput[] = [
        ...PRODUCTION_CATALOG.filter(p => selectedProduction.has(p.id)).map(p => ({
          description: p.name,
          quantity: 1,
          unitCost: p.clientPrice,
          lineTotal: p.clientPrice
        })),
        ...otherLineItems.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal
        }))
      ]

      const res = await approveAndSendProposalAction({
        bookingId,
        baseAmount: effectiveShowBase,
        viaticosAmount: totalViaticos,
        discountAmount,
        depositAmount: effectiveDeposit,
        packageName,
        lineItems: lineItemsToSave,
        isOutsideZone: isForaneo
      })

      if (res.success) {
        toast.success(res.message || "Propuesta aprobada y enviada al cliente por WhatsApp.")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo procesar la aprobación.")
      }
    } catch (err) {
      console.error("Error approving proposal:", err)
      toast.error("Error de comunicación al enviar la propuesta.")
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
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" /> Ubicación
            </span>
            <span className="font-bold text-foreground block truncate" title={`${city || ""}, ${state || ""}`}>
              {city || "Por confirmar"}{state ? `, ${state}` : ""}
            </span>
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
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#FF5A5F]" /> Viáticos Desglosados
            </span>
            <p className="text-[11px] text-muted-foreground">
              Asigna viáticos de traslado de músicos y flete de equipo técnico por separado.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted border border-border/60">
            Total Viáticos: {MXN(totalViaticos)}
          </span>
        </div>

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

      {/* 6. Descuento / Cortesía */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-foreground">
          Descuento / Ajuste de Cortesía ($)
        </Label>
        <Input
          type="number"
          min={0}
          step={500}
          value={discountAmount || ""}
          onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
          placeholder="0"
          className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
        />
      </div>

      {/* 7. Anticipo: 30% Autocalculado con Toggle para Ajuste Manual */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Anticipo de Apartado (30%)
            </span>
            <p className="text-[11px] text-muted-foreground">
              {manualDeposit ? "Ajuste manual personalizado activo" : "30% autocalculado sobre total pactado"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !manualDeposit
              setManualDeposit(next)
              if (!next) {
                setCustomDepositAmount(Math.round(subtotal * 0.3))
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
                <span className="text-muted-foreground">Automático (30%)</span>
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
              max={subtotal}
              step={500}
              value={customDepositAmount || ""}
              onChange={(e) => setCustomDepositAmount(Number(e.target.value) || 0)}
              className="bg-white dark:bg-zinc-900 border-border h-10 rounded-xl text-sm font-mono focus:border-[#6F0D2B]"
            />
          </div>
        ) : null}
      </div>

      {/* 8. Tarjeta de Margen Interno (Solo Visible para Administración) */}
      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-800 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-600/20">
            <Lock className="w-3 h-3" /> Solo Administración
          </span>
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 font-mono">
            Control de Margen Interno
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/30 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Margen Show (Base)</span>
            <span className="text-sm font-black text-foreground font-mono">{MXN(effectiveShowBase)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/30 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Margen Producción</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">+{MXN(productionOfficeMarginTotal)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/30 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Utilidad Proyectada</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {MXN(effectiveShowBase + productionOfficeMarginTotal - discountAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 9. Resumen Financiero Ejecutivo (Lo que verá el cliente) */}
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
        <div className="flex justify-between items-center text-foreground pt-2 border-t border-border text-sm font-black">
          <span>Total Pactado con Cliente:</span>
          <span className="text-[#6F0D2B] dark:text-rose-400 font-mono text-base">{MXN(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Anticipo para Apartar (30%):</span>
          <span className="text-foreground font-bold font-mono">{MXN(effectiveDeposit)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Saldo a Liquidar el Día del Show:</span>
          <span className="text-foreground font-mono">{MXN(balancePending)}</span>
        </div>
      </div>

      {/* 10. Botón Único Principal de Cierre y Aprobación */}
      <Button
        type="button"
        onClick={handleApproveAndSend}
        disabled={loading || effectiveShowBase <= 0}
        className={`w-full h-12 rounded-xl font-bold uppercase text-xs sm:text-sm tracking-wider gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50 ${
          isApproved
            ? "bg-cyan-700 hover:bg-cyan-800 text-white"
            : "bg-[#6F0D2B] hover:bg-[#580a22] text-white"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando y Despachando WhatsApp...
          </>
        ) : isApproved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Actualizar y Reenviar Propuesta por WhatsApp
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Aprobar y Enviar Propuesta por WhatsApp
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Al confirmar, el estatus pasará a <strong className="text-foreground font-bold">propuesta_enviada</strong> y se despachará el mensaje oficial con el enlace a <code className="font-mono">/status/{shortId}</code>.
      </p>
    </div>
  )
}

