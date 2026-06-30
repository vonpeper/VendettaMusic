"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Copy, FileText, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react"
import { reportDepositAction } from "@/actions/ventas"
import { toast } from "sonner"

interface QuoteApprovalFormProps {
  bookingId: string
  depositAmount: number
  totalAmount: number
  paymentStatus: string
  paymentRef: string | null
  bankName: string | null
  bankAccount: string | null
  bankClabe: string | null
  bankBeneficiary: string | null
}

export function QuoteApprovalForm({
  bookingId,
  depositAmount,
  totalAmount,
  paymentStatus,
  paymentRef,
  bankName,
  bankAccount,
  bankClabe,
  bankBeneficiary
}: QuoteApprovalFormProps) {
  const [loading, setLoading] = useState(false)
  const [refInput, setRefInput] = useState("")
  const [copiedClabe, setCopiedClabe] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleCopy = (text: string, type: "clabe" | "account") => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === "clabe") {
      setCopiedClabe(true)
      setTimeout(() => setCopiedClabe(false), 2000)
    } else {
      setCopiedAccount(true)
      setTimeout(() => setCopiedAccount(false), 2000)
    }
    toast.success("Copiado al portapapeles")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refInput.trim()) {
      toast.error("Por favor ingresa la referencia o nombre del titular.")
      return
    }

    setLoading(true)
    try {
      const res = await reportDepositAction(bookingId, refInput.trim())
      if (res.success) {
        toast.success("¡Cotización aprobada y reporte enviado!")
        window.location.reload()
      } else {
        toast.error(res.error || "Error al enviar la aprobación")
      }
    } catch (err) {
      toast.error("Error de conexión al procesar la aprobación")
    } finally {
      setLoading(false)
    }
  }

  const isReview = paymentStatus === "review" || paymentStatus === "revisar"

  if (isReview) {
    return (
      <div className="bg-card/40 border border-blue-600/30 rounded-[2rem] overflow-hidden shadow-xl shadow-blue-900/5">
        <div className="p-6 bg-blue-600/10 border-b border-border/40 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Aprobación de Cotización</h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <h4 className="text-base font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              👍 ¡Aprobación Registrada!
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu cotización ha sido aprobada y estamos verificando tu pago del anticipo de{" "}
              <span className="text-primary font-black">{formatCurrency(depositAmount)}</span>.
            </p>
            {paymentRef && (
              <div className="p-3 bg-foreground/5 border border-border/40 rounded-xl text-xs font-mono">
                <span className="text-muted-foreground block text-[9px] uppercase tracking-widest font-sans font-bold mb-1">Referencia Reportada:</span>
                <span className="text-foreground font-bold break-all">{paymentRef}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground italic">
              Una vez validado el depósito en banco por la administración, tu fecha quedará bloqueada de inmediato en nuestra agenda y tu contrato digital estará disponible para ser firmado desde esta misma página.
            </p>
          </div>

          <div className="pt-4 border-t border-border/20 space-y-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Datos de Transferencia para Referencia:</span>
            <div className="p-4 rounded-2xl bg-foreground/5 border border-border/40 space-y-2 text-xs">
              <div><span className="text-muted-foreground">Beneficiario:</span> <span className="font-bold text-foreground">{bankBeneficiary || "Vendetta Live Music"}</span></div>
              <div><span className="text-muted-foreground">Banco:</span> <span className="font-bold text-foreground">{bankName || "Bancomer"}</span></div>
              {bankAccount && (
                <div className="flex items-center justify-between">
                  <div><span className="text-muted-foreground">Cuenta:</span> <span className="font-mono font-bold text-foreground">{bankAccount}</span></div>
                </div>
              )}
              {bankClabe && (
                <div className="flex items-center justify-between">
                  <div><span className="text-muted-foreground">CLABE:</span> <span className="font-mono font-bold text-foreground">{bankClabe}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/40 border border-border/40 rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-border/40 flex items-center gap-3">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Aprobar y Confirmar Reserva</h3>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para aprobar formalmente esta propuesta y apartar la fecha de tu evento en nuestra agenda, es necesario realizar el pago del anticipo del {totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 40}% ({formatCurrency(depositAmount)}) y reportarlo a continuación:
          </p>
        </div>

        {/* Datos Bancarios */}
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
          <div className="pb-3 border-b border-border/30 flex justify-between items-center">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Monto del Anticipo:</span>
            <span className="text-lg font-black text-primary">{formatCurrency(depositAmount)}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Beneficiario:</span>
              <span className="font-bold text-foreground text-right">{bankBeneficiary || "Diego Armando Fabela Peñaloza"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Banco:</span>
              <span className="font-bold text-foreground text-right">{bankName || "BBVA"}</span>
            </div>

            {bankAccount && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Cuenta:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{bankAccount}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccount, "account")}
                    className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                    title="Copiar Cuenta"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {bankClabe && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">CLABE Interbancaria:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{bankClabe}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankClabe, "clabe")}
                    className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                    title="Copiar CLABE"
                  >
                    {copiedClabe ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Aprobación */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentRef" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Nombre de quien transfiere / Folio o Referencia del Pago
            </Label>
            <Input
              id="paymentRef"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="Ej. Juan Pérez - BBVA 12345"
              required
              disabled={loading}
              className="bg-background border-border/40 h-11 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-primary/20 gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Confirmar y Enviar Aprobación
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
