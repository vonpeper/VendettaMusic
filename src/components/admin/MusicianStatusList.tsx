"use client"

import { CheckCircle2, Clock, XCircle, User, Music } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MusicianStatus {
  id: string
  status: string
  musician: {
    instrument: string | null
    user: {
      name: string | null
    }
  }
}

export function MusicianStatusList({ musicians }: { musicians: any[] }) {
  if (!musicians || musicians.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground italic text-sm">
        No hay músicos asignados a este evento.
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado"
      case "rejected":
        return "Rechazado"
      default:
        return "Pendiente"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  return (
    <div className="space-y-3">
      {musicians.map((m: any) => (
        <div 
          key={m.id} 
          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                {m.musician?.user?.name || "Músico"}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Music className="w-3 h-3" /> {m.musician?.instrument || "Instrumento no especificado"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter ${getStatusColor(m.status)}`}>
              {getStatusIcon(m.status)}
              <span className="ml-1.5">{getStatusLabel(m.status)}</span>
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
