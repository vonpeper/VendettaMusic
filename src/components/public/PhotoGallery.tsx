"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X 
} from "lucide-react"

export function PhotoGallery({ images = [] }: { images?: string[] }) {
  // Map strings to objects if needed, or use directly
  const PHOTOS = images.length > 0 
    ? images.map(src => ({ src, alt: "Vendetta en Vivo" }))
    : [
        { src: "/images/galeria/535121155_761041770195307_8126776643887802338_n.jpg", alt: "Banda en Vivo" },
        { src: "/images/galeria/535681229_761041766861974_6926113629069895939_n.jpg", alt: "Energía Vendetta" },
        { src: "/images/galeria/535103174_761041763528641_7245225103265677160_n.jpg", alt: "Show Premium" },
        { src: "/images/galeria/481504769_629534706679348_1561716134611844203_n.jpg", alt: "Producción de Gala" },
        { src: "/images/galeria/536600427_761041776861973_6445050278382618381_n.jpg", alt: "Rock Show" },
        { src: "/images/galeria/514286757_724509610515190_4657541336968800422_n.jpg", alt: "Vocalistas" },
        { src: "/images/galeria/480443072_617491504550335_3034048089450482085_n.jpg", alt: "Evento de Marca" },
        { src: "/images/galeria/534982425_761041773528640_8278088169193635074_n.jpg", alt: "Stage Setup" },
        { src: "/images/galeria/597393886_854962487469901_2382660845125978946_n.jpg", alt: "Público Prendido" },
        { src: "/images/galeria/515963015_724509627181855_2465529527478650196_n.jpg", alt: "Vendetta Night" },
      ]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (PHOTOS.length - 2))
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (PHOTOS.length - 2)) % (PHOTOS.length - 2))
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section className="py-24 bg-[#080808] overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">
               <Sparkles className="w-3 h-3" /> Galería Capturada
             </div>
             <h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter leading-none mb-4">
               Momentos <span className="animated-title italic pr-4">Vendetta</span>
             </h2>
             <p className="text-gray-400 text-sm font-medium">Desliza para explorar la energía de nuestros shows más recientes.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={prevSlide} className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <button onClick={nextSlide} className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white">
                <ChevronRight className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-4 px-4 md:gap-8 transition-transform duration-700 ease-in-out"
             style={{ transform: `translateX(-${currentIndex * 33.33}%)` }}>
          {PHOTOS.map((photo, idx) => (
            <div 
              key={idx} 
              onClick={() => { setSelectedImage(idx); setIsLightboxOpen(true) }}
              className="min-w-[85%] md:min-w-[400px] lg:min-w-[500px] aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/10 relative group cursor-pointer"
            >
              <Image 
                src={photo.src} 
                alt={photo.alt} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-8 left-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                 <div className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-black text-white uppercase tracking-widest">Ampliar Imagen</span>
              </div>
            </div>
          ))}
        </div>
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
