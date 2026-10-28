import React from "react"

interface RockBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant"
}

/**
 * RockBackground Ultra-Optimizado (Zero-Jank, Pure CSS/SVG)
 *
 * Elimina animaciones infinitas de Framer Motion y bucles en GPU.
 * Proporciona una textura acústica de escenario sobria, nítida y estática
 * con soporte para 60-120 FPS sin repintados continuos.
 */
export function RockBackground({ intensity = "medium" }: RockBackgroundProps) {
  const opacityClass =
    intensity === "vibrant"
      ? "opacity-85"
      : intensity === "subtle"
      ? "opacity-40"
      : "opacity-60"

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#f8fafc] pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* 1. SVG PATTERN: Textura Acústica Tenue de Escenario (Speaker Grille & Audio Engineering Grid) */}
      <svg
        className={`absolute inset-0 w-full h-full ${opacityClass} transition-opacity duration-300`}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Micro-perforación acústica (Perforated Speaker Grille) */}
          <pattern id="acoustic-perforations" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="#64748b" fillOpacity="0.25" />
            <circle cx="12" cy="12" r="1.3" fill="#475569" fillOpacity="0.3" />
          </pattern>

          {/* Micro-cuadrícula de ingeniería de audio */}
          <pattern id="sound-grid-light" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2="40" y2="40" stroke="#cbd5e1" strokeWidth="0.75" strokeOpacity="0.4" />
            <line x1="40" y1="0" x2="40" y2="40" stroke="#cbd5e1" strokeWidth="0.75" strokeOpacity="0.4" />
          </pattern>

          {/* Malla hexagonal de amplificadores de concierto */}
          <pattern id="acoustic-hex-mesh-light" width="28" height="48.497" patternUnits="userSpaceOnUse">
            <path
              d="M14 0 L28 8.083 L28 24.249 L14 32.332 L0 24.249 L0 8.083 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.75"
              strokeOpacity="0.2"
            />
            <path
              d="M14 32.332 L28 40.415 L28 56.58 L14 64.663 L0 56.58 L0 40.415 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.75"
              strokeOpacity="0.2"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#acoustic-perforations)" />
        <rect width="100%" height="100%" fill="url(#sound-grid-light)" />
        <rect width="100%" height="100%" fill="url(#acoustic-hex-mesh-light)" />
      </svg>

      {/* 2. ATMÓSFERA DE ESCENARIO ESTÁTICA (Spotlights en Rojo y Ámbar sin rotación continua) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Foco Izquierdo: Red Stage Light */}
        <div
          className="absolute -top-[10%] left-[5%] w-[450px] sm:w-[650px] h-[750px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(220, 38, 38, 0.12) 0%, rgba(239, 68, 68, 0.04) 50%, transparent 80%)",
            filter: "blur(24px)",
          }}
        />

        {/* Foco Derecho: Amber / Warm Stage Light */}
        <div
          className="absolute -top-[10%] right-[5%] w-[450px] sm:w-[650px] h-[750px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(217, 119, 6, 0.10) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 80%)",
            filter: "blur(24px)",
          }}
        />

        {/* Halo Cenital de Escenario */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(220, 38, 38, 0.08) 0%, rgba(245, 158, 11, 0.03) 45%, transparent 75%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* 3. ECUALIZADOR ESTÁTICO DE AUDIO EN LA BASE (Zero CPU/GPU Overdraw) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-between px-2 sm:px-8 opacity-25">
        {[
          32, 45, 28, 65, 80, 42, 92, 58, 74, 38,
          85, 60, 48, 95, 70, 52, 88, 64, 40, 78,
          90, 45, 68, 82, 35, 96, 75, 50, 84, 62,
          70, 40, 88, 55, 78, 92, 46, 68, 85, 38
        ].map((height, i) => (
          <div
            key={i}
            className="w-[2px] sm:w-1 mx-[1px] sm:mx-0.5 rounded-t-sm"
            style={{
              height: `${Math.max(14, Math.min(88, height * 0.7))}%`,
              background:
                i % 4 === 0
                  ? "linear-gradient(to top, rgba(220,38,38,0.5), rgba(245,158,11,0.6))"
                  : i % 2 === 0
                  ? "linear-gradient(to top, rgba(185,28,28,0.45), rgba(239,68,68,0.55))"
                  : "linear-gradient(to top, rgba(217,119,6,0.4), rgba(245,158,11,0.5))",
            }}
          />
        ))}
      </div>
    </div>
  )
}
