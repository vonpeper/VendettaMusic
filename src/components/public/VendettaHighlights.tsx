"use client";

import { useEffect, useRef, useState } from "react";

export function VendettaHighlights() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersected, setIsIntersected] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.disconnect(); // Runs only once
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-black py-0" 
      aria-label="Estadísticas de la Gira Vendetta"
    >
      {/* 
        Main Flight Case Wrapper
        - Uses the flightcase wood-leather texture.
        - Adds a dramatic vignette gradient for deep 3D shading.
      */}
      <div className="w-full vendetta-case-surface h-[440px] lg:h-[320px] relative max-w-[1440px] mx-auto select-none overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.98)]">
        
        {/* Vignette Shadow Overlay (dramatic studio lighting) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

        {/* --- 3D METALLIC BEZEL FRAME (Top, Bottom, Left, Right profiles) --- */}
        
        {/* Top Profile */}
        <div className="absolute top-0 left-0 right-0 h-[22px] bg-gradient-to-b from-[#D1D2CF] via-[#777B7F] to-[#292C2F] border-b border-[#121416] z-30 shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        {/* Bottom Profile */}
        <div className="absolute bottom-0 left-0 right-0 h-[22px] bg-gradient-to-t from-[#D1D2CF] via-[#777B7F] to-[#292C2F] border-t border-[#121416] z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.5)]" />
        {/* Left Profile */}
        <div className="absolute top-[22px] bottom-[22px] left-0 w-[22px] bg-gradient-to-r from-[#D1D2CF] via-[#777B7F] to-[#292C2F] border-r border-[#121416] z-20" />
        {/* Right Profile */}
        <div className="absolute top-[22px] bottom-[22px] right-0 w-[22px] bg-gradient-to-l from-[#D1D2CF] via-[#777B7F] to-[#292C2F] border-l border-[#121416] z-20" />

        {/* Small metal rivets along top and bottom profiles */}
        <div className="absolute inset-x-0 top-0 h-[22px] pointer-events-none z-30 hidden lg:block">
          <div className="absolute left-[25%] top-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
          <div className="absolute left-[50%] top-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
          <div className="absolute left-[75%] top-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[22px] pointer-events-none z-30 hidden lg:block">
          <div className="absolute left-[25%] bottom-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
          <div className="absolute left-[50%] bottom-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
          <div className="absolute left-[75%] bottom-[5px] w-3 h-3 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-[#121416]/50 shadow-sm" />
        </div>

        {/* --- FIXED CORNER BRACKETS (Prevents distortion) --- */}
        
        {/* SVG Reusable Corner Bracket Symbol Definitions */}
        <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="metal-grad-hard" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#D1D2CF"/>
              <stop offset="0.2" stopColor="#777B7F"/>
              <stop offset="0.52" stopColor="#292C2F"/>
              <stop offset="0.78" stopColor="#8D9194"/>
              <stop offset="1" stopColor="#3C3F42"/>
            </linearGradient>
            <radialGradient id="rivet-grad-hard">
              <stop stopColor="#D4D5D1"/>
              <stop offset="0.35" stopColor="#777B7E"/>
              <stop offset="1" stopColor="#202326"/>
            </radialGradient>
            
            <g id="corner-bracket-path">
              {/* The metal corner bracket angle shape */}
              <path d="M0 0h108v22H22v86H0z" fill="url(#metal-grad-hard)"/>
              {/* Big rivet at the corner intersection */}
              <circle cx="42" cy="42" r="12" fill="url(#rivet-grad-hard)" stroke="#121416" strokeWidth="2"/>
            </g>
          </defs>
        </svg>

        {/* Corner Brackets Positioned in the 4 corners */}
        <div className="absolute top-0 left-0 w-[108px] h-[86px] z-30 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 108 86"><use href="#corner-bracket-path"/></svg>
        </div>
        <div className="absolute top-0 right-0 w-[108px] h-[86px] scale-x-[-1] z-30 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 108 86"><use href="#corner-bracket-path"/></svg>
        </div>
        <div className="absolute bottom-0 left-0 w-[108px] h-[86px] scale-y-[-1] z-30 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 108 86"><use href="#corner-bracket-path"/></svg>
        </div>
        <div className="absolute bottom-0 right-0 w-[108px] h-[86px] scale-x-[-1] scale-y-[-1] z-30 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 108 86"><use href="#corner-bracket-path"/></svg>
        </div>


        {/* --- DECORATIVE HARDWARE (Detailed Recessed Handles & Red Duct Tape) --- */}
        
        {/* Left Recessed Handle */}
        <div 
          className="absolute left-[34px] top-1/2 -translate-y-1/2 w-14 h-32 rounded-xl bg-[#131517] border-2 border-[#55595D] hidden lg:flex items-center justify-center shadow-[inset_0_4px_16px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.6)] z-25"
          aria-hidden="true"
        >
          {/* Handle rivets */}
          <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          {/* Inner recess shadow area */}
          <div className="w-[70%] h-[78%] rounded-lg bg-black shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center">
            {/* Grip handle bar */}
            <div className="w-3.5 h-[80%] rounded-full bg-gradient-to-r from-[#8D9194] via-[#3C3F42] to-[#8D9194] border border-[#1d1f21] shadow-md flex flex-col justify-between py-2 items-center">
              <span className="w-full h-[2px] bg-[#121416]" />
              <span className="w-full h-[2px] bg-[#121416]" />
            </div>
          </div>
        </div>

        {/* Right Recessed Handle */}
        <div 
          className="absolute right-[34px] top-1/2 -translate-y-1/2 w-14 h-32 rounded-xl bg-[#131517] border-2 border-[#55595D] hidden lg:flex items-center justify-center shadow-[inset_0_4px_16px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.6)] z-25"
          aria-hidden="true"
        >
          {/* Handle rivets */}
          <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#74777b] border border-black/40" />
          {/* Inner recess shadow area */}
          <div className="w-[70%] h-[78%] rounded-lg bg-black shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center">
            {/* Grip handle bar */}
            <div className="w-3.5 h-[80%] rounded-full bg-gradient-to-r from-[#8D9194] via-[#3C3F42] to-[#8D9194] border border-[#1d1f21] shadow-md flex flex-col justify-between py-2 items-center">
              <span className="w-full h-[2px] bg-[#121416]" />
              <span className="w-full h-[2px] bg-[#121416]" />
            </div>
          </div>
        </div>

        {/* Top Left Red Tape */}
        <div 
          className="absolute left-[135px] top-[26px] w-[130px] h-[36px] bg-[#9F0D15]/85 backdrop-blur-[0.5px] border border-red-950/40 shadow-md transform -rotate-[9deg] z-40 pointer-events-none select-none opacity-90 mix-blend-multiply hidden lg:block"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.2))",
            clipPath: "polygon(2% 6%, 98% 2%, 96% 94%, 3% 97%)"
          }}
          aria-hidden="true"
        />
        {/* Bottom Right Red Tape */}
        <div 
          className="absolute right-[220px] bottom-[30px] w-[160px] h-[40px] bg-[#9F0D15]/85 backdrop-blur-[0.5px] border border-red-950/40 shadow-md transform -rotate-[5deg] z-40 pointer-events-none select-none opacity-95 mix-blend-multiply"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.2))",
            clipPath: "polygon(3% 2%, 97% 6%, 99% 91%, 1% 94%)"
          }}
          aria-hidden="true"
        />


        {/* --- VERTICAL DIVIDER LINES (Thin Metallic Slots) --- */}
        <div className="absolute inset-0 pointer-events-none z-20 hidden lg:block" aria-hidden="true">
          <div className="absolute left-[26.04%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/25 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[42.01%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/25 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[57.98%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/25 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[73.95%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/25 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
        </div>


        {/* --- CH1-CH8 CHANNEL LABELS (Bottom Left) --- */}
        <div 
          className="absolute left-[110px] bottom-[28px] items-center gap-4 z-20 select-none pointer-events-none hidden lg:flex"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3 text-[10px] font-barlow font-bold text-[#626466] tracking-[0.18em]">
            <span>CH1</span>
            <span>CH2</span>
            <span>CH4</span>
            <span>CH5</span>
            <div className="flex flex-col items-center gap-0.5 px-0.5 relative">
              <span className="text-[#848688]">CH6</span>
              {/* Electric blue LED signal micro-accent */}
              <span className="w-1.5 h-1 bg-[#2797ff] shadow-[0_0_6px_#2797ff] rounded-sm" />
            </div>
            <span>CH7</span>
            <span>CH8</span>
          </div>
        </div>


        {/* --- DESKTOP VECTOR GRAPHICS & STATISTICS CONTAINER --- */}
        <div className="hidden lg:block w-full h-full relative z-25">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 320" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              {/* SVG Plugs Definitions */}
              <g id="jack-plug-left">
                {/* Silver Metal Tip */}
                <rect x="0" y="-3" width="12" height="6" rx="1" fill="url(#metal-grad-hard)" stroke="#121416" strokeWidth="0.5"/>
                {/* Black Housing Body */}
                <rect x="-15" y="-5" width="15" height="10" rx="1.5" fill="#17191B" stroke="#7C8083" strokeWidth="1"/>
                {/* Red Band Ring Accent */}
                <rect x="-6" y="-4.5" width="3" height="9" fill="#B5121B"/>
              </g>
              <g id="jack-plug-right">
                {/* Silver Metal Tip */}
                <rect x="-12" y="-3" width="12" height="6" rx="1" fill="url(#metal-grad-hard)" stroke="#121416" strokeWidth="0.5"/>
                {/* Black Housing Body */}
                <rect x="0" y="-5" width="15" height="10" rx="1.5" fill="#17191B" stroke="#7C8083" strokeWidth="1"/>
                {/* Red Band Ring Accent */}
                <rect x="3" y="-4.5" width="3" height="9" fill="#B5121B"/>
              </g>

              {/* 
                Heavy-Grunge SVG Filter Mask
                - Uses fractalNoise to generate infinite random high-frequency grain.
                - Color matrix bumps up contrast of alpha channel, producing sharp weathered paint flakes.
              */}
              <filter id="heavy-grunge-filter">
                <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="4" result="noise"/>
                <feColorMatrix type="matrix" values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 1.9 -0.92
                " result="high-contrast-noise"/>
                <feComposite operator="in" in2="SourceGraphic" in="high-contrast-noise"/>
              </filter>

              <filter id="cable-drop-shadow" x="-5%" y="-40%" width="110%" height="180%">
                <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#000" floodOpacity="0.85"/>
              </filter>
            </defs>

            {/* --- CABLE PATHS (Matte tour-level red cable, zero gamer glow) --- */}
            <g filter="url(#cable-drop-shadow)">
              {/* Base red cable path (Top row / Peaks at Y=130, Valleys at Y=200) */}
              <path 
                d="M 110,170 C 160,170 200,130 260,130 C 320,130 330,200 375,200 C 420,200 430,130 490,130 C 550,130 560,200 605,200 C 660,200 670,130 720,130 C 780,130 790,200 835,200 C 890,200 900,130 950,130 C 1000,130 1050,170 1090,170"
                stroke="#A80F16" strokeWidth="6.5" strokeLinecap="round"
              />
              {/* Small cable segment exiting the right of the plate */}
              <path 
                d="M 1310,170 C 1330,170 1350,170 1370,170"
                stroke="#A80F16" strokeWidth="6.5" strokeLinecap="round"
              />

              {/* Cable connectors (Jacks) plugged at each peak & plate side */}
              <use href="#jack-plug-left" x="200" y="130"/>
              <use href="#jack-plug-right" x="320" y="130"/>
              
              <use href="#jack-plug-left" x="430" y="130"/>
              <use href="#jack-plug-right" x="550" y="130"/>

              <use href="#jack-plug-left" x="682" y="130"/>
              <use href="#jack-plug-right" x="758" y="130"/>

              <use href="#jack-plug-left" x="898" y="130"/>
              <use href="#jack-plug-right" x="1002" y="130"/>

              <use href="#jack-plug-left" x="1090" y="170"/>
              <use href="#jack-plug-right" x="1310" y="170"/>
            </g>

            {/* --- STATISTICS NUMBERS & LABELS (Weathered vector stencils) --- */}
            <g filter="url(#heavy-grunge-filter)">
              
              {/* +500 */}
              <text x="260" y="145" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="76" fill="#e8e6e0" letterSpacing="-0.04em">
                <tspan fontSize="50" dy="-18">+</tspan>500
              </text>
              <text x="260" y="200" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="12" fill="#afb3b6" letterSpacing="0.18em">
                EVENTOS REALIZADOS
              </text>

              {/* +15 */}
              <text x="490" y="145" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="76" fill="#e8e6e0" letterSpacing="-0.04em">
                <tspan fontSize="50" dy="-18">+</tspan>15
              </text>
              <text x="490" y="200" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="12" fill="#afb3b6" letterSpacing="0.18em">
                AÑOS DE EXPERIENCIA
              </text>

              {/* 5 */}
              <text x="720" y="145" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="76" fill="#e8e6e0" letterSpacing="-0.04em">
                5
              </text>
              <text x="720" y="200" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="12" fill="#afb3b6" letterSpacing="0.18em">
                MÚSICOS EN ESCENA
              </text>

              {/* 2 H */}
              <text x="950" y="94" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="12" fill="rgba(255,255,255,0.4)" letterSpacing="0.15em">
                DESDE
              </text>
              <text x="950" y="145" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="76" fill="#e8e6e0" letterSpacing="-0.04em">
                2<tspan fontSize="60" dx="2">H</tspan>
              </text>
              <text x="950" y="200" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="12" fill="#afb3b6" letterSpacing="0.18em">
                DE SHOW EN VIVO
              </text>

              {/* TOUR LEVEL PLATE (Grounded design, no blinking dashboard lights) */}
              <g transform="translate(1090 95)">
                {/* Plate base */}
                <rect width="220" height="130" rx="6" fill="#151719" stroke="url(#metal-grad-hard)" strokeWidth="4"/>
                <rect x="7" y="7" width="206" height="116" rx="3" fill="none" stroke="#55595D" strokeWidth="1.5"/>
                {/* Metal corner rivets */}
                <circle cx="14" cy="14" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" strokeWidth="0.5"/>
                <circle cx="206" cy="14" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                <circle cx="14" cy="116" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                <circle cx="206" cy="116" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                
                {/* Plate Titles */}
                <text x="110" y="65" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="28" fill="#ffffff" letterSpacing="0.02em">
                  TOUR LEVEL
                </text>
                <text x="110" y="90" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="11" fill="#e31b23" letterSpacing="0.12em">
                  PRODUCCIÓN DE GIRA
                </text>
                <line x1="90" y1="105" x2="130" y2="105" stroke="#e31b23" strokeWidth="2"/>
              </g>

            </g>
          </svg>
        </div>


        {/* --- MOBILE VECTOR LAYOUT (Organized 2-row vector SVG) --- */}
        <div className="lg:hidden w-full h-full relative z-25">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 720 440" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Reuses same filters inside SVG */}
            <g filter="url(#cable-drop-shadow)">
              {/* Mobile cable path - loops from Top Row to Bottom Row organically */}
              <path 
                d="M 30,90 C 60,90 90,60 120,60 C 150,60 210,110 240,110 C 270,110 330,60 360,60 C 390,60 450,110 480,110 C 510,110 570,60 600,60 C 660,60 695,110 660,160 C 620,210 300,160 220,210 C 140,260 270,300 305,300 C 330,300 350,280 390,280"
                stroke="#A80F16" strokeWidth="6.5" strokeLinecap="round"
              />
              <path 
                d="M 610,280 C 630,280 670,280 690,280"
                stroke="#A80F16" strokeWidth="6.5" strokeLinecap="round"
              />

              {/* Jacks plugs for Mobile */}
              <use href="#jack-plug-left" x="70" y="60"/>
              <use href="#jack-plug-right" x="170" y="60"/>

              <use href="#jack-plug-left" x="310" y="60"/>
              <use href="#jack-plug-right" x="410" y="60"/>

              <use href="#jack-plug-left" x="550" y="60"/>
              <use href="#jack-plug-right" x="650" y="60"/>

              <use href="#jack-plug-left" x="160" y="210"/>
              <use href="#jack-plug-right" x="280" y="210"/>

              <use href="#jack-plug-left" x="390" y="280"/>
              <use href="#jack-plug-right" x="610" y="280"/>
            </g>

            {/* Mobile weather stencils */}
            <g filter="url(#heavy-grunge-filter)">
              
              {/* Row 1 Stats */}
              <text x="120" y="70" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="48" fill="#e8e6e0" letterSpacing="-0.04em">
                <tspan fontSize="30" dy="-10">+</tspan>500
              </text>
              <text x="120" y="110" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="9" fill="#afb3b6" letterSpacing="0.1em">
                EVENTOS REALIZADOS
              </text>

              <text x="360" y="70" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="48" fill="#e8e6e0" letterSpacing="-0.04em">
                <tspan fontSize="30" dy="-10">+</tspan>15
              </text>
              <text x="360" y="110" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="9" fill="#afb3b6" letterSpacing="0.1em">
                AÑOS DE EXPERIENCIA
              </text>

              <text x="600" y="70" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="48" fill="#e8e6e0" letterSpacing="-0.04em">
                5
              </text>
              <text x="600" y="110" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="9" fill="#afb3b6" letterSpacing="0.1em">
                MÚSICOS EN ESCENA
              </text>

              {/* Row 2 Stats */}
              <text x="220" y="174" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="10" fill="rgba(255,255,255,0.4)" letterSpacing="0.12em">
                DESDE
              </text>
              <text x="220" y="220" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="48" fill="#e8e6e0" letterSpacing="-0.04em">
                2<tspan fontSize="38" dx="2">H</tspan>
              </text>
              <text x="220" y="252" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="9" fill="#afb3b6" letterSpacing="0.1em">
                DE SHOW EN VIVO
              </text>

              {/* Mobile custom Tour Level Plate */}
              <g transform="translate(390 215)">
                <rect width="220" height="130" rx="6" fill="#151719" stroke="url(#metal-grad-hard)" strokeWidth="4"/>
                <rect x="7" y="7" width="206" height="116" rx="3" fill="none" stroke="#55595D" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" strokeWidth="0.5"/>
                <circle cx="206" cy="14" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                <circle cx="14" cy="116" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                <circle cx="206" cy="116" r="3.5" fill="url(#rivet-grad-hard)" stroke="#121416" stroke-width="0.5"/>
                
                <text x="110" y="65" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="28" fill="#ffffff" letterSpacing="0.02em">
                  TOUR LEVEL
                </text>
                <text x="110" y="90" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="11" fill="#e31b23" letterSpacing="0.12em">
                  PRODUCCIÓN DE GIRA
                </text>
                <line x1="90" y1="105" x2="130" y2="105" stroke="#e31b23" strokeWidth="2"/>
              </g>

            </g>
          </svg>
        </div>

      </div>
    </section>
  );
}
