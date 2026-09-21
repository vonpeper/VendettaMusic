"use client";

export function VendettaExperience() {
  return (
    <section 
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 82% 45%, rgba(111, 13, 43, 0.35), transparent 50%),
          radial-gradient(ellipse at 18% 25%, rgba(119, 119, 255, 0.12), transparent 45%),
          linear-gradient(135deg, #07080D 0%, #15152B 42%, #42112D 72%, #6F0D2B 100%)
        `
      }}
      className="relative w-full py-[68px] md:py-[80px] lg:py-[96px] px-6 overflow-hidden select-none border-y border-white/10"
      aria-label="Experiencia y producción de Vendetta"
    >
      {/* Subtle Digital Grid Overlay */}
      <div 
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none"
        }}
      />

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto relative z-10 flex flex-col items-start">
        
        {/* Top Accent Line */}
        <div 
          aria-hidden="true" 
          className="w-16 h-[3px] bg-gradient-to-r from-[#FF5A5F] to-[#7777FF] mb-5 rounded-full"
        />

        {/* Section Header */}
        <h2 
          className="font-sans font-semibold text-xs md:text-sm tracking-[0.28em] uppercase text-[#FF5A5F] mb-12"
        >
          EXPERIENCIA EN ESCENA
        </h2>

        {/* Desktop and responsive Stats Grid */}
        <ul 
          className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12 md:gap-y-14 lg:gap-y-0 items-end"
        >
          {/* Stat 1: +500 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              className="font-sans font-black text-[#F2F0EB] text-[clamp(56px,16vw,78px)] lg:text-[96px] leading-[0.85] tracking-tight whitespace-nowrap drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] inline-flex items-baseline"
            >
              <span className="text-[#FF5A5F] mr-1" aria-hidden="true">+</span>
              <span>500</span>
            </span>
            <span 
              className="mt-3.5 font-sans font-normal text-xs uppercase tracking-[0.18em] text-[#F2F0EB]/70 max-w-[160px] leading-snug"
            >
              EVENTOS REALIZADOS
            </span>

            {/* Glass separator on desktop */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"
            />
          </li>

          {/* Stat 2: +15 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              className="font-sans font-black text-[#F2F0EB] text-[clamp(52px,15vw,68px)] lg:text-[84px] leading-[0.85] tracking-tight whitespace-nowrap drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] inline-flex items-baseline"
            >
              <span className="text-[#FF5A5F] mr-1" aria-hidden="true">+</span>
              <span>15</span>
            </span>
            <span 
              className="mt-3.5 font-sans font-normal text-xs uppercase tracking-[0.18em] text-[#F2F0EB]/70 max-w-[140px] leading-snug"
            >
              AÑOS DE TRAYECTORIA
            </span>

            {/* Glass separator on desktop */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"
            />
          </li>

          {/* Stat 3: 5 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              className="font-sans font-black text-[#F2F0EB] text-[clamp(52px,15vw,68px)] lg:text-[88px] leading-[0.85] tracking-tight drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
            >
              5
            </span>
            <span 
              className="mt-3.5 font-sans font-normal text-xs uppercase tracking-[0.18em] text-[#F2F0EB]/70 max-w-[130px] leading-snug"
            >
              MÚSICOS EN ESCENA
            </span>

            {/* Glass separator on desktop */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"
            />
          </li>

          {/* Stat 4: DESDE 2 H */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              className="font-sans font-light text-[11px] uppercase tracking-[0.24em] text-[#FF5A5F] mb-1 block"
            >
              DESDE
            </span>
            <span 
              className="font-sans font-black text-[#F2F0EB] text-[clamp(52px,15vw,68px)] lg:text-[84px] leading-[0.85] tracking-tight drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
            >
              2 H
            </span>
            <span 
              className="mt-3.5 font-sans font-normal text-xs uppercase tracking-[0.18em] text-[#F2F0EB]/70 max-w-[140px] leading-snug"
            >
              DE SHOW EN VIVO
            </span>

            {/* Glass separator on desktop */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"
            />
          </li>

          {/* Stat 5: TOUR LEVEL */}
          <li className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left justify-end h-full w-full max-w-[220px] mx-auto md:mx-0 mt-4 md:mt-0">
            <span 
              className="font-sans font-black text-[#F2F0EB] text-[46px] lg:text-[52px] leading-[0.82] tracking-tight uppercase drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] text-left"
            >
              TOUR<br />LEVEL
            </span>
            <span 
              className="mt-4 font-sans font-semibold text-xs uppercase tracking-[0.2em] text-[#FF5A5F]"
            >
              PRODUCCIÓN DE GIRA
            </span>
            
            {/* Stamp Indicator Line */}
            <div 
              aria-hidden="true" 
              className="w-12 h-[2px] bg-[#FF5A5F] mt-3"
            />
          </li>
        </ul>

      </div>
    </section>
  );
}
