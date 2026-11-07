"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Send,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Receipt,
  ToggleLeft,
  ToggleRight,
  Truck,
  Speaker,
  Lock,
  Percent
} from "lucide-react"
import { approveAndSendProposalAction, ApproveProposalLineItemInput } from "@/actions/ventas"
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
  currentStatus: string
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
  currentStatus,
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
      // Líneas de producción consolidadas para la propuesta oficial
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

  return (
    <div className="relative bg-zinc-950/90 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden space-y-6">
      {/* Glow de acento ejecutivo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header de la Ficha Comercial */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5" /> Ficha de Cierre Comercial
            </span>
            {isPendingApproval ? (
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-wider border border-yellow-500/30 animate-pulse">
                Pendiente de Aprobación
              </span>
            ) : isApproved ? (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Propuesta Enviada
              </span>
            ) : null}
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight mt-2">
            Propuesta para {clientName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Folio: <span className="font-mono font-bold text-white">{shortId}</span> • WhatsApp: <span className="font-mono text-white">{clientPhone}</span>
            {guestCount ? (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-white/10 text-white font-bold">
                Aforo: {guestCount} pax
              </span>
            ) : null}
          </p>
        </div>

        {/* Enlace para Previsualizar la Propuesta */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs gap-1.5 cursor-pointer font-bold"
          >
            <Link href={`/status/${shortId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              Previsualizar Propuesta
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-9 px-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            title="Copiar Enlace de Propuesta"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
          </Button>
        </div>
      </div>

      {/* Contenido interactivo */}
      <div className="relative z-10 space-y-6">
        
        {/* 1. Selector de Paquete Sugerido (Pills) */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1. Selector de Paquete Sugerido
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CORE_PACKAGES.map((pkg) => {
              const isSelected = packageName.toLowerCase().includes(pkg.key)
              return (
                <button
                  key={pkg.key}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-500"
                      : "bg-black/40 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black ${isSelected ? "text-amber-400" : "text-white"}`}>
                      {pkg.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-1">
                    Base: {MXN(pkg.defaultBase)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Regla Foránea (+20% sobre show base) y Precio Base */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-400" /> Regla Foránea (+20% al Show Base)
                </span>
                {distanceKm !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
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
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {isForaneo ? (
                <>
                  <ToggleRight className="w-6 h-6 text-amber-400" />
                  <span className="text-amber-400">Foráneo (+20% Activo)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-400">Tarifa Local</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
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
                className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Show Efectivo al Cliente {isForaneo ? "(+20% Foráneo)" : ""}
              </Label>
              <div className="h-11 px-3 rounded-xl bg-zinc-900 border border-white/15 flex items-center justify-between font-mono text-sm">
                <span className="text-gray-400 text-xs">
                  {isForaneo ? `Base ${MXN(rawBaseAmount)} + 20% (${MXN(foraneoSurcharge)})` : "Base directa"}
                </span>
                <span className="font-bold text-amber-400">{MXN(effectiveShowBase)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Viáticos Desglosados: Viáticos Banda + Viáticos Producción / Flete */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Viáticos Desglosados
              </span>
              <p className="text-[11px] text-muted-foreground">
                Asigna viáticos de traslado de músicos y flete de equipo técnico por separado.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              Total Viáticos: {MXN(totalViaticos)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Viáticos Banda ($)
              </Label>
              <Input
                type="number"
                min={0}
                step={200}
                value={viaticosBanda || ""}
                onChange={(e) => setViaticosBanda(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Viáticos Producción / Flete Equipo ($)
              </Label>
              <Input
                type="number"
                min={0}
                step={200}
                value={viaticosProduccion || ""}
                onChange={(e) => setViaticosProduccion(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Tabulador de Producción para Aforo > 100 pax */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                  <Speaker className="w-3.5 h-3.5 text-amber-400" /> Tabulador de Producción Técnica {guestCount ? `(Aforo: ${guestCount} pax)` : ""}
                </span>
                {guestCount && guestCount > 100 ? (
                  <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    Recomendado para &gt;100 pax
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Selecciona los elementos técnicos necesarios. Los precios ya contemplan el costo con proveedor y el margen de oficina.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 self-start sm:self-auto">
              Total Producción: {MXN(productionClientTotal)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
            {PRODUCTION_CATALOG.map((item) => {
              const isSelected = selectedProduction.has(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleProduction(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500"
                      : "bg-zinc-900/60 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? "text-amber-400" : "text-white"}`}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-white">
                        {MXN(item.clientPrice)}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/30" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {item.description}
                  </p>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between pt-1 border-t border-white/5">
                    <span>Proveedor: {MXN(item.providerCost)}</span>
                    <span className="text-emerald-400 font-bold">Oficina: +{MXN(item.officeMargin)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 5. Descuento / Ajuste Comercial */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Descuento / Ajuste de Cortesía ($)
          </Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={discountAmount || ""}
            onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
            placeholder="0"
            className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
          />
        </div>

        {/* 6. Anticipo: 30% Autocalculado con Toggle para Ajuste Manual */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
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
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {manualDeposit ? (
                <>
                  <ToggleRight className="w-6 h-6 text-amber-400" />
                  <span>Personalizado</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-400">Automático (30%)</span>
                </>
              )}
            </button>
          </div>

          {manualDeposit ? (
            <div className="pt-2 border-t border-white/10">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5 block">
                Monto Manual de Anticipo ($)
              </Label>
              <Input
                type="number"
                min={0}
                max={subtotal}
                step={500}
                value={customDepositAmount || ""}
                onChange={(e) => setCustomDepositAmount(Number(e.target.value) || 0)}
                className="bg-zinc-900 border-white/20 text-white h-10 rounded-xl text-sm font-mono focus:border-amber-500"
              />
            </div>
          ) : null}
        </div>

        {/* 7. TARJETA PRIVADA DE ADMINISTRACIÓN: CONTROL DE UTILIDAD DE OFICINA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 border-2 border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <Lock className="w-3 h-3" /> Solo Visible para Administración
            </span>
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              Control de Margen Interno
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Margen Show (Base)</span>
              <span className="text-base font-black text-white font-mono">{MXN(effectiveShowBase)}</span>
              <span className="text-[10px] text-gray-500 block">Facturación base espectáculo</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Margen Producción</span>
              <span className="text-base font-black text-emerald-400 font-mono">+{MXN(productionOfficeMarginTotal)}</span>
              <span className="text-[10px] text-gray-500 block">Comisión neta de oficina</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Ingreso Bruto Oficina</span>
              <span className="text-base font-black text-emerald-300 font-mono">
                {MXN(effectiveShowBase + productionOfficeMarginTotal - discountAmount)}
              </span>
              <span className="text-[10px] text-emerald-400/80 block">Show + Margen Prod - Descuento</span>
            </div>
          </div>
        </div>

        {/* 8. Resumen Ejecutivo de Cierre (Lo que verá el cliente) */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-400">
            <span>Paquete Show:</span>
            <span className="text-white font-bold">{packageName}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Show Vendetta {isForaneo ? "(Incluye +20% foráneo)" : ""}:</span>
            <span className="text-white font-mono">{MXN(effectiveShowBase)}</span>
          </div>
          {totalViaticos > 0 && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Viáticos Totales (Banda + Flete):</span>
              <span className="text-white font-mono">{MXN(totalViaticos)}</span>
            </div>
          )}
          {totalLineItems > 0 && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Producción y Adicionales:</span>
              <span className="text-cyan-400 font-mono font-bold">{MXN(totalLineItems)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <span>Descuento aplicado:</span>
              <span className="font-mono font-bold">-{MXN(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-white pt-2 border-t border-white/10 text-sm font-black">
            <span>Total Pactado con Cliente:</span>
            <span className="text-amber-400 font-mono text-base">{MXN(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-300">
            <span>Anticipo para Apartar (30%):</span>
            <span className="text-primary font-bold font-mono">{MXN(effectiveDeposit)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Saldo a Liquidar el Día del Show:</span>
            <span className="text-white font-mono">{MXN(balancePending)}</span>
          </div>
        </div>

        {/* 9. Botón Prioritario de Aprobación y Envío */}
        <Button
          type="button"
          onClick={handleApproveAndSend}
          disabled={loading || effectiveShowBase <= 0}
          className={`w-full h-13 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider gap-2 shadow-xl cursor-pointer transition-all disabled:opacity-50 ${
            isApproved
              ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/25 font-black"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando y Despachando WhatsApp...
            </>
          ) : isApproved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Actualizar y Reenviar Propuesta por WhatsApp
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Aprobar y Enviar Propuesta por WhatsApp
            </>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Al confirmar, el estatus pasará a <strong className="text-cyan-400 font-bold">propuesta_enviada</strong> y se despachará el mensaje oficial con el enlace a <code className="text-white font-mono">/status/{shortId}</code>.
        </p>
      </div>
    </div>
  )
}
