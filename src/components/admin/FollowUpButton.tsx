"use client"

import { useState } from "react"
import { MessageCircle, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getValidWhatsappPhone } from "@/lib/phone"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { sendAutoFollowUpAction } from "@/actions/ventas"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface FollowUpButtonProps {
  id: string
  type: "booking" | "quote"
  phone: string
  clientName: string
  currentCount: number
  template?: string
  variant?: "default" | "dropdown"
}

export function FollowUpButton({ id, type, phone, clientName, currentCount, template, variant = "default" }: FollowUpButtonProps) {
  const [loadingAuto, setLoadingAuto] = useState(false)
  const [loadingManual, setLoadingManual] = useState(false)
  const router = useRouter()

  const handleAutoFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const validPhone = getValidWhatsappPhone(phone);
    if (!validPhone) {
      toast.error("El teléfono del cliente no es válido o está vacío. Revisa el número en el detalle de la venta.");
      return;
    }

    setLoadingAuto(true)
    try {
      const res = await sendAutoFollowUpAction(id, type, phone, clientName)
      if (res.success) {
        toast.success("Mensaje automático enviado")
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

    const validPhone = getValidWhatsappPhone(phone);
    if (!validPhone) {
      toast.error("El teléfono del cliente no es válido o está vacío. Revisa el número en el detalle de la venta.");
      return;
    }

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
      const whatsappUrl = `https://wa.me/${validPhone}?text=${message}`
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

  if (variant === "dropdown") {
    const hasPhone = Boolean(getValidWhatsappPhone(phone))
    
    return (
      <>
        <DropdownMenuItem 
          className={`gap-3 cursor-pointer rounded-lg focus:bg-primary/10 py-2.5 ${!hasPhone ? 'opacity-50 grayscale' : ''}`}
          onClick={handleAutoFollowUp}
          disabled={loadingAuto || loadingManual}
        >
          {loadingAuto ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Zap className="w-4 h-4 text-primary" />}
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Seguimiento Automático (Zap)</span>
            <span className="text-[9px] text-muted-foreground">
              {hasPhone ? "Envía recordatorio rápido via API" : "⚠️ Sin número de contacto registrado"}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className={`gap-3 cursor-pointer rounded-lg focus:bg-green-500/10 py-2.5 ${!hasPhone ? 'opacity-50 grayscale' : ''}`}
          onClick={handleManualFollowUp}
          disabled={loadingManual || loadingAuto}
        >
          {loadingManual ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <MessageCircle className="w-4 h-4 text-green-600" />}
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Chat Directo (WhatsApp)</span>
            <span className="text-[9px] text-muted-foreground">
              {hasPhone ? `Abrir WhatsApp con mensaje pre-llenado (#${currentCount + 1})` : "⚠️ No se puede abrir el chat"}
            </span>
          </div>
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handleAutoFollowUp}
        disabled={loadingAuto || loadingManual}
        className="h-8 w-8 rounded-full border-primary/20 hover:bg-primary/10 text-primary relative group shrink-0"
        title="Enviar seguimiento automático (API)"
      >
        {loadingAuto ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5 fill-primary/10" />
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
