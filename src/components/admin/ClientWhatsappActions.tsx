"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Loader2, ExternalLink, Copy, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { sendAutomatedClientWhatsAppAction } from "@/actions/notifications"

export function ClientWhatsappActions({ 
  bookingId, 
  clientPhone,
  notifications = [],
  bookingStatus
}: { 
  bookingId: string
  clientPhone: string 
  notifications?: any[]
  bookingStatus?: string
}) {
  const [loading, setLoading] = useState(false)
  const [rawMessage, setRawMessage] = useState<string | null>(null)

  // Find the last confirmation notification
  const notificationType = (bookingStatus === "agendado" || bookingStatus === "completado") 
      ? "client_confirmed" 
      : "client_quote"

  const lastNotification = notifications
    .filter(n => n.type.toLowerCase() === notificationType)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const isSent = lastNotification?.status === "successful" || lastNotification?.status === "sent"
  const isFailed = lastNotification?.status === "failed"

  const handleAutomated = async () => {
    setLoading(true)
    setRawMessage(null)
    try {
      const res = await sendAutomatedClientWhatsAppAction(bookingId, isSent)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.error)
        if (res.rawMessage) {
          setRawMessage(res.rawMessage)
        }
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (rawMessage) {
      navigator.clipboard.writeText(rawMessage)
      toast.success("Mensaje copiado al portapapeles")
    }
  }

  const cleanPhone = clientPhone.replace(/\D/g, "")
  const whatsappLink = `https://wa.me/52${cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-10)}`

  return (
    <div className="space-y-3 w-full bg-muted/20 p-4 rounded-xl border border-border/40">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Comunicaciones con Cliente</h4>
        {isSent ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md" title={`Enviado el ${new Date(lastNotification.createdAt).toLocaleString('es-MX')}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enviado Oficial
          </span>
        ) : isFailed ? (
           <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            Fallo de Envío
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </span>
        )}
      </div>

      <div className="space-y-2 pt-1">
        <Button 
          variant={isSent ? "outline" : "default"} 
          onClick={handleAutomated}
          disabled={loading}
          className={`w-full transition-all rounded-xl h-11 gap-2 font-black uppercase tracking-widest shadow-sm ${
            isSent ? "border-blue-600/40 text-blue-600 hover:bg-blue-600 hover:text-white" : "bg-blue-600 text-white hover:bg-blue-700"
          }`} 
          title="Envía la notificación oficial configurada en el sistema (Cotización o Confirmación)."
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {isSent ? "Reenviar Confirmación" : "Enviar Confirmación Oficial"}
        </Button>
        
        {rawMessage && (
          <Button 
            variant="outline" 
            onClick={handleCopy}
            className="w-full border-orange-500/40 text-orange-500 hover:bg-orange-500 hover:text-white transition-all rounded-xl h-11 gap-2 font-black uppercase tracking-widest shadow-sm" 
            title="Si el envío falló, copia el texto de la plantilla aquí para pegarlo manualmente."
          >
            <Copy className="w-4 h-4" />
            Copiar Plantilla Manual
          </Button>
        )}

        <Button 
          variant="ghost" 
          asChild
          className="w-full text-green-600 hover:bg-green-600/10 hover:text-green-700 transition-all rounded-xl h-11 gap-2 font-bold shadow-none" 
          title="Abre un chat vacío con el cliente en WhatsApp Web o en la App."
        >
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Abrir Chat en WhatsApp
          </a>
        </Button>
      </div>
    </div>
  )
}
