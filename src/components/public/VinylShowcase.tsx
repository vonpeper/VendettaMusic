"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Disc3, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ExternalLink 
} from "lucide-react"

interface VinylTrack {
  id: string
  title: string
  artist: string
  era: string
  rpm: string
  accentColor: string
  audioUrl: string
}

const TRACKS: VinylTrack[] = [
  { 
    id: "tr-1", 
    title: "Dancing Queen", 
    artist: "ABBA", 
    era: "DISCO POP 70S", 
    rpm: "33 RPM", 
    accentColor: "#FF5A5F", 
    audioUrl: "/audio/dancing-queen.mp3" 
  },
  { 
    id: "tr-2", 
    title: "Flowers", 
    artist: "Miley Cyrus", 
    era: "HITS MODERNOS", 
    rpm: "45 RPM", 
    accentColor: "#20D5E5", 
    audioUrl: "/audio/flowers.mp3" 
  },
  { 
    id: "tr-3", 
    title: "I Wanna Dance with Somebody", 
    artist: "Whitney Houston", 
    era: "HIMNO 80S", 
    rpm: "33 RPM", 
    accentColor: "#FFB300", 
    audioUrl: "/audio/i-wanna-dance-with-somebody.mp3" 
  },
  { 
    id: "tr-4", 
    title: "Locked Out of Heaven", 
    artist: "Bruno Mars", 
    era: "FUNK & ROCK", 
    rpm: "45 RPM", 
    accentColor: "#00E676", 
    audioUrl: "/audio/locked-out-of-heaven.mp3" 
  },
  { 
    id: "tr-5", 
    title: "September", 
    artist: "Earth, Wind & Fire", 
    era: "DISCO FUNK", 
    rpm: "33 RPM", 
    accentColor: "#A855F7", 
    audioUrl: "/audio/september.mp3" 
  }
]

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function VinylShowcase() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTrackIndex, setActiveTrackIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoPlayRef = useRef(false)

  const activeTrack = TRACKS[activeTrackIndex]

  // Track change synchronization
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.src = TRACKS[activeTrackIndex].audioUrl
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    setDuration(0)

    if (autoPlayRef.current) {
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Audio playback interrupted or blocked:", err)
            setIsPlaying(false)
          })
      }
    }
  }, [activeTrackIndex])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      autoPlayRef.current = false
    } else {
      autoPlayRef.current = true
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Playback error:", err)
            setIsPlaying(false)
          })
      }
    }
  }

  const selectTrack = (index: number) => {
    if (index === activeTrackIndex) {
      togglePlay()
      return
    }
    autoPlayRef.current = true
    setActiveTrackIndex(index)
  }

  const handleNext = () => {
    autoPlayRef.current = isPlaying
    setActiveTrackIndex((prev) => (prev + 1) % TRACKS.length)
  }

  const handlePrev = () => {
    autoPlayRef.current = isPlaying
    setActiveTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    const nextMuted = !isMuted
    audioRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  return (
    <div className="w-full my-12 p-6 sm:p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-[#0F1118]/95 via-[#08090E]/95 to-[#040507]/95 border-2 border-white/20 relative overflow-hidden shadow-2xl neon-live-cyan">
      
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0)
          }
        }}
        onEnded={() => {
          autoPlayRef.current = true
          setActiveTrackIndex((prev) => (prev + 1) % TRACKS.length)
        }}
      />

      {/* Aurora Ambient Background Flare */}
      <div 
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-20"
        style={{ backgroundColor: activeTrack.accentColor }}
      />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#FF5A5F]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-10">
        
        {/* Left Column: Vinyl Turntable Platter */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative select-none">
          
          {/* Turntable Platter Deck */}
          <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[380px] md:h-[380px] rounded-full p-3 bg-gradient-to-br from-[#222] via-[#111] to-[#080808] border-4 border-white/20 shadow-2xl relative flex items-center justify-center">
            
            {/* Spinning Vinyl Record Disc */}
            <div 
              className={`w-full h-full rounded-full vinyl-grooves relative flex items-center justify-center cursor-pointer transition-all duration-700 ${
                isPlaying ? "animate-spin-vinyl" : ""
              }`}
              onClick={togglePlay}
              title={isPlaying ? "Pausar vinilo" : "Reproducir vinilo"}
            >
              {/* Glossy Reflective Vinyl Shine */}
              <div className="absolute inset-0 rounded-full vinyl-shine pointer-events-none" />

              {/* Center Vinyl Paper Label */}
              <div 
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-[#111] flex flex-col items-center justify-center text-center p-2.5 shadow-inner relative z-10 transition-all duration-700"
                style={{
                  background: `radial-gradient(circle at center, #151515 0%, #202020 50%, ${activeTrack.accentColor}dd 100%)`
                }}
              >
                <span className="text-[7px] sm:text-[8px] font-mono uppercase tracking-widest text-white/70 font-black">
                  VENDETTA LIVE
                </span>
                <span className="text-white font-sans font-black text-[10px] sm:text-xs uppercase tracking-tight my-0.5 drop-shadow line-clamp-2 px-1 leading-tight max-w-[120px]">
                  {activeTrack.title}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-300 truncate max-w-[110px]">
                  {activeTrack.artist}
                </span>
                <span className="text-[7px] font-mono text-white/70 font-semibold mt-0.5">
                  {activeTrack.rpm} • STEREO
                </span>

                {/* Center Spindle Hole */}
                <div className="w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-white/30 absolute shadow-inner" />
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
              <div 
                className="w-5 h-7 rounded-sm border border-white/50 absolute right-1.5 bottom-0 shadow-md transition-colors duration-500"
                style={{ backgroundColor: activeTrack.accentColor }}
              />
            </div>

          </div>

          {/* Quick Click Play Hint */}
          <div 
            onClick={togglePlay}
            className="mt-4 px-4 py-1.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono text-white/80 uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg hover:border-white/40 transition-all"
          >
            {isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">● EN VIVO • {activeTrack.rpm} GIRANDO</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white/80" />
                <span>HAZ CLIC PARA ESCUCHAR EN VIVO</span>
              </>
            )}
          </div>

        </div>

        {/* Right Column: Track & Era Selection + Transport */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#20D5E5]/30 bg-[#20D5E5]/10 text-[#20D5E5] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
              <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? "animate-spin" : ""}`} />
              <span>DISCO DE VINILO • MUESTRAS EN VIVO</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-2">
              ESCÚCHANOS <span className="text-gradient-encore">EN ACCIÓN</span>
            </h3>

            <p className="text-[#F2F0EB]/70 text-xs sm:text-sm mb-5 leading-relaxed">
              Grabaciones en vivo reales interpretadas por Vendetta. Selecciona una pista para escuchar nuestra versatilidad musical:
            </p>

            {/* Tracklist selection */}
            <div className="space-y-2 mb-6">
              {TRACKS.map((track, idx) => {
                const isSelected = activeTrackIndex === idx
                const isThisPlaying = isSelected && isPlaying

                return (
                  <div
                    key={track.id}
                    onClick={() => selectTrack(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-white/10 shadow-lg"
                        : "bg-white/[0.02] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                    style={{
                      borderColor: isSelected ? `${track.accentColor}80` : undefined,
                      boxShadow: isSelected ? `0 0 20px ${track.accentColor}25` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0 transition-colors"
                        style={{
                          backgroundColor: isSelected ? track.accentColor : "rgba(255,255,255,0.08)",
                          color: isSelected ? "#000" : "#fff"
                        }}
                      >
                        {isThisPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                            <motion.span
                              className="w-1 bg-black rounded-full"
                              animate={{ height: ["25%", "90%", "35%"] }}
                              transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                            />
                            <motion.span
                              className="w-1 bg-black rounded-full"
                              animate={{ height: ["60%", "100%", "20%"] }}
                              transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut", delay: 0.1 }}
                            />
                            <motion.span
                              className="w-1 bg-black rounded-full"
                              animate={{ height: ["35%", "85%", "55%"] }}
                              transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut", delay: 0.2 }}
                            />
                          </div>
                        ) : isSelected ? (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        ) : (
                          <span>0{idx + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className={`font-sans font-bold text-xs sm:text-sm leading-tight truncate ${isSelected ? "text-white" : "text-[#F2F0EB]/90 group-hover:text-white"}`}>
                          {track.title}
                        </h4>
                        <span 
                          className="text-[11px] font-mono font-semibold truncate block mt-0.5"
                          style={{ color: track.accentColor }}
                        >
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="px-2.5 py-1 rounded-md text-[9px] font-mono font-extrabold uppercase tracking-wider bg-black/50 border border-white/10 text-white/70">
                        {track.era}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white group-hover:bg-white/10 transition-colors">
                        {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Master Transport & Scrubber Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3.5">
            {/* Scrubber / Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                <span className="flex items-center gap-1.5 font-bold text-white/90 truncate mr-2">
                  <Disc3 className={`w-3.5 h-3.5 shrink-0 ${isPlaying ? "animate-spin text-[#20D5E5]" : ""}`} />
                  <span className="truncate max-w-[180px] sm:max-w-[260px]">{activeTrack.title} — {activeTrack.artist}</span>
                </span>
                <span className="shrink-0">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Progreso de la pista"
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5A5F] focus:outline-none"
                />
              </div>
            </div>

            {/* Playback Controls & Links */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Prev Track */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Canción anterior"
                  title="Canción anterior"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play / Pause main button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] hover:opacity-95 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? "Pausar" : "Reproducir"}</span>
                </button>

                {/* Next Track */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Siguiente canción"
                  title="Siguiente canción"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Mute / Unmute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                  title={isMuted ? "Activar sonido" : "Silenciar"}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-[#FF5A5F]" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Repertorio link */}
              <a
                href="/repertorio"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-sans font-bold text-xs uppercase tracking-wider border border-white/15 flex items-center gap-2 transition-all ml-auto"
              >
                <span>Repertorio (+150)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
