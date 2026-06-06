"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { syncAllEventsAction } from "@/actions/config"

export function GoogleSyncAllButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    try {
      const res = await syncAllEventsAction()
      if (res && 'success' in res) {
        if (res.success) {
          toast.success(res.message)
        } else {
          toast.error(res.message)
        }
      } else {
        toast.error("Error al sincronizar eventos")
      }
    } catch (err: any) {
      toast.error("Error al iniciar la sincronización masiva")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      type="button"
      onClick={handleSync}
      disabled={loading}
      variant="outline" 
      className="w-full border-blue-500/35 hover:bg-blue-500/10 text-blue-400 group h-12 font-bold"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
      )}
      Sincronizar Todos los Eventos Existentes
    </Button>
  )
}
