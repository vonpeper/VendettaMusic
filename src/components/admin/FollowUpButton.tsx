"use client"

import { useState } from "react"
import { MessageCircle, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { sendAutoFollowUpAction } from "@/actions/ventas"

interface FollowUpButtonProps {
  id: string
  type: "booking" | "quote"
  phone: string
  clientName: string
  currentCount: number
  template?: string
}

export function FollowUpButton({ id, type, phone, clientName, currentCount, template }: FollowUpButtonProps) {
  const [loadingAuto, setLoadingAuto] = useState(false)
  const [loadingManual, setLoadingManual] = useState(false)
  const router = useRouter()

  const handleAutoFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLoadingAuto(true)
    try {
      const res = await sendAutoFollowUpAction(id, type, phone, clientName)
      if (res.success) {
        toast.success("Mensaje automático enviado")
        router.refresh()
      } else {
        toast.error(res.error || "Error al enviar mensaje")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoadingAuto(false)
    }
  }

  const handleManualFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLoadingManual(true)
    try {
      const res = await fetch("/api/admin/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type })
      })

      if (!res.ok) throw new Error("Fallo al actualizar el contador")

      const defaultTemplate = `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla? Seguimos a tus órdenes para apartar la fecha.`
      const rawMessage = template || defaultTemplate
      
      const firstName = clientName.split(" ")[0]
      const formattedMessage = rawMessage
        .replace(/{{clientName}}/g, firstName)
        .replace(/{{followUpCount}}/g, String(currentCount + 1))

      const message = encodeURIComponent(formattedMessage)
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`
      window.open(whatsappUrl, "_blank")

      toast.success("Seguimiento registrado")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Error al registrar el seguimiento")
    } finally {
      setLoadingManual(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handleAutoFollowUp}
        disabled={loadingAuto || loadingManual}
        className="h-8 w-8 rounded-full border-blue-500/20 hover:bg-blue-500/10 text-blue-600 relative group shrink-0"
        title="Enviar seguimiento automático (API)"
      >
        {loadingAuto ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5 fill-blue-600/10" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleManualFollowUp}
        disabled={loadingManual || loadingAuto}
        className="h-8 w-8 rounded-full border-green-500/20 hover:bg-green-500/10 text-green-600 relative group shrink-0"
        title={`Chatear con el cliente - Seguimiento #${currentCount + 1}`}
      >
        {loadingManual ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4 fill-green-600/10" />
        )}
        {currentCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white shadow-sm ring-1 ring-green-600/20">
            {currentCount}
          </span>
        )}
      </Button>
    </div>
  )
}
