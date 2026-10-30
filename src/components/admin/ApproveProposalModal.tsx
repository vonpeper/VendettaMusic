"use client"

import { useState } from "react"
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
import { Sparkles, Send, Loader2, CheckCircle2, AlertCircle, DollarSign, Package } from "lucide-react"
import { approveAndSendProposalAction } from "@/actions/ventas"
import { toast } from "sonner"

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
  packagesList?: Array<{ id: string; name: string }>
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
  packagesList = []
}: ApproveProposalModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [packageName, setPackageName] = useState(initialPackage)
  const [baseAmount, setBaseAmount] = useState<number>(initialBase)
  const [viaticosAmount, setViaticosAmount] = useState<number>(initialViaticos)
  const [discountAmount, setDiscountAmount] = useState<number>(initialDiscount)

  const router = useRouter()

  const subtotal = Math.max(0, baseAmount + viaticosAmount - discountAmount)
  const suggestedDeposit = Math.round(subtotal * 0.3)

  const isPendingApproval = currentStatus === "pendiente_aprobacion"
  const isApproved = currentStatus === "propuesta_enviada"

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
        depositAmount: suggestedDeposit,
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
          className={`w-full h-11 font-black text-xs uppercase tracking-wider gap-2 rounded-xl transition-all shadow-md ${
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
              Reenviar Propuesta Aprobada por WhatsApp
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Aprobar y Enviar Propuesta por WhatsApp
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
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="Show Vendetta - Experience"
                className="bg-black/40 border-white/15 text-white h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Importes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>Precio Show *</span>
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
                step={500}
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

          {/* Resumen Financiero Dinámico */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Acordado:</span>
              <span className="text-white text-base font-black font-mono">{MXN(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Anticipo Solicitado (30%):</span>
              <span className="text-primary font-bold font-mono">{MXN(suggestedDeposit)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-white/10 text-[11px]">
              <span>Enlace que se enviará:</span>
              <span className="text-cyan-400 font-mono underline">https://vendetta.mx/status/{shortId}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto h-10 text-xs rounded-xl"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={loading || baseAmount <= 0}
            className="w-full sm:w-auto h-10 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-wider hover:bg-primary/90 gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aprobando y Despachando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirmar y Enviar WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
