"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  ExternalLink, 
  Radio, 
  Disc3, 
  Flame
} from "lucide-react"
import Image from "next/image"

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  )
}

interface ReelItem {
  id: string
  title: string
  song: string
  side: "A" | "B"
  duration: string
  views: string
  thumbnail: string
  videoUrl?: string
  instagramUrl: string
  tag: string
}

const DEFAULT_REELS: ReelItem[] = [
  {
    id: "reel-1",
    title: "Tributo Mentiras — Pop Medley 80s",
    song: "Mentiras / Castillos / Cuando Baja la Marea",
    side: "A",
    duration: "0:45",
    views: "18.4K",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "🔥 Show Estelar"
  },
  {
    id: "reel-2",
    title: "De Música Ligera — Locura en la Pista",
    song: "Soda Stereo",
    side: "A",
    duration: "0:52",
    views: "24.1K",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "⚡ Rock en Español"
  },
  {
    id: "reel-3",
    title: "Lamento Boliviano — Solo de Guitarra",
    song: "Enanitos Verdes",
    side: "A",
    duration: "0:38",
    views: "15.9K",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "🎸 Guitar Solo"
  },
  {
    id: "reel-4",
    title: "Luis Miguel 90s Pop Medley",
    song: "La Incondicional / Ahora Te Puedes Marchar",
    side: "A",
    duration: "0:58",
    views: "31.2K",
    thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "⭐ Clásicos 90s"
  },
  {
    id: "reel-5",
    title: "Mr. Brightside — Salto Colectivo",
    song: "The Killers",
    side: "B",
    duration: "0:48",
    views: "42.8K",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "💥 Clímax Boda"
  },
  {
    id: "reel-6",
    title: "Don't Stop Me Now — Himno en Vivo",
    song: "Queen",
    side: "B",
    duration: "1:02",
    views: "27.5K",
    thumbnail: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "👑 Queen Anthem"
  },
  {
    id: "reel-7",
    title: "Levitating x 2000s Pop Mashup",
    song: "Dua Lipa & 2000s Hits",
    side: "B",
    duration: "0:44",
    views: "19.3K",
    thumbnail: "https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "✨ Pop 2000s"
  },
  {
    id: "reel-8",
    title: "Sweet Child O' Mine — Intro en Vivo",
    song: "Guns N' Roses",
    side: "B",
    duration: "0:49",
    views: "36.0K",
    thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/607_nxc0Rqc?autoplay=1",
    instagramUrl: "https://www.instagram.com/vendettamusica",
    tag: "⚡ Hard Rock 80s"
  }
]

interface CassetteReelsSectionProps {
  reels?: any[]
}

export function CassetteReelsSection({ reels = [] }: CassetteReelsSectionProps) {
  const [activeSide, setActiveSide] = useState<"A" | "B">("A")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [modalReel, setModalReel] = useState<ReelItem | null>(null)

  // Merge dynamic reels from DB if provided, else use rich curated list
  const allReels: ReelItem[] = reels.length > 0
    ? reels.map((r, i) => ({
        id: r.id || `db-reel-${i}`,
        title: r.title || `Vendetta Live Show ${i + 1}`,
        song: r.title || "Pop & Rock en Vivo",
        side: (i % 2 === 0 ? "A" : "B") as "A" | "B",
        duration: "0:45",
        views: `${15 + (i * 3)}.5K`,
        thumbnail: r.url || DEFAULT_REELS[i % DEFAULT_REELS.length].thumbnail,
        videoUrl: r.url?.includes("http") ? r.url : DEFAULT_REELS[i % DEFAULT_REELS.length].videoUrl,
        instagramUrl: "https://www.instagram.com/vendettamusica",
        tag: i % 2 === 0 ? "🔥 Live Reel" : "⚡ Concierto"
      }))
    : DEFAULT_REELS

  const visibleReels = allReels.filter(r => r.side === activeSide)
  const currentReel = visibleReels[currentReelIndex % visibleReels.length] || visibleReels[0]

  const handleNext = () => {
    setCurrentReelIndex(prev => (prev + 1) % visibleReels.length)
    setIsPlaying(true)
  }

  const handlePrev = () => {
    setCurrentReelIndex(prev => (prev - 1 + visibleReels.length) % visibleReels.length)
    setIsPlaying(true)
  }

  const handlePlayToggle = () => {
    if (!isPlaying) {
      setIsPlaying(true)
      setModalReel(currentReel)
    } else {
      setIsPlaying(false)
    }
  }

  const handleSelectReel = (reel: ReelItem, idx: number) => {
    setCurrentReelIndex(idx)
    setIsPlaying(true)
    setModalReel(reel)
  }

  return (
    <section id="mixtape" className="py-28 relative overflow-hidden bg-gradient-to-b from-[#07080D] via-[#15152B] to-[#0E0E1A]">
      {/* Máscara de mezcla de gradiente para transición suave con sección anterior */}
      <div className="section-blend-top bg-gradient-to-b from-[#07080D] to-transparent" />

      {/* Glow de concierto escénico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#6F0D2B]/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#FF5A5F]/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-25" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Cabecera de la Sección */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold text-xs uppercase tracking-[0.25em] mb-5 shadow-lg shadow-[#6F0D2B]/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Vendetta Live Mixtape
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-heading font-black text-white uppercase tracking-tight leading-tight md:leading-none mb-6">
            Directo desde el <br />
            <span className="text-gradient-encore italic pr-4">Escenario</span>
          </h2>
          <p className="text-[#F2F0EB]/75 text-base sm:text-lg font-normal leading-relaxed">
            Sin filtros ni poses. Mira cómo suena y se siente la energía de un concierto real en vivo en nuestras fechas más recientes.
          </p>
        </div>

        {/* -- CASSETTE 80s DECK --------------------------------------------- */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative rounded-3xl p-6 sm:p-10 border border-white/15 bg-gradient-to-b from-[#18182D]/90 via-[#101020]/95 to-[#080812] shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Tornillos de carcasa en esquinas */}
            <div className="absolute top-4 left-4 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border border-amber-300/40 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-black/70 rotate-45" />
            </div>
            <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border border-amber-300/40 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-black/70 -rotate-45" />
            </div>
            <div className="absolute bottom-4 left-4 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border border-amber-300/40 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-black/70 -rotate-12" />
            </div>
            <div className="absolute bottom-4 right-4 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border border-amber-300/40 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-black/70 rotate-30" />
            </div>

            {/* Barra Superior del Cassette: Formato & Side */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded bg-[#6F0D2B]/50 border border-[#FF5A5F]/40 text-[#F2F0EB] text-[11px] font-black uppercase tracking-widest shadow">
                  LADO {activeSide}
                </span>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                  {activeSide === "A" ? "Pop & Rock en Español" : "World Rock & Party Hits"}
                </span>
              </div>

              {/* Botones de Selección Lado A / Lado B */}
              <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => { setActiveSide("A"); setCurrentReelIndex(0); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeSide === "A"
                      ? "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-[#F2F0EB] shadow-md shadow-[#6F0D2B]/50 scale-105"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Side A
                </button>
                <button
                  onClick={() => { setActiveSide("B"); setCurrentReelIndex(0); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeSide === "B"
                      ? "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-[#F2F0EB] shadow-md shadow-[#6F0D2B]/50 scale-105"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Side B
                </button>
              </div>

              <div className="text-[10px] font-mono tracking-widest text-[#FF5A5F]/80 uppercase font-bold">
                HIGH BIAS / CrO2 CHROME
              </div>
            </div>

            {/* Ventana Central del Cassette: Carretes Giratorios y Cinta Magnética */}
            <div className="my-8 p-6 rounded-2xl bg-black/70 border border-white/15 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Carretes de cinta */}
              <div className="flex items-center justify-around w-full md:w-3/5 py-4 px-2 bg-gradient-to-r from-black/80 via-[#181024]/60 to-black/80 rounded-xl border border-white/5 relative">
                {/* Carrete Izquierdo */}
                <div className="relative flex items-center justify-center">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center shadow-lg ${
                    isPlaying ? "animate-spin-reel" : ""
                  }`}>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#FF5A5F]/40 flex items-center justify-center bg-black/60">
                      <div className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A5F]" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute -bottom-5 text-[9px] font-mono uppercase tracking-wider text-white/40">SUPPLY</span>
                </div>

                {/* Cinta Magnética Transversal y Ventana Medidora */}
                <div className="flex flex-col items-center justify-center px-4 flex-1">
                  <div className="h-1.5 w-full bg-gradient-to-r from-amber-900/60 via-amber-800 to-amber-900/60 rounded mb-2 shadow" />
                  <div className="px-3 py-1 rounded bg-black/80 border border-white/15 text-[10px] font-mono text-[#FF5A5F] tracking-widest">
                    {currentReel?.duration || "0:45"} / HI-FI
                  </div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-amber-900/60 via-amber-800 to-amber-900/60 rounded mt-2 shadow" />
                </div>

                {/* Carrete Derecho */}
                <div className="relative flex items-center justify-center">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center shadow-lg ${
                    isPlaying ? "animate-spin-reel" : ""
                  }`}>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#FF5A5F]/40 flex items-center justify-center bg-black/60">
                      <div className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A5F]" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute -bottom-5 text-[9px] font-mono uppercase tracking-wider text-white/40">TAKE-UP</span>
                </div>
              </div>

              {/* Display de Tema Activo & Vúmetro LED */}
              <div className="w-full md:w-2/5 flex flex-col justify-between gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/10">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#FF5A5F] mb-1 flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 animate-spin" /> Ahora en cabina:
                  </div>
                  <h4 className="text-white font-black text-base sm:text-lg leading-snug line-clamp-1">
                    {currentReel?.title}
                  </h4>
                  <p className="text-white/60 text-xs font-medium italic mt-1 line-clamp-1">
                    {currentReel?.song}
                  </p>
                </div>

                {/* Vúmetro LED Analógico */}
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/50 mb-2 uppercase tracking-wider">
                    <span>VU L</span>
                    <span>-20 -10 -5 0 +3dB</span>
                    <span>VU R</span>
                  </div>
                  <div className="space-y-1.5">
                    {/* Canal L */}
                    <div className="h-2 rounded bg-white/5 overflow-hidden flex gap-0.5">
                      <div className={`h-full bg-emerald-500 rounded-sm transition-all duration-150 ${isPlaying ? "w-[50%]" : "w-[20%]"}`} />
                      <div className={`h-full bg-amber-400 rounded-sm transition-all duration-150 ${isPlaying ? "w-[25%]" : "w-[0%]"}`} />
                      <div className={`h-full bg-[#FF5A5F] rounded-sm transition-all duration-150 ${isPlaying ? "w-[15%]" : "w-[0%]"}`} />
                    </div>
                    {/* Canal R */}
                    <div className="h-2 rounded bg-white/5 overflow-hidden flex gap-0.5">
                      <div className={`h-full bg-emerald-500 rounded-sm transition-all duration-150 ${isPlaying ? "w-[45%]" : "w-[18%]"}`} />
                      <div className={`h-full bg-amber-400 rounded-sm transition-all duration-150 ${isPlaying ? "w-[30%]" : "w-[0%]"}`} />
                      <div className={`h-full bg-[#FF5A5F] rounded-sm transition-all duration-150 ${isPlaying ? "w-[12%]" : "w-[0%]"}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de Reproducción Estilo Cassette Deck 80s */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:text-[#FF5A5F] hover:border-[#FF5A5F]/40 transition-all cursor-pointer active:scale-95"
                  title="Anterior"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayToggle}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#6F0D2B]/40 hover:opacity-95 transition-all cursor-pointer active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-white" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white" /> Reproducir Tape
                    </>
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:text-[#FF5A5F] hover:border-[#FF5A5F]/40 transition-all cursor-pointer active:scale-95"
                  title="Siguiente"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Botón directo a Instagram */}
              <a
                href="https://www.instagram.com/vendettamusica"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#833ab4]/20 via-[#fd1d1d]/20 to-[#fcb045]/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider hover:border-[#FF5A5F]/60 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <InstagramIcon className="w-4 h-4 text-[#FF5A5F]" />
                <span>Ver en Instagram @vendettamusica</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>

        {/* -- GRID DE REELS (TARJETAS 9:16) -------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {visibleReels.map((reel, idx) => {
            const isCurrent = currentReel?.id === reel.id
            return (
              <div
                key={reel.id}
                onClick={() => handleSelectReel(reel, idx)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 aspect-[9/14] border ${
                  isCurrent
                    ? "border-[#FF5A5F] ring-2 ring-[#FF5A5F]/50 scale-[1.02] shadow-2xl shadow-[#6F0D2B]/60"
                    : "border-white/10 hover:border-[#FF5A5F]/40 hover:-translate-y-1.5 shadow-lg"
                }`}
              >
                {/* Imagen del Reel */}
                <Image
                  src={reel.thumbnail}
                  alt={reel.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradiente oscuro superior e inferior */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />

                {/* Badge Superior */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#FF5A5F] text-[10px] font-black uppercase tracking-wider border border-white/10">
                    {reel.tag}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">
                    <Flame className="w-3 h-3 text-[#FF5A5F] fill-[#FF5A5F]" />
                    {reel.views}
                  </div>
                </div>

                {/* Botón Central Play en Hover */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? "bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] scale-110 shadow-lg shadow-[#FF5A5F]/40"
                      : "bg-black/60 border border-white/20 group-hover:bg-[#FF5A5F] group-hover:scale-110 group-hover:border-transparent"
                  }`}>
                    <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                  </div>
                </div>

                {/* Información Inferior */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <h4 className="font-bold text-white text-xs sm:text-sm leading-tight line-clamp-2 mb-1 group-hover:text-[#FF5A5F] transition-colors">
                    {reel.title}
                  </h4>
                  <p className="text-[11px] text-white/60 line-clamp-1 italic font-medium">
                    {reel.song}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Máscara de mezcla de gradiente para transición suave con siguiente sección */}
      <div className="section-blend-bottom bg-gradient-to-t from-[#0E0E1A] to-transparent" />

      {/* -- MODAL DE REEL INTERACTIVO -------------------------------------- */}
      <AnimatePresence>
        {modalReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#18182D] via-[#101020] to-[#07080D] border border-white/20 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl shadow-black/95"
            >
              {/* Botón Cerrar */}
              <button
                onClick={() => { setModalReel(null); setIsPlaying(false); }}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Modal */}
              <div className="p-5 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6F0D2B] to-[#FF5A5F] flex items-center justify-center text-white font-bold">
                  <Disc3 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm line-clamp-1">{modalReel.title}</h3>
                  <p className="text-[11px] text-white/60 italic">{modalReel.song}</p>
                </div>
              </div>

              {/* Video Player Embebido */}
              <div className="relative aspect-[9/16] w-full bg-black">
                {modalReel.videoUrl ? (
                  <iframe
                    src={modalReel.videoUrl}
                    title={modalReel.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <InstagramIcon className="w-16 h-16 text-[#FF5A5F] mb-4" />
                    <p className="text-white font-bold text-sm mb-4">Ver reel directamente en Instagram</p>
                    <a
                      href={modalReel.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-white font-bold text-xs uppercase tracking-wider"
                    >
                      Abrir en Instagram
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Modal con llamada a la acción */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40">
                <div className="text-[11px] font-bold text-white/70">
                  ¿Quieres este ambiente en tu evento?
                </div>
                <a
                  href="#paquetes"
                  onClick={() => setModalReel(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-[#F2F0EB] transition-colors"
                >
                  Cotizar
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
