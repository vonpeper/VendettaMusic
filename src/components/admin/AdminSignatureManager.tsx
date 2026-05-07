
"use client"

import React, { useState } from "react"
import { SignaturePad } from "./SignaturePad"
import { saveAdminSignatureAction } from "@/actions/signatures"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function AdminSignatureManager({ initialSignature }: { initialSignature: string | null }) {
  const [signature, setSignature] = useState<string | null>(initialSignature)
  const [isEditing, setIsEditing] = useState(!initialSignature)

  const handleSave = async (base64: string) => {
    try {
      const res = await saveAdminSignatureAction(base64)
      if (res.success) {
        setSignature(base64)
        setIsEditing(false)
        toast.success("Firma corporativa guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch (e) {
      toast.error("Error de red")
    }
  }

  if (!isEditing && signature) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center min-h-[160px] relative group">
           <img src={signature} alt="Firma Administrador" className="max-h-32 invert opacity-90" />
           <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="destructive" size="icon" onClick={() => setIsEditing(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
           </div>
        </div>
        <p className="text-xs text-muted-foreground text-center italic">
          Esta firma se estampará en el contrato legal cuando el cliente firme su parte.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-4">
         <p className="text-xs text-primary font-bold">Usa tu mouse o trackpad para trazar la firma oficial de Vendetta.</p>
      </div>
      <SignaturePad onSave={handleSave} placeholder="Firma de Vendetta" />
      {signature && (
        <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => setIsEditing(false)}>
          Cancelar y conservar firma actual
        </Button>
      )}
    </div>
  )
}
