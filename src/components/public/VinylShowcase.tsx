"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Disc3, 
  Play, 
  Pause, 
  Sparkles, 
  Flame, 
  Music, 
  Volume2, 
  ExternalLink 
} from "lucide-react"

interface VinylTrack {
  id: string
  title: string
  artist: string
  era: string
  rpm: string
  accentColor: string
}

const TRACKS: VinylTrack[] = [
  { id: "tr-1", title: "Mentiras / Castillos / Cuando Baja La Marea", artist: "Tributo Pop 80s", era: "ÉPOCA 80S", rpm: "33 RPM", accentColor: "#FF5A5F" },
  { id: "tr-2", title: "De Música Ligera / Persiana Americana", artist: "Soda Stereo", era: "ÉPOCA 90S", rpm: "33 RPM", accentColor: "#20D5E5" },
  { id: "tr-3", title: "Mr. Brightside / Seven Nation Army", artist: "The Killers / White Stripes", era: "ÉPOCA 2000S", rpm: "33 RPM", accentColor: "#FFB300" },
  { id: "tr-4", title: "Matador / Devuélveme a mi Chica", artist: "Fabulosos Cadillacs / Hombres G", era: "FIESTA TOTAL", rpm: "33 RPM", accentColor: "#7777FF" }
]

export function VinylShowcase() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTrack, setActiveTrack] = useState<VinylTrack>(TRACKS[0])

  return (
    <div className="w-full my-12 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-[#0F1118]/95 via-[#08090E]/95 to-[#040507]/95 border-2 border-white/20 relative overflow-hidden shadow-2xl neon-live-cyan">
      
      {/* Aurora Ambient Background Flare */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#20D5E5]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#FF5A5F]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-10">
        
        {/* Left Column: Vinyl Turntable Platter */}
        <div className="lg:col-span-6 flex items-center justify-center relative select-none">
          
          {/* Turntable Platter Deck */}
          <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-full p-3 bg-gradient-to-br from-[#222] via-[#111] to-[#080808] border-4 border-white/20 shadow-2xl relative flex items-center justify-center">
            
            {/* Spinning Vinyl Record Disc */}
            <div 
              className={`w-full h-full rounded-full vinyl-grooves relative flex items-center justify-center cursor-pointer transition-all duration-700 ${
                isPlaying ? "animate-spin-vinyl" : ""
              }`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {/* Glossy Reflective Vinyl Shine */}
              <div className="absolute inset-0 rounded-full vinyl-shine pointer-events-none" />

              {/* Center Vinyl Paper Label */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] border-4 border-[#111] flex flex-col items-center justify-center text-center p-3 shadow-inner relative z-10">
                <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-white/80 font-bold">
                  VENDETTA MUSIC
                </span>
                <span className="text-white font-sans font-black text-xs sm:text-sm uppercase tracking-tight my-1 drop-shadow-md">
                  LIVE POP & ROCK
                </span>
                <span className="text-[8px] font-mono text-amber-300 font-bold">
                  {activeTrack.rpm} • STEREO
                </span>

                {/* Center Spindle Hole */}
                <div className="w-5 h-5 rounded-full bg-[#111] border-2 border-white/30 absolute shadow-inner" />
              </div>
            </div>

            {/* Tone-Arm (Turntable Needle) */}
            <div 
              className={`absolute top-4 right-4 w-28 h-40 pointer-events-none transition-transform duration-700 origin-top-right z-20 ${
                isPlaying ? "rotate-[26deg]" : "rotate-[0deg]"
              }`}
            >
              {/* Tone-arm base pivot */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-white/40 shadow-lg absolute right-0 top-0" />
              {/* Chrome Arm Tube */}
              <div className="w-2 h-32 bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-full absolute right-3 top-6 shadow-md" />
              {/* Cartridge headshell & stylus */}
              <div className="w-5 h-7 rounded-sm bg-[#FF5A5F] border border-white/50 absolute right-1.5 bottom-0 shadow-md" />
            </div>

          </div>

          {/* Quick Click Play Hint */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono text-white/80 uppercase tracking-widest pointer-events-none">
            {isPlaying ? "● 33 RPM GIRANDO" : "▶ HAZ CLIC PARA GIRAR"}
          </div>

        </div>

        {/* Right Column: Track & Era Selection */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#20D5E5]/30 bg-[#20D5E5]/10 text-[#20D5E5] text-[10px] font-mono font-bold uppercase tracking-widest mb-4">
              <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? "animate-spin" : ""}`} />
              <span>DISCO DE VINILO • SHOW REPERTORY</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-3">
              VIAJE SONORO <span className="text-gradient-encore">POR DÉCADAS</span>
            </h3>

            <p className="text-[#F2F0EB]/70 text-sm mb-6 leading-relaxed">
              De los clásicos ochenteros al rock alternativo de los 90s y los himnos pop rock de los 2000s. Selecciona una cara del vinilo para explorar el repertorio:
            </p>

            {/* Tracklist selection */}
            <div className="space-y-3 mb-8">
              {TRACKS.map((track) => {
                const isSelected = activeTrack.id === track.id
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setActiveTrack(track)
                      setIsPlaying(true)
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-white/10 border-[#FF5A5F]/50 shadow-md"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black bg-white/10 text-white font-mono">
                        {track.id.replace("tr-", "0")}
                      </div>
                      <div>
                        <h4 className="text-white font-sans font-bold text-sm leading-tight">
                          {track.title}
                        </h4>
                        <span className="text-[11px] font-mono text-[#FF5A5F] font-semibold">
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md text-[9px] font-mono font-extrabold uppercase tracking-wider bg-black/40 border border-white/10 text-white/70">
                      {track.era}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Turntable Action Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 shadow-lg cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? "Detener Vinilo" : "Girar Vinilo"}</span>
            </button>

            <a
              href="/repertorio"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-sans font-bold text-xs uppercase tracking-wider border border-white/15 flex items-center gap-2 transition-all"
            >
              <span>Ver Repertorio Completo (+150 Temas)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}
