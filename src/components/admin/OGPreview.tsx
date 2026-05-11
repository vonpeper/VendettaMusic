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
    <div className="mt-8 p-6 bg-pink-500/5 border border-pink-500/10 rounded-2xl space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-pink-400 mb-3">Vista Previa (Aproximada)</h4>
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

      <div className="pt-6 border-t border-pink-500/10 space-y-4">
        <div className="flex items-start gap-3 bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
          <ShieldCheck className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-pink-100 uppercase tracking-wide">¿Facebook muestra Error 403?</p>
            <p className="text-[11px] text-pink-200/70 leading-relaxed">
              Si el depurador de Facebook devuelve un código <strong>403</strong>, significa que tu servidor o WAF está bloqueando al bot de Facebook. 
              Debes permitir el User-Agent <code className="bg-pink-900/40 px-1 rounded text-pink-300">facebookexternalhit</code> en tu configuración de Cloudflare o Firewall.
            </p>
          </div>
        </div>

        <a 
          href="https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fvendetta.mx%2F" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all group"
        >
          <ExternalLink className="w-4 h-4 text-pink-400" />
          Abrir Depurador de Compartición de Facebook
        </a>
      </div>
    </div>
  )
}
