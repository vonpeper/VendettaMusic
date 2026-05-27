"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Loader2, ExternalLink, Copy, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { sendAutomatedClientWhatsAppAction, sendManualClientThanksAction } from "@/actions/notifications"
import { toWaLink } from "@/lib/phone"

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
  const router = useRouter();
  const [loadingThanks, setLoadingThanks] = useState(false)
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
      console.log("[OFFICIAL NOTIFICATION] payload", { bookingId, isSent })
      const res = await sendAutomatedClientWhatsAppAction(bookingId, isSent)
      console.log("[WHATSAPP RESPONSE]", res)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleThanks = async () => {
    setLoadingThanks(true)
    try {
      const res = await sendManualClientThanksAction(bookingId)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoadingThanks(false)
    }
  }

  const handleCopy = () => {
    if (rawMessage) {
      navigator.clipboard.writeText(rawMessage)
      toast.success("Mensaje copiado al portapapeles")
    }
  }

  const whatsappLink = toWaLink(clientPhone) ?? `https://wa.me/${clientPhone.replace(/\D/g, "")}`

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

      <div className="space-y-3 pt-2">
          {/* Notificación Oficial (Nuevo) */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex flex-col gap-3">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Notificación Oficial</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Envía los detalles (cotización o confirmación) directamente al WhatsApp del cliente.
              </div>
            </div>
            <Button
              variant={isSent ? "outline" : "default"}
              onClick={handleAutomated}
              disabled={loading || loadingThanks}
              className={`w-full transition-all rounded-lg h-10 gap-2 font-bold shadow-sm ${
                isSent ? "border-blue-600/40 text-blue-600 hover:bg-blue-600 hover:text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isSent ? "Reenviar Mensaje Oficial" : "Enviar Mensaje Oficial"}
            </Button>
          </div>
        </div>

        {/* Post Event Thanks Button (Only if Completed) */}
        {bookingStatus === "completado" && (
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 flex flex-col gap-3">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-600">Post-Evento</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Envía mensaje de agradecimiento y petición de testimonio.
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleThanks}
              disabled={loading || loadingThanks}
              className="w-full transition-all rounded-lg h-10 gap-2 font-bold shadow-sm border-purple-600/40 text-purple-600 hover:bg-purple-600 hover:text-white" 
            >
              {loadingThanks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Enviar Agradecimiento
            </Button>
          </div>
        )}
        
        {rawMessage && (
          <Button 
            variant="outline" 
            onClick={handleCopy}
            className="w-full border-orange-500/40 text-orange-500 hover:bg-orange-500 hover:text-white transition-all rounded-lg h-10 gap-2 font-bold shadow-sm" 
            title="Copia el texto de la plantilla para pegarlo manualmente."
          >
            <Copy className="w-4 h-4" />
            Copiar Texto Manual
          </Button>
        )}

        <Button 
          variant="ghost" 
          asChild
          className="w-full text-green-600 hover:bg-green-600/10 hover:text-green-700 transition-all rounded-lg h-10 gap-2 font-bold shadow-none" 
        >
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Abrir Chat en WhatsApp
          </a>
        </Button>
      </div>

  )
}
