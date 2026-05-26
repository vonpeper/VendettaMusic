
"use client"

import React, { useState } from "react"
import { SignaturePad } from "@/components/admin/SignaturePad"
import { signContractAction } from "@/actions/signatures"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileText, ShieldCheck, Clock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface ContractSignerProps {
  bookingId: string
  clientName: string
  shortId: string
  isSigned: boolean
  signedAt?: Date | null
  clientSignature?: string | null
  adminSignature?: string | null
  contractLegalText?: string
  // New props for variables
  eventDate?: Date | string
  eventTime?: string
  eventAmount?: number
  packageName?: string
  eventAddress?: string
}

export function ContractSigner({ 
  bookingId, 
  clientName, 
  shortId, 
  isSigned, 
  signedAt,
  clientSignature,
  adminSignature,
  contractLegalText,
  eventDate,
  eventTime,
  eventAmount,
  packageName,
  eventAddress
}: ContractSignerProps) {
  const [loading, setLoading] = useState(false)
  const [showPad, setShowPad] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const defaultClauses = `PRIMERA.- DECLARA Y ACEPTA "{{cliente}}" Conocer el trabajo que desempeña “VENDETTA” y estar de acuerdo en su modalidad de “BANDA DE ROCK DE COVERS EN INGLES Y ESPAÑOL”

SEGUNDA.- DECLARA “VENDETTA” tener la capacidad y experiencia necesaria en términos musicales para cumplir con el compromiso motivo de este contrato de forma profesional.

TERCERA.- “VENDETTA” se compromete a tocar en el evento que se efectuará el día {{fecha}} en {{ubicación}}.

CUARTA.- La actuación de “VENDETTA” será efectuada en el siguiente programa: {{horario}} HRS.

QUINTA.- Por esta actuación "{{cliente}}" se compromete a pagar a “VENDETTA” la cantidad de: {{monto}} por concepto de la actuación. La liquidación se realizará en efectivo el día del evento en el momento en el que “VENDETTA” llegue a la dirección mencionada en la tercera cláusula.

SEXTA.- En caso de alternar con otro grupo, si dicho grupo no respeta el horario establecido y ocupara más tiempo del establecido, “VENDETTA” no repondrá dicho tiempo y será sujeto a cumplir dentro del horario estipulado.

SÉPTIMA.- "{{cliente}}" se compromete a poner a la disposición de “VENDETTA” un espacio con servicio para sus descansos y contar con el espacio adecuado para la instalación del equipo con dos tomas de corriente de 110 V a un máximo 10 metros de distancia.

OCTAVA.- "{{cliente}}" se compromete a proporcionar a “VENDETTA” bebidas hidratantes durante el desarrollo del evento.

NOVENA.- “VENDETTA” asegura presentarse en tiempo y forma con vestimenta, limpieza y respeto para el cumplimiento del evento.

DÉCIMA.- "{{cliente}}" se obliga a proporcionar a “VENDETTA” las condiciones adecuadas para la correcta, cómoda y segura ejecución del servicio.

DÉCIMA PRIMERA.- Si por algún motivo el evento no se realizara por causas imputables a "{{cliente}}", éste mismo se compromete a pagar a “VENDETTA” el 50% del costo total de la presentación por concepto de indemnización.

DÉCIMA SEGUNDA.- Las partes están de acuerdo en que una vez terminada la actuación de “VENDETTA” y si fuese necesario seguir tocando por tiempo extra, el precio por este será de $3,500.00 MN por TURNO EXTRA.

DÉCIMA TERCERA.- "{{cliente}}" hace constar bajo protesta de decir verdad que la información es verídica, comprometiéndose a resarcir los daños por una falsa declaración.

DÉCIMA CUARTA.- Para la interpretación de este contrato las partes se someten a la jurisdicción de Toluca, Estado de México.

DÉCIMA QUINTA.- “VENDETTA” podrá interrumpir la presentación en el caso específico donde alguno de sus miembros sea molestado con motivo sexual, racial, de clase, género o violencia verbal o física.

DÉCIMA SEXTA.- "{{cliente}}" acepta que la propuesta de equipo de audio no puede ser modificada en el momento del evento sin previo aviso.

DÉCIMA SÉPTIMA.- LOGÍSTICA EXTENDIDA Y SERVICIOS FORÁNEOS: Se considerarán cargos extra o necesidad de hospedaje si los traslados o la logística superan los tiempos estándar de operación.`

  const processedLegalText = React.useMemo(() => {
    const rawText = contractLegalText || defaultClauses
    
    let text = rawText
    const replacements: Record<string, string> = {
      "{{cliente}}": clientName,
      "{{horario}}": eventTime || "Por confirmar",
      "{{monto}}": eventAmount ? formatCurrency(eventAmount) : "Por confirmar",
      "{{paquete}}": packageName || "Por confirmar",
      "{{dirección}}": eventAddress || "Por confirmar",
      "{{ubicación}}": eventAddress || "Por confirmar",
      "{{fecha}}": eventDate ? new Date(eventDate).toLocaleDateString("es-MX", { day: 'numeric', month: 'long', year: 'numeric' }) : "Por confirmar"
    }

    Object.entries(replacements).forEach(([key, value]) => {
      text = text.split(key).join(value)
    })

    return text
  }, [contractLegalText, clientName, eventTime, eventAmount, packageName, eventAddress, eventDate])

  const handleSign = async (base64: string) => {
    setLoading(true)
    try {
      const res = await signContractAction(bookingId, base64)
      if (res.success) {
        toast.success("¡Contrato firmado con éxito!")
        window.location.reload()
      } else {
        toast.error(res.error || "Error al firmar")
      }
    } catch (e) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

    if (isSigned) {
    return (
      <div className="bg-card/40 border border-border/40 rounded-[2rem] overflow-hidden">
        <div className="p-6 bg-green-500/10 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Contrato Firmado Digitalmente</h3>
          </div>
          <div className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Legalmente Vinculante</div>
        </div>
        
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Firma Cliente */}
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">Firma del Cliente: {clientName}</div>
                 <div className="bg-foreground/5 rounded-2xl p-4 flex items-center justify-center min-h-[120px]">
                    {clientSignature ? (
                      <img src={clientSignature} alt="Firma Cliente" className="max-h-24 invert opacity-80" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Verificado Administrativamente</span>
                      </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase italic">
                    <Clock className="w-3 h-3" /> Firmado el {signedAt ? new Date(signedAt).toLocaleString() : "N/A"}
                 </div>
              </div>

              {/* Firma Vendetta */}
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border/40 pb-2">Firma Vendetta Live Music</div>
                 <div className="bg-foreground/5 rounded-2xl p-4 flex items-center justify-center min-h-[120px]">
                    {adminSignature ? (
                      <img src={adminSignature} alt="Firma Vendetta" className="max-h-24 invert opacity-80" />
                    ) : (
                      <div className="text-[10px] text-muted-foreground italic">Sello Digital Corporativo</div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-[9px] text-primary font-black uppercase">
                    <CheckCircle2 className="w-3 h-3" /> Verificado por Vendetta
                 </div>
              </div>
           </div>

           <div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/40 space-y-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic">
                Este documento constituye un acuerdo legal entre las partes. La firma digital ha sido verificada mediante IP y sello de tiempo.
              </p>
              
              <div className="flex justify-center pt-2">
                <Button 
                  asChild
                  className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl transition-all gap-2"
                >
                  <a href={`/api/admin/contract/${bookingId}`} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4" />
                    Descargar Contrato PDF
                  </a>
                </Button>
              </div>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/40 border border-border/40 rounded-[2rem] overflow-hidden">
       <div className="p-6 border-b border-border/40 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Formalización de Contrato</h3>
       </div>

       <div className="p-8 space-y-6">
          <div className="space-y-2">
             <p className="text-sm text-muted-foreground leading-relaxed">
               Hola <span className="text-foreground font-bold">{clientName}</span>, para finalizar el proceso de reserva, es necesario que leas y firmes digitalmente el contrato de prestación de servicios musicales.
             </p>
             <p className="text-xs text-muted-foreground italic">
               Al firmar, aceptas los términos y condiciones de Vendetta para tu evento el próximo día.
             </p>
          </div>

          {!showPad ? (
            <Button 
              onClick={() => setShowPad(true)}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20"
            >
              Leer y Firmar Contrato
            </Button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-4 rounded-xl bg-foreground/5 border border-border/40 max-h-[60vh] overflow-y-auto text-[11px] text-muted-foreground space-y-3 leading-relaxed">
                  {processedLegalText.split("\n").filter(p => p.trim()).map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
               </div>
               
               <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Traza tu firma aquí</Label>
                  <SignaturePad onSave={handleSign} placeholder="Firma del cliente" />
               </div>

               <Button 
                variant="ghost" 
                onClick={() => setShowPad(false)}
                className="w-full text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase"
               >
                Cancelar
               </Button>
            </div>
          )}
       </div>
    </div>
  )
}
