"use client"

import React, { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { ReviewModal } from "@/components/public/ReviewModal"

interface TestimonialsScrollProps {
  reviews: any[]
}

const DEFAULT_REVIEWS = [
  {
    id: "def-1",
    name: "Sofía & Alejandro",
    text: "La mejor decisión para nuestra boda en Valle de Bravo. Tocaron los clásicos de los 80s y 90s con una energía de concierto real. Todos nuestros invitados terminaron en la pista cantando a todo pulmón.",
    event: "Boda en Rancho Avándaro",
    stars: 5,
  },
  {
    id: "def-2",
    name: "Carlos Mendoza",
    text: "Vendetta convirtió nuestra convención anual en un festival de rock. Puntualidad impecable, equipo de gira de primer nivel y un sonido brutal. 100% recomendados.",
    event: "Evento Corporativo Toluca",
    stars: 5,
  },
  {
    id: "def-3",
    name: "Mariana Treviño",
    text: "No es el típico grupo versátil aburrido. Su show es un viaje en el tiempo con arreglos modernos y una vocalista increíble. La gente no los dejaba bajar del escenario pidiendo encore.",
    event: "Fiesta Privada Metepec",
    stars: 5,
  },
  {
    id: "def-4",
    name: "Diego & Valentina",
    text: "Increíble montaje, la iluminación y los visuales le dieron un toque de gala rockera a nuestra boda. Todo el proceso de contratación fue transparente y profesional.",
    event: "Boda en Hacienda CDMX",
    stars: 5,
  },
  {
    id: "def-5",
    name: "Lic. Roberto Galindo",
    text: "Excelente presentación para el cierre de año empresarial. Son músicos con un nivel técnico altísimo que conectan de inmediato con la audiencia.",
    event: "Gala Empresarial WTC",
    stars: 5,
  }
]

export function TestimonialsScroll({ reviews = [] }: TestimonialsScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const activeReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  return (
    <section id="testimonios" className="py-28 md:py-36 bg-[#0B0B14] relative overflow-hidden">
      {/* Top and Bottom Gradient Blends */}
      <div className="section-blend-top bg-gradient-to-b from-[#0E0E1A] to-transparent" />
      <div className="section-blend-bottom bg-gradient-to-t from-[#0B0B14] to-transparent" />

      {/* Aurora Ambient Stage Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-layer-1 -top-32 left-1/3 animate-aurora-drift opacity-50" />
        <div className="aurora-layer-2 bottom-10 right-1/4 animate-aurora-reverse opacity-40" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        {/* Section Header with Navigation Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold text-xs uppercase tracking-widest mb-4">
              <Star className="w-3.5 h-3.5 fill-[#FF5A5F]" />
              <span>TESTIMONIALES REALES • 5.0 ESTRELLAS</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-7xl font-sans font-black text-white uppercase tracking-tight leading-none mb-4">
              LO QUE DICEN <br />
              <span className="text-gradient-encore italic">NUESTROS CLIENTES</span>
            </h2>

            <p className="text-[#F2F0EB]/70 text-sm sm:text-base font-normal max-w-xl">
              Historias de bodas, aniversarios y eventos donde la pista no paró de cantar en toda la noche.
            </p>
          </div>

          {/* Controls: Left/Right Arrow Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                canScrollLeft
                  ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
              }`}
              aria-label="Testimonios anteriores"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                canScrollRight
                  ? "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] border-white/20 text-white hover:scale-105"
                  : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
              }`}
              aria-label="Testimonios siguientes"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Horizontal Smooth Scroll Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {activeReviews.map((r: any, i: number) => {
            const reviewId = ("id" in r ? r.id : null) || `rev-${i}`
            const textContent = r.text || r.content || ""
            const reviewerName = r.name || "Invitado VIP"
            const eventInfo = r.event || r.eventName || r.role || "Verificado en sitio"
            const starsCount = r.stars || 5

            return (
              <div
                key={reviewId}
                className="min-w-[85%] sm:min-w-[420px] md:min-w-[480px] snap-start rounded-[2.5rem] p-8 md:p-10 border border-white/15 bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl relative flex flex-col justify-between group shadow-2xl transition-all hover:border-[#FF5A5F]/40 hover:-translate-y-1 select-none"
              >
                {/* Quote Background Watermark */}
                <Quote className="absolute top-8 right-8 w-14 h-14 text-white/5 group-hover:text-[#FF5A5F]/15 transition-colors pointer-events-none" />

                <div>
                  {/* Golden Stars */}
                  <div className="flex gap-1.5 mb-6">
                    {[...Array(starsCount)].map((_, sIdx) => (
                      <Star
                        key={sIdx}
                        className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      />
                    ))}
                  </div>

                  {/* Testimonial Quote Text */}
                  <p className="text-base sm:text-lg font-medium text-white leading-relaxed mb-8 italic">
                    &quot;{textContent}&quot;
                  </p>
                </div>

                {/* Author & Event Info */}
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6F0D2B] to-[#FF5A5F] border border-white/20 flex items-center justify-center font-sans font-black text-white text-lg shadow-md shrink-0">
                    {reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-white text-base leading-tight">
                      {reviewerName}
                    </h4>
                    <div className="text-[11px] font-mono text-[#F2F0EB]/60 uppercase tracking-widest font-semibold mt-0.5">
                      {eventInfo}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Scroll hint on mobile */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest sm:hidden">
          <span>← Desliza para leer más testimonios →</span>
        </div>

        {/* Review Modal Trigger */}
        <div className="mt-8 flex justify-center">
          <ReviewModal />
        </div>
      </div>
    </section>
  )
}
