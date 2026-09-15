"use client"

import React from "react"
import { motion } from "framer-motion"

interface RockBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant"
}

export function RockBackground({ intensity = "medium" }: RockBackgroundProps) {
  const opacityMultiplier = intensity === "vibrant" ? 1.4 : intensity === "subtle" ? 0.7 : 1.0

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#f8fafc] pointer-events-none select-none">
      {/* 1. SVG PATTERN: Textura Acústica Tenue de Escenario (Rejilla de Bocina + Micro-perforaciones de Audio) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Micro-perforación acústica (Perforated Speaker Grille) */}
          <pattern id="acoustic-perforations" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#64748b" fillOpacity="0.35" />
            <circle cx="12" cy="12" r="1.4" fill="#475569" fillOpacity="0.45" />
          </pattern>

          {/* Micro-cuadrícula de ingeniería de audio */}
          <pattern id="sound-grid-light" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2="40" y2="40" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="40" y1="0" x2="40" y2="40" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.5" />
          </pattern>

          {/* Malla hexagonal de amplificadores de concierto */}
          <pattern id="acoustic-hex-mesh-light" width="28" height="48.497" patternUnits="userSpaceOnUse">
            <path
              d="M14 0 L28 8.083 L28 24.249 L14 32.332 L0 24.249 L0 8.083 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.85"
              strokeOpacity="0.3"
            />
            <path
              d="M14 32.332 L28 40.415 L28 56.58 L14 64.663 L0 56.58 L0 40.415 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.85"
              strokeOpacity="0.3"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#acoustic-perforations)" />
        <rect width="100%" height="100%" fill="url(#sound-grid-light)" />
        <rect width="100%" height="100%" fill="url(#acoustic-hex-mesh-light)" />
      </svg>

      {/* 2. HACES DE ILUMINACIÓN DE ESCENARIO / ROBOTIC MOVING HEADS (Atmósfera de Concierto en Rojo y Ámbar) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Haz Izquierdo: Red Spotlight */}
        <motion.div
          animate={{
            rotate: [-5, 6, -5],
            opacity: [0.18 * opacityMultiplier, 0.35 * opacityMultiplier, 0.18 * opacityMultiplier],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[12%] left-[8%] w-[420px] sm:w-[700px] h-[1000px] origin-top pointer-events-none"
          style={{
            background: "conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(239, 68, 68, 0.18) 178deg, rgba(220, 38, 38, 0.32) 180deg, rgba(239, 68, 68, 0.18) 182deg, transparent 195deg)",
            filter: "blur(32px)",
          }}
        />

        {/* Haz Derecho: Gold/Amber Spotlight */}
        <motion.div
          animate={{
            rotate: [5, -6, 5],
            opacity: [0.15 * opacityMultiplier, 0.3 * opacityMultiplier, 0.15 * opacityMultiplier],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute -top-[12%] right-[8%] w-[420px] sm:w-[700px] h-[1000px] origin-top pointer-events-none"
          style={{
            background: "conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(245, 158, 11, 0.16) 178deg, rgba(217, 119, 6, 0.28) 180deg, rgba(245, 158, 11, 0.16) 182deg, transparent 195deg)",
            filter: "blur(32px)",
          }}
        />

        {/* Resplandor Central de Escenario en Rojo Carmesí */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.12 * opacityMultiplier, 0.25 * opacityMultiplier, 0.12 * opacityMultiplier],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[500px] bg-gradient-to-b from-red-600/18 via-red-500/8 to-transparent blur-[100px] rounded-full pointer-events-none"
        />
      </div>

      {/* 3. ECUALIZADOR DINÁMICO DE AUDIO EN LA BASE (Live Soundboard Visualizer) */}
      <div className="absolute bottom-0 left-0 right-0 h-28 flex items-end justify-between px-2 sm:px-8 opacity-35">
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
                  ? "linear-gradient(to top, rgba(220,38,38,0.7), rgba(245,158,11,0.85))"
                  : i % 2 === 0
                  ? "linear-gradient(to top, rgba(185,28,28,0.6), rgba(239,68,68,0.8))"
                  : "linear-gradient(to top, rgba(217,119,6,0.5), rgba(245,158,11,0.75))",
            }}
          />
        ))}
      </div>
    </div>
  )
}
