"use client"

import { ShieldCheck, ExternalLink } from "lucide-react"

interface OGPreviewProps {
  ogImage?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
}

export function OGPreview({ ogImage, ogTitle, ogDescription }: OGPreviewProps) {
  const fallbackImage = "/images/shows/arma-tu-show.jpg"
  const displayImage = ogImage || fallbackImage
  const displayTitle = ogTitle || "Vendetta | Música en Vivo"
  const displayDescription = ogDescription || "La mejor música en vivo para tu boda..."

  return (
    <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Vista Previa (Aproximada)</h4>
        <div className="bg-white rounded-lg overflow-hidden border border-slate-200 max-w-sm mx-auto shadow-xl">
          <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center relative overflow-hidden">
            <img 
              src={displayImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as any).src = "https://placehold.co/1200x630?text=Error+Cargando+Imagen";
              }}
            />
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-1">VENDETTA.MX</p>
            <h5 className="text-slate-900 font-bold text-sm line-clamp-1">{displayTitle}</h5>
            <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-tight">
              {displayDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-blue-500/10 space-y-4">
        <div className="flex items-start gap-4 bg-slate-900/60 p-5 rounded-2xl border border-blue-500/30 backdrop-blur-md">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black text-white uppercase tracking-widest">¿Facebook muestra Error 403?</p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Si el depurador de Facebook devuelve un código <strong className="text-white">403</strong>, significa que tu servidor o WAF está bloqueando al bot de Facebook. 
              Debes permitir el User-Agent <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 border border-blue-500/10 font-bold">facebookexternalhit</code> en tu configuración de Cloudflare o Firewall.
            </p>
          </div>
        </div>

        <a 
          href="https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fvendetta.mx%2F" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 border border-blue-400/20 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-blue-900/20 group"
        >
          <ExternalLink className="w-4 h-4 text-white" />
          ABRIR DEPURADOR DE COMPARTICIÓN
        </a>
      </div>
    </div>
  )
}
