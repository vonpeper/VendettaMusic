"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Loader2, DollarSign } from "lucide-react"
import { updateTotalAmountAction } from "@/actions/ventas"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

interface EditTotalInlineProps {
  bookingId: string
  initialBase: number
  initialViaticos: number
  initialDiscount?: number
  initialLineItemsTotal?: number
  initialTotal: number
  hasInvoice?: boolean
}

export function EditTotalInline({
  bookingId,
  initialBase,
  initialViaticos,
  initialDiscount = 0,
  initialLineItemsTotal = 0,
  initialTotal,
  hasInvoice = false
}: EditTotalInlineProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [baseValue, setBaseValue] = useState(initialBase.toString())
  const [viaticosValue, setViaticosValue] = useState(initialViaticos.toString())
  const [isPending, startTransition] = useTransition()

  const numBase = parseFloat(baseValue) || 0
  const numViaticos = parseFloat(viaticosValue) || 0
  const previewSubtotal = Math.max(0, numBase + numViaticos + initialLineItemsTotal - initialDiscount)
  const previewIva = hasInvoice ? Math.round(previewSubtotal * 0.16 * 100) / 100 : 0
  const previewTotal = previewSubtotal + previewIva

  function resetForm() {
    setBaseValue(initialBase.toString())
    setViaticosValue(initialViaticos.toString())
  }

  async function handleSave() {
    if (isNaN(numBase) || numBase < 0) {
      toast.error("Por favor ingresa un monto base válido")
      return
    }

    startTransition(async () => {
      try {
        const res = await updateTotalAmountAction(bookingId, numBase, numViaticos)
        if (res.success) {
          toast.success("Total del evento actualizado con éxito")
          setIsOpen(false)
        } else {
          toast.error(res.error || "Fallo al actualizar el total")
        }
      } catch (err) {
        toast.error("Error de conexión al guardar")
      }
    })
  }

  return (
    <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/10 border border-blue-600/20 flex flex-col justify-between h-full relative group">
      <div className="flex justify-between items-center w-full">
        <div className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Total</div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) resetForm()
          setIsOpen(open)
        }}>
          <DialogTrigger asChild>
            <button 
              className="text-blue-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-blue-400 transition-opacity p-0.5 cursor-pointer"
              title="Editar monto total o precio base del show"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md bg-card border border-border/40 shadow-2xl rounded-2xl p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Editar Inversión del Show
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Modifica el precio base del show y viáticos. El total comercial, propuesta del cliente y contrato se actualizarán automáticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div>
                <label htmlFor="modalBaseAmount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Monto Base del Show (MXN)
                </label>
                <Input
                  id="modalBaseAmount"
                  type="number"
                  step="100"
                  min="0"
                  value={baseValue}
                  disabled={isPending}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBaseValue(e.target.value)}
                  className="bg-background text-foreground border-border/40 focus-visible:ring-2 focus-visible:ring-blue-600/50 w-full font-bold text-base"
                />
              </div>

              <div>
                <label htmlFor="modalViaticosAmount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Viáticos Logísticos (MXN)
                </label>
                <Input
                  id="modalViaticosAmount"
                  type="number"
                  step="100"
                  min="0"
                  value={viaticosValue}
                  disabled={isPending}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setViaticosValue(e.target.value)}
                  className="bg-background text-foreground border-border/40 focus-visible:ring-2 focus-visible:ring-blue-600/50 w-full"
                />
              </div>

              {/* Vista Previa en Tiempo Real */}
              <div className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-600/20 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Monto Base + Viáticos:</span>
                  <span className="font-bold text-foreground">{MXN(numBase + numViaticos)}</span>
                </div>
                {initialLineItemsTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Adicionales:</span>
                    <span className="font-bold text-foreground">+{MXN(initialLineItemsTotal)}</span>
                  </div>
                )}
                {initialDiscount > 0 && (
                  <div className="flex justify-between text-blue-500 font-medium">
                    <span>Descuento aplicado:</span>
                    <span className="font-bold">-{MXN(initialDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground font-medium pt-1 border-t border-border/20">
                  <span>Subtotal:</span>
                  <span className="font-bold text-foreground">{MXN(previewSubtotal)}</span>
                </div>
                {hasInvoice && (
                  <div className="flex justify-between text-amber-500 font-medium">
                    <span>IVA (16% Factura):</span>
                    <span className="font-bold">{MXN(previewIva)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border/30">
                  <span>Total Final Cliente:</span>
                  <span className="text-blue-500 font-black">{MXN(previewTotal)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => { 
                  setIsOpen(false)
                  resetForm()
                }} 
                disabled={isPending}
                className="rounded-xl border border-border/40 flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold gap-2 flex-1"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-base md:text-xl font-black text-foreground mt-1">
        {MXN(initialTotal)}
      </div>
    </div>
  )
}
