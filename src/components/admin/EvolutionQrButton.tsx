"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getEvolutionQrCodeAction } from "@/actions/config"
import { QrCode, Loader2, X } from "lucide-react"
import { toast } from "sonner"

export function EvolutionQrButton() {
  const [loading, setLoading] = useState(false)
  const [qrBase64, setQrBase64] = useState<string | null>(null)

  async function handleGetQr() {
    setLoading(true)
    setQrBase64(null)
    try {
      const res = await getEvolutionQrCodeAction()
      if (res.success && res.qr) {
        setQrBase64(res.qr)
        toast.success("QR Generado. Escanéalo desde WhatsApp.")
      } else {
        toast.error(res.message || "No se pudo obtener el código QR")
      }
    } catch (e) {
      toast.error("Error al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!qrBase64 ? (
        <Button
          type="button"
          onClick={handleGetQr}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-white flex items-center justify-center gap-2 h-11"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando QR (Logout previo)...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              Vincular WhatsApp (Generar QR)
            </>
          )}
        </Button>
      ) : (
        <div className="bg-slate-900 border border-border/40 rounded-2xl p-5 flex flex-col items-center gap-4 relative animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => setQrBase64(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            title="Cerrar QR"
          >
            <X className="w-4 h-4" />
          </button>
          
          <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center">
            Escanea el código QR desde tu celular
          </span>
          
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrBase64} alt="Evolution API WhatsApp QR Code" className="w-64 h-64 select-none pointer-events-none" />
          </div>

          <p className="text-[10px] text-muted-foreground text-center max-w-xs leading-relaxed">
            Ve a WhatsApp → Dispositivos Vinculados → Vincular un Dispositivo, y apunta tu cámara al QR. Una vez vinculado, esta ventana se actualizará.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGetQr}
            disabled={loading}
            className="w-full text-xs font-bold h-9"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : "Regenerar Código QR"}
          </Button>
        </div>
      )}
    </div>
  )
}
