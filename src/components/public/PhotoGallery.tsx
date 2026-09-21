"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X 
} from "lucide-react"

export function PhotoGallery({ images = [] }: { images?: (string | null | undefined)[] }) {
  // Map strings to objects if needed, or use verified default photos
  const DEFAULT_PHOTOS = [
    { src: "/images/galeria/vendetta-live-music-show-boda.jpeg", alt: "Vendetta Live Show en Boda" },
    { src: "/images/galeria/vendetta-banda-en-vivo-evento.jpg", alt: "Banda en Vivo para Eventos" },
    { src: "/images/galeria/vendetta-cantante-escenario.jpg", alt: "Voz en Escenario Vendetta" },
    { src: "/images/galeria/vendetta-guitarrista-solo.jpg", alt: "Solo de Guitarra Eléctrica" },
    { src: "/images/galeria/vendetta-bajista-ritmo.jpg", alt: "Bajo y Ritmo Vendetta" },
    { src: "/images/galeria/vendetta-bateria-iluminacion.jpg", alt: "Batería e Iluminación Robótica" },
    { src: "/images/galeria/vendetta-saxofonista-metales.jpg", alt: "Sección de Metales Saxofón" },
    { src: "/images/galeria/vendetta-trompetista-show.jpg", alt: "Trompeta en Vivo" },
    { src: "/images/galeria/vendetta-grupo-musical-animacion.jpg", alt: "Animación y Fiesta en Vivo" },
    { src: "/images/galeria/vendetta-concierto-versatil.jpg", alt: "Concierto Pop & Rock en Vivo Vendetta" },
    { src: "/images/galeria/vendetta-musica-corporativo.jpg", alt: "Evento Corporativo de Gala" },
    { src: "/images/galeria/vendetta-vocalista-grupo.jpg", alt: "Vocalistas Vendetta Live" },
  ]

  const cleanImages = (images || []).filter((img): img is string => typeof img === "string" && img.trim().length > 0)
  const PHOTOS = cleanImages.length > 0 
    ? cleanImages.map(src => ({ src, alt: "Vendetta en Vivo" }))
    : DEFAULT_PHOTOS

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (PHOTOS.length))
  }, [PHOTOS.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length)
  }, [PHOTOS.length])

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.scrollWidth - containerRef.current.offsetWidth
      setConstraints({ left: -width, right: 0 })
    }
  }, [PHOTOS.length])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section id="galeria" className="py-24 md:py-32 bg-gradient-to-b from-[#07080D] via-[#15152B]/80 to-[#07080D] relative overflow-hidden border-t border-white/10">
      {/* Stage lighting atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#7777FF]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#FF5A5F]/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 mb-12 text-center md:text-left relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 text-[#FF5A5F] text-[10px] font-semibold uppercase tracking-[0.35em] mb-4">
               <Sparkles className="w-3 h-3" /> Galería en Escena
             </div>
             <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-4">
               Momentos <span className="text-gradient-encore">Vendetta</span>
             </h2>
             <p className="text-[#F2F0EB]/70 text-sm md:text-base font-normal">Explora la energía y el despliegue técnico de nuestros shows en vivo.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={prevSlide} className="w-12 h-12 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white shadow-lg cursor-pointer">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <button onClick={nextSlide} className="w-12 h-12 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white shadow-lg cursor-pointer">
                <ChevronRight className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing px-4 sm:px-10">
        <motion.div 
          ref={containerRef}
          className="flex gap-4 md:gap-8"
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.1}
          whileTap={{ cursor: "grabbing" }}
          animate={{ x: constraints.left ? -((currentIndex / PHOTOS.length) * Math.abs(constraints.left)) : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {PHOTOS.map((photo, idx) => (
            <motion.div 
              key={idx} 
              whileHover={{ scale: 1.02 }}
              onClick={() => { setSelectedImage(idx); setIsLightboxOpen(true) }}
              className="min-w-[85%] sm:min-w-[400px] md:min-w-[500px] aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/10 relative group cursor-pointer shrink-0 shadow-2xl"
            >
              <Image 
                src={photo.src} 
                alt={photo.alt} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-8 left-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                 <div className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-black text-white uppercase tracking-widest">Ampliar Imagen</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox Pop-up */}
      <AnimatePresence>
        {isLightboxOpen && selectedImage !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white z-[110]"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-6xl aspect-video md:aspect-[4/3] max-h-[85vh] flex items-center justify-center group">
              <img 
                src={PHOTOS[selectedImage].src} 
                alt={PHOTOS[selectedImage].alt} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              />
              
              <button 
                onClick={() => setSelectedImage((p) => (p! - 1 + PHOTOS.length) % PHOTOS.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button 
                onClick={() => setSelectedImage((p) => (p! + 1) % PHOTOS.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-gray-500 text-xs font-black uppercase tracking-widest">
                {selectedImage + 1} / {PHOTOS.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
