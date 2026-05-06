"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2, FileCheck } from "lucide-react"
import { markContractAsSignedAction } from "@/actions/ventas"
import { toast } from "sonner"

export function ContractSignedButton({ bookingId, isSigned }: { bookingId: string, isSigned: boolean }) {
  const [loading, setLoading] = useState(false)

  if (isSigned) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest">
        <Check className="w-4 h-4" /> Contrato Firmado
      </div>
    )
  }

  const handleConfirm = async () => {
    if (!confirm("¿Confirmas que el cliente ya firmó el contrato?")) return
    setLoading(true)
    try {
      const res = await markContractAsSignedAction(bookingId)
      if (res.success) {
        toast.success("Contrato marcado como firmado")
      } else {
        toast.error(res.error || "Error al actualizar")
      }
    } catch (e) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleConfirm}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
      Confirmar Firma de Contrato
    </Button>
  )
}
