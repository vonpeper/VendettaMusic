"use client"

import { useState } from "react"
import { Button }   from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function BookingActions({ 
  bookingId, 
  clientName, 
  forceSync = false 
}: { 
  bookingId: string; 
  clientName: string;
  forceSync?: boolean;
}) {
  const [note,    setNote]    = useState("")
  const [loading, setLoading] = useState<"confirm" | "reject" | "sync" | null>(null)
  const [done,    setDone]    = useState(false)
  const router = useRouter()

  async function handleAction(action: "confirm" | "reject" | "sync") {
    const actionToApi = action === "sync" ? "confirm" : action
    setLoading(action)
    try {
      const res  = await fetch("/api/booking", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, action: actionToApi, adminNote: note })
      })
      const json = await res.json()
      if (json.success) {
        setDone(true)
        const msg = action === "sync" ? "Sincronización exitosa" : `Acción ${action === 'confirm' ? 'confirmada' : 'rechazada'} con éxito`
        toast.success(msg)
        router.refresh()
      } else {
        toast.error("Error al procesar la acción")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(null)
    }
  }

  if (done) return (
    <div className="text-xs text-green-400 font-bold flex items-center gap-1.5 p-4 bg-green-900/10 border border-green-500/20 rounded-xl">
      <Check className="w-3.5 h-3.5" /> Acción realizada. Recargando datos...
    </div>
  )

  if (forceSync) {
    return (
      <Button
        onClick={() => handleAction("sync")}
        disabled={loading !== null}
        className="w-full bg-orange-600 hover:bg-orange-500 h-11 gap-2 font-bold rounded-xl"
      >
        {loading === "sync"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Check className="w-4 h-4" />
        }
        Publicar Show en Agenda Ahora
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas Administrativas</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ej: Ya hablé con el cliente por WA, todo listo para el montaje."
          rows={3}
          className="w-full text-sm bg-background border border-border/40 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none transition-all"
        />
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => handleAction("confirm")}
          disabled={loading !== null}
          className="flex-1 bg-green-600 hover:bg-green-500 h-11 gap-2 font-bold rounded-xl"
        >
          {loading === "confirm"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Check className="w-4 h-4" />
          }
          Confirmar y Notificar
        </Button>
        <Button
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          variant="outline"
          className="flex-1 border-red-900/50 text-red-400 hover:bg-red-900/30 h-11 gap-2 font-bold rounded-xl"
        >
          {loading === "reject"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <X className="w-4 h-4" />
          }
          Rechazar
        </Button>
      </div>
    </div>
  )
}
