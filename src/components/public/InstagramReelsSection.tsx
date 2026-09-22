"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  X, 
  ExternalLink, 
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Image from "next/image"

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  )
}

export interface ReelItem {
  id: string
  title: string
  song: string
  category: "all" | "poprock" | "mentiras" | "bodas"
  duration: string
  views: string
  thumbnail: string
  videoUrl?: string
  instagramUrl: string
  tag: string
}

const OFFICIAL_REELS: ReelItem[] = [
  {
    id: "reel-1",
    title: "Vizzio Metepec — Pop & Rock en Vivo",
    song: "Vendetta en Concierto",
    category: "poprock",
    duration: "0:13",
    views: "18.4K",
    thumbnail: "/images/reels/reel-vizzio.jpg",
    videoUrl: "/videos/reels/reel-vizzio.mp4",
    instagramUrl: "https://www.instagram.com/reel/Dc_il-KOqBb/",
    tag: "🔥 Vizzio Metepec"
  },
  {
    id: "reel-2",
    title: "COMEXANE A.C. — Cena de Gala & Inauguración",
    song: "Cena Anual de Gala",
    category: "bodas",
    duration: "1:19",
    views: "38.2K",
    thumbnail: "/images/reels/reel-comexane.jpg",
    videoUrl: "/videos/reels/reel-comexane.mp4",
    instagramUrl: "https://www.instagram.com/reel/DcYzk_yOy_y/",
    tag: "💎 Gala COMEXANE"
  },
  {
    id: "reel-3",
    title: "Alquimia 73 — Ochenteras, Molotov & Rosa Pastel",
    song: "Disco, 80s, 90s & Rock en Español",
    category: "mentiras",
    duration: "1:41",
    views: "31.4K",
    thumbnail: "/images/reels/reel-alquimia.jpg",
    videoUrl: "/videos/reels/reel-alquimia.mp4",
    instagramUrl: "https://www.instagram.com/reel/Da7HQT5gk8J/",
    tag: "⚡ Alquimia 73"
  },
  {
    id: "reel-4",
    title: "Bruma Memories & Drinks — Gran Noche en Vivo",
    song: "Valle de Bravo Rock & Hits",
    category: "poprock",
    duration: "0:20",
    views: "29.7K",
    thumbnail: "/images/reels/reel-bruma.jpg",
    videoUrl: "/videos/reels/reel-bruma.mp4",
    instagramUrl: "https://www.instagram.com/reel/DYtp2LFum_y/",
    tag: "🍸 Bruma Valle"
  },
  {
    id: "reel-5",
    title: "Festejo Privado — ¡Muchas Felicidades Imelda!",
    song: "Banda en Vivo & Clientes Amigos",
    category: "bodas",
    duration: "0:30",
    views: "24.6K",
    thumbnail: "/images/reels/reel-imelda.jpg",
    videoUrl: "/videos/reels/reel-imelda.mp4",
    instagramUrl: "https://www.instagram.com/reel/DdRuHREMPVv/",
    tag: "❤️ Festejo Imelda"
  },
  {
    id: "reel-6",
    title: "Celebración Exclusiva — Festejo Frida",
    song: "Hits en Vivo & Gran Ambiente",
    category: "poprock",
    duration: "0:32",
    views: "27.1K",
    thumbnail: "/images/reels/reel-frida.jpg",
    videoUrl: "/videos/reels/reel-frida.mp4",
    instagramUrl: "https://www.instagram.com/reel/DdMJmI3ON4x/",
    tag: "🎉 Festejo Frida"
  }
]

export function InstagramReelsSection({ reels = [] }: { reels?: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "poprock" | "mentiras" | "bodas">("all")
  const [activeModalReel, setActiveModalReel] = useState<ReelItem | null>(null)

  // Map incoming DB reels if any with valid URLs, otherwise prioritize official curated reels
  const items: ReelItem[] = (reels && reels.length > 0)
    ? reels.map((r, i) => ({
        id: r.id || `reel-db-${i}`,
        title: r.title || OFFICIAL_REELS[i % OFFICIAL_REELS.length].title,
        song: r.song || OFFICIAL_REELS[i % OFFICIAL_REELS.length].song,
        category: (r.category as any) || OFFICIAL_REELS[i % OFFICIAL_REELS.length].category,
        duration: r.duration || OFFICIAL_REELS[i % OFFICIAL_REELS.length].duration,
        views: r.views || OFFICIAL_REELS[i % OFFICIAL_REELS.length].views,
        thumbnail: r.thumbnail || OFFICIAL_REELS[i % OFFICIAL_REELS.length].thumbnail,
        videoUrl: r.videoUrl || r.url || OFFICIAL_REELS[i % OFFICIAL_REELS.length].videoUrl,
        instagramUrl: r.instagramUrl || OFFICIAL_REELS[i % OFFICIAL_REELS.length].instagramUrl,
        tag: r.tag || OFFICIAL_REELS[i % OFFICIAL_REELS.length].tag
      }))
    : OFFICIAL_REELS

  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  // Carousel navigation within modal
  const currentIndex = activeModalReel 
    ? filteredItems.findIndex(item => item.id === activeModalReel.id)
    : -1

  const handleNextReel = useCallback(() => {
    if (filteredItems.length === 0) return
    const nextIdx = (currentIndex + 1) % filteredItems.length
    setActiveModalReel(filteredItems[nextIdx])
  }, [currentIndex, filteredItems])

  const handlePrevReel = useCallback(() => {
    if (filteredItems.length === 0) return
    const prevIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length
    setActiveModalReel(filteredItems[prevIdx])
  }, [currentIndex, filteredItems])

  // Keyboard navigation (Escape to close, Left/Right arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModalReel) return
      if (e.key === "Escape") setActiveModalReel(null)
      if (e.key === "ArrowRight") handleNextReel()
      if (e.key === "ArrowLeft") handlePrevReel()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeModalReel, handleNextReel, handlePrevReel])

  return (
    <section id="reels" className="py-24 md:py-32 bg-[#07080D] relative overflow-hidden border-t border-white/10">
      {/* Top and Bottom gradient blend masks */}
      <div className="section-blend-top bg-gradient-to-b from-[#0E0E1A] to-transparent" />
      <div className="section-blend-bottom bg-gradient-to-t from-[#0E0E1A] to-transparent" />

      {/* Aurora Ambient Stage Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-layer-1 -top-32 left-1/4 animate-aurora-drift" />
        <div className="aurora-layer-2 -bottom-40 right-1/4 animate-aurora-reverse" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        {/* Stage Monitor Header with Official Instagram Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            {/* Live Rig Indicator & Instagram Profile Pill */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F2F0EB]">
                <div className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
                <span>LIVE RIG ON STAGE</span>
              </div>

              <a 
                href="https://www.instagram.com/vendettamusica" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF5A5F]/40 bg-[#FF5A5F]/15 hover:bg-[#FF5A5F]/25 text-[#FF5A5F] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>@vendettamusica</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </a>
            </div>

            <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-4">
              REELS & EN VIVO <span className="text-gradient-encore">EN INSTAGRAM</span>
            </h2>
            <p className="text-[#F2F0EB]/70 text-sm md:text-base font-normal">
              Grabaciones directas desde el escenario y la pista. Reproduce al instante con audio real de consola o visítanos en Instagram.
            </p>
          </div>

          {/* Direct CTA to Instagram Profile */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/vendettamusica"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-white font-sans font-bold text-xs uppercase tracking-widest border border-white/20 shadow-lg shadow-[#FF5A5F]/25 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Seguir en Instagram</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {[
            { id: "all", label: "🔥 Todos los Reels (6)" },
            { id: "poprock", label: "🎸 Pop & Rock en Vivo" },
            { id: "mentiras", label: "🎭 Ochenteras & Medleys" },
            { id: "bodas", label: "💍 Galas & Festejos" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                selectedCategory === tab.id
                  ? "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-white border-white/30 shadow-md shadow-[#FF5A5F]/20"
                  : "bg-white/5 text-[#F2F0EB]/60 hover:text-white hover:bg-white/10 border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Responsive 9:16 Video Reel Cards Grid (3 columns on desktop for 6 items) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredItems.map((reel) => (
            <motion.div
              key={reel.id}
              whileHover={{ y: -6, scale: 1.015 }}
              onClick={() => setActiveModalReel(reel)}
              className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-xl group cursor-pointer shadow-2xl transition-all"
            >
              {/* Reel Poster Image */}
              <Image
                src={reel.thumbnail}
                alt={reel.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                unoptimized
              />

              {/* Stage Lighting & Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/40 pointer-events-none" />

              {/* Top Meta: Category Badge & Instagram Icon */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-[#F2F0EB]">
                  {reel.tag}
                </span>

                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#FF5A5F]">
                  <InstagramIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Central Glowing Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#6F0D2B] border-2 border-white/40 flex items-center justify-center text-white shadow-2xl shadow-[#FF5A5F]/50 group-hover:scale-115 transition-transform duration-300">
                  <Play className="w-7 h-7 fill-white translate-x-0.5" />
                </div>
              </div>

              {/* Bottom Content: Title, Sound & Details (Flex structure: absolutely zero overlapping!) */}
              <div className="absolute bottom-0 inset-x-0 p-5 z-10 bg-gradient-to-t from-black via-black/90 to-transparent pt-14 flex flex-col gap-2 pointer-events-none">
                {/* Audio label row with integrated VU meter */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#FF5A5F] text-[11px] font-semibold uppercase tracking-wider line-clamp-1">
                    {reel.song}
                  </span>
                  
                  {/* Live Audio Visualizer Bars */}
                  <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 rounded-full bg-[#FF5A5F] animate-vu-1" />
                      <span className="w-0.5 rounded-full bg-[#FF5A5F] animate-vu-2" />
                      <span className="w-0.5 rounded-full bg-white animate-vu-3" />
                      <span className="w-0.5 rounded-full bg-[#FF5A5F] animate-vu-1" />
                    </div>
                    <span className="text-[9px] font-mono text-white/80 uppercase tracking-wider">LIVE</span>
                  </div>
                </div>

                <h3 className="text-white font-sans font-black text-base sm:text-lg leading-tight drop-shadow-md line-clamp-2">
                  {reel.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-white/60 font-mono pt-2 border-t border-white/10">
                  <span>{reel.views} vistas</span>
                  <span className="text-[#FF5A5F] font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3 h-3 fill-current" /> Reproducir
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer info note with direct profile handle */}
        <div className="mt-12 text-center">
          <p className="text-[#F2F0EB]/60 text-xs md:text-sm font-normal">
            ¿Quieres ver más canciones y videos de conciertos recientes? Visita{" "}
            <a 
              href="https://www.instagram.com/vendettamusica" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF5A5F] font-bold hover:underline inline-flex items-center gap-1"
            >
              @vendettamusica en Instagram <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
      </div>

      {/* Video Player Modal with Native In-Site Playback */}
      <AnimatePresence>
        {activeModalReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModalReel(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModalReel(null)}
              aria-label="Cerrar reproductor"
              className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white z-[120] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Desktop Navigation Arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevReel() }}
              aria-label="Video anterior"
              className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md items-center justify-center text-white transition-all z-[115] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNextReel() }}
              aria-label="Siguiente video"
              className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md items-center justify-center text-white transition-all z-[115] cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-[#0E1017] rounded-3xl border border-white/20 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
            >
              {/* Native Video Player Container */}
              <div className="relative w-full md:w-3/5 min-h-[380px] md:min-h-[560px] bg-black flex items-center justify-center overflow-hidden">
                {activeModalReel.videoUrl?.endsWith(".mp4") ? (
                  <video
                    key={activeModalReel.videoUrl}
                    src={activeModalReel.videoUrl}
                    poster={activeModalReel.thumbnail}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full max-h-[55vh] md:max-h-[85vh] object-contain bg-black"
                  />
                ) : activeModalReel.videoUrl ? (
                  <iframe
                    src={activeModalReel.videoUrl}
                    title={activeModalReel.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full min-h-[460px] md:min-h-[580px] border-0"
                  />
                ) : (
                  <div className="text-center p-6 text-white">
                    <InstagramIcon className="w-12 h-12 text-[#FF5A5F] mx-auto mb-4" />
                    <p className="font-bold">Ver directamente en la app de Instagram</p>
                  </div>
                )}
              </div>

              {/* Sidebar Info & Controls */}
              <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] to-transparent overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        EN VIVO • REEL {currentIndex >= 0 ? `${currentIndex + 1}/${filteredItems.length}` : ""}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {activeModalReel.duration}
                    </span>
                  </div>

                  <h3 className="text-white font-sans font-black text-xl md:text-2xl leading-tight mb-2">
                    {activeModalReel.title}
                  </h3>

                  <p className="text-[#FF5A5F] font-semibold text-sm mb-4">
                    {activeModalReel.song}
                  </p>

                  <div className="space-y-2 text-xs text-white/70 font-mono mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between">
                      <span className="text-white/40">ORIGEN:</span>
                      <span className="text-white">@vendettamusica</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">VISTAS:</span>
                      <span className="text-white">{activeModalReel.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">AUDIO:</span>
                      <span className="text-emerald-400">Directo de Consola (Stereo)</span>
                    </div>
                  </div>

                  {/* Mobile Prev / Next Controls */}
                  <div className="flex lg:hidden items-center justify-between gap-2 py-2 mb-4">
                    <button 
                      onClick={handlePrevReel} 
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button 
                      onClick={handleNextReel} 
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/10">
                  <a
                    href="#paquetes"
                    onClick={() => setActiveModalReel(null)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-white text-xs font-bold uppercase tracking-widest border border-white/20 shadow-md shadow-[#FF5A5F]/20 hover:opacity-95 transition-all"
                  >
                    <span>Cotizar este Show</span>
                  </a>

                  <a
                    href={activeModalReel.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <InstagramIcon className="w-4 h-4 text-[#FF5A5F]" />
                    <span>Ver en Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
