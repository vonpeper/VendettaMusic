
"use client"

import React, { useState } from "react"
import { SignaturePad } from "./SignaturePad"
import { saveAdminSignatureAction } from "@/actions/signatures"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2, PenTool, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AdminSignatureManager({ initialSignature }: { initialSignature: string | null }) {
  const [signature, setSignature] = useState<string | null>(initialSignature)
  const [open, setOpen] = useState(false)

  const handleSave = async (base64: string) => {
    try {
      const res = await saveAdminSignatureAction(base64)
      if (res.success) {
        setSignature(base64)
        setOpen(false)
        toast.success("Firma corporativa guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch (e) {
      toast.error("Error de red")
    }
  }

  return (
    <div className="space-y-6">
      {signature ? (
        <div className="space-y-6">
          <div className="bg-white border border-border/60 shadow-inner rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px] relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E91E63] to-transparent opacity-20" />
             <img src={signature} alt="Firma Administrador" className="max-h-40 opacity-90 grayscale hover:grayscale-0 transition-all duration-500" />
             
             <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
               <CheckCircle2 className="w-3 h-3" /> Firma Registrada
             </div>

             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => {
                    if(confirm("¿Estás seguro de eliminar la firma actual?")) setSignature(null)
                  }}
                  className="rounded-xl shadow-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
            Esta firma se estampará automáticamente en los contratos digitales.
          </p>
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed border-border/60 rounded-3xl bg-muted/30 flex flex-col items-center justify-center text-center gap-4">
           <div className="w-16 h-16 rounded-2xl bg-[#E91E63]/10 flex items-center justify-center text-[#E91E63] mb-2">
             <PenTool className="w-8 h-8" />
           </div>
           <div>
             <h3 className="text-foreground font-black uppercase tracking-tight">Sin Firma Digital</h3>
             <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">Necesitas registrar tu firma para poder emitir contratos legales.</p>
           </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full h-14 bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] transition-all"
          >
            {signature ? "Actualizar Firma Digital" : "Registrar Nueva Firma"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] bg-background border-border rounded-3xl p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <PenTool className="w-6 h-6 text-[#E91E63]" />
                Registro de Firma
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Dibuja tu firma oficial de Vendetta en el recuadro inferior. 
                Se recomienda usar un dispositivo táctil para mayor precisión.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <div className="bg-white border border-border/40 rounded-2xl p-2">
              <SignaturePad onSave={handleSave} placeholder="Traza tu firma aquí" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
