"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { purgeOrphanInboxItemsAction } from "@/actions/inbox"

export function PurgeInboxButton() {
  const [loading, setLoading] = useState(false)

  const handlePurge = async () => {
    const ok = window.confirm(
      "¿Deseas purgar los mensajes huérfanos de la bandeja de entrada?\n\nEsta acción eliminará todos los mensajes de remitentes que no pertenezcan a prospectos o clientes comerciales registrados."
    )
    if (!ok) return

    setLoading(true)
    try {
      const res = await purgeOrphanInboxItemsAction()
      if (res.success) {
        toast.success(
          `Purga completada: se eliminaron ${res.deletedCount} mensajes huérfanos. (${res.remainingCount} válidos conservados)`
        )
      } else {
        toast.error(res.error || "Error al purgar mensajes huérfanos")
      }
    } catch {
      toast.error("Error inesperado al purgar mensajes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePurge}
      disabled={loading}
      className="text-xs font-semibold gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
      title="Eliminar mensajes de chats personales y no comerciales"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      <span>Purgar Huérfanos</span>
    </Button>
  )
}
