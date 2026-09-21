"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star, Award, CheckCircle2, Ticket } from "lucide-react"

interface AutographItem {
  name: string
  type: "Recinto Icónico" | "Corporativo & Gobierno" | "Gala & Boda" | "Rock & Club"
  city: string
  passId: string
  highlight?: boolean
}

const HALL_OF_FAME: AutographItem[] = [
  { name: "WTC México", type: "Recinto Icónico", city: "CDMX", passId: "VIP-001", highlight: true },
  { name: "Harley Davidson", type: "Corporativo & Gobierno", city: "Toluca", passId: "VIP-002", highlight: true },
  { name: "Teatro Quimera", type: "Recinto Icónico", city: "Metepec", passId: "VIP-003", highlight: true },
  { name: "COMEXANE A.C.", type: "Corporativo & Gobierno", city: "Nacional", passId: "VIP-004" },
  { name: "McCarthy's Irish Pub", type: "Rock & Club", city: "Toluca / Metepec", passId: "VIP-005" },
  { name: "UNTICKET", type: "Corporativo & Gobierno", city: "CDMX", passId: "VIP-006" },
  { name: "Ayto. de Toluca", type: "Corporativo & Gobierno", city: "Edomex", passId: "VIP-007" },
  { name: "Ayto. de Ixtapan de la Sal", type: "Recinto Icónico", city: "Festival", passId: "VIP-008" },
  { name: "Bistró Mecha", type: "Gala & Boda", city: "Toluca", passId: "VIP-009" },
  { name: "Alquimia 73", type: "Gala & Boda", city: "Metepec", passId: "VIP-010" },
  { name: "Bruma", type: "Gala & Boda", city: "Valle de Bravo", passId: "VIP-011", highlight: true },
  { name: "Sec. de Salud Edomex", type: "Corporativo & Gobierno", city: "Edomex", passId: "VIP-012" },
  { name: "Ayto. de Ocoyoacac", type: "Corporativo & Gobierno", city: "Edomex", passId: "VIP-013" },
  { name: "Ayto. Santiago Tianguistenco", type: "Corporativo & Gobierno", city: "Edomex", passId: "VIP-014" },
]

export function AutographWall() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden bg-[#07080D]">
      {/* Top and Bottom gradient blend masks */}
      <div className="section-blend-top bg-gradient-to-b from-[#07080D] to-transparent" />
      <div className="section-blend-bottom bg-gradient-to-t from-[#07080D] to-transparent" />

      {/* Background Stage Warm Lighting Overhead (Backstage Floodlights) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Overhead Spotlights */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#FF5A5F]/15 rounded-full blur-[140px]" />
        
        {/* Flight-Case / Stage Texture */}
        <div className="absolute inset-0 stage-grid-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        {/* Wall Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-amber-300 mb-5">
            <Award className="w-3.5 h-3.5" />
            <span>SALÓN DE LA FAMA • PARED DE AUTÓGRAFOS</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-none mb-4">
            BACKSTAGE <span className="text-gradient-encore">HALL OF FAME</span>
          </h2>

          <p className="text-[#F2F0EB]/70 max-w-2xl mx-auto text-sm sm:text-base font-normal leading-relaxed">
            Las empresas, recintos oficiales y celebraciones exclusivas que han vibrado con el show de Vendetta Music y dejaron su firma en nuestro backstage.
          </p>
        </div>

        {/* Autograph Wall Grid: Styled as VIP Laminates & Backstage Gold Plaques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {HALL_OF_FAME.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ duration: 0.25 }}
              className={`group relative rounded-3xl p-6 border transition-all duration-300 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-2xl ${
                item.highlight
                  ? "bg-gradient-to-b from-[#1C1424] via-[#120F1D] to-[#0A0912] border-amber-500/40 shadow-amber-500/10 neon-live-coral"
                  : "bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent border-white/15 hover:border-[#FF5A5F]/50 hover:bg-white/[0.09]"
              }`}
            >
              {/* Metallic Lanyard Hole Grommet Detail at Top */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-3 h-3 rounded-full bg-black/80 border border-white/40 shadow-inner flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white/60" />
                </div>
                <span className="text-[9px] font-mono text-white/50 tracking-widest uppercase">
                  {item.passId}
                </span>
                <Ticket className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF5A5F] transition-colors" />
              </div>

              {/* Autograph / Signature Typography */}
              <div className="my-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF5A5F] font-semibold mb-1">
                  {item.type}
                </div>
                
                {/* Signature-style brand name */}
                <h3 className="text-xl sm:text-2xl font-sans font-black text-white tracking-tight leading-tight group-hover:text-amber-300 transition-colors drop-shadow-md">
                  {item.name}
                </h3>
              </div>

              {/* Bottom Tag: City & Stamp */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                <span className="text-white/60">{item.city}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  FIRMA VIP
                </span>
              </div>

              {/* Light reflection sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Bottom Hall of Fame Stats & Guarantee Banner */}
        <div className="mt-16 p-8 rounded-3xl border border-white/15 bg-gradient-to-r from-[#15152B]/80 via-[#220F1D]/80 to-[#120F24]/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-[#FF5A5F]/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg shrink-0">
              <Star className="w-7 h-7 fill-amber-300" />
            </div>
            <div>
              <h4 className="text-white font-sans font-black text-lg md:text-xl uppercase tracking-tight">
                ¿Tu evento será el próximo en este Salón de la Fama?
              </h4>
              <p className="text-[#F2F0EB]/70 text-xs md:text-sm font-normal">
                Disponibilidad limitada por fecha. Asegura a la banda estelar para tu boda o fiesta privada.
              </p>
            </div>
          </div>

          <a
            href="#paquetes"
            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-white font-sans font-bold text-xs uppercase tracking-widest border border-white/20 shadow-lg shadow-[#FF5A5F]/25 hover:scale-105 active:scale-95 transition-all text-center shrink-0 cursor-pointer"
          >
            Apartar mi Fecha
          </a>
        </div>

      </div>
    </section>
  )
}
