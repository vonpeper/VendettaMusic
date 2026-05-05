"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { repairOrphanedEvents } from "@/actions/admin"
import { toast } from "sonner"

export function RepairSyncButton() {
  const [loading, setLoading] = useState(false)

  const handleRepair = async () => {
    setLoading(true)
    try {
      const res = await repairOrphanedEvents()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error("Error: " + res.message)
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRepair} 
      disabled={loading}
      className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all h-9 px-4 rounded-xl font-bold"
    >
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      Sincronizar Datos
    </Button>
  )
}
