"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X,
  Camera,
  Flame
} from "lucide-react"

const DEFAULT_PHOTOS = [
  { src: "/images/galeria/vendetta-live-music-show-boda.jpeg", alt: "Vendetta Live Show en Boda", tag: "Boda Monumental" },
  { src: "/images/galeria/vendetta-banda-en-vivo-evento.jpg", alt: "Banda en Vivo para Eventos", tag: "Concierto en Escena" },
  { src: "/images/galeria/vendetta-cantante-escenario.jpg", alt: "Voz en Escenario Vendetta", tag: "Vocal Performance" },
  { src: "/images/galeria/vendetta-guitarrista-solo.jpg", alt: "Solo de Guitarra Eléctrica", tag: "Solo de Guitarra" },
  { src: "/images/galeria/vendetta-bajista-ritmo.jpg", alt: "Bajo y Ritmo Vendetta", tag: "Groove & Bajo" },
  { src: "/images/galeria/vendetta-bateria-iluminacion.jpg", alt: "Batería e Iluminación Robótica", tag: "Batería & DMX" },
  { src: "/images/galeria/vendetta-saxofonista-metales.jpg", alt: "Sección de Metales Saxofón", tag: "Metales en Vivo" },
  { src: "/images/galeria/vendetta-trompetista-show.jpg", alt: "Trompeta en Vivo", tag: "Potencia Sonora" },
  { src: "/images/galeria/vendetta-grupo-musical-animacion.jpg", alt: "Animación y Fiesta en Vivo", tag: "Pista Llena" },
  { src: "/images/galeria/vendetta-concierto-versatil.jpg", alt: "Concierto Pop & Rock en Vivo Vendetta", tag: "Atmósfera Live" },
  { src: "/images/galeria/vendetta-musica-corporativo.jpg", alt: "Evento Corporativo de Gala", tag: "Gala & Corporativo" },
  { src: "/images/galeria/vendetta-vocalista-grupo.jpg", alt: "Vocalistas Vendetta Live", tag: "Dueto Vocal" },
]

export function PhotoGallery({ images = [] }: { images?: (string | null | undefined)[] }) {
  // Filter incoming images: ignore broken facebook/instagram hashes if they don't match our local storage
  const cleanImages = (images || []).filter((img): img is string => {
    if (typeof img !== "string" || img.trim().length === 0) return false
    // If it starts with /images/galeria/ but has a long numeric hash that fails on disk, filter it out
    if (img.startsWith("/images/galeria/") && /_\d+_\d+_n\.jpg/i.test(img)) return false
    return true
  })

  const basePhotos = cleanImages.length > 0 
    ? cleanImages.map((src, i) => ({ 
        src, 
        alt: `Vendetta Concierto en Vivo ${i + 1}`,
        tag: DEFAULT_PHOTOS[i % DEFAULT_PHOTOS.length]?.tag || "En Vivo"
      }))
    : DEFAULT_PHOTOS

  // Fallback map in case any URL fails to load in browser
  const [photoList, setPhotoList] = useState(basePhotos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })

  useEffect(() => {
    setPhotoList(basePhotos)
  }, [cleanImages.length])

  const handleImageError = (index: number) => {
    setPhotoList((prev) => {
      const updated = [...prev]
      const fallbackSrc = DEFAULT_PHOTOS[index % DEFAULT_PHOTOS.length].src
      if (updated[index]?.src !== fallbackSrc) {
        updated[index] = {
          ...updated[index],
          src: fallbackSrc
        }
      }
      return updated
    })
  }

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (photoList.length || 1))
  }, [photoList.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (photoList.length || 1)) % (photoList.length || 1))
  }, [photoList.length])

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.scrollWidth - containerRef.current.offsetWidth
      setConstraints({ left: -Math.max(0, width), right: 0 })
    }
  }, [photoList.length])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5500)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section id="galeria" className="py-24 md:py-32 bg-[#07080D] relative overflow-hidden border-t border-white/10">
      {/* Aurora Lighting Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-layer-1 -top-24 -left-20 animate-aurora-drift" />
        <div className="aurora-layer-2 -bottom-32 -right-20 animate-aurora-reverse" />
        <div className="aurora-layer-3 top-1/2 left-1/3 opacity-40" />
        <div className="absolute inset-0 stage-grid-overlay opacity-40" />
      </div>

      <div className="container mx-auto px-4 mb-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
             {/* Amp Pilot Badge */}
             <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.3em] mb-4 text-[#F2F0EB]">
               <div className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
               <span>LIVE STAGE PHOTOGRAPHY</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-4">
               MOMENTOS <span className="text-gradient-encore">EN VIVO</span>
             </h2>
             <p className="text-[#F2F0EB]/70 text-sm md:text-base font-normal">
               Siente la vibra de concierto, la iluminación robótica y la conexión en vivo con cada invitado.
             </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-[#F2F0EB]/60 uppercase tracking-widest font-mono">
               <Camera className="w-3.5 h-3.5 text-[#FF5A5F]" />
               <span>{photoList.length} FOTOS REALES</span>
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={prevSlide} 
                 aria-label="Foto anterior"
                 className="w-12 h-12 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/15 hover:border-[#FF5A5F]/40 transition-all text-white shadow-lg cursor-pointer active:scale-95"
               >
                  <ChevronLeft className="w-6 h-6" />
               </button>
               <button 
                 onClick={nextSlide} 
                 aria-label="Foto siguiente"
                 className="w-12 h-12 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/15 hover:border-[#FF5A5F]/40 transition-all text-white shadow-lg cursor-pointer active:scale-95"
               >
                  <ChevronRight className="w-6 h-6" />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Horizontal Draggable Stage Photo Reel */}
      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing px-4 sm:px-10 z-10">
        <motion.div 
          ref={containerRef}
          className="flex gap-5 md:gap-8"
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.1}
          whileTap={{ cursor: "grabbing" }}
          animate={{ 
            x: constraints.left && photoList.length > 0
              ? -((currentIndex / photoList.length) * Math.abs(constraints.left)) 
              : 0 
          }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {photoList.map((photo, idx) => (
            <motion.div 
              key={`${photo.src}-${idx}`} 
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => { setSelectedImage(idx); setIsLightboxOpen(true) }}
              className="min-w-[82%] sm:min-w-[420px] md:min-w-[500px] aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/15 bg-white/5 relative group cursor-pointer shrink-0 shadow-2xl backdrop-blur-md"
            >
              <Image 
                src={photo.src} 
                alt={photo.alt} 
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
                className="object-cover group-hover:scale-108 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                draggable={false}
                onError={() => handleImageError(idx)}
                unoptimized
              />
              
              {/* Stage lens flare overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              {/* Top Category Badge */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-[#F2F0EB]">
                  {photo.tag}
                </span>
              </div>

              {/* Bottom Info & Maximize Button */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between z-10">
                 <div>
                   <p className="text-white font-sans font-bold text-base md:text-lg tracking-tight drop-shadow-md">
                     {photo.alt}
                   </p>
                   <p className="text-[#FF5A5F] text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A5F] animate-pulse" />
                     Vendetta Live Tour
                   </p>
                 </div>
                 <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6F0D2B] to-[#FF5A5F] border border-white/30 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Maximize2 className="w-4 h-4" />
                 </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox Pop-up */}
      <AnimatePresence>
        {isLightboxOpen && selectedImage !== null && photoList[selectedImage] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white z-[110] cursor-pointer"
              aria-label="Cerrar vista completa"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl aspect-video md:aspect-[4/3] max-h-[85vh] flex items-center justify-center group">
              <img 
                src={photoList[selectedImage].src} 
                alt={photoList[selectedImage].alt} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/15" 
                onError={() => handleImageError(selectedImage)}
              />
              
              <button 
                onClick={() => setSelectedImage((p) => (p! - 1 + photoList.length) % photoList.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-black/70 border border-white/20 flex items-center justify-center hover:bg-[#FF5A5F] transition-all text-white shadow-xl cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              
              <button 
                onClick={() => setSelectedImage((p) => (p! + 1) % photoList.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-black/70 border border-white/20 flex items-center justify-center hover:bg-[#FF5A5F] transition-all text-white shadow-xl cursor-pointer"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
              
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white/80 text-xs font-mono font-bold tracking-widest">
                <span>{selectedImage + 1} / {photoList.length}</span>
                <span className="text-[#FF5A5F]">•</span>
                <span>{photoList[selectedImage].alt}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
