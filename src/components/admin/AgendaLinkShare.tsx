"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Calendar, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function AgendaLinkShare() {
  const [copied, setCopied] = useState(false)

  const getUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`
    }
    return `https://vendetta.mx${path}`
  }

  const handleCopy = (path: string) => {
    const url = getUrl(path)
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Enlace copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/20 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-purple-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Acceso Directo Público</span>
        </div>
        <h3 className="text-xl font-heading font-black text-white mb-2">
          Calendario Visual de Agenda (/agenda)
        </h3>
        <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6">
          Los músicos, técnicos, clientes y colaboradores pueden acceder directamente a este enlace sin necesidad de usuario ni contraseña para revisar las fechas confirmadas, horarios y locaciones de la banda.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Link Card */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">
                Enlace Principal
              </div>
              <code className="text-sm font-black text-primary font-mono block truncate">
                /agenda
              </code>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy("/agenda")}
                className="flex-1 border-white/10 hover:bg-white/10 text-xs font-bold gap-1.5 h-9"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "¡Copiado!" : "Copiar Enlace"}
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 h-9 px-3"
              >
                <a href="/agenda" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir
                </a>
              </Button>
            </div>
          </div>

          {/* Alias Fechas Card */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">
                Enlace Corto Alternativo
              </div>
              <code className="text-sm font-black text-purple-400 font-mono block truncate">
                /fechas
              </code>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy("/fechas")}
                className="flex-1 border-white/10 hover:bg-white/10 text-xs font-bold gap-1.5 h-9"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Enlace
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold gap-1.5 h-9 px-3"
              >
                <a href="/fechas" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Broadcast Push Reminder Card */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              🔔 Notificaciones Push a Músicos
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Envía un recordatorio push a todos los dispositivos que hayan activado las notificaciones en la agenda.
            </p>
          </div>

          <Button
            size="sm"
            onClick={async () => {
              const { sendTodayShowReminderAction } = await import("@/actions/push")
              const res = await sendTodayShowReminderAction()
              if (res.success) {
                toast.success(res.message)
              } else {
                toast.error(res.message)
              }
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 h-9 px-4 rounded-xl shadow-md cursor-pointer"
          >
            Enviar Recordatorio Ahora
          </Button>
        </div>
      </div>
    </div>
  )
}
