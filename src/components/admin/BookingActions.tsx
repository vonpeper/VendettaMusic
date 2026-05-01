"use client"

import { useState } from "react"
import { Button }   from "@/components/ui/button"
import { Check, X, Loader2, Users, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function BookingActions({ 
  bookingId, 
  clientName, 
  musicians = [],
  forceSync = false 
}: { 
  bookingId: string; 
  clientName: string;
  musicians?: any[];
  forceSync?: boolean;
}) {
  const [note,    setNote]    = useState("")
  const [loading, setLoading] = useState<"confirm" | "reject" | "sync" | null>(null)
  const [done,    setDone]    = useState(false)
  const [selectedMusicians, setSelectedMusicians] = useState<string[]>(
    musicians
      .filter(m => !["Ingeniero de Audio", "Técnico", "Staff", "Proveedor"].includes(m.instrument || ""))
      .map(m => m.id)
  )
  const router = useRouter()

  const toggleMusician = (id: string) => {
    setSelectedMusicians(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    )
  }

  async function handleAction(action: "confirm" | "reject" | "sync") {
    const actionToApi = action === "sync" ? "confirm" : action
    setLoading(action)
    try {
      const res  = await fetch("/api/booking", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ 
          bookingId, 
          action: actionToApi, 
          adminNote: note,
          musicianIds: action === "confirm" ? selectedMusicians : undefined
        })
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
    <div className="text-xs text-green-700 font-bold flex items-center gap-1.5 p-4 bg-green-900/10 border border-green-500/20 rounded-xl">
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
      <div className="space-y-3 pb-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3 h-3" /> Convocar Músicos (WhatsApp)
          </label>
          <span className="text-[10px] font-bold text-primary">{selectedMusicians.length} Seleccionados</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-hide">
          {musicians.map(m => {
            const isSelected = selectedMusicians.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMusician(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                  isSelected 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-background border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
                )}
              >
                {m.name.split(' ')[0]} 
                <span className="opacity-50 font-normal">({m.instrument || 'Músico'})</span>
                {isSelected && <Check className="w-2.5 h-2.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas Administrativas</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ej: Ya hablé con el cliente por WA, todo listo para el montaje."
          rows={3}
          className="w-full text-sm bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none transition-all"
        />
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => handleAction("confirm")}
          disabled={loading !== null}
          className="flex-1 bg-green-600 hover:bg-green-500 h-11 gap-2 font-bold rounded-xl text-white uppercase text-[10px] tracking-widest"
        >
          {loading === "confirm"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Check className="w-4 h-4" />
          }
          Confirmar
        </Button>
        <Button
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          variant="outline"
          className="flex-1 border-red-900/50 text-red-500 hover:bg-red-900/30 h-11 gap-2 font-bold rounded-xl uppercase text-[10px] tracking-widest"
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
