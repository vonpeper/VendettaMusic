"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { markBookingAsPaidAction } from "@/actions/ventas"
import { toast } from "sonner"

export function LiquidarButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleLiquidar() {
    if (!confirm("¿Deseas marcar esta solicitud como LIQUIDADA (Totalmente pagada)?")) return
    
    setLoading(true)
    try {
      const res = await markBookingAsPaidAction(bookingId)
      if (res.success) {
        toast.success("Pago liquidado correctamente")
      } else {
        toast.error(res.error || "Error al liquidar pago")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleLiquidar}
      disabled={loading}
      variant="outline"
      className="mt-4 w-full border-green-500/30 text-green-400 hover:bg-green-600 hover:text-white font-bold rounded-xl h-10 gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Liquidar Pago Total
    </Button>
  )
}
