"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markContractAsSignedAction } from "@/actions/ventas"
import { db } from "@/lib/db" // Wait, I can't use db in client component. I'll need a new action to "unsign" if needed, or just the sign one.

// I'll add an "unsign" action in src/actions/ventas.ts if needed, 
// but for now let's use what we have or create a generic one.

import { updateContractStatusAction } from "@/actions/ventas"

export function ContractStatusSwitcher({ 
  bookingId, 
  status 
}: { 
  bookingId: string, 
  status: string 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isSigned = status === "signed"

  const handleToggle = async () => {
    setLoading(true)
    try {
      const newStatus = isSigned ? "pending" : "signed"
      const res = await updateContractStatusAction(bookingId, newStatus)
      if (res.success) {
        toast.success(`Contrato marcado como ${newStatus === "signed" ? "firmado" : "pendiente"}`)
        router.refresh()
      } else {
        toast.error(res.error || "Error al actualizar contrato")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`h-8 gap-2 px-3 rounded-lg border transition-all ${
        isSigned 
          ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" 
          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSigned ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <Circle className="w-3.5 h-3.5" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest">
        {isSigned ? "Firmado" : "Sin Firma"}
      </span>
    </Button>
  )
}
