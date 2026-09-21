"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Radio, 
  Zap, 
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2
} from "lucide-react"

interface ChannelState {
  id: string
  name: string
  icon: string
  color: string
  volume: number // 0 to 100
  isMuted: boolean
  isSolo: boolean
}

const INITIAL_CHANNELS: ChannelState[] = [
  { id: "ch-1", name: "Voz Líder", icon: "🎤", color: "#FF5A5F", volume: 85, isMuted: false, isSolo: false },
  { id: "ch-2", name: "Guitarra Crunch", icon: "🎸", color: "#A91D4D", volume: 80, isMuted: false, isSolo: false },
  { id: "ch-3", name: "Batería Rock", icon: "🥁", color: "#20D5E5", volume: 90, isMuted: false, isSolo: false },
  { id: "ch-4", name: "Bajo Eléctrico", icon: "🎸", color: "#7777FF", volume: 85, isMuted: false, isSolo: false },
  { id: "ch-5", name: "Sintes 80s", icon: "🎹", color: "#FFB300", volume: 75, isMuted: false, isSolo: false },
]

export function LiveStageMixer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [channels, setChannels] = useState<ChannelState[]>(INITIAL_CHANNELS)
  const [waveformProgress, setWaveformProgress] = useState(35) // 0 - 100%
  const [eqLevels, setEqLevels] = useState<number[]>([40, 65, 80, 55, 90, 70, 85, 60, 95, 75, 50, 65])
  
  // Audio Context and Nodes Ref
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const channelGainsRef = useRef<Record<string, GainNode>>({})
  const timerRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Initialize Web Audio Engine
  const initAudio = () => {
    if (audioCtxRef.current) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.5, ctx.currentTime)
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    masterGain.connect(analyser)
    analyserRef.current = analyser

    // Setup channel gains
    channels.forEach((ch) => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(ch.volume / 100, ctx.currentTime)
      g.connect(masterGain)
      channelGainsRef.current[ch.id] = g
    })
  }

  // Play synthesized groovy live concert pattern
  const playLoop = useCallback(() => {
    if (!audioCtxRef.current) initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    if (ctx.state === "suspended") ctx.resume()

    let step = 0
    // Drum & Rock synth loop sequence
    const interval = window.setInterval(() => {
      if (!audioCtxRef.current) return
      const now = audioCtxRef.current.currentTime

      // 1. Kick Drum (CH-3)
      if (step % 4 === 0 && !channels[2].isMuted) {
        const kickOsc = ctx.createOscillator()
        const kickGain = ctx.createGain()
        kickOsc.frequency.setValueAtTime(140, now)
        kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.35)
        kickGain.gain.setValueAtTime(0.7, now)
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
        kickOsc.connect(kickGain)
        if (channelGainsRef.current["ch-3"]) kickGain.connect(channelGainsRef.current["ch-3"])
        kickOsc.start(now)
        kickOsc.stop(now + 0.35)
      }

      // 2. Snare / Clack (CH-3)
      if ((step % 4 === 2) && !channels[2].isMuted) {
        const snareOsc = ctx.createOscillator()
        const snareGain = ctx.createGain()
        snareOsc.type = "triangle"
        snareOsc.frequency.setValueAtTime(220, now)
        snareGain.gain.setValueAtTime(0.4, now)
        snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)
        snareOsc.connect(snareGain)
        if (channelGainsRef.current["ch-3"]) snareGain.connect(channelGainsRef.current["ch-3"])
        snareOsc.start(now)
        snareOsc.stop(now + 0.18)
      }

      // 3. Bass Groove (CH-4)
      if (step % 2 === 0 && !channels[3].isMuted) {
        const bassNotes = [55, 65.41, 73.42, 82.41] // A, C, D, E
        const bassOsc = ctx.createOscillator()
        const bassGain = ctx.createGain()
        bassOsc.type = "sawtooth"
        bassOsc.frequency.setValueAtTime(bassNotes[(step / 2) % bassNotes.length], now)
        bassGain.gain.setValueAtTime(0.25, now)
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22)
        bassOsc.connect(bassGain)
        if (channelGainsRef.current["ch-4"]) bassGain.connect(channelGainsRef.current["ch-4"])
        bassOsc.start(now)
        bassOsc.stop(now + 0.22)
      }

      // 4. Guitar Chord Riff (CH-2)
      if (step % 2 === 1 && !channels[1].isMuted) {
        const guitarOsc = ctx.createOscillator()
        const guitarGain = ctx.createGain()
        guitarOsc.type = "square"
        guitarOsc.frequency.setValueAtTime(220 * 1.5, now)
        guitarGain.gain.setValueAtTime(0.15, now)
        guitarGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        guitarOsc.connect(guitarGain)
        if (channelGainsRef.current["ch-2"]) guitarGain.connect(channelGainsRef.current["ch-2"])
        guitarOsc.start(now)
        guitarOsc.stop(now + 0.15)
      }

      // 5. Vocals / Melody Hook (CH-1)
      if (step % 4 === 1 && !channels[0].isMuted) {
        const leadOsc = ctx.createOscillator()
        const leadGain = ctx.createGain()
        leadOsc.type = "sine"
        leadOsc.frequency.setValueAtTime(440, now)
        leadOsc.frequency.exponentialRampToValueAtTime(523.25, now + 0.2) // A to C
        leadGain.gain.setValueAtTime(0.2, now)
        leadGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        leadOsc.connect(leadGain)
        if (channelGainsRef.current["ch-1"]) leadGain.connect(channelGainsRef.current["ch-1"])
        leadOsc.start(now)
        leadOsc.stop(now + 0.3)
      }

      // 6. Synth Pad (CH-5)
      if (step % 8 === 0 && !channels[4].isMuted) {
        const synthOsc = ctx.createOscillator()
        const synthGain = ctx.createGain()
        synthOsc.type = "sawtooth"
        synthOsc.frequency.setValueAtTime(329.63, now) // E4
        synthGain.gain.setValueAtTime(0.12, now)
        synthGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        synthOsc.connect(synthGain)
        if (channelGainsRef.current["ch-5"]) synthGain.connect(channelGainsRef.current["ch-5"])
        synthOsc.start(now)
        synthOsc.stop(now + 0.8)
      }

      step = (step + 1) % 16
      setWaveformProgress((p) => (p + 1.2) % 100)
    }, 180)

    timerRef.current = interval

    // EQ Analyzer animation loop
    const updateEQ = () => {
      if (analyserRef.current && isPlaying) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        const levels = [
          Math.max(15, (data[0] / 255) * 100),
          Math.max(20, (data[2] / 255) * 100),
          Math.max(25, (data[4] / 255) * 100),
          Math.max(15, (data[6] / 255) * 100),
          Math.max(30, (data[8] / 255) * 100),
          Math.max(20, (data[10] / 255) * 100),
          Math.max(25, (data[12] / 255) * 100),
          Math.max(18, (data[14] / 255) * 100),
          Math.max(35, (data[16] / 255) * 100),
          Math.max(22, (data[18] / 255) * 100),
          Math.max(15, (data[20] / 255) * 100),
          Math.max(20, (data[22] / 255) * 100),
        ]
        setEqLevels(levels)
      } else {
        // Fallback simulation when idle
        setEqLevels(prev => prev.map(() => Math.floor(Math.random() * 55 + 20)))
      }
      animFrameRef.current = requestAnimationFrame(updateEQ)
    }
    animFrameRef.current = requestAnimationFrame(updateEQ)
  }, [channels, isPlaying])

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current) audioCtxRef.current.suspend()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playLoop()
    }
  }

  // Update channel volume
  const handleVolumeChange = (id: string, newVol: number) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        if (channelGainsRef.current[id] && audioCtxRef.current) {
          channelGainsRef.current[id].gain.setValueAtTime(
            ch.isMuted ? 0 : newVol / 100, 
            audioCtxRef.current.currentTime
          )
        }
        return { ...ch, volume: newVol }
      }
      return ch
    }))
  }

  // Toggle Mute
  const toggleMute = (id: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        const nextMuted = !ch.isMuted
        if (channelGainsRef.current[id] && audioCtxRef.current) {
          channelGainsRef.current[id].gain.setValueAtTime(
            nextMuted ? 0 : ch.volume / 100, 
            audioCtxRef.current.currentTime
          )
        }
        return { ...ch, isMuted: nextMuted }
      }
      return ch
    }))
  }

  // Toggle Solo
  const toggleSolo = (id: string) => {
    setChannels(prev => {
      const target = prev.find(c => c.id === id)
      const isCurrentlySolo = target?.isSolo
      const nextSoloState = !isCurrentlySolo

      return prev.map(ch => {
        const isThisSolo = ch.id === id ? nextSoloState : false
        const shouldMute = nextSoloState && ch.id !== id
        if (channelGainsRef.current[ch.id] && audioCtxRef.current) {
          channelGainsRef.current[ch.id].gain.setValueAtTime(
            shouldMute ? 0 : ch.volume / 100, 
            audioCtxRef.current.currentTime
          )
        }
        return { 
          ...ch, 
          isSolo: isThisSolo,
          isMuted: shouldMute 
        }
      })
    })
  }

  // Quick Preset Handlers
  const applyPreset = (preset: "full" | "rhythm" | "guitar") => {
    setChannels(prev => prev.map(ch => {
      let isMuted = false
      if (preset === "rhythm") isMuted = ch.id === "ch-1" || ch.id === "ch-2"
      if (preset === "guitar") isMuted = ch.id === "ch-1" || ch.id === "ch-5"
      if (channelGainsRef.current[ch.id] && audioCtxRef.current) {
        channelGainsRef.current[ch.id].gain.setValueAtTime(
          isMuted ? 0 : ch.volume / 100, 
          audioCtxRef.current.currentTime
        )
      }
      return { ...ch, isMuted, isSolo: false }
    }))
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  return (
    <section id="consola-live" className="py-24 md:py-32 bg-[#07080D] relative overflow-hidden border-t border-white/10">
      {/* Background Stage Aurora & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-layer-1 -top-32 right-1/4 animate-aurora-drift opacity-50" />
        <div className="aurora-layer-2 -bottom-40 left-10 animate-aurora-reverse opacity-45" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Console Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F2F0EB] mb-4">
              <span className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
              <span>SIMULADOR DE CONSOLA DE CONCIERTO (LIVE STEMS)</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-3">
              MEZCLA EL SHOW <span className="text-gradient-encore">EN TIEMPO REAL</span>
            </h2>
            <p className="text-[#F2F0EB]/70 text-sm md:text-base font-normal max-w-2xl">
              Prueba la pureza acústica de nuestra banda. Sube, baja o mutea canales en vivo para escuchar cada instrumento ejecutado con maestría.
            </p>
          </div>

          {/* Master Play/Pause Button with Neon Glow */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className={`px-8 py-4 rounded-2xl font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer shadow-xl ${
                isPlaying
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-2 border-emerald-300 shadow-emerald-500/30 animate-pulse"
                  : "bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-white border-2 border-[#FF5A5F]/40 shadow-[#FF5A5F]/30 hover:scale-105"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>CONSOLA ACTIVA (DETENER)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>▶ ESCUCHAR STEMS EN VIVO</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Console Flight-Case Frame with MODO NEON LIVE */}
        <div className="rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-2 border-white/20 bg-gradient-to-b from-[#111218]/95 via-[#0A0B10]/95 to-[#050608]/95 backdrop-blur-2xl shadow-2xl relative overflow-hidden neon-live-coral">
          
          {/* Top Panel: Interactive Scrubbable Waveform & EQ Spectrum */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
            
            {/* Interactive Waveform Display (2 Columns) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-3">
                <span className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#FF5A5F] animate-pulse" />
                  <span>FORMA DE ONDA MULTICANAL • HAZ CLIC PARA SALTAR</span>
                </span>
                <span className="text-[#FF5A5F] font-bold">POS: {Math.round(waveformProgress)}%</span>
              </div>

              {/* Clickable Waveform Bars */}
              <div 
                className="h-16 flex items-center gap-1 cursor-pointer select-none group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
                  setWaveformProgress(percentage)
                }}
              >
                {Array.from({ length: 48 }).map((_, i) => {
                  const barPos = (i / 48) * 100
                  const isPast = barPos <= waveformProgress
                  const heightFactor = Math.sin(i * 0.3) * 0.4 + Math.cos(i * 0.8) * 0.4 + 0.6
                  const barHeight = Math.max(18, Math.min(100, heightFactor * 100))

                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPast
                          ? "bg-gradient-to-t from-[#6F0D2B] via-[#FF5A5F] to-[#20D5E5] shadow-[0_0_8px_rgba(255,90,95,0.6)]"
                          : "bg-white/15 group-hover:bg-white/30"
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Real-time Jumping EQ Spectrum Visualizer */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-3">
                <span>ANALIZADOR EQ RTA</span>
                <span className="text-emerald-400 font-bold">20Hz - 20kHz</span>
              </div>

              <div className="h-16 flex items-end gap-1.5 pt-2">
                {eqLevels.map((lvl, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-t-sm transition-all duration-75 bg-gradient-to-t from-emerald-500 via-amber-400 to-[#FF5A5F]"
                      style={{ height: `${lvl}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-xs font-mono text-white/50 uppercase tracking-wider mr-2">PRESETS RÁPIDOS:</span>
            <button
              onClick={() => applyPreset("full")}
              className="px-4 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-mono text-white font-bold transition-all cursor-pointer"
            >
              ✓ Full Band 100%
            </button>
            <button
              onClick={() => applyPreset("rhythm")}
              className="px-4 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-mono text-cyan-300 font-bold transition-all cursor-pointer"
            >
              🥁 Solo Ritmo (Batería + Bajo)
            </button>
            <button
              onClick={() => applyPreset("guitar")}
              className="px-4 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-mono text-amber-300 font-bold transition-all cursor-pointer"
            >
              🎸 Solo Guitar Hero
            </button>
          </div>

          {/* 5 Channel Strips (Live Faders) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {channels.map((ch, index) => (
              <div 
                key={ch.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  ch.isMuted
                    ? "bg-black/40 border-white/5 opacity-60"
                    : "bg-white/[0.04] border-white/15 shadow-lg"
                }`}
              >
                {/* Channel Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{ch.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${ch.isMuted ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
                      <span className="text-[10px] font-mono text-white/40">CH 0{index + 1}</span>
                    </div>
                  </div>

                  <h4 className="text-white font-sans font-black text-sm tracking-tight mb-1 truncate">
                    {ch.name}
                  </h4>
                  <div className="text-[10px] font-mono text-white/50 mb-4">
                    {ch.isMuted ? "MUTED" : `${ch.volume}% VOL`}
                  </div>
                </div>

                {/* Vertical Fader Slider */}
                <div className="my-6 flex flex-col items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ch.isMuted ? 0 : ch.volume}
                    onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                    className="w-32 h-2.5 bg-black/70 rounded-lg appearance-none cursor-pointer accent-[#FF5A5F] rotate-[-90deg] my-10"
                    aria-label={`Volumen de ${ch.name}`}
                  />
                </div>

                {/* Mute & Solo Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => toggleMute(ch.id)}
                    className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      ch.isMuted 
                        ? "bg-red-600 text-white border-red-400 shadow-md shadow-red-500/30" 
                        : "bg-white/5 hover:bg-white/15 text-white/70 border-white/10"
                    }`}
                  >
                    MUTE
                  </button>

                  <button
                    onClick={() => toggleSolo(ch.id)}
                    className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      ch.isSolo 
                        ? "bg-amber-500 text-black border-amber-300 font-black shadow-md shadow-amber-500/30" 
                        : "bg-white/5 hover:bg-white/15 text-white/70 border-white/10"
                    }`}
                  >
                    SOLO
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Console Note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sistemas de Audio Digital Shure & Electro-Voice de tiro largo</span>
            </div>
            <a 
              href="/cotizar"
              className="text-[#FF5A5F] font-bold hover:underline uppercase tracking-wider"
            >
              Cotizar Banda para mi Evento →
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
