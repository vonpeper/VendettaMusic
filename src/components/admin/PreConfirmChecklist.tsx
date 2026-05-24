"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle, CheckCircle, MapPin, Phone, Users, FileText } from "lucide-react"

export interface PreConfirmData {
  bookingId: string
  clientName: string
  clientPhone: string
  mapsLink?: string | null
  musiciansCount: number
}

interface PreConfirmChecklistProps {
  data: PreConfirmData
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function PreConfirmChecklist({ data, isOpen, onOpenChange, onConfirm }: PreConfirmChecklistProps) {
  const [loading, setLoading] = useState(false)

  const hasPhone = data.clientPhone && data.clientPhone !== "5500000000" && data.clientPhone !== "0000000000"
  const hasMaps = !!data.mapsLink && data.mapsLink.trim().length > 0
  const hasStaff = data.musiciansCount > 0

  // Hard blockers para generar contrato (según requerimientos)
  const canConfirm = hasPhone && hasMaps

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border/40 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Checklist de Confirmación
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Verificando requisitos para confirmar el evento de <strong className="text-foreground">{data.clientName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${hasPhone ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <Phone className={`w-5 h-5 mt-0.5 ${hasPhone ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className={`text-sm font-bold ${hasPhone ? 'text-green-500' : 'text-red-500'}`}>Teléfono del Cliente</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasPhone ? `Registrado: ${data.clientPhone}` : "Falta número de teléfono válido para enviar notificaciones de WhatsApp."}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-start gap-3 ${hasMaps ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <MapPin className={`w-5 h-5 mt-0.5 ${hasMaps ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className={`text-sm font-bold ${hasMaps ? 'text-green-500' : 'text-red-500'}`}>Ubicación / Google Maps</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasMaps ? "Enlace de Maps registrado." : "Obligatorio para la logística del evento y el contrato."}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-start gap-3 ${hasStaff ? 'bg-blue-600/10 border-blue-600/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            <Users className={`w-5 h-5 mt-0.5 ${hasStaff ? 'text-blue-600' : 'text-yellow-500'}`} />
            <div>
              <p className={`text-sm font-bold ${hasStaff ? 'text-blue-600' : 'text-yellow-500'}`}>Asignación de Staff</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasStaff ? `${data.musiciansCount} miembros del staff asignados.` : "Advertencia: Aún no hay músicos/staff asignados a este evento."}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !canConfirm}
            className={`rounded-xl font-bold gap-2 ${canConfirm ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {canConfirm ? "Confirmar y Generar Contrato" : "Faltan Requisitos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
