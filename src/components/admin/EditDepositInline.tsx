"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Loader2 } from "lucide-react"
import { updateDepositAmountAction } from "@/actions/ventas"
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

export function EditDepositInline({ bookingId, initialDeposit }: { bookingId: string; initialDeposit: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(initialDeposit.toString())
  const [isPending, startTransition] = useTransition()

  async function handleSave() {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      toast.error("Por favor ingresa un monto válido")
      return
    }

    startTransition(async () => {
      try {
        const res = await updateDepositAmountAction(bookingId, numValue)
        if (res.success) {
          toast.success("Anticipo actualizado con éxito")
          setIsOpen(false)
        } else {
          toast.error(res.error || "Fallo al actualizar anticipo")
        }
      } catch (err) {
        toast.error("Error de conexión al guardar")
      }
    })
  }

  return (
    <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/15 border border-blue-600/30 flex flex-col justify-between h-full relative group">
      <div className="flex justify-between items-center w-full">
        <div className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">Anticipo</div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) setValue(initialDeposit.toString())
          setIsOpen(open)
        }}>
          <DialogTrigger asChild>
            <button 
              className="text-blue-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-blue-700 transition-opacity p-0.5 cursor-pointer"
              title="Editar anticipo"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-card border border-border/40 shadow-2xl rounded-2xl p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-black text-foreground">Editar Anticipo</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Ingresa el nuevo monto para el anticipo pactado o requerido (MXN).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="modalDepositAmount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Monto del Anticipo (MXN)
              </label>
              <Input
                id="modalDepositAmount"
                type="number"
                step="0.01"
                min="0"
                value={value}
                disabled={isPending}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setValue(e.target.value)}
                className="bg-background text-foreground border-border/40 focus-visible:ring-2 focus-visible:ring-blue-600/50 w-full"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => { 
                  setIsOpen(false)
                  setValue(initialDeposit.toString())
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
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-base md:text-xl font-black text-blue-600 flex items-center justify-between mt-1">
        <span>{MXN(initialDeposit)}</span>
      </div>
    </div>
  )
}
