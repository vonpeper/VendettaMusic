"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  updateProposalSelectionsAction, 
  saveClientLegalDataAction, 
  acceptProposalAction,
  requestChangesAction,
  LegalData 
} from "@/actions/proposal"
import { toast } from "sonner"
import { Loader2, FileText, CheckCircle2, ChevronRight, RefreshCw, Download } from "lucide-react"

interface ProposalInteractiveProps {
  booking: any
  downloadQuoteUrl: string
  downloadContractUrl: string
}

export function ProposalInteractive({ booking, downloadQuoteUrl, downloadContractUrl }: ProposalInteractiveProps) {
  const [isPending, startTransition] = useTransition()
  const [hasPantalla, setHasPantalla] = useState(booking.hasPantalla || false)
  const [hasTemplete, setHasTemplete] = useState(booking.hasTemplete || false)

  // Datos legales del cliente
  const clientProfile = booking.client || {}
  const [legalData, setLegalData] = useState<LegalData>({
    rfc: clientProfile.rfc || "",
    fiscalAddress: clientProfile.fiscalAddress || "",
    legalRepName: clientProfile.legalRepName || "",
    legalRepRole: clientProfile.legalRepRole || "",
    legalRepPower: clientProfile.legalRepPower || "",
    notificationAddress: clientProfile.notificationAddress || "",
    billingData: clientProfile.billingData || "",
    clientEmail: booking.clientEmail || "",
    clientPhone: booking.clientPhone || ""
  })

  const [savingLegal, setSavingLegal] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [requestingChanges, setRequestingChanges] = useState(false)

  // Precios estáticos para mostrar
  const BASE_VENDETTA = 35000
  const BASE_PRODUCCION = 43770
  const OPTIONAL_PANTALLA = 36250
  const OPTIONAL_TEMPLETE = 18390

  // Recálculo local reactivo para UX instantáneo
  const subtotal = BASE_VENDETTA + BASE_PRODUCCION + (hasPantalla ? OPTIONAL_PANTALLA : 0) + (hasTemplete ? OPTIONAL_TEMPLETE : 0)
  const iva = Math.round(subtotal * 0.16 * 100) / 100
  const total = subtotal + iva
  const anticipo = Math.round(total * 0.50 * 100) / 100

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Manejar cambio de opcionales
  const handleToggle = (type: "pantalla" | "templete", checked: boolean) => {
    const nextPantalla = type === "pantalla" ? checked : hasPantalla
    const nextTemplete = type === "templete" ? checked : hasTemplete

    if (type === "pantalla") setHasPantalla(checked)
    if (type === "templete") setHasTemplete(checked)

    startTransition(async () => {
      const res = await updateProposalSelectionsAction(booking.id, nextPantalla, nextTemplete)
      if (res.success) {
        toast.success("Presupuesto actualizado en servidor")
      } else {
        toast.error(res.error || "Error al actualizar la selección")
        // Revertir estado local
        if (type === "pantalla") setHasPantalla(!checked)
        if (type === "templete") setHasTemplete(!checked)
      }
    })
  }

  // Guardar datos legales
  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLegal(true)
    try {
      const res = await saveClientLegalDataAction(booking.id, legalData)
      if (res.success) {
        toast.success("Datos fiscales y legales guardados")
      } else {
        toast.error(res.error || "Error al guardar datos")
      }
    } catch (err) {
      toast.error("Error al guardar")
    } finally {
      setSavingLegal(false)
    }
  }

  // Aceptar propuesta
  const handleAcceptProposal = async () => {
    setAccepting(true)
    try {
      const res = await acceptProposalAction(booking.id)
      if (res.success) {
        toast.success("¡Propuesta Aceptada con éxito! La versión ha sido bloqueada.")
        window.location.reload()
      } else {
        toast.error(res.error || "Error al aceptar")
      }
    } catch (err) {
      toast.error("Error al procesar")
    } finally {
      setAccepting(false)
    }
  }

  // Solicitar cambios
  const handleRequestChanges = async () => {
    if (!confirm("¿Estás seguro de solicitar cambios? Esto archivará esta versión e incrementará la versión de revisión.")) return
    setRequestingChanges(true)
    try {
      const res = await requestChangesAction(booking.id)
      if (res.success) {
        toast.success("Cambios solicitados. Se ha generado una nueva versión de propuesta.")
        window.location.reload()
      } else {
        toast.error(res.error || "Error al solicitar cambios")
      }
    } catch (err) {
      toast.error("Error al procesar")
    } finally {
      setRequestingChanges(false)
    }
  }

  const isAccepted = booking.status === "agendado" || booking.status === "completado"

  // Validar si los datos legales obligatorios están listos
  const hasIncompleteLegal = !legalData.rfc || !legalData.fiscalAddress || !legalData.legalRepName || !legalData.legalRepRole || !legalData.legalRepPower || !legalData.notificationAddress || !legalData.billingData || !legalData.clientEmail || !legalData.clientPhone

  return (
    <div className="space-y-8">
      {/* Contenedor de Opcionales */}
      <div className="bg-card/50 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-8 shadow-2xl">
        <h3 className="text-lg font-black text-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border/40">
          Servicios Opcionales Disponibles
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Puedes agregar o quitar estos servicios opcionales de la propuesta. El desglose económico se recalculará automáticamente.
        </p>

        <div className="space-y-6">
          {/* Opcional 1: Pantalla LED */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-foreground/[0.02] border border-border/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Pantalla LED 6 × 4 metros</span>
                <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded">Opcional</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Pantalla LED pitch 2.6 mm de 24 metros cuadrados totales con estructura trasera de soporte en truss y placas de acero, procesador de video, laptop de contenidos, dos técnicos de video y montaje/operación completos.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
              <span className="text-sm font-black text-primary">{formatCurrency(OPTIONAL_PANTALLA)} <span className="text-[10px] text-muted-foreground">+ IVA</span></span>
              <Switch 
                checked={hasPantalla}
                onCheckedChange={(checked) => handleToggle("pantalla", checked)}
                disabled={isPending || isAccepted}
              />
            </div>
          </div>

          {/* Opcional 2: Templete */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-foreground/[0.02] border border-border/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Templete de 8 × 6 metros</span>
                <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded">Opcional</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Escenario profesional de 8 x 6 metros, con altura ajustable de 1 o 1.5 metros (sujeta a validación técnica del recinto), dos escaleras laterales de acceso, transporte, montaje y desmontaje.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
              <span className="text-sm font-black text-primary">{formatCurrency(OPTIONAL_TEMPLETE)} <span className="text-[10px] text-muted-foreground">+ IVA</span></span>
              <Switch 
                checked={hasTemplete}
                onCheckedChange={(checked) => handleToggle("templete", checked)}
                disabled={isPending || isAccepted}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Económico Recalculado */}
      <div className="bg-card/50 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-8 shadow-2xl">
        <h3 className="text-lg font-black text-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border/40">
          Resumen Económico Recalculado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border/10">
              <span className="text-muted-foreground">Presentación Artística Vendetta (Obligatorio)</span>
              <span className="font-bold text-foreground">{formatCurrency(BASE_VENDETTA)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/10">
              <span className="text-muted-foreground">Producción Técnica Integral (Obligatorio)</span>
              <span className="font-bold text-foreground">{formatCurrency(BASE_PRODUCCION)}</span>
            </div>
            {hasPantalla && (
              <div className="flex justify-between py-1 border-b border-border/10 text-primary">
                <span>Servicio Adicional: Pantalla LED 6x4m</span>
                <span className="font-bold">{formatCurrency(OPTIONAL_PANTALLA)}</span>
              </div>
            )}
            {hasTemplete && (
              <div className="flex justify-between py-1 border-b border-border/10 text-primary">
                <span>Servicio Adicional: Templete de 8x6m</span>
                <span className="font-bold">{formatCurrency(OPTIONAL_TEMPLETE)}</span>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-foreground/5 border border-border/40 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal Neto:</span>
              <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">IVA Trasladado (16%):</span>
              <span className="font-bold text-foreground">{formatCurrency(iva)}</span>
            </div>
            <div className="pt-3 border-t border-border/20 flex justify-between items-center">
              <span className="text-sm font-black text-foreground uppercase">Inversión Total:</span>
              <span className="text-lg font-black text-foreground">{formatCurrency(total)}</span>
            </div>
            <div className="pt-3 border-t border-border/40 flex justify-between items-center text-primary">
              <span className="text-xs font-black uppercase">Anticipo Requerido (50%):</span>
              <span className="text-base font-black">{formatCurrency(anticipo)}</span>
            </div>
          </div>
        </div>

        {/* Botón de descarga de Cotización en borrador */}
        <div className="flex justify-start mt-6">
          <Button
            asChild
            variant="outline"
            className="border-border/40 hover:bg-foreground/5 text-xs font-black uppercase tracking-widest h-10 gap-2 rounded-xl"
          >
            <a href={downloadQuoteUrl} target="_blank" rel="noreferrer">
              <Download className="w-4 h-4" />
              Descargar Cotización PDF (Borrador)
            </a>
          </Button>
        </div>
      </div>

      {/* Formulario de Información Legal y Fiscal */}
      <div className="bg-card/50 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-8 shadow-2xl">
        <h3 className="text-lg font-black text-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border/40">
          Información Fiscal y Legal del Cliente
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Por favor, completa los siguientes datos legales obligatorios. Son indispensables para poder generar el contrato de prestación de servicios definitivo y habilitar la firma digital.
        </p>

        <form onSubmit={handleSaveLegal} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RFC</Label>
              <Input 
                id="rfc"
                value={legalData.rfc}
                onChange={(e) => setLegalData({ ...legalData, rfc: e.target.value })}
                placeholder="RFC del Colegio"
                required
                className="bg-background border-border/40 h-11 rounded-xl font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalAddress" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domicilio Fiscal</Label>
              <Input 
                id="fiscalAddress"
                value={legalData.fiscalAddress}
                onChange={(e) => setLegalData({ ...legalData, fiscalAddress: e.target.value })}
                placeholder="Dirección fiscal oficial completa"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalRepName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Representante Legal</Label>
              <Input 
                id="legalRepName"
                value={legalData.legalRepName}
                onChange={(e) => setLegalData({ ...legalData, legalRepName: e.target.value })}
                placeholder="Nombre completo"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalRepRole" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo del Representante Legal</Label>
              <Input 
                id="legalRepRole"
                value={legalData.legalRepRole}
                onChange={(e) => setLegalData({ ...legalData, legalRepRole: e.target.value })}
                placeholder="Ej. Presidente / Apoderado Legal"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalRepPower" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instrumento de Facultades</Label>
              <Input 
                id="legalRepPower"
                value={legalData.legalRepPower}
                onChange={(e) => setLegalData({ ...legalData, legalRepPower: e.target.value })}
                placeholder="Ej. Escritura Pública No. 12345"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationAddress" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domicilio para Notificaciones</Label>
              <Input 
                id="notificationAddress"
                value={legalData.notificationAddress}
                onChange={(e) => setLegalData({ ...legalData, notificationAddress: e.target.value })}
                placeholder="Dirección para recibir notificaciones"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Electrónico de Contacto</Label>
              <Input 
                id="clientEmail"
                type="email"
                value={legalData.clientEmail}
                onChange={(e) => setLegalData({ ...legalData, clientEmail: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono de Contacto</Label>
              <Input 
                id="clientPhone"
                value={legalData.clientPhone}
                onChange={(e) => setLegalData({ ...legalData, clientPhone: e.target.value })}
                placeholder="WhatsApp (10 dígitos)"
                required
                className="bg-background border-border/40 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingData" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datos de Facturación</Label>
            <Textarea 
              id="billingData"
              value={legalData.billingData}
              onChange={(e) => setLegalData({ ...legalData, billingData: e.target.value })}
              placeholder="Instrucciones especiales de facturación (CFDI, método de pago, etc.)"
              required
              rows={3}
              className="bg-background border-border/40 rounded-xl"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingLegal}
              className="h-11 px-6 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-widest rounded-xl"
            >
              {savingLegal ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Datos Legales
            </Button>
          </div>
        </form>
      </div>

      {/* Flujo de Aceptación y Firma */}
      <div className="bg-card/50 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-8 shadow-2xl">
        <h3 className="text-lg font-black text-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border/40">
          Aceptación y Bloqueo de Propuesta
        </h3>

        {!isAccepted ? (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al hacer clic en "Aceptar y Bloquear Propuesta", declaras estar conforme con la cotización mostrada y los servicios opcionales seleccionados. Esta propuesta quedará bloqueada contra cualquier cambio directo y se generará el borrador del contrato.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button
                onClick={handleAcceptProposal}
                disabled={accepting}
                className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-900/20 gap-2"
              >
                {accepting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Aceptar y Bloquear Propuesta
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-500">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-sm font-bold uppercase tracking-wide">Propuesta Aprobada Formalmente</div>
                <div className="text-xs opacity-80 mt-0.5">Versión actual: V{booking.quoteVersion} (Bloqueada para cambios directos).</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Para realizar cambios sobre esta versión aprobada de la cotización, haz clic en el botón de abajo. Esto generará una nueva versión histórica y revertirá el estado a borrador para que puedas volver a personalizarla.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                onClick={handleRequestChanges}
                disabled={requestingChanges}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/5 text-xs font-black uppercase tracking-widest h-10 px-5 rounded-xl gap-2 w-full sm:w-auto"
              >
                {requestingChanges ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Solicitar Ajustes / Nueva Versión
                  </>
                )}
              </Button>

              {/* Botón de descarga de Cotización definitiva */}
              <Button
                asChild
                className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 text-xs font-black uppercase tracking-widest h-10 px-5 rounded-xl gap-2 w-full sm:w-auto"
              >
                <a href={downloadQuoteUrl} target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4" />
                  Descargar Cotización (Aceptada)
                </a>
              </Button>
            </div>

            {/* Aviso de firma bloqueada si faltan datos */}
            {hasIncompleteLegal ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500 text-xs">
                ⚠️ **Firma de Contrato Bloqueada:** Por favor, completa todos los campos del formulario de datos fiscales y legales más arriba antes de poder firmar tu contrato definitivo.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
