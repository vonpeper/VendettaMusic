"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { FileText, Loader2, Send, CheckCircle2 } from "lucide-react"
import { notifyAccountantInvoiceAction, getAccountantConfigAction } from "@/actions/accountant"
import { toast } from "sonner"

interface NotifyAccountantButtonProps {
  eventId: string
  clientName: string
  baseAmount?: number
  venueOrTitle?: string
  variant?: "icon" | "dropdown-item" | "button"
  className?: string
}

export function NotifyAccountantButton({
  eventId,
  clientName,
  baseAmount = 0,
  venueOrTitle = "Show Vendetta",
  variant = "button",
  className = "",
}: NotifyAccountantButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [isLoadingPhone, setIsLoadingPhone] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoadingPhone(true)
      getAccountantConfigAction()
        .then((res) => {
          if (res.phone) setPhone(res.phone)
        })
        .finally(() => setIsLoadingPhone(false))
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Ingresa un número de WhatsApp válido (10 dígitos)")
      return
    }

    setIsSending(true)
    try {
      const res = await notifyAccountantInvoiceAction(eventId, phone)
      if (res.success) {
        toast.success(res.message || "¡Solicitud enviada a Rodo!")
        setIsOpen(false)
      } else {
        toast.error(res.error || "No se pudo enviar la notificación")
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al comunicarse con el servidor")
    } finally {
      setIsSending(false)
    }
  }

  const MXN = (v: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }).format(v)

  const previewMessage = `Hola Rodo, espero estés bien, este es un mensaje automático. Es para solicitar una factura para el cliente ${clientName.toUpperCase()}

Monto antes de IVA: ${MXN(baseAmount)}
Concepto: Happening ${venueOrTitle}`

  return (
    <>
      {variant === "dropdown-item" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted rounded-md cursor-pointer ${className}`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span>Solicitar Factura a Contador</span>
        </button>
      ) : variant === "icon" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`h-8 w-8 p-0 rounded-lg text-amber-500 border-amber-500/30 hover:bg-amber-500/10 ${className}`}
          title="Solicitar Factura al Contador"
        >
          <FileText className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`gap-1.5 text-xs font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-xl ${className}`}
        >
          <FileText className="w-3.5 h-3.5" />
          Factura Contador
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="w-5 h-5 text-amber-500" />
              Solicitar Factura a Rodo (Contador)
            </DialogTitle>
            <DialogDescription>
              Se enviará una notificación automática por WhatsApp para solicitar la factura con los datos de este evento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                WhatsApp de Rodo (Contador)
              </Label>
              <div className="relative mt-1">
                <Input
                  placeholder="Ej. 5512345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoadingPhone || isSending}
                  className="font-mono text-sm"
                />
                {isLoadingPhone && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                El número ingresado se guardará en la configuración para futuros envíos.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vista previa del mensaje a enviar
              </span>
              <pre className="text-xs whitespace-pre-wrap font-sans text-foreground leading-relaxed bg-background/80 p-3 rounded-lg border border-border/30">
                {previewMessage}
              </pre>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || isLoadingPhone}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-bold"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando WhatsApp...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar a Rodo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
