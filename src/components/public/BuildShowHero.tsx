"use client"

import { Sparkles, ArrowRight, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function BuildShowHero({ imageUrl = "/images/shows/arma-tu-show.jpg" }: { imageUrl?: string }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#050505] py-24">
      {/* Intense Background Treatment */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-60 mix-blend-overlay animate-pulse"
          style={{
            background: "radial-gradient(circle at 10% 20%, rgba(220,38,38,0.5) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(138,43,226,0.4) 0%, transparent 40%)"
          }}
        />
        <Image 
          src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070&auto=format&fit=crop" 
          alt="Stage" 
          fill
          className="object-cover opacity-20 scale-110 blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20 z-10" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-black text-xs uppercase tracking-[0.3em] mb-12 backdrop-blur-xl">
              <Zap className="w-4 h-4 fill-primary" /> Totalmente Personalizable
            </div>
            
            <h2 className="font-heading font-black text-6xl md:text-8xl lg:text-[11rem] tracking-tighter mb-10 leading-[0.75] uppercase italic select-none">
              <span className="text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">Crea Tu</span> <br />
              <span className="animated-title underline decoration-primary/40 decoration-8 underline-offset-[12px] not-italic pr-4">Propio Show</span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-400 max-w-xl lg:mx-0 mx-auto mb-14 font-medium leading-relaxed">
              Tú tienes el control total: desde el setlist hasta la potencia del audio. Cotización instantánea basada en tu locación real.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <Link href="/cotizar?pkg=custom&step=1">
                <Button 
                  size="lg" 
                  className="h-24 px-16 rounded-[2rem] font-black text-3xl gap-4 shadow-[0_20px_60px_-15px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95 transition-all bg-primary"
                >
                  <Sparkles className="w-8 h-8" />
                  ¡PERSONALIZAR!
                </Button>
              </Link>
              
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left group cursor-default">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-primary fill-primary" />)}
                  </div>
                  <span className="text-[11px] font-black text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">
                    +500 Eventos Personalizados
                  </span>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 w-full max-w-md">
            <div className="relative aspect-[4/5] rounded-[3rem] border border-white/10 overflow-hidden transform lg:rotate-6 bg-white/5 backdrop-blur-md shadow-2xl">
              <Image 
                 src={imageUrl}
                 alt="Show" 
                 fill
                 className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                 <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">Siguiente nivel</div>
                 <h4 className="text-2xl font-black text-white leading-tight">Producción VIP para Bodas y Corporativos</h4>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
    </section>
  )
}
