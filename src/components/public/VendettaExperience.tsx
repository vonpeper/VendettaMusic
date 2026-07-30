"use client";

export function VendettaExperience() {
  return (
    <section 
      style={{
        backgroundColor: "#070707",
        backgroundImage: `
          radial-gradient(ellipse at 82% 45%, rgba(188, 16, 25, 0.10), transparent 38%),
          linear-gradient(180deg, #090909 0%, #050505 100%)
        `
      }}
      className="relative w-full py-[64px] md:py-[72px] lg:py-[88px] px-[22px] md:px-6 overflow-hidden select-none"
      aria-label="Experiencia y producción de Vendetta"
    >
      {/* Subtle Grid Overlay */}
      <div 
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.35,
          pointerEvents: "none"
        }}
      />

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto relative z-10 flex flex-col items-start">
        
        {/* Top Accent Red Line */}
        <div 
          aria-hidden="true" 
          style={{ width: "72px", height: "3px", backgroundColor: "#e31b23" }} 
          className="mb-[18px] rounded-full"
        />

        {/* Section Header */}
        <h2 
          style={{
            fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: ".28em",
            color: "#e31b23"
          }}
          className="uppercase mb-12"
        >
          EXPERIENCIA EN ESCENA
        </h2>

        {/* Desktop and responsive Stats Grid */}
        <ul 
          className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-[48px] md:gap-y-[54px] lg:gap-y-0 lg:gap-x-0 items-end"
          style={{
            // Overridden dynamically on LG breakpoint via standard CSS
            gridTemplateColumns: "var(--grid-cols-desktop, repeat(2, 1fr))"
          }}
        >
          {/* Inject dynamic grid sizing on desktop screens */}
          <style>{`
            @media (min-width: 1024px) {
              ul {
                grid-template-columns: 1.25fr 1fr 0.8fr 1fr 1.1fr !important;
                gap: clamp(24px, 4vw, 64px) !important;
              }
            }
          `}</style>

          {/* Stat 1: +500 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              style={{
                fontFamily: 'var(--font-heading), "Montserrat", sans-serif',
                fontWeight: 900,
                fontStyle: "normal",
                color: "#f3f0e9",
                lineHeight: 0.82,
                textShadow: "0 5px 18px rgba(0,0,0,.35)",
                display: "inline-flex",
                alignItems: "baseline",
                whiteSpace: "nowrap",
                letterSpacing: "normal"
              }}
              className="text-[clamp(64px,20vw,82px)] lg:text-[104px]"
            >
              <span style={{ marginRight: "0.06em" }} aria-hidden="true">+</span>
              <span style={{ letterSpacing: "-0.045em" }}>500</span>
            </span>
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".17em",
                lineHeight: 1.25,
                color: "rgba(243,240,233,.58)"
              }}
              className="mt-3.5 uppercase max-w-[160px]"
            >
              EVENTOS REALIZADOS
            </span>

            {/* Separator on desktop */}
            <div 
              aria-hidden="true" 
              style={{
                position: "absolute",
                right: "-12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1px",
                height: "68px",
                background: "linear-gradient(transparent, rgba(255,255,255,.16), transparent)"
              }}
              className="hidden lg:block"
            />
          </li>

          {/* Stat 2: +15 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              style={{
                fontFamily: 'var(--font-heading), "Montserrat", sans-serif',
                fontWeight: 900,
                fontStyle: "normal",
                color: "#f3f0e9",
                lineHeight: 0.82,
                textShadow: "0 5px 18px rgba(0,0,0,.35)",
                display: "inline-flex",
                alignItems: "baseline",
                whiteSpace: "nowrap",
                letterSpacing: "normal"
              }}
              className="text-[clamp(58px,18vw,72px)] lg:text-[82px]"
            >
              <span style={{ marginRight: "0.06em" }} aria-hidden="true">+</span>
              <span style={{ letterSpacing: "-0.045em" }}>15</span>
            </span>
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".17em",
                lineHeight: 1.25,
                color: "rgba(243,240,233,.58)"
              }}
              className="mt-3.5 uppercase max-w-[140px]"
            >
              AÑOS DE EXPERIENCIA
            </span>

            {/* Separator on desktop */}
            <div 
              aria-hidden="true" 
              style={{
                position: "absolute",
                right: "-12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1px",
                height: "68px",
                background: "linear-gradient(transparent, rgba(255,255,255,.16), transparent)"
              }}
              className="hidden lg:block"
            />
          </li>

          {/* Stat 3: 5 */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              style={{
                fontFamily: 'var(--font-heading), "Montserrat", sans-serif',
                fontWeight: 900,
                fontStyle: "normal",
                color: "#f3f0e9",
                lineHeight: 0.82,
                letterSpacing: "-0.045em",
                textShadow: "0 5px 18px rgba(0,0,0,.35)"
              }}
              className="text-[clamp(58px,18vw,72px)] lg:text-[92px]"
            >
              5
            </span>
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".17em",
                lineHeight: 1.25,
                color: "rgba(243,240,233,.58)"
              }}
              className="mt-3.5 uppercase max-w-[130px]"
            >
              MÚSICOS EN ESCENA
            </span>

            {/* Separator on desktop */}
            <div 
              aria-hidden="true" 
              style={{
                position: "absolute",
                right: "-12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1px",
                height: "68px",
                background: "linear-gradient(transparent, rgba(255,255,255,.16), transparent)"
              }}
              className="hidden lg:block"
            />
          </li>

          {/* Stat 4: DESDE 2 H */}
          <li className="relative flex flex-col items-start justify-end h-full">
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: ".22em",
                color: "#e31b23"
              }}
              className="uppercase mb-[9px]"
            >
              DESDE
            </span>
            <span 
              style={{
                fontFamily: 'var(--font-heading), "Montserrat", sans-serif',
                fontWeight: 900,
                fontStyle: "normal",
                color: "#f3f0e9",
                lineHeight: 0.82,
                letterSpacing: "-0.045em",
                textShadow: "0 5px 18px rgba(0,0,0,.35)"
              }}
              className="text-[clamp(58px,18vw,72px)] lg:text-[88px]"
            >
              2 H
            </span>
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".17em",
                lineHeight: 1.25,
                color: "rgba(243,240,233,.58)"
              }}
              className="mt-3.5 uppercase max-w-[140px]"
            >
              DE SHOW EN VIVO
            </span>

            {/* Separator on desktop */}
            <div 
              aria-hidden="true" 
              style={{
                position: "absolute",
                right: "-12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1px",
                height: "68px",
                background: "linear-gradient(transparent, rgba(255,255,255,.16), transparent)"
              }}
              className="hidden lg:block"
            />
          </li>

          {/* Stat 5: TOUR LEVEL */}
          <li className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left justify-end h-full w-full max-w-[210px] mx-auto md:mx-0 mt-3 md:mt-0">
            <span 
              style={{
                fontFamily: 'var(--font-heading), "Montserrat", sans-serif',
                fontWeight: 900,
                fontStyle: "normal",
                lineHeight: 0.72,
                color: "#f3f0e9",
                textShadow: "0 5px 18px rgba(0,0,0,.35)",
                fontSize: "58px",
                letterSpacing: "-0.04em",
                textAlign: "left"
              }}
              className="uppercase"
            >
              TOUR<br />LEVEL
            </span>
            <span 
              style={{
                fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: ".18em",
                color: "#e31b23"
              }}
              className="mt-[18px] uppercase"
            >
              PRODUCCIÓN DE GIRA
            </span>
            
            {/* Stamp Red Line */}
            <div 
              aria-hidden="true" 
              style={{ width: "44px", height: "2px", backgroundColor: "#e31b23" }} 
              className="mt-[18px]"
            />
          </li>
        </ul>

      </div>
    </section>
  );
}
