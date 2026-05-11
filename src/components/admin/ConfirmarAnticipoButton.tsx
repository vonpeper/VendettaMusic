"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { confirmDepositPaidAction } from "@/actions/ventas"
import { toast } from "sonner"

export function ConfirmarAnticipoButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!confirm("¿Deseas confirmar que el ANTICIPO de esta solicitud ha sido pagado?")) return
    
    setLoading(true)
    try {
      const res = await confirmDepositPaidAction(bookingId)
      if (res.success) {
        toast.success("Anticipo confirmado correctamente")
      } else {
        toast.error(res.error || "Error al confirmar anticipo")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleConfirm}
      disabled={loading}
      variant="outline"
      className="mt-4 w-full border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl h-10 gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      Confirmar Anticipo Pagado
    </Button>
  )
}
