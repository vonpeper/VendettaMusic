"use client"

import { useState } from "react"
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
  ShieldCheck,
  Receipt,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { approveAndSendProposalAction } from "@/actions/ventas"
import { toast } from "sonner"
import Link from "next/link"

export interface PackageOption {
  id: string
  name: string
  baseCostPerHour?: number
  minDuration?: number
}

interface CommercialClosingCardProps {
  bookingId: string
  shortId: string
  clientName: string
  clientPhone: string
  currentStatus: string
  initialPackage?: string
  initialBase?: number
  initialViaticos?: number
  initialDiscount?: number
  initialDeposit?: number
  initialLineItemsTotal?: number
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
  initialPackage = "Show Vendetta - Experience",
  initialBase = 0,
  initialViaticos = 0,
  initialDiscount = 0,
  initialDeposit = 0,
  initialLineItemsTotal = 0,
  packagesList = []
}: CommercialClosingCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Determinar base inicial efectiva
  const findDefaultPrice = (name: string) => {
    const pkg = packagesList.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
    if (pkg && pkg.baseCostPerHour) {
      return pkg.baseCostPerHour * (pkg.minDuration || 2)
    }
    const core = CORE_PACKAGES.find(c => name.toLowerCase().includes(c.key))
    return core?.defaultBase || 15500
  }

  const effectiveInitialBase = initialBase > 0 ? initialBase : findDefaultPrice(initialPackage)

  const [packageName, setPackageName] = useState(initialPackage)
  const [baseAmount, setBaseAmount] = useState<number>(effectiveInitialBase)
  const [viaticosAmount, setViaticosAmount] = useState<number>(initialViaticos)
  const [discountAmount, setDiscountAmount] = useState<number>(initialDiscount)

  // Toggle de anticipo manual vs 30% automático
  const autoDeposit30 = Math.round(Math.max(0, baseAmount + viaticosAmount + initialLineItemsTotal - discountAmount) * 0.3)
  const hasCustomDepositInitially = initialDeposit > 0 && Math.abs(initialDeposit - autoDeposit30) > 100

  const [manualDeposit, setManualDeposit] = useState(hasCustomDepositInitially)
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(
    initialDeposit > 0 ? initialDeposit : autoDeposit30
  )

  const subtotal = Math.max(0, baseAmount + viaticosAmount + initialLineItemsTotal - discountAmount)
  const effectiveDeposit = manualDeposit ? customDepositAmount : Math.round(subtotal * 0.3)
  const balancePending = Math.max(0, subtotal - effectiveDeposit)

  const isPendingApproval = currentStatus === "pendiente_aprobacion"
  const isApproved = currentStatus === "propuesta_enviada"
  const proposalUrl = `https://vendetta.mx/status/${shortId}`

  const handlePackageSelect = (pkg: typeof CORE_PACKAGES[number]) => {
    setPackageName(pkg.fullName)
    const suggestedPrice = findDefaultPrice(pkg.fullName)
    if (baseAmount === 0 || baseAmount === effectiveInitialBase) {
      setBaseAmount(suggestedPrice)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proposalUrl)
    setCopiedLink(true)
    toast.success("Enlace de propuesta copiado al portapapeles")
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleApproveAndSend = async () => {
    if (baseAmount <= 0) {
      toast.error("El precio base del show debe ser mayor a $0 para aprobar la propuesta.")
      return
    }

    setLoading(true)
    try {
      const res = await approveAndSendProposalAction({
        bookingId,
        baseAmount,
        viaticosAmount,
        discountAmount,
        depositAmount: effectiveDeposit,
        packageName
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
      <div className="relative z-10 space-y-5">
        
        {/* 1. Selector de Paquete Sugerido (Pills) */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1. Selector de Paquete Sugerido
          </Label>
          <div className="grid grid-cols-3 gap-2.5">
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

        {/* 2. Inputs Financieros: Precio Show, Viáticos Reales y Descuento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Precio Show Base ($) *
            </Label>
            <Input
              type="number"
              min={0}
              step={500}
              required
              value={baseAmount || ""}
              onChange={(e) => setBaseAmount(Number(e.target.value) || 0)}
              placeholder="0"
              className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Viáticos Reales ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={200}
              value={viaticosAmount || ""}
              onChange={(e) => setViaticosAmount(Number(e.target.value) || 0)}
              placeholder="0"
              className="bg-black/50 border-white/15 text-white h-11 rounded-xl text-sm font-mono focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Descuento / Ajuste ($)
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
        </div>

        {/* 3. Anticipo: 30% Autocalculado con Toggle para Ajuste Manual */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Anticipo de Apartado
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

        {/* 4. Resumen Ejecutivo de Cierre */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-400">
            <span>Paquete:</span>
            <span className="text-white font-bold">{packageName}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Precio Base Show:</span>
            <span className="text-white font-mono">{MXN(baseAmount)}</span>
          </div>
          {viaticosAmount > 0 && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Viáticos Reales:</span>
              <span className="text-white font-mono">{MXN(viaticosAmount)}</span>
            </div>
          )}
          {initialLineItemsTotal > 0 && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Adicionales (DJ / Horas extra):</span>
              <span className="text-cyan-400 font-mono font-bold">{MXN(initialLineItemsTotal)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <span>Descuento aplicado:</span>
              <span className="font-mono font-bold">-{MXN(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-white pt-2 border-t border-white/10 text-sm font-black">
            <span>Total Pactado:</span>
            <span className="text-amber-400 font-mono text-base">{MXN(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-300">
            <span>Anticipo a Requerir:</span>
            <span className="text-primary font-bold font-mono">{MXN(effectiveDeposit)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Saldo a Liquidar:</span>
            <span className="text-white font-mono">{MXN(balancePending)}</span>
          </div>
        </div>

        {/* 5. Botón Prioritario de Aprobación y Envío */}
        <Button
          type="button"
          onClick={handleApproveAndSend}
          disabled={loading || baseAmount <= 0}
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
