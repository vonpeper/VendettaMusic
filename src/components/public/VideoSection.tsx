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
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
              <Zap className="w-3 h-3 fill-primary" /> Energía en Vivo
            </div>
            <h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter mb-4">
              Mira a <span className="animated-title italic pr-4">Vendetta</span> en Acción
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm font-medium">
              No es solo música, es una producción de primer nivel diseñada para que tu evento sea inolvidable.
            </p>
          </div>

          <div 
            onClick={() => setIsOpen(true)}
            className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group cursor-pointer"
          >
            <Image 
               src={thumbnailUrl} 
               alt="Video Thumbnail" 
               fill 
               className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
            />
            
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
               <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-2" />
               </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Audio profesional", "Show exclusivo", "Backline de gira", "Experiencia VIP"
            ].map((tag, i) => (
              <div key={i} className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary hover:border-primary/20 transition-all">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

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
