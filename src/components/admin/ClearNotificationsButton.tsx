"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { clearAllNotificationsAction } from "@/actions/notifications"

export function ClearNotificationsButton() {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    startTransition(async () => {
      const res = await clearAllNotificationsAction()
      if (res.success) {
        setConfirming(false)
      } else {
        alert(res.error || "Error al borrar registros")
      }
    })
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleClear}
      disabled={isPending}
      className="gap-2 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:shadow-lg hover:shadow-pink-500/30 transition-all text-white border-none rounded-xl font-bold"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      {confirming ? "¿Confirmar?" : "Limpiar Historial"}
    </Button>
  )
}
