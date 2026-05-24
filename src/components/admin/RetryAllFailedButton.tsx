"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"

export function RetryAllFailedButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: number, failed?: number } | null>(null)

  const handleRetryAll = async () => {
    if (!confirm("¿Estás seguro de que deseas reintentar el envío de todas las notificaciones fallidas?")) return
    
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/notifications/retry-all", {
        method: "POST",
      })
      
      const data = await res.json()
      if (res.ok) {
        setResult({ success: data.successCount, failed: data.failedCount })
        if (data.successCount > 0) {
          setTimeout(() => window.location.reload(), 2000)
        }
      } else {
        alert(data.error || "Error al procesar los reintentos masivos")
      }
    } catch (error) {
      alert("Error de red al intentar reenviar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        variant="default" 
        onClick={handleRetryAll}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        Reintentar Todos los Fallidos
      </Button>
      {result && (
        <div className="text-xs flex items-center gap-2 bg-muted/50 p-2 rounded border border-border/40">
          <span className="text-green-500 font-bold">{result.success} exitosos</span>
          <span>|</span>
          <span className="text-red-500 font-bold">{result.failed} fallidos</span>
        </div>
      )}
    </div>
  )
}
