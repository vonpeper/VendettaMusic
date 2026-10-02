
"use client"

import React, { useState, useRef } from "react"
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
  eventEndTime?: string
  eventAmount?: number
  packageName?: string
  eventAddress?: string
  downloadContractUrl?: string
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
  eventEndTime,
  eventAmount,
  packageName,
  eventAddress,
  downloadContractUrl
}: ContractSignerProps) {
  const [loading, setLoading] = useState(false)
  const [showPad, setShowPad] = useState(false)
  const isSubmitting = useRef(false)

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
      "{{horario}}": eventTime && eventEndTime ? `${eventTime} A ${eventEndTime}` : (eventTime || "Por confirmar"),
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
  }, [contractLegalText, clientName, eventTime, eventEndTime, eventAmount, packageName, eventAddress, eventDate])

  const handleSign = async (base64: string) => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    setLoading(true)
    try {
      const res = await signContractAction(bookingId, base64)
      if (res.success) {
        toast.success("¡Contrato firmado con éxito!")
        window.location.reload()
      } else {
        toast.error(res.error || "Error al firmar")
        isSubmitting.current = false
        setLoading(false)
      }
    } catch (e) {
      toast.error("Error de conexión")
      isSubmitting.current = false
      setLoading(false)
    }
  }

  if (isSigned) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 bg-emerald-50 border-b-2 border-emerald-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Contrato Firmado Digitalmente
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Acuerdo formal de prestación de servicios</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Legalmente Vinculante
          </span>
        </div>
        
        <div className="p-6 sm:p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Firma Cliente */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                 <div className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                   Firma del Cliente: {clientName}
                 </div>
                 <div className="bg-white rounded-xl p-4 flex items-center justify-center min-h-[120px] border border-slate-200">
                    {clientSignature ? (
                      <img src={clientSignature} alt="Firma Cliente" className="max-h-24 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Verificado Digitalmente
                        </span>
                      </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                    Firmado el {signedAt ? new Date(signedAt).toLocaleString("es-MX") : "N/A"}
                 </div>
              </div>

              {/* Firma Vendetta */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                 <div className="text-xs font-black text-red-600 uppercase tracking-wider border-b border-slate-200 pb-2">
                   Firma Vendetta Live Music
                 </div>
                 <div className="bg-white rounded-xl p-4 flex items-center justify-center min-h-[120px] border border-slate-200">
                    {adminSignature ? (
                      <img src={adminSignature} alt="Firma Vendetta" className="max-h-24 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Sello Digital Corporativo
                        </span>
                      </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-red-600 font-black uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado por Vendetta
                 </div>
              </div>
           </div>

           <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed text-center font-medium">
                Este documento constituye un acuerdo legal vinculante entre las partes. La firma digital ha sido registrada y respaldada con sello de tiempo e IP.
              </p>
              
              <div className="flex justify-center pt-1">
                <Button 
                  asChild
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider h-11 px-6 rounded-xl shadow-md transition-all gap-2"
                >
                  <a href={downloadContractUrl || `/api/admin/contract/${bookingId}?t=${Date.now()}`} target="_blank" rel="noreferrer">
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
    <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
       <div className="p-5 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
            <FileText className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Formalización de Contrato</h3>
            <p className="text-xs text-slate-500 font-medium">Revisa las cláusulas y firma digitalmente para asegurar el evento</p>
          </div>
       </div>

       <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
             <p className="text-sm text-slate-800 leading-relaxed font-medium">
               Hola <span className="text-slate-950 font-black">{clientName}</span>, para finalizar el proceso de reserva, es necesario que leas y firmes digitalmente el contrato de prestación de servicios musicales.
             </p>
             <p className="text-xs text-slate-500 font-medium">
               Al firmar en pantalla, aceptas en su totalidad los términos y condiciones de Vendetta para la fecha de tu evento.
             </p>
          </div>

          {!showPad ? (
            <Button 
              onClick={() => setShowPad(true)}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-red-600/20 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Leer y Firmar Contrato
            </Button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                       Términos y Cláusulas Contractuales
                     </span>
                     <span className="text-[11px] font-bold text-slate-500">
                       Desliza para leer completo
                     </span>
                  </div>
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 max-h-[50vh] overflow-y-auto text-xs text-slate-900 font-medium space-y-3 leading-relaxed shadow-inner custom-scrollbar-slate">
                     {processedLegalText.split("\n").filter(p => p.trim()).map((para, idx) => (
                       <p key={idx} className="text-slate-900 leading-relaxed">{para}</p>
                     ))}
                  </div>
               </div>
               
               <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                     <Label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                       Traza tu firma digital aquí
                     </Label>
                     <span className="text-[11px] text-slate-500 font-semibold">
                       Usa tu dedo en móvil o puntero en desktop
                     </span>
                  </div>
                  <SignaturePad onSave={handleSign} placeholder="Firma del cliente" disabled={loading} />
               </div>

               <div className="pt-2 flex justify-center">
                 <Button 
                   variant="ghost" 
                   onClick={() => setShowPad(false)}
                   className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-xl h-10 px-6 transition-colors"
                 >
                   Cancelar
                 </Button>
               </div>
            </div>
          )}
       </div>
    </div>
  )
}
