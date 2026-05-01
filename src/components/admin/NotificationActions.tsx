"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function NotificationActions({ notificationId }: { notificationId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const router = useRouter()

  async function handleResend() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/resend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notificationId }),
      })
      const json = await res.json()
      if (json.success) {
        setSent(true)
        toast.success("Mensaje reenviado")
        router.refresh()
      } else {
        toast.error(json.error || "No se pudo reenviar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
      <Check className="w-3.5 h-3.5" /> Reenviado
    </div>
  )

  return (
    <Button
      onClick={handleResend}
      disabled={loading}
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 text-[10px] uppercase tracking-widest font-bold border-primary/30 text-primary hover:bg-primary/10"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      Reintentar
    </Button>
  )
}
