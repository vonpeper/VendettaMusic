"use client";

import { useEffect, useRef, useState } from "react";

interface HighlightItem {
  id: string;
  value: string;
  valueRender: React.ReactNode;
  label: string;
  prefix?: string;
  leftPercent: string; // Center X of the column
}

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

  const highlights: HighlightItem[] = [
    { 
      id: "events", 
      value: "+500", 
      valueRender: (
        <>
          <span className="text-[0.55em] align-super mr-0.5 font-bold select-none text-white/90">+</span>500
        </>
      ),
      label: "EVENTOS REALIZADOS", 
      leftPercent: "18.05%" 
    },
    { 
      id: "experience", 
      value: "+15", 
      valueRender: (
        <>
          <span className="text-[0.55em] align-super mr-0.5 font-bold select-none text-white/90">+</span>15
        </>
      ),
      label: "AÑOS DE EXPERIENCIA", 
      leftPercent: "34.02%" 
    },
    { 
      id: "musicians", 
      value: "5", 
      valueRender: <>5</>,
      label: "MÚSICOS EN ESCENA", 
      leftPercent: "50.0%" 
    },
    { 
      id: "show", 
      value: "2 H", 
      valueRender: (
        <>
          2<span className="text-[0.7em] ml-1 font-black text-white/95">H</span>
        </>
      ),
      label: "DE SHOW EN VIVO", 
      prefix: "DESDE", 
      leftPercent: "65.97%" 
    },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-black py-0" 
      aria-label="Estadísticas de la Gira Vendetta"
    >
      {/* 
        Main Flight Case Container
        - Uses the flightcase wood-leather texture.
        - Adds a dramatic vignette gradient for deep 3D shading.
      */}
      <div className="w-full vendetta-case-surface h-[440px] lg:h-[320px] relative max-w-[1440px] mx-auto select-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        
        {/* Vignette Shadow Overlay (dramatic studio lighting) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

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
          className="absolute left-[135px] top-[26px] w-[130px] h-[36px] bg-[#C80F1A]/85 backdrop-blur-[0.5px] border border-red-800/40 shadow-md transform -rotate-[9deg] z-40 pointer-events-none select-none opacity-90 mix-blend-multiply hidden lg:block"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.18))",
            clipPath: "polygon(2% 6%, 98% 2%, 96% 94%, 3% 97%)"
          }}
          aria-hidden="true"
        />
        {/* Bottom Right Red Tape */}
        <div 
          className="absolute right-[220px] bottom-[30px] w-[160px] h-[40px] bg-[#C80F1A]/85 backdrop-blur-[0.5px] border border-red-800/40 shadow-md transform -rotate-[5deg] z-40 pointer-events-none select-none opacity-95 mix-blend-multiply"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.18))",
            clipPath: "polygon(3% 2%, 97% 6%, 99% 91%, 1% 94%)"
          }}
          aria-hidden="true"
        />


        {/* --- CABLES (Custom 5-Peak Bezier Path to line up with column positions) --- */}
        
        {/* Desktop Cable Container */}
        <div 
          className="absolute left-0 right-0 h-[220px] top-[18%] z-15 hidden lg:block" 
          aria-hidden="true"
        >
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 220" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Plugs Definitions */}
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
              
              <filter id="cable-shadow" x="-5%" y="-30%" width="110%" height="160%">
                <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#000" floodOpacity="0.8"/>
              </filter>
              <filter id="cable-glow" x="-10%" y="-150%" width="120%" height="400%">
                <feGaussianBlur stdDeviation="3.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* The Cable Paths (with shadow, base red, core neon glow) */}
            <g filter="url(#cable-shadow)">
              {/* Thick shadow base path */}
              <path 
                d="M 110,120 C 160,120 200,80 260,80 C 320,80 330,150 375,150 C 420,150 430,80 490,80 C 550,80 560,150 605,150 C 660,150 670,80 720,80 C 780,80 790,150 835,150 C 890,150 900,80 950,80 C 1000,80 1050,120 1090,120"
                stroke="#1B0203" strokeWidth="13" strokeLinecap="round"
              />
              <path 
                d="M 1310,120 C 1330,120 1350,120 1370,120"
                stroke="#1B0203" strokeWidth="13" strokeLinecap="round"
              />

              {/* Base red cable path */}
              <path 
                d="M 110,120 C 160,120 200,80 260,80 C 320,80 330,150 375,150 C 420,150 430,80 490,80 C 550,80 560,150 605,150 C 660,150 670,80 720,80 C 780,80 790,150 835,150 C 890,150 900,80 950,80 C 1000,80 1050,120 1090,120"
                stroke="#C80F1A" strokeWidth="8" strokeLinecap="round"
              />
              <path 
                d="M 1310,120 C 1330,120 1350,120 1370,120"
                stroke="#C80F1A" strokeWidth="8" strokeLinecap="round"
              />

              {/* Glowing inner red core */}
              <path 
                d="M 110,120 C 160,120 200,80 260,80 C 320,80 330,150 375,150 C 420,150 430,80 490,80 C 550,80 560,150 605,150 C 660,150 670,80 720,80 C 780,80 790,150 835,150 C 890,150 900,80 950,80 C 1000,80 1050,120 1090,120"
                stroke="#FF3843" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" filter="url(#cable-glow)"
              />
              <path 
                d="M 1310,120 C 1330,120 1350,120 1370,120"
                stroke="#FF3843" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" filter="url(#cable-glow)"
              />

              {/* 
                Signal Pulse Flow Animation 
                Only fires once when viewport triggers intersection
              */}
              <path 
                d="M 110,120 C 160,120 200,80 260,80 C 320,80 330,150 375,150 C 420,150 430,80 490,80 C 550,80 560,150 605,150 C 660,150 670,80 720,80 C 780,80 790,150 835,150 C 890,150 900,80 950,80 C 1000,80 1050,120 1090,120"
                stroke="#FF4F59" strokeWidth="3" strokeLinecap="round" filter="url(#cable-glow)"
                pathLength="100" strokeDasharray="15 100"
                className={isIntersected ? "animate-cable-signal" : ""}
                style={{ strokeDashoffset: 115 }}
              />

              {/* --- PLUGS INSTANCED AT EACH STAT PEAK (Guarantees zero misalignment) --- */}
              
              {/* Plugs at +500 */}
              <use href="#jack-plug-left" x="200" y="80"/>
              <use href="#jack-plug-right" x="320" y="80"/>

              {/* Plugs at +15 */}
              <use href="#jack-plug-left" x="430" y="80"/>
              <use href="#jack-plug-right" x="550" y="80"/>

              {/* Plugs at 5 */}
              <use href="#jack-plug-left" x="682" y="80"/>
              <use href="#jack-plug-right" x="758" y="80"/>

              {/* Plugs at 2 H */}
              <use href="#jack-plug-left" x="898" y="80"/>
              <use href="#jack-plug-right" x="1002" y="80"/>

              {/* Plug at left of TOUR LEVEL plate */}
              <use href="#jack-plug-left" x="1090" y="120"/>

              {/* Plug at right of TOUR LEVEL plate */}
              <use href="#jack-plug-right" x="1310" y="120"/>
            </g>
          </svg>
        </div>


        {/* --- VERTICAL DIVIDER LINES (Thin Metallic Slots) --- */}
        <div className="absolute inset-0 pointer-events-none z-20 hidden lg:block" aria-hidden="true">
          <div className="absolute left-[26.04%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/30 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[42.01%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/30 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[57.98%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/30 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
          <div className="absolute left-[73.95%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/30 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.03)]" />
        </div>


        {/* --- CH1-CH8 CHANNEL LABELS (Bottom Left) --- */}
        <div 
          className="absolute left-[110px] bottom-[28px] items-center gap-4 z-20 select-none pointer-events-none hidden lg:flex"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3 text-[10px] font-barlow font-bold text-[#727578] tracking-[0.18em]">
            <span>CH1</span>
            <span>CH2</span>
            <span>CH4</span>
            <span>CH5</span>
            <div className="flex flex-col items-center gap-0.5 px-0.5 relative">
              <span className="text-[#96999b]">CH6</span>
              {/* Electric blue LED signal micro-accent */}
              <span className="w-1.5 h-1 bg-[#2797ff] shadow-[0_0_6px_#2797ff] rounded-sm" />
            </div>
            <span>CH7</span>
            <span>CH8</span>
          </div>
        </div>


        {/* --- DESKTOP STATISTICS (Absolutely positioned to match peaks exactly) --- */}
        <div className="hidden lg:block w-full h-full relative z-25">
          <ul className="w-full h-full relative">
            {highlights.map((item) => (
              <li 
                key={item.id}
                style={{ left: item.leftPercent }}
                className="absolute top-[44%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center text-center select-none"
              >
                {/* Prefix Label (like DESDE) */}
                {item.prefix && (
                  <span className="font-barlow font-black text-xs text-white/40 tracking-[0.15em] uppercase leading-none mb-1.5">
                    {item.prefix}
                  </span>
                )}
                
                {/* Giant Weathered Numbers */}
                <span className="font-barlow font-black text-[#e8e6e0] leading-none tracking-tighter text-[5.8rem] xl:text-[6.8rem] distress-effect block select-none">
                  {item.valueRender}
                </span>

                {/* Stat Title */}
                <span className="font-barlow font-black text-[12px] xl:text-[13px] text-[#afb3b6] tracking-[0.16em] uppercase leading-none mt-4 select-none">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>


        {/* --- FIXED TOUR LEVEL PLATE (Absolutely positioned on the right panel) --- */}
        <div 
          className="absolute hidden lg:flex right-[102px] top-1/2 -translate-y-1/2 w-[220px] h-[130px] rounded-lg bg-[#191B1D] border-4 border-[#777B7F] shadow-2xl z-25 p-3 select-none flex-col items-center justify-center"
          aria-hidden="true"
        >
          {/* Plate corner rivets */}
          <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-black/50" />
          <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-black/50" />
          <span className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-black/50" />
          <span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#D4D5D1] via-[#777B7E] to-[#202326] border border-black/50" />
          
          {/* Inner decorative border */}
          <div className="absolute inset-1.5 border border-[#676B6E] rounded-md pointer-events-none" />
          
          {/* LEDs at top-right */}
          <div className="flex items-center gap-3 mb-1.5 z-10">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_#e31b23]" />
              <span className="text-[8px] font-barlow font-bold tracking-widest text-[#aaa8a2]">LIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2797ff] shadow-[0_0_6px_#2797ff]" />
              <span className="text-[8px] font-barlow font-bold tracking-widest text-[#aaa8a2]">SIGNAL</span>
            </div>
          </div>
          
          {/* Plate Text */}
          <span className="font-barlow font-black text-white text-2xl tracking-tight leading-none uppercase distress-effect z-10">
            TOUR LEVEL
          </span>
          <span className="font-barlow font-bold text-[#e31b23] text-[9px] tracking-wider uppercase mt-1 leading-none z-10">
            PRODUCCIÓN DE GIRA
          </span>
          <div className="w-8 h-[2px] bg-[#e31b23] mt-2.5 z-10" />
        </div>


        {/* --- MOBILE LAYOUT (2 Rows, clean proportions) --- */}
        <div className="lg:hidden flex flex-col justify-between w-full h-full relative z-25 px-6 py-12">
          
          {/* Top Row: +500, +15, 5 */}
          <ul className="grid grid-cols-3 gap-2 w-full pt-4">
            {highlights.slice(0, 3).map((item) => (
              <li key={item.id} className="flex flex-col items-center text-center">
                <span className="font-barlow font-black text-4xl sm:text-5xl text-white leading-none tracking-tighter distress-effect">
                  {item.value}
                </span>
                <span className="font-barlow font-bold text-[9px] sm:text-[10px] text-white/80 tracking-wider uppercase mt-2.5 leading-tight">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Bottom Row: DESDE 2 H, TOUR LEVEL Plate */}
          <div className="grid grid-cols-2 gap-4 w-full items-center pb-4">
            
            {/* DESDE 2 H Column */}
            <div className="flex flex-col items-center text-center pl-4">
              <span className="font-barlow font-bold text-[10px] sm:text-xs text-white/50 tracking-wider leading-none uppercase">
                {highlights[3].prefix}
              </span>
              <span className="font-barlow font-black text-4xl sm:text-5xl text-white leading-none tracking-tighter distress-effect">
                {highlights[3].value}
              </span>
              <span className="font-barlow font-bold text-[9px] sm:text-[10px] text-primary tracking-widest uppercase mt-2.5 leading-tight">
                {highlights[3].label}
              </span>
            </div>

            {/* TOUR LEVEL Custom Plate Column */}
            <div className="flex justify-center pr-4">
              <div className="w-[150px] h-[86px] rounded-lg bg-[#191B1D] border-2 border-[#55595D] flex flex-col items-center justify-center p-2 relative shadow-inner">
                {/* Rivets on plate corners */}
                <span className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
                <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
                <span className="absolute bottom-1 left-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
                <span className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
                
                {/* LEDs */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[6px] font-barlow font-bold tracking-widest text-[#aaa8a2]">LIVE</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-[#2797ff]" />
                    <span className="text-[6px] font-barlow font-bold tracking-widest text-[#aaa8a2]">SIGNAL</span>
                  </div>
                </div>
                {/* Plate Title */}
                <div className="font-barlow font-black text-white text-xs tracking-tight leading-none uppercase">
                  TOUR LEVEL
                </div>
                {/* Plate Subtitle */}
                <div className="font-barlow font-bold text-primary text-[7px] tracking-wider uppercase mt-1 leading-none">
                  PRODUCCIÓN DE GIRA
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
