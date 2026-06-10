"use client"

import { useState } from "react"
import { EventForm } from "@/components/admin/EventForm"
import { notifyEventAction, deleteEventAction } from "@/actions/events"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Edit2, Trash2, AlertCircle, Plus } from "lucide-react"

export function NuevoEventoButton({ clients, locations, packages, staff, allMusicians = [], variant = "big" }: {
  clients: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number }[]
  staff: { id: string; name: string }[]
  allMusicians?: any[]
  variant?: "big" | "compact"
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && (
        <EventForm
          onClose={() => setShowForm(false)}
          clients={clients}
          locations={locations}
          packages={packages}
          staff={staff}
          allMusicians={allMusicians}
        />
      )}
      {variant === "big" ? (
        <Button 
          onClick={() => setShowForm(true)} 
          className="w-full h-14 justify-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <div className="text-left">
            <div className="text-sm font-bold">Nuevo Evento</div>
            <div className="text-[10px] text-white/70 uppercase tracking-tight">Manual / Admin</div>
          </div>
        </Button>
      ) : (
        <Button 
          onClick={() => setShowForm(true)} 
          className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 px-6 rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </Button>
      )}
    </>
  )
}

export function EditEventoButton({ eventId, initialData, clients, locations, packages, staff, allMusicians = [], showText, className, variant, label }: {
  eventId: string
  initialData: any
  clients: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  packages: { id: string; name: string; baseCostPerHour: number; minDuration: number }[]
  staff: { id: string; name: string }[]
  allMusicians?: any[]
  showText?: boolean
  className?: string
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost"
  label?: string
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && (
        <EventForm
          onClose={() => setShowForm(false)}
          clients={clients}
          locations={locations}
          packages={packages}
          staff={staff}
          allMusicians={allMusicians}
          initialData={initialData}
        />
      )}
      <Button 
        variant={variant || "ghost"} 
        size={showText ? "sm" : "icon"} 
        onClick={() => setShowForm(true)}
        className={className || `${showText ? "px-3 gap-2" : "h-8 w-8"} text-muted-foreground hover:text-primary hover:bg-primary/10`}
        title="Editar evento"
      >
        <Edit2 className="w-3.5 h-3.5" />
        {showText && <span>{label || "Editar"}</span>}
      </Button>
    </>
  )
}

export function DeleteEventoButton({ eventId, showText }: { eventId: string; showText?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteEventAction(eventId)
    if (!result.success) {
      alert(result.error)
      setConfirm(false)
    }
    setLoading(false)
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={loading}
          className="h-7 text-[10px] font-bold text-white"
        >
          {loading ? "..." : "Confirmar"}
        </Button>
        <button 
          onClick={() => setConfirm(false)}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase font-bold"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size={showText ? "sm" : "icon"} 
      onClick={() => setConfirm(true)}
      className={`${showText ? "px-3 gap-2" : "h-8 w-8"} text-destructive/60 hover:text-destructive hover:bg-destructive/10`}
      title="Eliminar evento"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {showText && <span>Eliminar</span>}
    </Button>
  )
}

export function NotifyEventButton({ eventId, alreadySent }: { eventId: string; alreadySent: boolean }) {
  const [sent, setSent] = useState(alreadySent)
  const [loading, setLoading] = useState(false)

  async function handleNotify() {
    setLoading(true)
    const result = await notifyEventAction(eventId)
    if (result.success) setSent(true)
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleNotify}
      disabled={loading}
      className={`h-7 w-7 ${sent ? "text-green-700 hover:text-green-300" : "hover:text-primary hover:bg-primary/10"}`}
      title={sent ? "Músicos notificados" : "Enviar aviso a músicos"}
    >
      {sent ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
    </Button>
  )
}
