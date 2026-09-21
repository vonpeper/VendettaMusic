"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sliders, Cpu, Activity, Zap, CheckCircle2, ChevronRight, Radio } from "lucide-react"

interface ClientItem {
  id: string
  name: string
  type: "Recinto Icónico" | "Corporativo & Gobierno" | "Gala & Boda" | "Rock & Club"
  city: string
  channel: string
  gain: string
}

const CLIENT_CHANNELS: ClientItem[] = [
  { id: "c1", name: "WTC México", type: "Recinto Icónico", city: "CDMX", channel: "CH-01", gain: "+4.2 dB" },
  { id: "c2", name: "Harley Davidson", type: "Corporativo & Gobierno", city: "Toluca", channel: "CH-02", gain: "+6.0 dB" },
  { id: "c3", name: "Teatro Quimera", type: "Recinto Icónico", city: "Metepec", channel: "CH-03", gain: "+3.8 dB" },
  { id: "c4", name: "COMEXANE A.C.", type: "Corporativo & Gobierno", city: "Nacional", channel: "CH-04", gain: "+5.1 dB" },
  { id: "c5", name: "McCarthy's Irish Pub", type: "Rock & Club", city: "Toluca / Metepec", channel: "CH-05", gain: "+7.4 dB" },
  { id: "c6", name: "UNTICKET", type: "Corporativo & Gobierno", city: "CDMX", channel: "CH-06", gain: "+4.9 dB" },
  { id: "c7", name: "Ayto. de Toluca", type: "Corporativo & Gobierno", city: "Edomex", channel: "CH-07", gain: "+5.5 dB" },
  { id: "c8", name: "Ayto. de Ixtapan de la Sal", type: "Recinto Icónico", city: "Festival", channel: "CH-08", gain: "+6.8 dB" },
  { id: "c9", name: "Bistró Mecha", type: "Gala & Boda", city: "Toluca", channel: "CH-09", gain: "+4.0 dB" },
  { id: "c10", name: "Alquimia 73", type: "Gala & Boda", city: "Metepec", channel: "CH-10", gain: "+4.5 dB" },
  { id: "c11", name: "Bruma", type: "Gala & Boda", city: "Valle de Bravo", channel: "CH-11", gain: "+5.8 dB" },
  { id: "c12", name: "Sec. de Salud Edomex", type: "Corporativo & Gobierno", city: "Edomex", channel: "CH-12", gain: "+4.7 dB" },
  { id: "c13", name: "Ayto. de Ocoyoacac", type: "Corporativo & Gobierno", city: "Edomex", channel: "CH-13", gain: "+5.0 dB" },
  { id: "c14", name: "Ayto. Santiago Tianguistenco", type: "Corporativo & Gobierno", city: "Edomex", channel: "CH-14", gain: "+5.2 dB" },
]

export function AutographWall() {
  const [selectedClient, setSelectedClient] = useState<ClientItem>(CLIENT_CHANNELS[0])
  const [vuNeedleLeft, setVuNeedleLeft] = useState(-5)
  const [vuNeedleRight, setVuNeedleRight] = useState(2)

  // Gentle live VU meter flutter simulating studio outboard processing
  useEffect(() => {
    const interval = setInterval(() => {
      const flutterL = -15 + Math.random() * 22
      const flutterR = -10 + Math.random() * 20
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
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[500px] bg-[#6F0D2B]/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span>SALÓN DE LA FAMA • OUTBOARD COMPRESSOR RACK</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-sans font-black text-white uppercase tracking-tight leading-none mb-4">
            CLIENTES QUE <span className="text-gradient-encore italic">HACEN HISTORIA</span>
          </h2>

          <p className="text-[#F2F0EB]/70 max-w-2xl mx-auto text-sm sm:text-base font-normal">
            Marcas, recintos oficiales y producciones que han conectado su sonido con el escenario en vivo de Vendetta Music.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* RACK UNIT 19" STUDIO ENCLOSURE */}
        {/* ========================================================================= */}
        <div className="relative mx-auto rounded-3xl border border-zinc-700/80 bg-gradient-to-b from-[#1A1D24] via-[#12141A] to-[#0A0C10] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden">
          
          {/* Brushed Metal Texture Lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Chassis Bevel Highlight */}
          <div className="h-[2px] w-full bg-gradient-to-r from-zinc-500/10 via-zinc-300/40 to-zinc-500/10" />

          {/* RACK EARS & FACEPLATE WRAPPER */}
          <div className="flex">

            {/* Left Rack Ear with Heavy-Duty Screws */}
            <div className="w-8 sm:w-12 bg-gradient-to-r from-[#1E222B] to-[#141720] border-r border-zinc-800 flex flex-col justify-between py-6 items-center shrink-0">
              <RackScrew />
              <RackHandle />
              <RackScrew />
            </div>

            {/* MAIN FACEPLATE PANEL */}
            <div className="flex-1 p-5 sm:p-8 md:p-10 flex flex-col gap-8">

              {/* RACK TOP BAR: BRANDING + VINTAGE DUAL VU METERS */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-800/90">
                {/* Brand & Model Serigraphy */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#22c55e] animate-pulse" />
                    <span className="font-mono text-xs font-black tracking-[0.28em] text-white uppercase">
                      VENDETTA AUDIO LABS
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 tracking-tight">
                    VF-2026 // DYNAMICS HALL OF FAME
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mt-0.5">
                    STEREO MASTERING COMPRESSOR & CLIENT ROUTING MATRIX
                  </div>
                </div>

                {/* DUAL ANALOG VU METERS */}
                <div className="flex items-center gap-3 sm:gap-4 bg-[#0B0D12] p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <VuMeter label="CH L (STAGE GAIN)" angle={vuNeedleLeft} />
                  <VuMeter label="CH R (CROWD SAT)" angle={vuNeedleRight} />

                  {/* Signal Peak LEDs */}
                  <div className="flex flex-col gap-1.5 pl-2 border-l border-zinc-800">
                    <span className="text-[8px] font-mono text-zinc-500">PK</span>
                    <span className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_6px_#ef4444]" />
                    <span className="w-2 h-2 rounded-full bg-amber-400/90 shadow-[0_0_6px_#f59e0b]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* ROTARY ANALOG ATTENUATORS & KNOBS ROW */}
              <div className="hidden sm:flex items-center justify-between px-2 sm:px-6 py-2 bg-gradient-to-r from-black/40 via-black/20 to-black/40 rounded-xl border border-zinc-800/60 text-zinc-400 font-mono text-[9px] uppercase tracking-widest">
                <StudioKnob label="INPUT DRIVE" value="+8.5 dB" />
                <StudioKnob label="ATTACK" value="15 ms" />
                <StudioKnob label="RATIO" value="4:1" />
                <StudioKnob label="ENERGY" value="100%" />
                <StudioKnob label="SATISFACTION" value="+12 dB" />
                <StudioKnob label="ENCORE GAIN" value="MAX" />
              </div>

              {/* =================================================================== */}
              {/* CLIENT MATRIX: ELLIPSE BUTTONS WITH BLINKING GREEN LED */}
              {/* =================================================================== */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Canales de Clientes Oficiales (Haz click para probar canal)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    14 CHANNELS ONLINE
                  </span>
                </div>

                {/* Grid of Ellipse Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  {CLIENT_CHANNELS.map((item) => {
                    const isSelected = selectedClient.id === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedClient(item)}
                        className={`group relative flex items-center justify-between px-5 py-3.5 rounded-full border transition-all duration-300 cursor-pointer text-left select-none ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-950/80 via-[#15241C] to-[#121E17] border-emerald-400/80 shadow-[0_0_20px_rgba(34,197,94,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] scale-[1.02]"
                            : "bg-gradient-to-b from-[#1C202A] via-[#141720] to-[#0E1017] border-zinc-700/80 hover:border-emerald-400/50 hover:bg-[#181D26] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)] active:scale-95"
                        }`}
                      >
                        {/* LEFT: BLINKING GREEN LED */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative flex items-center justify-center w-3.5 h-3.5">
                            {/* Blinking ping wave */}
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            {/* Solid glowing green core LED */}
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_#22c55e,0_0_3px_#ffffff]" />
                          </div>

                          {/* Channel ID */}
                          <span className="font-mono text-[10px] text-zinc-400 group-hover:text-zinc-300 font-semibold tracking-wider">
                            {item.channel}
                          </span>
                        </div>

                        {/* CENTER: CLIENT NAME */}
                        <div className="flex-1 px-3 truncate">
                          <span className="font-sans font-black text-xs sm:text-sm text-white tracking-wide truncate block group-hover:text-emerald-300 transition-colors">
                            {item.name}
                          </span>
                        </div>

                        {/* RIGHT: TYPE BADGE */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-colors ${
                            isSelected
                              ? "bg-emerald-400/20 border-emerald-400/40 text-emerald-300 font-bold"
                              : "bg-zinc-800/80 border-zinc-700 text-zinc-400 group-hover:border-emerald-500/30 group-hover:text-zinc-300"
                          }`}>
                            {item.city}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* RACK MONITOR / DIGITAL LCD READOUT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#080A0E] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 font-mono shadow-inner">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#22c55e] animate-pulse shrink-0" />
                  <div className="text-xs text-zinc-300 truncate">
                    <span className="text-emerald-400 font-bold">MONITOR ACTIVO [{selectedClient.channel}]: </span>
                    <span className="text-white font-bold">{selectedClient.name}</span>
                    <span className="text-zinc-500"> • {selectedClient.type} ({selectedClient.city}) • NIVEL: {selectedClient.gain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CALIDAD AUDITADA 100% EN VIVO</span>
                </div>
              </div>

              {/* BOTTOM CTA: CONNECT YOUR EVENT */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
                <div className="text-center sm:text-left">
                  <h4 className="text-white font-sans font-bold text-sm sm:text-base">
                    ¿Tu evento será el próximo en ser procesado con la energía de Vendetta?
                  </h4>
                  <p className="text-[#F2F0EB]/60 text-xs font-normal">
                    Lleva la producción y el sonido de este Salón de la Fama a tu boda o fiesta privada.
                  </p>
                </div>

                <a
                  href="#paquetes"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] hover:from-[#7e1032] hover:to-[#ff6d72] text-white font-sans font-bold text-xs uppercase tracking-widest border border-white/20 shadow-lg shadow-[#FF5A5F]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>Conectar mi Evento</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

            </div>

            {/* Right Rack Ear with Heavy-Duty Screws */}
            <div className="w-8 sm:w-12 bg-gradient-to-l from-[#1E222B] to-[#141720] border-l border-zinc-800 flex flex-col justify-between py-6 items-center shrink-0">
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
    <div className="flex flex-col items-center gap-1">
      {/* Knob Dial */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-700 shadow-md flex items-center justify-center relative">
        {/* Tick Mark Indicator */}
        <div className="w-0.5 h-3 bg-emerald-400 rounded-full -translate-y-1.5 shadow-[0_0_4px_#22c55e]" />
      </div>
      <span className="text-[8px] text-zinc-400 font-semibold">{label}</span>
      <span className="text-[7px] text-emerald-400/90 font-mono">{value}</span>
    </div>
  )
}

function RackScrew() {
  return (
    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-900 border border-zinc-600 shadow-inner flex items-center justify-center">
      <div className="w-2.5 h-[1px] bg-zinc-900 rotate-45" />
      <div className="w-2.5 h-[1px] bg-zinc-900 -rotate-45 -ml-2.5" />
    </div>
  )
}

function RackHandle() {
  return (
    <div className="w-2 sm:w-2.5 h-28 sm:h-36 rounded-full bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-600 border border-zinc-700 shadow-[2px_0_6px_rgba(0,0,0,0.8)]" />
  )
}
