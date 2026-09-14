"use client"

import React from "react"
import { motion } from "framer-motion"

interface RockBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant"
}

export function RockBackground({ intensity = "medium" }: RockBackgroundProps) {
  const opacityMultiplier = intensity === "vibrant" ? 1.4 : intensity === "subtle" ? 0.7 : 1.0

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#070709] pointer-events-none select-none">
      {/* 1. SVG PATTERN: Rejilla Acústica de Bocinas / Speaker Grille Hex Mesh */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Malla hexagonal de bafles y amplificadores profesionales */}
          <pattern id="acoustic-hex-mesh" width="24" height="41.569" patternUnits="userSpaceOnUse">
            <path
              d="M12 0 L24 6.928 L24 20.785 L12 27.713 L0 20.785 L0 6.928 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            <path
              d="M12 27.713 L24 34.641 L24 48.497 L12 55.426 L0 48.497 L0 34.641 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            <circle cx="12" cy="13.856" r="1.5" fill="#ef4444" fillOpacity="0.3" />
            <circle cx="12" cy="41.569" r="1.5" fill="#f59e0b" fillOpacity="0.25" />
          </pattern>

          {/* Patrón de líneas isométricas de audio / micro-grid */}
          <pattern id="sound-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2="40" y2="40" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" />
            <line x1="40" y1="0" x2="40" y2="40" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" />
            <circle cx="40" cy="40" r="0.8" fill="#ffffff" fillOpacity="0.2" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#sound-grid)" />
        <rect width="100%" height="100%" fill="url(#acoustic-hex-mesh)" />
      </svg>

      {/* 2. HACES DE LUZ ROBÓTICA DE ESCENARIO (Conic Spotlights / Moving Heads) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Haz Izquierdo: Rock Crimson Beam */}
        <motion.div
          animate={{
            rotate: [-4, 5, -4],
            opacity: [0.35 * opacityMultiplier, 0.55 * opacityMultiplier, 0.35 * opacityMultiplier],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] left-[8%] w-[380px] sm:w-[620px] h-[900px] origin-top pointer-events-none"
          style={{
            background: "conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(239, 68, 68, 0.32) 178deg, rgba(220, 38, 38, 0.45) 180deg, rgba(239, 68, 68, 0.32) 182deg, transparent 195deg)",
            filter: "blur(28px)",
          }}
        />

        {/* Haz Derecho: VIP Champagne Gold / Amber Beam */}
        <motion.div
          animate={{
            rotate: [4, -5, 4],
            opacity: [0.3 * opacityMultiplier, 0.48 * opacityMultiplier, 0.3 * opacityMultiplier],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute -top-[10%] right-[8%] w-[380px] sm:w-[620px] h-[900px] origin-top pointer-events-none"
          style={{
            background: "conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(245, 158, 11, 0.28) 178deg, rgba(217, 119, 6, 0.4) 180deg, rgba(245, 158, 11, 0.28) 182deg, transparent 195deg)",
            filter: "blur(28px)",
          }}
        />

        {/* Haz Central: Violet Stage Wash (Atmósfera de Domo / Festival) */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15 * opacityMultiplier, 0.28 * opacityMultiplier, 0.15 * opacityMultiplier],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1100px] h-[450px] bg-gradient-to-b from-purple-600/20 via-red-600/10 to-transparent blur-[110px] rounded-full pointer-events-none"
        />
      </div>

      {/* 3. RESPLANDOR DE TARIMA / STAGE FLOOR GLOW */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-gradient-to-t from-red-600/10 via-amber-500/5 to-transparent blur-[80px] pointer-events-none" />

      {/* 4. ECUALIZADOR DINÁMICO DE CONSOLA EN LA BASE (Live Soundboard Visualizer) */}
      <div className="absolute bottom-0 left-0 right-0 h-28 flex items-end justify-between px-2 sm:px-8 opacity-25">
        {[
          32, 45, 28, 65, 80, 42, 92, 58, 74, 38,
          85, 60, 48, 95, 70, 52, 88, 64, 40, 78,
          90, 45, 68, 82, 35, 96, 75, 50, 84, 62,
          70, 40, 88, 55, 78, 92, 46, 68, 85, 38
        ].map((height, i) => (
          <motion.div
            key={i}
            animate={{
              height: [
                `${Math.max(12, height * 0.4)}%`,
                `${Math.min(98, height * (0.8 + Math.random() * 0.4))}%`,
                `${Math.max(12, height * 0.4)}%`,
              ],
            }}
            transition={{
              duration: 0.6 + (i % 7) * 0.18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-[2px] sm:w-1 mx-[1px] sm:mx-0.5 rounded-t-sm transition-all"
            style={{
              background:
                i % 4 === 0
                  ? "linear-gradient(to top, rgba(239,68,68,0.7), rgba(245,158,11,0.9))"
                  : i % 2 === 0
                  ? "linear-gradient(to top, rgba(220,38,38,0.5), rgba(239,68,68,0.8))"
                  : "linear-gradient(to top, rgba(245,158,11,0.4), rgba(251,191,36,0.7))",
            }}
          />
        ))}
      </div>

      {/* 5. NOTAS MUSICALES Y ARMONÍAS FLOTANTES DISCRETAS */}
      {[
        { symbol: "♪", x: "12%", delay: 0, duration: 18 },
        { symbol: "♫", x: "28%", delay: 3.5, duration: 22 },
        { symbol: "♬", x: "50%", delay: 7, duration: 20 },
        { symbol: "♩", x: "72%", delay: 2, duration: 24 },
        { symbol: "♪", x: "88%", delay: 5.5, duration: 19 },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ y: "105vh", opacity: 0, scale: 0.8 }}
          animate={{
            y: "-10vh",
            opacity: [0, 0.25 * opacityMultiplier, 0.35 * opacityMultiplier, 0],
            scale: [0.8, 1.1, 0.9],
            rotate: [-15, 20, -10],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear",
          }}
          className="absolute text-red-400/25 text-3xl sm:text-4xl font-serif pointer-events-none select-none"
          style={{ left: item.x }}
        >
          {item.symbol}
        </motion.div>
      ))}

      {/* 6. VIÑETA DE ESCENARIO OSCURO (Stage Vignette para Legibilidad Máxima) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 20%, rgba(7, 7, 9, 0.7) 65%, rgba(5, 5, 8, 0.96) 100%)",
        }}
      />
    </div>
  )
}
