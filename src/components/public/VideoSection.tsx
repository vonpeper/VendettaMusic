"use client"

import { useState } from "react"
import { Play, Zap, X } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export function VideoSection({ videoUrl = "https://www.youtube.com/watch?v=607_nxc0Rqc" }: { videoUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  // Extraer ID de YouTube
  let videoId = "607_nxc0Rqc"
  try {
     if(videoUrl.includes("v=")){
        videoId = videoUrl.split("v=")[1].split("&")[0]
     } else if(videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1].split("?")[0]
     }
  } catch(e) {}

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#17132B] via-[#07080D] to-[#15152B] border-t border-white/10">
      {/* Concert lighting atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#7777FF]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#20D5E5]/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-25" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 text-[#FF5A5F] font-semibold text-[10px] uppercase tracking-[0.3em] mb-4">
              <Zap className="w-3.5 h-3.5 fill-[#FF5A5F]" /> Energía en Vivo
            </div>
            <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight mb-4">
              Mira a <span className="text-gradient-encore">Vendetta</span> en Escena
            </h2>
            <p className="text-[#F2F0EB]/70 max-w-xl mx-auto text-sm md:text-base font-normal">
              No es solo música, es una experiencia de concierto diseñada para que tu evento sea inolvidable.
            </p>
          </div>

          <div 
            onClick={() => setIsOpen(true)}
            className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_24px_60px_-15px_rgba(111,13,43,0.5)] group cursor-pointer backdrop-blur-xl bg-white/[0.03]"
          >
            <Image 
               src={thumbnailUrl} 
               alt="Vendetta Pop & Rock en Vivo" 
               fill 
               className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100" 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080D]/70 via-[#07080D]/30 to-transparent group-hover:from-[#07080D]/50 transition-colors flex items-center justify-center">
               <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(255,90,95,0.6)] group-hover:scale-110 transition-transform border border-white/30">
                  <Play className="w-8 h-8 text-[#F2F0EB] ml-1 fill-white" />
               </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Audio Electro-Voice", "Show Exclusivo", "Backline de Gira", "Monitoreo In-Ear"
            ].map((tag, i) => (
              <div key={i} className="glass-card-subtle px-4 py-3.5 rounded-2xl text-center text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#F2F0EB]/70 hover:text-[#FF5A5F] hover:border-[#FF5A5F]/40 transition-all">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsOpen(false)}
             className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
           >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white z-[110]"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div 
                className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()} // Prevent close on clicked iframe area
              >
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1`}
                    title="Vendetta Show Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
