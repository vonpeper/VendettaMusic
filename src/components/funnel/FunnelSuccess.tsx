"use client"

import { FunnelData } from "./FunnelWizard"
import { Button }     from "@/components/ui/button"
import { CheckCircle2, Share2, Calendar, MapPin, Package, Download, Info } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ContractTemplate } from "./ContractTemplate"
import { downloadContractPdf } from "@/lib/pdf"
import { formatDateMX } from "@/lib/utils"
import confetti from "canvas-confetti"
import { useEffect } from "react"

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default function FunnelSuccess({ data }: { data: FunnelData }) {
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff0000", "#ffffff", "#000000"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff0000", "#ffffff", "#000000"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);
  const deposit = data.depositAmount ?? 0
  const total = (data.packagePrice ?? 0) + (data.viaticosAmount ?? 0)

  const eventDate = data.requestedDate
    ? formatDateMX(data.requestedDate, "PPPP")
    : "Por confirmar"

  const whatsappNumber = "527222417045"
  const message = `¡Hola Vendetta! Acabo de realizar mi reserva 🎸\n\n` +
    `Folio: ${data.shortId}\n` +
    `Cliente: ${data.clientName}\n` +
    `Evento: ${data.packageName}\n` +
    `Fecha: ${eventDate}\n` +
    `Ubicación: ${data.street} ${data.houseNumber}, ${data.colonia}\n` +
    `Total: ${MXN(total)}\n` +
    `Anticipo: ${MXN(deposit)}`

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  const handleDownload = async () => {
    const filename = `Contrato_Vendetta_${data.shortId}_${data.clientName.replace(/\s+/g, '_')}.pdf`
    await downloadContractPdf(data, filename)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      {/* Ya no necesitamos el contenedor invisible para html2canvas, el PDF se genera vectorialmente */}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 flex justify-center"
      >
        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
      </motion.div>

      <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
        ¡Reserva <span className="text-primary italic">Recibida!</span>
      </h2>
      <p className="text-gray-400 mb-8 italic">Tu solicitud de show ha sido ingresada con éxito.</p>
      
      <div className="bg-card/40 border border-primary/20 rounded-3xl p-6 mb-8 text-left space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Folio de Seguimiento</span>
          <span className="text-2xl font-black text-white">{data.shortId}</span>
        </div>

        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Paquete / Show</div>
              <div className="text-white font-bold">{data.packageName}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Fecha y Horario</div>
              <div className="text-white font-bold capitalize">{eventDate} @ {data.startTime}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Ubicación</div>
              <div className="text-white font-bold">{data.street} {data.houseNumber}, {data.colonia}</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Costo Total</div>
            <div className="text-3xl font-black text-white">{MXN(total)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-primary uppercase mb-1">Anticipo Pagado</div>
            <div className="text-2xl font-black text-primary">{MXN(deposit)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Button 
            onClick={handleDownload}
            className="h-14 bg-white text-black hover:bg-gray-200 font-black rounded-2xl gap-2 shadow-xl"
          >
            <Download className="w-5 h-5" /> Descargar Contrato
          </Button>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-14 bg-[#25D366] hover:bg-[#128C7E] border-none font-black rounded-2xl gap-2 shadow-xl">
              <Share2 className="w-5 h-5" /> Ir a WhatsApp
            </Button>
          </a>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 justify-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-[11px] text-gray-400 italic text-left leading-relaxed">
            Recordatorio: Su reserva se confirma una vez verificado el anticipo. 
            Descargue su contrato para tener validez legal del acuerdo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 border-t border-white/5">
          <Link href={`/status/${data.shortId}`} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">
            Rastrear estatus online
          </Link>
          <Link href="/" className="text-xs font-black text-white hover:text-primary transition-colors uppercase tracking-widest">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
