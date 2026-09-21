"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sliders, Award, Zap, CheckCircle2, ChevronRight, Volume2 } from "lucide-react"

interface ClientItem {
  id: string
  name: string
  type: "Recinto Icónico" | "Corporativo & Gobierno" | "Gala & Boda" | "Rock & Club"
  city: string
  channel: string
  gain: string
  highlight?: string
}

const CLIENT_CHANNELS: ClientItem[] = [
  { id: "c1", name: "WTC México", type: "Recinto Icónico", city: "Ciudad de México", channel: "CH-01", gain: "+4.2 dB", highlight: "Conciertos de Gala y Convenciones Masivas" },
  { id: "c2", name: "Harley Davidson", type: "Corporativo & Gobierno", city: "Toluca", channel: "CH-02", gain: "+6.0 dB", highlight: "Aniversarios y Eventos Oficiales Biker" },
  { id: "c3", name: "Teatro Quimera", type: "Recinto Icónico", city: "Metepec", channel: "CH-03", gain: "+3.8 dB", highlight: "Festivales Culturales y Producción a Gran Escala" },
  { id: "c4", name: "COMEXANE A.C.", type: "Corporativo & Gobierno", city: "Nacional", channel: "CH-04", gain: "+5.1 dB", highlight: "Cenas de Gala Anuales e Inauguraciones" },
  { id: "c5", name: "McCarthy's Irish Pub", type: "Rock & Club", city: "Toluca / Metepec", channel: "CH-05", gain: "+7.4 dB", highlight: "Noches Legendarias de Puro Rock en Vivo" },
  { id: "c6", name: "UNTICKET", type: "Corporativo & Gobierno", city: "CDMX", channel: "CH-06", gain: "+4.9 dB", highlight: "Celebraciones de Fin de Año & Gala Privada" },
  { id: "c7", name: "Ayuntamiento de Toluca", type: "Corporativo & Gobierno", city: "Estado de México", channel: "CH-07", gain: "+5.5 dB", highlight: "Festivales Municipales y Eventos Masivos" },
  { id: "c8", name: "Ayuntamiento de Ixtapan de la Sal", type: "Recinto Icónico", city: "Festival de la Tierra", channel: "CH-08", gain: "+6.8 dB", highlight: "Concierto Estelar de Pop & Rock" },
  { id: "c9", name: "Bistró Mecha", type: "Gala & Boda", city: "Toluca", channel: "CH-09", gain: "+4.0 dB", highlight: "Celebraciones Exclusivas & Cenas de Aniversario" },
  { id: "c10", name: "Alquimia 73", type: "Gala & Boda", city: "Metepec", channel: "CH-10", gain: "+4.5 dB", highlight: "Fiestas Privadas & Noches Ochenteras" },
  { id: "c11", name: "Bruma", type: "Gala & Boda", city: "Valle de Bravo", channel: "CH-11", gain: "+5.8 dB", highlight: "Bodas y Noches de Gala en Avándaro" },
  { id: "c12", name: "Secretaría de Salud Edomex", type: "Corporativo & Gobierno", city: "Estado de México", channel: "CH-12", gain: "+4.7 dB", highlight: "Eventos Conmemorativos Oficiales" },
  { id: "c13", name: "Ayuntamiento de Ocoyoacac", type: "Corporativo & Gobierno", city: "Estado de México", channel: "CH-13", gain: "+5.0 dB", highlight: "Festivales Regionales y Celebraciones Cívicas" },
  { id: "c14", name: "Ayuntamiento de Santiago Tianguistenco", type: "Corporativo & Gobierno", city: "Estado de México", channel: "CH-14", gain: "+5.2 dB", highlight: "Eventos Estelares en Plaza Principal" },
]

export function AutographWall() {
  const [selectedClient, setSelectedClient] = useState<ClientItem>(CLIENT_CHANNELS[0])
  const [vuNeedleLeft, setVuNeedleLeft] = useState(-5)
  const [vuNeedleRight, setVuNeedleRight] = useState(2)

  // Gentle live VU meter flutter simulating studio outboard processing
  useEffect(() => {
    const interval = setInterval(() => {
      const flutterL = -12 + Math.random() * 20
      const flutterR = -8 + Math.random() * 18
      setVuNeedleLeft(flutterL)
      setVuNeedleRight(flutterR)
    }, 600)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="clientes" className="py-28 md:py-36 relative overflow-hidden bg-[#07080D]">
      {/* Top and Bottom gradient blend masks */}
      <div className="section-blend-top bg-gradient-to-b from-[#07080D] to-transparent" />
      <div className="section-blend-bottom bg-gradient-to-t from-[#07080D] to-transparent" />

      {/* Atmospheric Stage Lights Behind the Rack */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[650px] h-[550px] bg-[#6F0D2B]/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        {/* Header Section: Clearly marked "CLIENTES SALÓN DE LA FAMA" */}
        <div className="text-center mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-[0.3em] mb-5 shadow-sm">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>SALÓN DE LA FAMA • CLIENTES DESTACADOS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#22c55e]" />
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-sans font-black text-white uppercase tracking-tight leading-none mb-5">
            CLIENTES <span className="text-gradient-encore italic">SALÓN DE LA FAMA</span>
          </h2>

          <p className="text-[#F2F0EB]/75 max-w-3xl mx-auto text-base sm:text-lg font-normal leading-relaxed">
            Recintos icónicos, marcas líderes y celebraciones gubernamentales y privadas que han vibrado con el concierto en vivo de Vendetta Music.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* RACK UNIT 19" STUDIO ENCLOSURE */}
        {/* ========================================================================= */}
        <div className="relative mx-auto rounded-3xl border-2 border-zinc-700 bg-gradient-to-b from-[#1C1F28] via-[#13161F] to-[#0A0C11] shadow-[0_35px_100px_rgba(0,0,0,0.95)] overflow-hidden">
          
          {/* Brushed Metal Texture */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Chassis Bevel Metallic Highlight */}
          <div className="h-[2px] w-full bg-gradient-to-r from-zinc-600/10 via-zinc-200/50 to-zinc-600/10" />

          {/* RACK EARS & FACEPLATE WRAPPER */}
          <div className="flex">

            {/* Left Rack Ear with Chrome Hex Screws & Aluminum Handle */}
            <div className="w-9 sm:w-14 bg-gradient-to-r from-[#222733] to-[#161922] border-r border-zinc-800 flex flex-col justify-between py-8 items-center shrink-0">
              <RackScrew />
              <RackHandle />
              <RackScrew />
            </div>

            {/* MAIN FACEPLATE PANEL */}
            <div className="flex-1 p-5 sm:p-8 md:p-12 flex flex-col gap-8 sm:gap-10">

              {/* RACK TOP BAR: BRANDING + VINTAGE DUAL VU METERS */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-800/90">
                {/* Brand & Model Serigraphy */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#22c55e] animate-pulse" />
                    <span className="font-mono text-xs font-black tracking-[0.3em] text-emerald-400 uppercase">
                      VENDETTA AUDIO LABS // MODEL 2026
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-300 tracking-tight">
                    CLIENTES • SALÓN DE LA FAMA
                  </div>
                  <div className="text-xs font-mono text-zinc-400 tracking-widest uppercase mt-1">
                    OUTBOARD COMPRESSOR RACK & MATRIZ DE RECINTOS ESTELARES
                  </div>
                </div>

                {/* DUAL ANALOG VU METERS */}
                <div className="flex items-center gap-3 sm:gap-5 bg-[#090B0F] p-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <VuMeter label="CH-L (STAGE GAIN)" angle={vuNeedleLeft} />
                  <VuMeter label="CH-R (CROWD SAT)" angle={vuNeedleRight} />

                  {/* Signal Peak LEDs */}
                  <div className="flex flex-col gap-2 pl-3 border-l border-zinc-800">
                    <span className="text-[9px] font-mono text-zinc-400 font-bold">PEAK</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_#ef4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90 shadow-[0_0_8px_#f59e0b]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* ROTARY ANALOG ATTENUATORS & KNOBS ROW */}
              <div className="hidden sm:flex items-center justify-between px-6 py-3 bg-gradient-to-r from-black/50 via-black/25 to-black/50 rounded-2xl border border-zinc-800/80 text-zinc-400 font-mono text-[10px] uppercase tracking-widest shadow-inner">
                <StudioKnob label="INPUT DRIVE" value="+8.5 dB" />
                <StudioKnob label="COMP RATIO" value="4:1" />
                <StudioKnob label="STAGE ATTACK" value="15 ms" />
                <StudioKnob label="ENERGY" value="100%" />
                <StudioKnob label="SATISFACTION" value="+12 dB" />
                <StudioKnob label="ENCORE OUTPUT" value="MAX" />
              </div>

              {/* =================================================================== */}
              {/* CLIENT MATRIX: SPACIOUS ELLIPSE BUTTONS WITH BLINKING GREEN LED */}
              {/* =================================================================== */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Canales Oficiales del Salón de la Fama (Haz click para conectar canal)</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 font-bold">
                    14 CLIENTES CONECTADOS
                  </span>
                </div>

                {/* 2-Column Responsive Grid: Plenty of space, NO truncated text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {CLIENT_CHANNELS.map((item) => {
                    const isSelected = selectedClient.id === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedClient(item)}
                        className={`group relative flex items-center justify-between px-6 py-4.5 rounded-full border-2 transition-all duration-300 cursor-pointer text-left select-none ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-950/90 via-[#15291E] to-[#101F17] border-emerald-400 shadow-[0_0_25px_rgba(34,197,94,0.35),inset_0_2px_4px_rgba(255,255,255,0.2)] scale-[1.015]"
                            : "bg-gradient-to-b from-[#1F2430] via-[#161922] to-[#0E1017] border-zinc-700/90 hover:border-emerald-400/70 hover:bg-[#1B202B] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),0_6px_16px_rgba(0,0,0,0.6)] active:scale-98"
                        }`}
                      >
                        {/* LEFT: BLINKING GREEN LED + CHANNEL BADGE */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Dedicated Blinking Green Studio LED */}
                          <div className="relative flex items-center justify-center w-4 h-4">
                            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-80" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_12px_#22c55e,0_0_4px_#ffffff]" />
                          </div>

                          {/* Channel ID */}
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            {item.channel}
                          </span>
                        </div>

                        {/* CENTER: CLIENT NAME (FULL, NEVER TRUNCATED) + META */}
                        <div className="flex-1 min-w-0 pl-3.5 pr-2">
                          <span className="font-sans font-black text-sm sm:text-base md:text-lg text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors block">
                            {item.name}
                          </span>
                          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-zinc-300 font-semibold">{item.type}</span>
                            <span className="text-emerald-400">•</span>
                            <span className="text-zinc-400">{item.city}</span>
                          </div>
                        </div>

                        {/* RIGHT: GAIN STATUS BADGE */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
                            isSelected
                              ? "bg-emerald-400 text-black border-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                              : "bg-zinc-800/80 border-zinc-700 text-emerald-400 group-hover:border-emerald-500/50"
                          }`}>
                            {item.gain}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* RACK MONITOR / DIGITAL LCD READOUT — GIVING PROMINENCE TO SELECTED CLIENT */}
              <div className="p-6 rounded-2xl bg-[#080A0F] border-2 border-zinc-800/90 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono">
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_#22c55e] animate-pulse shrink-0 mt-1" />
                  <div>
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                      <span>CANAL SELECCIONADO [{selectedClient.channel}]</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-white">GANANCIA DE SALA: {selectedClient.gain}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-sans font-black text-white tracking-tight">
                      {selectedClient.name}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {selectedClient.type} • {selectedClient.city} — <span className="text-zinc-200 italic">{selectedClient.highlight}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SHOW VERIFICADO 100% EN VIVO</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM CTA: CONNECT YOUR EVENT */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-5 border-t border-zinc-800/80">
                <div className="text-center sm:text-left">
                  <h4 className="text-white font-sans font-black text-base sm:text-lg">
                    ¿Tu evento será el próximo en ingresar a este Salón de la Fama?
                  </h4>
                  <p className="text-[#F2F0EB]/70 text-xs sm:text-sm font-normal">
                    Lleva la misma calidad, energía y producción técnica a tu boda o fiesta privada.
                  </p>
                </div>

                <a
                  href="#paquetes"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] hover:from-[#7e1032] hover:to-[#ff6d72] text-white font-sans font-bold text-xs uppercase tracking-widest border border-white/20 shadow-xl shadow-[#FF5A5F]/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>Cotizar mi Evento</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

            </div>

            {/* Right Rack Ear with Chrome Hex Screws & Aluminum Handle */}
            <div className="w-9 sm:w-14 bg-gradient-to-l from-[#222733] to-[#161922] border-l border-zinc-800 flex flex-col justify-between py-8 items-center shrink-0">
              <RackScrew />
              <RackHandle />
              <RackScrew />
            </div>

          </div>

          {/* Bottom Chassis Bevel Shadow */}
          <div className="h-[2px] w-full bg-gradient-to-r from-black via-zinc-900 to-black" />
        </div>

      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS: VINTAGE ANALOG VU METER & HARDWARE DETAILS
// ---------------------------------------------------------------------------

function VuMeter({ label, angle = 0 }: { label: string; angle: number }) {
  return (
    <div className="w-32 sm:w-40 h-20 sm:h-24 bg-gradient-to-b from-[#2E2519] via-[#1D1710] to-[#0F0C08] rounded-xl border border-amber-900/40 p-2 relative flex flex-col justify-between overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
      {/* Warm Incandescent Lamp Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Meter Scale Arc */}
      <div className="relative z-10 text-center pt-1">
        <div className="text-[7px] font-mono tracking-widest text-amber-200/60 uppercase">
          -20 -10 -7 -5 -3 0 +1 +3
        </div>
        <div className="w-full h-[1px] bg-gradient-to-r from-amber-500/30 via-amber-400/60 to-red-500/80 mt-0.5" />
      </div>

      {/* Needle Pivot & Moving Indicator */}
      <div className="relative h-8 flex items-end justify-center">
        <motion.div
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="w-[1.5px] h-14 bg-gradient-to-t from-red-600 via-amber-400 to-amber-200 origin-bottom shadow-[0_0_4px_rgba(251,191,36,0.6)]"
          style={{ transformOrigin: "bottom center" }}
        />
        {/* Pivot Cap */}
        <div className="absolute bottom-0 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-md" />
      </div>

      {/* Meter Title */}
      <div className="text-[8px] font-mono text-center text-amber-400/80 font-bold uppercase tracking-wider relative z-10">
        {label}
      </div>
    </div>
  )
}

function StudioKnob({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Knob Dial */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-700 shadow-md flex items-center justify-center relative">
        {/* Tick Mark Indicator */}
        <div className="w-0.5 h-3 bg-emerald-400 rounded-full -translate-y-2 shadow-[0_0_4px_#22c55e]" />
      </div>
      <span className="text-[8px] text-zinc-300 font-bold">{label}</span>
      <span className="text-[8px] text-emerald-400 font-mono font-bold">{value}</span>
    </div>
  )
}

function RackScrew() {
  return (
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-900 border border-zinc-600 shadow-inner flex items-center justify-center">
      <div className="w-3 h-[1.5px] bg-zinc-900 rotate-45" />
      <div className="w-3 h-[1.5px] bg-zinc-900 -rotate-45 -ml-3" />
    </div>
  )
}

function RackHandle() {
  return (
    <div className="w-2.5 sm:w-3 h-32 sm:h-44 rounded-full bg-gradient-to-r from-zinc-500 via-zinc-200 to-zinc-600 border border-zinc-700 shadow-[2px_0_8px_rgba(0,0,0,0.8)]" />
  )
}
