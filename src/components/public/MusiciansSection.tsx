"use client"

import { useState } from "react"
import Image from "next/image"
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

const DEFAULT_MUSICIANS: Musician[] = [
  {
    name: "Diego",
    role: "Voz Principal",
    emoji: "🎤",
    img: "/images/musicians/diego.jpg",
    shortBio: "Voz líder con gran potencia escénica, energía y carisma en vivo.",
    fullBio: "Líder vocal de Vendetta Music, especialista en prender al público y dominar los himnos de pop y rock en español e inglés.",
    ig: "https://instagram.com/vendettamusica"
  },
  {
    name: "Maryx",
    role: "Voz Femenina",
    emoji: "✨",
    img: "/images/musicians/maryx.jpg",
    shortBio: "Voz femenina de gran tesitura, elegancia y potencia escénica.",
    fullBio: "Cantante profesional con amplia trayectoria en shows de alto nivel y producciones de gala.",
    ig: "https://instagram.com/vendettamusica"
  },
  {
    name: "Pepe",
    role: "Guitarra & Dirección",
    emoji: "🎸",
    img: "/images/musicians/pepe.jpg",
    shortBio: "Guitarrista y director musical, arreglista del show.",
    fullBio: "Más de 15 años en producción musical, diseño sonoro y ejecución en vivo de pop, funk y rock.",
    ig: "https://instagram.com/vendettamusica"
  },
  {
    name: "Alex",
    role: "Batería & Percusión",
    emoji: "🥁",
    img: "/images/musicians/alex.jpg",
    shortBio: "El motor rítmico que mantiene la pista encendida.",
    fullBio: "Baterista de sesión con precisión y pegada para hacer vibrar a todos en cualquier fiesta.",
    ig: "https://instagram.com/vendettamusica"
  },
  {
    name: "Edgar",
    role: "Bajo Eléctrico",
    emoji: "⚡",
    img: "/images/musicians/edgar.jpg",
    shortBio: "Solidez y groove en cada compás del concierto.",
    fullBio: "Bajista profesional encargado de la base armónica y rítmica del sonido en vivo de Vendetta.",
    ig: "https://instagram.com/vendettamusica"
  }
]

export function MusiciansSection({ musicians = [] }: { musicians?: Musician[] }) {
  const [activeMuso, setActiveMuso] = useState<Musician | null>(null)
  const displayMusicians = musicians && musicians.length > 0 ? musicians : DEFAULT_MUSICIANS

  return (
    <>
      {activeMuso && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl cursor-pointer"
          onClick={() => setActiveMuso(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-[#07080D]/90 border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveMuso(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#FF5A5F] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 h-64 md:h-auto relative">
                <Image 
                  src={activeMuso.img} 
                  alt={activeMuso.name} 
                  width={360}
                  height={640}
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="w-full h-full object-cover object-top" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-transparent to-transparent md:hidden" />
              </div>
              <div className="p-8 md:w-1/2 flex flex-col justify-center">
                <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 text-[#FF5A5F] text-[10px] font-semibold uppercase tracking-widest mb-4">
                  {activeMuso.emoji} {activeMuso.role}
                </div>
                <h3 className="text-3xl font-sans font-black text-[#F2F0EB] mb-3">{activeMuso.name}</h3>
                <p className="text-[#F2F0EB]/80 text-sm leading-relaxed mb-6 font-normal">"{activeMuso.fullBio}"</p>
                <a href={activeMuso.ig ?? "#"} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2 font-semibold text-xs uppercase tracking-wider h-11 rounded-xl bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-[#F2F0EB] shadow-lg shadow-[#FF5A5F]/20 hover:shadow-[#FF5A5F]/40 border border-white/20">
                    <ExternalLink className="w-4 h-4" /> Seguir en Instagram
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="nosotros" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#15152B] via-[#07080D] to-[#42112D]/80">
        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#07080D] to-transparent" />

        {/* Stage lighting background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 -left-24 w-96 h-96 bg-[#7777FF]/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/3 -right-24 w-96 h-96 bg-[#FF5A5F]/15 rounded-full blur-[140px]" />
          <div className="absolute inset-0 stage-grid-overlay opacity-25" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 text-[#FF5A5F] font-semibold text-xs uppercase tracking-widest mb-5">
              🎸 En Escena
            </div>
            <h2 className="font-sans font-black text-4xl md:text-6xl text-[#F2F0EB] uppercase tracking-tight mb-4">
              Los Músicos de <span className="text-gradient-encore">Vendetta</span>
            </h2>
            <p className="text-[#F2F0EB]/70 max-w-lg mx-auto font-normal text-sm md:text-base">
              Músicos profesionales con trayectoria de concierto y producción de gira en vivo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
            {displayMusicians.map(m => (
              <button
                key={m.name}
                onClick={() => setActiveMuso(m)}
                className="group text-left rounded-3xl overflow-hidden glass-card-hover border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
              >
                <div className="relative h-72 md:h-80 overflow-hidden">
                  <Image
                    src={m.img}
                    alt={m.name}
                    width={360}
                    height={640}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <div className="text-[10px] font-semibold text-[#FF5A5F] px-2.5 py-1 rounded-lg bg-[#07080D]/80 border border-white/10 backdrop-blur-md">
                      {m.emoji} {m.role}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-sans font-black text-[#F2F0EB] text-lg mb-1 group-hover:text-[#FF5A5F] transition-colors">{m.name}</div>
                  <p className="text-xs text-[#F2F0EB]/65 leading-relaxed line-clamp-2 font-normal">{m.shortBio}</p>
                  <div className="mt-4 text-[10px] font-semibold text-[#FF5A5F]/80 group-hover:text-[#FF5A5F] transition-colors flex items-center gap-1 uppercase tracking-widest">
                    Ver trayectoria <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
