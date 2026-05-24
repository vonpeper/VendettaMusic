"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function ResendNotificationButton({ notificationId }: { notificationId: string }) {
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      })
      
      const data = await res.json()
      if (res.ok && data.success) {
        window.location.reload()
      } else {
        alert(data.error || "Error al reenviar la notificación")
      }
    } catch (error) {
      alert("Error de red al intentar reenviar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleResend}
      disabled={loading}
      className="h-7 text-[10px] px-2 gap-1 border-border/40 hover:bg-muted"
    >
      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      Reenviar
    </Button>
  )
}
