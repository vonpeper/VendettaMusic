"use client"

import { useState } from "react"
import { ChevronRight, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Musician {
  name: string
  role: string
  emoji: string
  img: string
  shortBio: string
  fullBio: string
  ig: string | null
}

export function MusiciansSection({ musicians }: { musicians: Musician[] }) {
  const [activeMuso, setActiveMuso] = useState<Musician | null>(null)

  return (
    <>
      {activeMuso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button 
              onClick={() => setActiveMuso(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 h-64 md:h-auto">
                <img src={activeMuso.img} alt={activeMuso.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-8 md:w-1/2">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  {activeMuso.emoji} {activeMuso.role}
                </div>
                <h3 className="text-3xl font-heading font-black text-white mb-2">{activeMuso.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 italic">"{activeMuso.fullBio}"</p>
                <a href={activeMuso.ig ?? "#"} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2 font-bold">
                    <ExternalLink className="w-4 h-4" /> Seguir en Instagram
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="nosotros" className="py-24 relative overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover opacity-[0.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-5">
              🎸 La Banda
            </div>
            <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-3">
              Conoce a{" "}
              <span className="animated-title pr-4">Vendetta</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto italic font-medium">
              Músicos profesionales con años de experiencia en eventos de alto perfil.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
            {musicians.map(m => (
              <button
                key={m.name}
                onClick={() => setActiveMuso(m)}
                className="group text-left rounded-2xl overflow-hidden border border-white/8 bg-card/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <div className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 backdrop-blur-sm">
                      {m.emoji} {m.role}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-black text-white text-base mb-1 group-hover:text-primary transition-colors">{m.name}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">{m.shortBio}</p>
                  <div className="mt-4 text-[10px] font-black text-primary/70 group-hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest">
                    Ver trayectoria <ChevronRight className="w-3 h-3 translate-y-[0.5px]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
