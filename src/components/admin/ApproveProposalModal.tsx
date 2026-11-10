"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Send, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react"
import { approveAndSendProposalAction } from "@/actions/ventas"
import { toast } from "sonner"

export interface PackageSummaryOption {
  id: string
  name: string
  baseCostPerHour?: number
  minDuration?: number
}

interface ApproveProposalModalProps {
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
  packagesList?: PackageSummaryOption[]
}

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v)

export function ApproveProposalModal({
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
}: ApproveProposalModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Encontrar costo predeterminado de paquete si initialBase es 0
  const findDefaultPriceForPackage = (pkgName: string) => {
    const pkg = packagesList.find(
      p => p.name.toLowerCase() === pkgName.toLowerCase() ||
           p.name.toLowerCase().includes(pkgName.toLowerCase()) ||
           pkgName.toLowerCase().includes(p.name.toLowerCase())
    )
    if (pkg && pkg.baseCostPerHour) {
      return pkg.baseCostPerHour * (pkg.minDuration || 2)
    }
    return 0
  }

  const effectiveInitialBase = initialBase > 0 
    ? initialBase 
    : findDefaultPriceForPackage(initialPackage)

  const [packageName, setPackageName] = useState(initialPackage)
  const [baseAmount, setBaseAmount] = useState<number>(effectiveInitialBase)
  const [viaticosAmount, setViaticosAmount] = useState<number>(initialViaticos)
  const [discountAmount, setDiscountAmount] = useState<number>(initialDiscount)

  const subtotal = Math.max(0, baseAmount + viaticosAmount + (initialLineItemsTotal || 0) - discountAmount)
  const autoDeposit50 = Math.round(subtotal * 0.5)
  const hasCustomDepositInitially = initialDeposit > 0 && Math.abs(initialDeposit - autoDeposit50) > 100

  const [manualDeposit, setManualDeposit] = useState(hasCustomDepositInitially)
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(
    initialDeposit > 0 ? initialDeposit : autoDeposit50
  )

  const router = useRouter()

  // Sincronización reactiva garantizada: cada vez que el modal se abre o cambian las propiedades
  useEffect(() => {
    if (open) {
      setPackageName(initialPackage)
      const baseToUse = initialBase > 0 ? initialBase : findDefaultPriceForPackage(initialPackage)
      setBaseAmount(baseToUse)
      setViaticosAmount(initialViaticos)
      setDiscountAmount(initialDiscount)
      const calcSub = Math.max(0, baseToUse + initialViaticos + (initialLineItemsTotal || 0) - initialDiscount)
      const calcAuto = Math.round(calcSub * 0.5)
      if (initialDeposit > 0 && Math.abs(initialDeposit - calcAuto) > 100) {
        setManualDeposit(true)
        setCustomDepositAmount(initialDeposit)
      } else {
        setManualDeposit(false)
        setCustomDepositAmount(calcAuto)
      }
    }
  }, [open, initialPackage, initialBase, initialViaticos, initialDiscount, initialDeposit, initialLineItemsTotal])

  const effectiveDeposit = manualDeposit ? customDepositAmount : Math.round(subtotal * 0.5)

  const isPendingApproval = currentStatus === "pendiente_aprobacion"
  const isApproved = currentStatus === "propuesta_enviada"

  const handlePackageChange = (newName: string) => {
    setPackageName(newName)
    const pkgPrice = findDefaultPriceForPackage(newName)
    if (pkgPrice > 0 && (baseAmount === 0 || baseAmount === effectiveInitialBase)) {
      setBaseAmount(pkgPrice)
    }
  }

  const handleApprove = async () => {
    if (baseAmount <= 0) {
      toast.error("El precio base debe ser mayor a $0 para aprobar y enviar la propuesta.")
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
        toast.success(res.message || "Propuesta aprobada y enviada al cliente.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Error al procesar la aprobación.")
      }
    } catch (err: any) {
      console.error("Error approving proposal:", err)
      toast.error("Error de comunicación al enviar propuesta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`w-full h-11 font-black text-xs uppercase tracking-wider gap-2 rounded-xl transition-all shadow-md cursor-pointer ${
            isPendingApproval
              ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20 animate-pulse"
              : isApproved
              ? "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
          }`}
        >
          {isApproved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Reenviar Propuesta
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Aprobar y Enviar
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-950 border border-border/50 text-white max-w-lg rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Folio: {shortId}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              WhatsApp: {clientPhone}
            </span>
          </div>

          <DialogTitle className="text-xl font-heading font-black text-white uppercase tracking-tight">
            {isApproved ? "Reenviar Propuesta Oficial" : "Aprobar y Enviar Propuesta"}
          </DialogTitle>

          <DialogDescription className="text-gray-400 text-xs leading-relaxed">
            Define el precio acordado para <strong className="text-white">{clientName}</strong>. Al confirmar, el estatus cambiará a <span className="text-cyan-400 font-bold">Propuesta Enviada</span> y se despachará el mensaje oficial con el enlace público por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Paquete */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Paquete Asignado
            </Label>
            <div className="relative">
              <Input
                type="text"
                list="packages-suggestions"
                value={packageName}
                onChange={(e) => handlePackageChange(e.target.value)}
                placeholder="Show Vendetta - Experience"
                className="bg-black/40 border-white/15 text-white h-10 rounded-xl text-xs"
              />
              <datalist id="packages-suggestions">
                {packagesList.map((pkg) => (
                  <option key={pkg.id} value={pkg.name}>
                    {pkg.baseCostPerHour ? `${pkg.name} (${MXN(pkg.baseCostPerHour * (pkg.minDuration || 2))})` : pkg.name}
                  </option>
                ))}
              </datalist>
            </div>
            {packagesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {packagesList.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handlePackageChange(pkg.name)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      packageName.toLowerCase().includes(pkg.name.toLowerCase())
                        ? "bg-primary text-black border-primary"
                        : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {pkg.name.replace(/Show Vendetta - /i, "")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Importes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Precio Show *
              </Label>
              <Input
                type="number"
                min={0}
                step={500}
                required
                value={baseAmount || ""}
                onChange={(e) => setBaseAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/40 border-white/15 text-white h-10 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Viáticos ($)
              </Label>
              <Input
                type="number"
                min={0}
                step={200}
                value={viaticosAmount || ""}
                onChange={(e) => setViaticosAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/40 border-white/15 text-white h-10 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Descuento ($)
              </Label>
              <Input
                type="number"
                min={0}
                step={500}
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/40 border-white/15 text-white h-10 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Anticipo y Toggle Manual */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300">Anticipo de Apartado</span>
              <button
                type="button"
                onClick={() => {
                  const next = !manualDeposit
                  setManualDeposit(next)
                  if (!next) setCustomDepositAmount(Math.round(subtotal * 0.5))
                }}
                className="flex items-center gap-1 text-[11px] text-amber-400 font-bold hover:underline cursor-pointer"
              >
                {manualDeposit ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-amber-400" />
                    <span>Personalizado</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-400">Automático (30%)</span>
                  </>
                )}
              </button>
            </div>

            {manualDeposit && (
              <div className="pt-2 border-t border-white/10">
                <Label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">
                  Monto Manual de Anticipo ($)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={subtotal}
                  step={500}
                  value={customDepositAmount || ""}
                  onChange={(e) => setCustomDepositAmount(Number(e.target.value) || 0)}
                  className="bg-zinc-900 border-white/20 text-white h-9 rounded-lg text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Resumen Financiero Dinámico */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Precio Show Base:</span>
              <span className="text-white font-mono">{MXN(baseAmount)}</span>
            </div>
            {viaticosAmount > 0 && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Viáticos de Traslado:</span>
                <span className="text-white font-mono">{MXN(viaticosAmount)}</span>
              </div>
            )}
            {initialLineItemsTotal > 0 && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Conceptos Adicionales (DJ / Extras):</span>
                <span className="text-cyan-400 font-mono font-bold">{MXN(initialLineItemsTotal)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-400">
                <span>Cortesía / Descuento:</span>
                <span className="font-mono font-bold">-{MXN(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-200 pt-2 border-t border-white/10">
              <span className="font-bold">Total Acordado de Propuesta:</span>
              <span className="text-white text-base font-black font-mono">{MXN(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Anticipo a Requerir:</span>
              <span className="text-primary font-bold font-mono">{MXN(effectiveDeposit)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-white/10 text-[11px]">
              <span>Enlace que se enviará:</span>
              <span className="text-cyan-400 font-mono underline truncate max-w-[220px]">https://vendetta.mx/status/{shortId}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto h-10 text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={loading || baseAmount <= 0}
            className="w-full sm:w-auto h-10 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-wider hover:bg-primary/90 gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirmar y Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
