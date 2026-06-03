"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { updateDepositAmountAction } from "@/actions/ventas"
import { toast } from "sonner"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export function EditDepositInline({ bookingId, initialDeposit }: { bookingId: string; initialDeposit: number }) {
  const [isEditing, setIsEditing] = useState(false)
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
          setIsEditing(false)
        } else {
          toast.error(res.error || "Fallo al actualizar anticipo")
        }
      } catch (err) {
        toast.error("Error de conexión al guardar")
      }
    })
  }

  function handleCancel() {
    setValue(initialDeposit.toString())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/15 border border-blue-600/30 flex flex-col justify-between h-full gap-2">
        <div className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">Anticipo</div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            disabled={isPending}
            onFocus={(e) => e.target.select()}
            onChange={e => setValue(e.target.value)}
            className="h-8 text-xs bg-background text-foreground border-blue-600/40 w-full"
          />
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleSave} 
            disabled={isPending}
            className="h-8 w-8 text-green-500 hover:bg-green-500/10 shrink-0"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleCancel} 
            disabled={isPending}
            className="h-8 w-8 text-red-500 hover:bg-red-500/10 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/15 border border-blue-600/30 flex flex-col justify-between h-full relative group">
      <div className="flex justify-between items-center w-full">
        <div className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">Anticipo</div>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-blue-500 opacity-0 group-hover:opacity-100 hover:text-blue-700 transition-opacity p-0.5"
          title="Editar anticipo"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
      <div className="text-base md:text-xl font-black text-blue-600 flex items-center justify-between mt-1">
        <span>{MXN(initialDeposit)}</span>
      </div>
    </div>
  )
}
