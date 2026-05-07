
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
}

export function ContractSigner({ 
  bookingId, 
  clientName, 
  shortId, 
  isSigned, 
  signedAt,
  clientSignature,
  adminSignature
}: ContractSignerProps) {
  const [loading, setLoading] = useState(false)
  const [showPad, setShowPad] = useState(false)

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
      <div className="bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden">
        <div className="p-6 bg-green-500/10 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Contrato Firmado Digitalmente</h3>
          </div>
          <div className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Legalmente Vinculante</div>
        </div>
        
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Firma Cliente */}
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Firma del Cliente: {clientName}</div>
                 <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center min-h-[120px]">
                    <img src={clientSignature!} alt="Firma Cliente" className="max-h-24 invert opacity-80" />
                 </div>
                 <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase italic">
                    <Clock className="w-3 h-3" /> Firmado el {signedAt ? new Date(signedAt).toLocaleString() : "N/A"}
                 </div>
              </div>

              {/* Firma Vendetta */}
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-white/5 pb-2">Firma Vendetta Live Music</div>
                 <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center min-h-[120px]">
                    {adminSignature ? (
                      <img src={adminSignature} alt="Firma Vendetta" className="max-h-24 invert opacity-80" />
                    ) : (
                      <div className="text-[10px] text-gray-600 italic">Sello Digital Corporativo</div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-[9px] text-primary font-black uppercase">
                    <CheckCircle2 className="w-3 h-3" /> Verificado por Vendetta
                 </div>
              </div>
           </div>

           <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500 leading-relaxed text-center italic">
                Este documento constituye un acuerdo legal entre las partes. La firma digital ha sido verificada mediante IP y sello de tiempo.
              </p>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden">
       <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Formalización de Contrato</h3>
       </div>

       <div className="p-8 space-y-6">
          <div className="space-y-2">
             <p className="text-sm text-gray-300 leading-relaxed">
               Hola <span className="text-white font-bold">{clientName}</span>, para finalizar el proceso de reserva, es necesario que leas y firmes digitalmente el contrato de prestación de servicios musicales.
             </p>
             <p className="text-xs text-gray-500 italic">
               Al firmar, aceptas los términos y condiciones de Vendetta para tu evento el próximo día.
             </p>
          </div>

          {!showPad ? (
            <Button 
              onClick={() => setShowPad(true)}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20"
            >
              Leer y Firmar Contrato
            </Button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-40 overflow-y-auto text-[11px] text-gray-400 space-y-3 leading-relaxed">
                  <p><strong>CLAÚSULA DE SERVICIO:</strong> VENDETTA se compromete a presentarse en la fecha y hora estipuladas con el paquete seleccionado.</p>
                  <p><strong>CANCELACIONES:</strong> El anticipo no es reembolsable en caso de cancelación por parte del cliente.</p>
                  <p><strong>LOGÍSTICA:</strong> El cliente proporcionará el espacio físico y alimentación básica para el staff.</p>
               </div>
               
               <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Traza tu firma aquí</Label>
                  <SignaturePad onSave={handleSign} placeholder="Firma del cliente" />
               </div>

               <Button 
                variant="ghost" 
                onClick={() => setShowPad(false)}
                className="w-full text-gray-500 hover:text-white text-[10px] font-bold uppercase"
               >
                Cancelar
               </Button>
            </div>
          )}
       </div>
    </div>
  )
}
