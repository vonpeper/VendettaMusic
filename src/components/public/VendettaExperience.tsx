"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Flame, 
  Music, 
  ShieldCheck, 
  Sliders, 
  Radio, 
  Zap, 
  Volume2,
  CheckCircle2
} from "lucide-react";

export function VendettaExperience() {
  return (
    <section 
      id="experiencia"
      className="relative w-full py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-[#07080D] overflow-hidden border-y border-white/10"
      aria-label="Experiencia y producción de Vendetta"
    >
      {/* Aurora Ambient Stage Highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-layer-1 top-0 left-1/3 animate-aurora-drift opacity-60" />
        <div className="aurora-layer-2 bottom-0 right-10 animate-aurora-reverse opacity-50" />
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="max-w-[1280px] mx-auto relative z-10">
        {/* Section Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.3em] mb-4 text-[#F2F0EB]">
              <div className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
              <span>EXPERIENCIA & RIDER DE GIRA</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-4">
              POR QUÉ <span className="text-gradient-encore">VENDETTA MUSIC</span>
            </h2>
            <p className="text-[#F2F0EB]/70 text-sm md:text-base font-normal">
              La diferencia entre contratar un grupo promedio y vivir un verdadero concierto en tu evento.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="hidden lg:flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">CONTRATO & GARANTÍA</div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">100% Fecha Asegurada</div>
            </div>
          </div>
        </div>

        {/* Dynamic Bento Grid of Stage Experience */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          
          {/* Bento Card 1 (Large 2 Columns): +500 Shows con Audio Spectrum */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-2 lg:col-span-2 rounded-3xl p-8 md:p-10 border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl relative overflow-hidden group shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5A5F]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF5A5F]/25 transition-all" />

            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 text-[#FF5A5F] text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#FF5A5F] animate-ping" />
                MÉTRICA COMPROBADA
              </div>

              {/* Classic Ruby Jewel Pilot Lamp */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/40 border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
                <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest">STAGE CH-01</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-6xl md:text-8xl font-sans font-black text-[#F2F0EB] tracking-tight leading-none drop-shadow-md">
                +500
              </span>
              <span className="text-[#FF5A5F] text-2xl md:text-3xl font-black font-sans uppercase">
                EVENTOS
              </span>
            </div>

            <p className="text-[#F2F0EB]/80 text-sm md:text-base font-normal max-w-lg mb-6 leading-relaxed">
              Bodas de destino, galas corporativas y aniversarios inolvidables. Sabemos cómo leer la pista y elevar el clímax musical minuto a minuto.
            </p>

            {/* Simulated Live Stage Audio Spectrum Analyzer */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/60 uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-[#FF5A5F] animate-pulse" />
                <span>Nivel de Presión Sonora</span>
              </div>

              {/* Animated VU Spectrum Bars */}
              <div className="flex items-end gap-1 h-5">
                <span className="w-1.5 bg-emerald-500 rounded-sm animate-vu-1" />
                <span className="w-1.5 bg-emerald-400 rounded-sm animate-vu-2" />
                <span className="w-1.5 bg-emerald-400 rounded-sm animate-vu-3" />
                <span className="w-1.5 bg-amber-400 rounded-sm animate-vu-1" />
                <span className="w-1.5 bg-amber-400 rounded-sm animate-vu-2" />
                <span className="w-1.5 bg-[#FF5A5F] rounded-sm animate-vu-3" />
                <span className="w-1.5 bg-[#FF5A5F] rounded-sm animate-vu-1" />
                <span className="text-[10px] font-mono font-bold text-white/80 ml-2">108 dB SPL</span>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: 15 Años & Bulbos Calientes */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-3xl p-8 border border-white/15 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl relative overflow-hidden group shadow-xl flex flex-col justify-between"
          >
            {/* Warm Valve Tube Incandescent Background Glow */}
            <div className="absolute inset-0 vacuum-tube-glow opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                {/* Amber Amp LED */}
                <div className="w-2.5 h-2.5 rounded-full amp-jewel-amber" />
              </div>

              <div className="text-5xl md:text-6xl font-sans font-black text-[#F2F0EB] tracking-tight leading-none mb-2">
                15 <span className="text-[#FF5A5F] text-3xl font-bold">AÑOS</span>
              </div>

              <div className="text-xs font-mono uppercase tracking-widest text-[#FF5A5F] mb-3 font-semibold">
                DE TRAYECTORIA REAL
              </div>

              <p className="text-[#F2F0EB]/70 text-xs md:text-sm leading-relaxed">
                Músicos con maestría en vivo, sincronía milimétrica y el calor auténtico de amplificadores a bulbos en el escenario.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>VALVULAR • BOUTIQUE</span>
              <span className="text-amber-400 font-bold">WARM TONE</span>
            </div>
          </motion.div>

          {/* Bento Card 3: 5 Músicos en Escena & Consola */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-3xl p-8 border border-white/15 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl relative overflow-hidden group shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#7777FF]/10 border border-[#7777FF]/30 flex items-center justify-center text-[#7777FF]">
                  <Music className="w-5 h-5" />
                </div>
                {/* Emerald Amp LED */}
                <div className="w-2.5 h-2.5 rounded-full amp-jewel-emerald" />
              </div>

              <div className="text-5xl md:text-6xl font-sans font-black text-[#F2F0EB] tracking-tight leading-none mb-2">
                5
              </div>

              <div className="text-xs font-mono uppercase tracking-widest text-[#7777FF] mb-3 font-semibold">
                MÚSICOS EN ESCENA
              </div>

              <p className="text-[#F2F0EB]/70 text-xs md:text-sm leading-relaxed">
                Voz Líder, Guitarra Eléctrica, Bajo, Batería Acústica y Teclados/Secuencias. Alineación completa sin imitaciones.
              </p>
            </div>

            {/* 5 Channel Meters UI */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-1.5">
              {["VOZ", "GUITARRA", "BAJO", "BATERÍA", "SYNTH"].map((inst, i) => (
                <div key={inst} className="flex items-center justify-between text-[9px] font-mono text-white/50">
                  <span>{inst}</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-2 rounded-xs bg-emerald-500" />
                    <span className="w-1 h-2 rounded-xs bg-emerald-500" />
                    <span className="w-1 h-2 rounded-xs bg-emerald-400" />
                    <span className="w-1 h-2 rounded-xs bg-amber-400" />
                    <span className="w-1 h-2 rounded-xs bg-[#FF5A5F]" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bento Card 4: Cero Pistas Pregrabadas (100% Live Rock) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-3xl p-8 border border-white/15 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl relative overflow-hidden group shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5A5F]/15 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                  TRUE BYPASS
                </div>
              </div>

              <div className="text-2xl md:text-3xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-tight mb-2">
                100% EN VIVO
              </div>

              <div className="text-xs font-mono uppercase tracking-widest text-[#FF5A5F] mb-3 font-semibold">
                CERO PISTAS PREGRABADAS
              </div>

              <p className="text-[#F2F0EB]/70 text-xs md:text-sm leading-relaxed">
                Cada riff de guitarra, golpe de batería y nota vocal es ejecutado en tiempo real. La autenticidad que hace vibrar a tus invitados.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sin playback ni mímica</span>
            </div>
          </motion.div>

          {/* Bento Card 5 (Large 3 Columns on desktop): Tour Level Production */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-2 lg:col-span-3 rounded-3xl p-8 md:p-10 border border-white/15 bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent backdrop-blur-xl relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                <Sliders className="w-3 h-3" />
                RIDER TÉCNICO INTERNACIONAL
              </div>

              <h3 className="text-2xl md:text-4xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-tight mb-3">
                PRODUCCIÓN <span className="text-gradient-encore">TOUR-LEVEL</span>
              </h3>

              <p className="text-[#F2F0EB]/80 text-xs md:text-sm leading-relaxed mb-6">
                Sistema Line Array de alta definición acústica, consolas digitales con monitoreo in-ear para cada músico, iluminación robótica DMX programada al tempo de cada canción.
              </p>

              <div className="flex flex-wrap gap-2">
                {["Line Array Pro Audio", "In-Ear Shure / Sennheiser", "Robóticas DMX & Haz", "Backline Marshall / Fender", "Consola Digital M32"].map(spec => (
                  <span key={spec} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#F2F0EB]/80">
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action to Quote */}
            <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end">
              <a
                href="/cotizar"
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-white font-sans font-bold text-xs uppercase tracking-widest border border-white/20 shadow-lg shadow-[#FF5A5F]/20 hover:scale-105 active:scale-95 transition-all text-center"
              >
                Cotizar este Show
              </a>
              <span className="text-[10px] font-mono text-white/40 mt-2">Disponibilidad 2026/2027</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
