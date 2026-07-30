"use client";

import { useEffect, useRef, useState } from "react";

interface HighlightItem {
  id: string;
  value: string;
  label: string;
  prefix?: string;
  leftPercent: string; // Absolute position of column center on desktop
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
    { id: "events", value: "+500", label: "EVENTOS REALIZADOS", leftPercent: "18.25%" },
    { id: "experience", value: "+15", label: "AÑOS DE EXPERIENCIA", leftPercent: "34.75%" },
    { id: "musicians", value: "5", label: "MÚSICOS EN ESCENA", leftPercent: "51.25%" },
    { id: "show", value: "2 H", label: "DE SHOW EN VIVO", prefix: "DESDE", leftPercent: "67.75%" },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-black py-0" 
      aria-label="Estadísticas e Highlights de Vendetta"
    >
      {/* Main Flight Case Wrapper */}
      <div className="w-full vendetta-case-surface h-[440px] lg:h-[320px] relative max-w-[1440px] mx-auto select-none overflow-hidden border border-[#2d2f31] shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(0,0,0,0.9)]">
        
        {/* Metal Profile & Corner Hardware Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-30" 
          style={{
            backgroundImage: "url(/images/vendetta-highlights-kit/flightcase-hardware.svg)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat"
          }}
          aria-hidden="true"
        />

        {/* --- CABLES (Inlined for animation capabilities) --- */}
        
        {/* Desktop Cable SVG */}
        <div className="absolute bottom-6 left-0 right-0 h-[180px] z-10 hidden lg:block" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="metal-grad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ECE7DC"/>
                <stop offset="0.28" stopColor="#696D71"/>
                <stop offset="0.55" stopColor="#25282B"/>
                <stop offset="0.78" stopColor="#A9ADB0"/>
                <stop offset="1" stopColor="#3B3E41"/>
              </linearGradient>
              <filter id="shadow-filter" x="-20%" y="-50%" width="140%" height="200%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.65"/>
              </filter>
              <filter id="glow-filter" x="-20%" y="-200%" width="140%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#shadow-filter)">
              {/* Outer thick black shadow path */}
              <path d="M96 119C190 119 192 60 286 60S386 137 478 137 578 82 674 82s104 57 198 57 92-76 190-76 104 56 192 56h91"
                stroke="#3B0709" strokeWidth="14" strokeLinecap="round"/>
              {/* Base red cable path */}
              <path d="M96 116C190 116 192 57 286 57S386 134 478 134 578 79 674 79s104 57 198 57 92-76 190-76 104 56 192 56h91"
                stroke="#C80F1A" strokeWidth="9" strokeLinecap="round"/>
              {/* Inner glowing red core path */}
              <path d="M96 113C190 113 192 54 286 54S386 131 478 131 578 76 674 76s104 57 198 57 92-76 190-76 104 56 192 56h91"
                stroke="#F23842" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" filter="url(#glow-filter)"/>
              
              {/* Animated flowing signal pulse (Tenuous Red) */}
              <path d="M96 113C190 113 192 54 286 54S386 131 478 131 578 76 674 76s104 57 198 57 92-76 190-76 104 56 192 56h91"
                stroke="#FF3E4A" strokeWidth="3" strokeLinecap="round" filter="url(#glow-filter)"
                pathLength="100" strokeDasharray="15 100"
                className={isIntersected ? "animate-cable-signal" : ""}
                style={{ strokeDashoffset: 115 }}/>

              {/* Left Jack Connector (plugs to wall) */}
              <g transform="translate(16 89)">
                <path d="M0 14h28v22H0z" fill="url(#metal-grad)"/>
                <path d="M28 8h42c15 0 26 10 26 17S85 42 70 42H28z" fill="#17191B" stroke="#7C8083" strokeWidth="3"/>
                <path d="M2 18h19v14H2z" fill="#C8C9C6"/>
                <path d="M0 20h5v10H0z" fill="#E5E1D8"/>
                <path d="M73 12h15v26H73z" fill="#B5121B"/>
              </g>
              {/* Right Jack Connector (plugs to wall) */}
              <g transform="translate(1424 145) rotate(180)">
                <path d="M0 14h28v22H0z" fill="url(#metal-grad)"/>
                <path d="M28 8h42c15 0 26 10 26 17S85 42 70 42H28z" fill="#17191B" stroke="#7C8083" strokeWidth="3"/>
                <path d="M2 18h19v14H2z" fill="#C8C9C6"/>
                <path d="M0 20h5v10H0z" fill="#E5E1D8"/>
                <path d="M73 12h15v26H73z" fill="#B5121B"/>
              </g>
            </g>
          </svg>
        </div>

        {/* Mobile Cable SVG */}
        <div className="absolute bottom-4 left-0 right-0 h-[240px] z-10 lg:hidden" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 720 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="metal-grad-mob" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#EEE9DE"/>
                <stop offset="0.35" stopColor="#55595D"/>
                <stop offset="0.7" stopColor="#141618"/>
                <stop offset="1" stopColor="#A5A9AC"/>
              </linearGradient>
              <filter id="shadow-filter-mob" x="-20%" y="-40%" width="140%" height="180%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.7"/>
              </filter>
              <filter id="glow-filter-mob" x="-20%" y="-200%" width="140%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#shadow-filter-mob)">
              {/* Outer thick black shadow path */}
              <path d="M78 70c80 0 73 78 158 78s83-76 165-76 71 96 154 96c52 0 57-34 89-34"
                stroke="#3B0709" strokeWidth="14" strokeLinecap="round"/>
              {/* Base red cable path */}
              <path d="M78 67c80 0 73 78 158 78s83-76 165-76 71 96 154 96c52 0 57-34 89-34"
                stroke="#C80F1A" strokeWidth="9" strokeLinecap="round"/>
              {/* Inner glowing red core path */}
              <path d="M78 64c80 0 73 78 158 78s83-76 165-76 71 96 154 96c52 0 57-34 89-34"
                stroke="#F34A52" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" filter="url(#glow-filter-mob)"/>
              
              {/* Animated flowing signal pulse (Tenuous Red) */}
              <path d="M78 64c80 0 73 78 158 78s83-76 165-76 71 96 154 96c52 0 57-34 89-34"
                stroke="#FF3E4A" strokeWidth="3" strokeLinecap="round" filter="url(#glow-filter-mob)"
                pathLength="100" strokeDasharray="15 100"
                className={isIntersected ? "animate-cable-signal" : ""}
                style={{ strokeDashoffset: 115 }}/>

              {/* Left Jack Connector */}
              <g transform="translate(6 42)">
                <path d="M0 14h24v20H0z" fill="url(#metal-grad-mob)"/>
                <path d="M24 8h42c12 0 22 9 22 16S78 40 66 40H24z" fill="#17191B" stroke="#777B7E" strokeWidth="3"/>
                <path d="M68 12h13v24H68z" fill="#B5121B"/>
              </g>
              {/* Right Jack Connector */}
              <g transform="translate(714 164) rotate(180)">
                <path d="M0 14h24v20H0z" fill="url(#metal-grad-mob)"/>
                <path d="M24 8h42c12 0 22 9 22 16S78 40 66 40H24z" fill="#17191B" stroke="#777B7E" strokeWidth="3"/>
                <path d="M68 12h13v24H68z" fill="#B5121B"/>
              </g>
            </g>
          </svg>
        </div>


        {/* --- DECORATIVE HARDWARE (Handles & Red Tape) --- */}
        
        {/* Left Recessed Handle */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-28 rounded-lg bg-[#151719] border border-[#55595D] hidden lg:flex items-center justify-center shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] z-40"
          aria-hidden="true"
        >
          {/* Rivets */}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute left-1 top-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute right-1 top-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute left-1 bottom-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute right-1 bottom-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          {/* Handle Grip Bar */}
          <div className="w-[60%] h-[75%] rounded-md bg-black shadow-[inset_0_0_8px_rgba(0,0,0,0.9)] flex items-center justify-center">
            <div className="w-2.5 h-[80%] rounded-full bg-gradient-to-b from-[#777B7F] via-[#292C2F] to-[#8D9194] border border-[#3C3F42] shadow-sm flex flex-col justify-between py-1">
              <span className="w-full h-[2px] bg-[#121416]" />
              <span className="w-full h-[2px] bg-[#121416]" />
            </div>
          </div>
        </div>

        {/* Right Recessed Handle */}
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-28 rounded-lg bg-[#151719] border border-[#55595D] hidden lg:flex items-center justify-center shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] z-40"
          aria-hidden="true"
        >
          {/* Rivets */}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute left-1 top-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute right-1 top-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute left-1 bottom-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          <span className="absolute right-1 bottom-1.5 w-1 h-1 rounded-full bg-[#74777b]" />
          {/* Handle Grip Bar */}
          <div className="w-[60%] h-[75%] rounded-md bg-black shadow-[inset_0_0_8px_rgba(0,0,0,0.9)] flex items-center justify-center">
            <div className="w-2.5 h-[80%] rounded-full bg-gradient-to-b from-[#777B7F] via-[#292C2F] to-[#8D9194] border border-[#3C3F42] shadow-sm flex flex-col justify-between py-1">
              <span className="w-full h-[2px] bg-[#121416]" />
              <span className="w-full h-[2px] bg-[#121416]" />
            </div>
          </div>
        </div>

        {/* Top Left Red Tape */}
        <div 
          className="absolute left-12 top-6 w-24 h-7 bg-red-700/80 backdrop-blur-[0.5px] border border-red-800/40 shadow-sm transform -rotate-[12deg] z-40 pointer-events-none select-none opacity-90 mix-blend-multiply hidden lg:block"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.15))",
            clipPath: "polygon(2% 8%, 98% 3%, 95% 95%, 4% 97%)"
          }}
          aria-hidden="true"
        />
        {/* Bottom Right Red Tape */}
        <div 
          className="absolute right-24 bottom-6 w-32 h-9 bg-red-700/80 backdrop-blur-[0.5px] border border-red-800/40 shadow-sm transform -rotate-[5deg] z-40 pointer-events-none select-none opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.15))",
            clipPath: "polygon(4% 2%, 96% 7%, 98% 92%, 1% 95%)"
          }}
          aria-hidden="true"
        />

        {/* --- VERTICAL DIVIDER LINES (Metallic Engraved look) --- */}
        <div className="absolute inset-0 pointer-events-none z-20 hidden lg:block" aria-hidden="true">
          <div className="absolute left-[26.5%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/40 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.05)]" />
          <div className="absolute left-[43%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/40 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.05)]" />
          <div className="absolute left-[59.5%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/40 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.05)]" />
          <div className="absolute left-[76%] top-1/2 -translate-y-1/2 w-[1px] h-[55%] bg-gradient-to-b from-transparent via-[#55595D]/40 to-transparent shadow-[1px_0_0_rgba(255,255,255,0.05)]" />
        </div>

        {/* --- CH1-CH8 CHANNEL PANEL (Bottom Left) --- */}
        <div 
          className="absolute left-[12%] bottom-6 items-center gap-4 z-20 select-none pointer-events-none hidden lg:flex"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 text-[9px] font-barlow font-bold text-[#aaa8a2] tracking-[0.15em]">
            <span>CH1</span>
            <span>CH2</span>
            <span>CH4</span>
            <span>CH5</span>
            <div className="flex flex-col items-center gap-0.5 px-0.5">
              <span>CH6</span>
              {/* Electric blue LED signal micro-accent */}
              <span className="w-1.5 h-1 bg-[#2797ff] shadow-[0_0_6px_#2797ff] rounded-sm" />
            </div>
            <span>CH7</span>
            <span>CH8</span>
          </div>
        </div>

        {/* --- DESKTOP LAYOUT (Exact positions matching SVG curves) --- */}
        <div className="hidden lg:block w-full h-full relative z-20">
          <ul className="w-full h-full relative">
            {highlights.map((item, idx) => {
              const isFirst = idx === 0;
              return (
                <li 
                  key={item.id}
                  style={{ left: item.leftPercent }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center text-center select-none"
                >
                  {/* Outer relative box for number text with metal jacks on the sides */}
                  <div className="relative flex items-center justify-center px-6">
                    {/* Metal Plug left */}
                    <div className="absolute left-0 top-[45%] -translate-y-1/2 w-4 h-1.5 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-l-sm shadow-sm" />
                    
                    {/* Prefix label (like DESDE) */}
                    {item.prefix && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-barlow font-bold text-[10px] text-white/50 tracking-wider uppercase leading-none">
                        {item.prefix}
                      </span>
                    )}
                    
                    {/* Big Stats Numbers */}
                    <span 
                      className={`font-barlow font-black text-[#f2efe8] leading-none tracking-tighter distress-effect ${
                        isFirst 
                          ? "text-6xl xl:text-7xl" 
                          : "text-5xl xl:text-6xl"
                      }`}
                    >
                      {item.value}
                    </span>

                    {/* Metal Plug right */}
                    <div className="absolute right-0 top-[45%] -translate-y-1/2 w-4 h-1.5 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-r-sm shadow-sm" />
                  </div>

                  {/* Descriptive Label below the number */}
                  <div className="flex flex-col items-center mt-3">
                    <span className="font-barlow font-black text-[11px] xl:text-[12px] text-white/90 tracking-[0.18em] uppercase leading-none">
                      {item.label}
                    </span>
                    {/* Small red accent line centered below each label */}
                    <div className="w-7 h-[2px] bg-[#e31b23] mt-2.5" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>


        {/* --- TOUR LEVEL PLATE (HTML Overlay over the SVG plate) --- */}
        {/* Desktop Plate position: left-[76.67%] top-[30%] width-[18.33%] height-[36.11%] */}
        <div 
          className="absolute hidden lg:flex left-[76.67%] top-[30%] w-[18.33%] h-[36.11%] flex-col items-center justify-center text-center z-40 select-none px-2"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center justify-center h-full">
            {/* LED Indicators */}
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_#e31b23]" />
                <span className="text-[8px] font-barlow font-bold tracking-widest text-[#aaa8a2]">LIVE</span>
              </div>
              <div className="flex items-center gap-1">
                {/* 2-4px Blue electrical signal LED (micro-accent) */}
                <span className="w-1.5 h-1.5 rounded-full bg-[#2797ff] shadow-[0_0_6px_#2797ff]" />
                <span className="text-[8px] font-barlow font-bold tracking-widest text-[#aaa8a2]">SIGNAL</span>
              </div>
            </div>
            {/* Plate Title */}
            <div className="font-barlow font-black text-white text-base xl:text-xl tracking-tight leading-none uppercase">
              TOUR LEVEL
            </div>
            {/* Plate Subtitle */}
            <div className="font-barlow font-bold text-primary text-[8px] xl:text-[10px] tracking-wider uppercase mt-1 leading-none">
              PRODUCCIÓN DE GIRA
            </div>
            {/* Red accent line under the plate label */}
            <div className="w-7 h-[2px] bg-[#e31b23] mt-2" />
          </div>
        </div>


        {/* --- MOBILE LAYOUT --- */}
        {/* On Mobile: 2 rows. Top row: +500, +15, 5. Bottom row: DESDE 2 H, TOUR LEVEL. */}
        <div className="lg:hidden flex flex-col justify-between w-full h-full relative z-20 px-6 py-12">
          
          {/* Top Row: +500, +15, 5 */}
          <ul className="grid grid-cols-3 gap-2 w-full pt-4">
            {highlights.slice(0, 3).map((item) => (
              <li key={item.id} className="flex flex-col items-center text-center">
                <div className="relative px-3 flex items-center justify-center">
                  <div className="absolute left-0 top-[45%] -translate-y-1/2 w-2 h-1 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-l-sm" />
                  <span className="font-barlow font-black text-4xl sm:text-5xl text-white leading-none tracking-tighter distress-effect">
                    {item.value}
                  </span>
                  <div className="absolute right-0 top-[45%] -translate-y-1/2 w-2 h-1 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-r-sm" />
                </div>
                <span className="font-barlow font-bold text-[9px] sm:text-[10px] text-white/80 tracking-wider uppercase mt-2.5 leading-tight">
                  {item.label}
                </span>
                <div className="w-5 h-[1.5px] bg-[#e31b23] mt-2" />
              </li>
            ))}
          </ul>

          {/* Bottom Row: DESDE 2 H, TOUR LEVEL Plate */}
          <div className="grid grid-cols-2 gap-4 w-full items-center pb-4">
            
            {/* DESDE 2 H Column */}
            <div className="flex flex-col items-center text-center pl-4">
              <div className="flex items-baseline gap-1 justify-center relative px-3">
                <div className="absolute left-0 top-[45%] -translate-y-1/2 w-2 h-1 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-l-sm" />
                <span className="font-barlow font-bold text-[10px] sm:text-xs text-white/50 tracking-wider leading-none uppercase">
                  {highlights[3].prefix}
                </span>
                <span className="font-barlow font-black text-4xl sm:text-5xl text-white leading-none tracking-tighter distress-effect">
                  {highlights[3].value}
                </span>
                <div className="absolute right-0 top-[45%] -translate-y-1/2 w-2 h-1 bg-gradient-to-b from-[#ECE7DC] to-[#25282B] border border-black/50 rounded-r-sm" />
              </div>
              <span className="font-barlow font-bold text-[9px] sm:text-[10px] text-primary tracking-widest uppercase mt-2.5 leading-tight">
                {highlights[3].label}
              </span>
              <div className="w-5 h-[1.5px] bg-[#e31b23] mt-2" />
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
                {/* Red line */}
                <div className="w-5 h-[1.5px] bg-[#e31b23] mt-1.5" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
