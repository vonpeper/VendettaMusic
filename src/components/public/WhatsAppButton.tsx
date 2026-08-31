"use client"

import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"

export function WhatsAppButton() {
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  
  // Si no hay línea de WhatsApp comercial configurada, no mostramos el botón flotante
  if (!rawNumber) {
    return null
  }

  const cleanPhone = rawNumber.replace(/\D/g, "")
  const message = encodeURIComponent("¡Hola Vendetta Live Music! 🎸⚡ Me gustaría pedir información y cotización para mi evento.")
  const url = `https://wa.me/${cleanPhone}?text=${message}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 group flex items-center justify-center cursor-pointer"
      aria-label="Contactar por WhatsApp"
    >
      {/* Dynamic radar wave pulse */}
      <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping duration-1000 pointer-events-none" />
      
      {/* Main floating button */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_4px_25px_rgba(37,211,102,0.5)] group-hover:shadow-[0_8px_35px_rgba(37,211,102,0.8)] group-hover:scale-110 group-active:scale-95 transition-all duration-300 border border-white/20">
        <WhatsAppIcon className="w-8 h-8 md:w-9 md:h-9 fill-white transition-transform duration-300 group-hover:rotate-6" />
        
        {/* Active online notification dot */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-black" />
        </span>
      </div>

      {/* Floating tooltip */}
      <div className="absolute right-full mr-3.5 hidden sm:flex items-center gap-2 bg-zinc-950/95 text-white text-xs font-bold px-3.5 py-2 rounded-2xl border border-[#25D366]/40 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>⚡ ¿Cotización inmediata? <strong className="text-[#25D366]">Escríbenos</strong></span>
      </div>
    </a>
  )
}
