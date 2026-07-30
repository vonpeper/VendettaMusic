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
          observer.disconnect();
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
      className="relative w-full bg-black py-0 overflow-hidden" 
      aria-label="Estadísticas de la Gira Vendetta"
    >
      {/* 
        Inline stylesheet for case background texture and fonts
        - Uses flightcase-texture.webp/avif with supports check.
      */}
      <style jsx global>{`
        .vendetta-highlights-surface {
          background-color: #08090a;
          background-image:
            linear-gradient(90deg, rgba(0,0,0,0.65), rgba(0,0,0,0.2) 18%, rgba(0,0,0,0.2) 82%, rgba(0,0,0,0.65)),
            url("/images/vendetta-highlights-kit/flightcase-texture.webp");
          background-size: 100% 100%, 768px 768px;
          background-repeat: no-repeat, repeat;
        }
        @supports (background-image: url("/images/vendetta-highlights-kit/flightcase-texture.avif")) {
          .vendetta-highlights-surface {
            background-image:
              linear-gradient(90deg, rgba(0,0,0,0.65), rgba(0,0,0,0.2) 18%, rgba(0,0,0,0.2) 82%, rgba(0,0,0,0.65)),
              url("/images/vendetta-highlights-kit/flightcase-texture.avif");
          }
        }
      `}</style>

      {/* 
        Flight Case Container
      */}
      <div className="w-full vendetta-highlights-surface h-[440px] lg:h-[320px] relative max-w-[1440px] mx-auto select-none overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.98)] border-y border-[#121416]">
        
        {/* Vignette Shadow Overlay (deep 3D lighting vignette) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

        {/* 3D Atmospheric Lighting Glows from the Designer's Render */}
        {/* Top-Left Red Stage Light Glow */}
        <div className="absolute top-0 left-0 w-[400px] h-[300px] bg-[radial-gradient(circle_at_0%_0%,rgba(227,27,35,0.45)_0%,rgba(227,27,35,0.1)_40%,transparent_70%)] pointer-events-none z-20" />
        
        {/* Blue Indicator Light Glow at bottom right */}
        <div className="absolute bottom-[20px] right-[120px] w-[180px] h-[180px] bg-[radial-gradient(circle_at_center,rgba(39,151,255,0.35)_0%,rgba(39,151,255,0.08)_45%,transparent_75%)] pointer-events-none z-20" />

        {/* --- DESKTOP VECTOR VIEWPORT (viewBox 0 0 1200 360) --- */}
        <div className="hidden lg:block w-full h-full relative z-20">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1200 360" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="metal-plug-grad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ECE7DC"/>
                <stop offset="0.28" stopColor="#696D71"/>
                <stop offset="0.55" stopColor="#25282B"/>
                <stop offset="0.78" stopColor="#A9ADB0"/>
                <stop offset="1" stopColor="#3B3E41"/>
              </linearGradient>

              {/* 
                UserSpaceOnUse Distressed Stencil Filter
                - Solves browser low-res scaling/blurriness bug.
                - Renders pin-sharp, high-DPI cracks and wear directly on text vectors.
              */}
              <filter id="stencil-grunge" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="360">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
                <feColorMatrix type="matrix" values="
                  1 0 0 0 0
                  1 0 0 0 0
                  1 0 0 0 0
                  1.75 0 0 0 -0.42
                " result="alpha-mask"/>
                <feComposite operator="in" in="SourceGraphic" in2="alpha-mask"/>
              </filter>

              {/* Metal Plug Pointing Right (Tip on right) */}
              <g id="jack-plug-right-pointing">
                <path d="M0 14h28v22H0z" fill="url(#metal-plug-grad)"/>
                <path d="M28 8h42c15 0 26 10 26 17S85 42 70 42H28z" fill="#17191B" stroke="#7C8083" strokeWidth="3"/>
                <path d="M2 18h19v14H2z" fill="#C8C9C6"/>
                <path d="M0 20h5v10H0z" fill="#E5E1D8"/>
                <path d="M73 12h15v26H73z" fill="#B5121B"/>
              </g>

              {/* Metal Plug Pointing Left (Tip on left) */}
              <g id="jack-plug-left-pointing">
                <g transform="scale(-1 1) translate(-88 0)">
                  <path d="M0 14h28v22H0z" fill="url(#metal-plug-grad)"/>
                  <path d="M28 8h42c15 0 26 10 26 17S85 42 70 42H28z" fill="#17191B" stroke="#7C8083" strokeWidth="3"/>
                  <path d="M2 18h19v14H2z" fill="#C8C9C6"/>
                  <path d="M0 20h5v10H0z" fill="#E5E1D8"/>
                  <path d="M73 12h15v26H73z" fill="#B5121B"/>
                </g>
              </g>

              {/* Silver circular socket ring */}
              <g id="jack-socket">
                <circle cx="0" cy="0" r="7" fill="#17191B" stroke="#7A7E81" strokeWidth="2"/>
                <circle cx="0" cy="0" r="3.5" fill="#000"/>
              </g>
            </defs>

            {/* 1. Designer's Cable Layer (Positioned behind numbers) */}
            <image 
              href="/images/vendetta-highlights-kit/cable-signal-desktop.svg" 
              x="0" 
              y="90" 
              width="1200" 
              height="150" 
              preserveAspectRatio="none"
            />

            {/* 2. Thin Vertical Separator Lines between Columns */}
            <line x1="335" y1="65" x2="335" y2="295" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>
            <line x1="515" y1="65" x2="515" y2="295" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>
            <line x1="685" y1="65" x2="685" y2="295" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>
            <line x1="865" y1="65" x2="865" y2="295" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>

            {/* 3. Channels micro indicators (Below wood grain) */}
            <text x="135" y="327" fontFamily="var(--font-barlow-condensed)" fontWeight="bold" fontSize="10" fill="#626466" letterSpacing="0.18em">
              CH1   CH2   CH4   CH5   <tspan fill="#848688">CH6</tspan>   CH7   CH8
            </text>
            <circle cx="258" cy="333" r="2.5" fill="#2797ff" filter="drop-shadow(0 0 3px #2797ff)"/>
            <circle cx="258" cy="333" r="1" fill="#fff"/>

            {/* 4. Sockets & Plugs (Positioned directly next to the numbers) */}
            {/* Stat 1 Plugs/Sockets (+500 at X=240, Y=138) */}
            <use href="#jack-socket" x="178" y="138"/>
            <use href="#jack-socket" x="302" y="138"/>
            <use href="#jack-plug-right-pointing" x="90" y="113"/>
            <use href="#jack-plug-left-pointing" x="302" y="113"/>

            {/* Stat 2 Plugs/Sockets (+15 at X=430, Y=202) */}
            <use href="#jack-socket" x="372" y="202"/>
            <use href="#jack-socket" x="488" y="202"/>
            <use href="#jack-plug-right-pointing" x="284" y="177"/>
            <use href="#jack-plug-left-pointing" x="488" y="177"/>

            {/* Stat 3 Plugs/Sockets (5 at X=600, Y=156) */}
            <use href="#jack-socket" x="548" y="156"/>
            <use href="#jack-socket" x="652" y="156"/>
            <use href="#jack-plug-right-pointing" x="460" y="131"/>
            <use href="#jack-plug-left-pointing" x="652" y="131"/>

            {/* Stat 4 Plugs/Sockets (2 H at X=770, Y=206) */}
            <use href="#jack-socket" x="712" y="206"/>
            <use href="#jack-socket" x="828" y="206"/>
            <use href="#jack-plug-right-pointing" x="624" y="181"/>
            <use href="#jack-plug-left-pointing" x="828" y="181"/>

            {/* Tour Level Sockets/Plugs */}
            <use href="#jack-socket" x="908" y="173"/>
            <use href="#jack-plug-right-pointing" x="820" y="148"/>

            {/* 5. Statistics Text Layer (Printed directly on wood, with distressed stencil grunge) */}
            {/* Stat 1: +500 */}
            <text x="240" y="210" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="85" fill="#f2efe8" filter="url(#stencil-grunge)">
              <tspan fontSize="45" dy="-22">+</tspan><tspan dy="22">500</tspan>
            </text>
            <text x="240" y="246" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="#aaa8a2" letterSpacing="0.1em">
              EVENTOS REALIZADOS
            </text>

            {/* Stat 2: +15 */}
            <text x="430" y="210" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="85" fill="#f2efe8" filter="url(#stencil-grunge)">
              <tspan fontSize="45" dy="-22">+</tspan><tspan dy="22">15</tspan>
            </text>
            <text x="430" y="246" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="#aaa8a2" letterSpacing="0.1em">
              AÑOS DE EXPERIENCIA
            </text>

            {/* Stat 3: 5 */}
            <text x="600" y="210" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="85" fill="#f2efe8" filter="url(#stencil-grunge)">
              5
            </text>
            <text x="600" y="246" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="#aaa8a2" letterSpacing="0.1em">
              MÚSICOS EN ESCENA
            </text>

            {/* Stat 4: DESDE 2 H */}
            <text x="770" y="125" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="rgba(242,239,232,0.4)" letterSpacing="0.12em">
              DESDE
            </text>
            <text x="770" y="210" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="85" fill="#f2efe8" filter="url(#stencil-grunge)">
              2<tspan fontSize="55" dx="2">H</tspan>
            </text>
            <text x="770" y="246" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="#aaa8a2" letterSpacing="0.1em">
              DE SHOW EN VIVO
            </text>

            {/* 6. TOUR LEVEL Stencil Paint (Printed directly on wood, to the left of the handle dish) */}
            <g filter="url(#stencil-grunge)">
              <rect x="888" y="105" width="136" height="110" fill="none" stroke="#f2efe8" strokeWidth="4.5" strokeDasharray="30 2 10 3 20 2" />
              <text x="956" y="148" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="32" fill="#f2efe8">TOUR</text>
              <text x="956" y="188" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="32" fill="#f2efe8">LEVEL</text>
            </g>
            <text x="956" y="242" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="11" fill="#e31b23" letterSpacing="0.1em">
              PRODUCCIÓN DE GIRA
            </text>
            <line x1="916" y1="254" x2="996" y2="254" stroke="#e31b23" strokeWidth="2"/>

            {/* 7. Metallic Frame Overlay (Covers viewport, providing profiles, brackets, rivets) */}
            <image 
              href="/images/vendetta-highlights-kit/flightcase-hardware.svg" 
              x="0" 
              y="0" 
              width="1200" 
              height="360" 
              preserveAspectRatio="none"
              pointerEvents="none"
            />

            {/* 8. Recessed Handles (Fotorrealistic left and right steel dishes with grip bars) */}
            {/* Left recessed handle (Symmetric replica of the right one) */}
            <g transform="translate(60 108)" pointerEvents="none">
              <rect width="220" height="130" rx="8" fill="#151719" stroke="url(#metal-plug-grad)" strokeWidth="5"/>
              <rect x="13" y="13" width="194" height="104" rx="3" fill="none" stroke="#55595D" strokeWidth="1.5"/>
              {/* Corner Dish Rivets */}
              <circle cx="22" cy="22" r="5" fill="#777B7F" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="198" cy="22" r="5" fill="#777B7F" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="22" cy="108" r="5" fill="#777B7F" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="198" cy="108" r="5" fill="#777B7F" stroke="#121416" strokeWidth="0.5"/>
              
              {/* Recessed Grip bar handle */}
              <rect x="40" y="30" width="140" height="70" rx="6" fill="#0c0d0e" />
              <rect x="50" y="60" width="120" height="10" rx="5" fill="url(#metal-plug-grad)" stroke="#111" strokeWidth="1"/>
            </g>

            {/* Right recessed handle (Inside the hardware SVG dish) */}
            <g transform="translate(920 108)" pointerEvents="none">
              {/* Recessed Grip bar handle */}
              <rect x="40" y="30" width="140" height="70" rx="6" fill="#0c0d0e" />
              <rect x="50" y="60" width="120" height="10" rx="5" fill="url(#metal-plug-grad)" stroke="#111" strokeWidth="1"/>
            </g>

            {/* Red Duct Tape (Vector paths inside the SVG for perfect blending) */}
            {/* Top Left Tape */}
            <path 
              d="M125 24 L245 10 L240 40 L120 54 Z" 
              fill="#9F0D15" 
              fillOpacity="0.88" 
              stroke="#5F050A" 
              strokeWidth="0.5" 
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
            />
            {/* Bottom Right Tape */}
            <path 
              d="M930 334 L1070 322 L1068 350 L928 360 Z" 
              fill="#9F0D15" 
              fillOpacity="0.88" 
              stroke="#5F050A" 
              strokeWidth="0.5" 
              filter="drop-shadow(0 -2px 4px rgba(0,0,0,0.4))"
            />
          </svg>
        </div>


        {/* --- MOBILE VECTOR VIEWPORT (viewBox 0 0 720 440) --- */}
        <div className="lg:hidden w-full h-full relative z-20">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 720 440" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="metal-grad-mob" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#D1D2CF"/>
                <stop offset="0.2" stopColor="#777B7F"/>
                <stop offset="0.52" stopColor="#292C2F"/>
                <stop offset="0.78" stopColor="#8D9194"/>
                <stop offset="1" stopColor="#3C3F42"/>
              </linearGradient>
              <radialGradient id="rivet-grad-mob">
                <stop stopColor="#D4D5D1"/>
                <stop offset="0.35" stopColor="#777B7E"/>
                <stop offset="1" stopColor="#202326"/>
              </radialGradient>
            </defs>

            {/* 1. Mobile Cable Layer */}
            <image 
              href="/images/vendetta-highlights-kit/cable-signal-mobile.svg" 
              x="0" 
              y="60" 
              width="720" 
              height="300" 
              preserveAspectRatio="none"
            />

            {/* 2. Separators on mobile */}
            <line x1="240" y1="40" x2="240" y2="180" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>
            <line x1="480" y1="40" x2="480" y2="180" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>
            <line x1="360" y1="210" x2="360" y2="380" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1"/>

            {/* 3. Mobile Statistics Text Layer with userSpaceOnUse filter */}
            {/* Stat 1: +500 */}
            <text x="120" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#stencil-grunge)">
              <tspan fontSize="32" dy="-14">+</tspan><tspan dy="14">500</tspan>
            </text>
            <text x="120" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              EVENTOS REALIZADOS
            </text>

            {/* Stat 2: +15 */}
            <text x="360" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#stencil-grunge)">
              <tspan fontSize="32" dy="-14">+</tspan><tspan dy="14">15</tspan>
            </text>
            <text x="360" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              AÑOS DE EXPERIENCIA
            </text>

            {/* Stat 3: 5 */}
            <text x="600" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#stencil-grunge)">
              5
            </text>
            <text x="600" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              MÚSICOS EN ESCENA
            </text>

            {/* Stat 4: DESDE 2 H */}
            <text x="180" y="255" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="10" fill="rgba(242,239,232,0.4)" letterSpacing="0.12em">
              DESDE
            </text>
            <text x="180" y="315" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#stencil-grunge)">
              2<tspan fontSize="42" dx="2">H</tspan>
            </text>
            <text x="180" y="342" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              DE SHOW EN VIVO
            </text>

            {/* Mobile Tour Level Stencil Paint */}
            <g transform="translate(440 230)">
              <g filter="url(#stencil-grunge)">
                <rect width="130" height="96" fill="none" stroke="#f2efe8" strokeWidth="4.5" strokeDasharray="30 2 10 3 20 2" />
                <text x="65" y="40" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="28" fill="#f2efe8">TOUR</text>
                <text x="65" y="75" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="28" fill="#f2efe8">LEVEL</text>
              </g>
              <text x="65" y="120" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="10" fill="#e31b23" letterSpacing="0.1em">
                PRODUCCIÓN DE GIRA
              </text>
              <line x1="25" y1="130" x2="105" y2="130" stroke="#e31b23" strokeWidth="2"/>
            </g>

            {/* 3. Mobile Borders & Rivets */}
            {/* Top Border */}
            <rect width="720" height="16" fill="url(#metal-grad-mob)"/>
            {/* Bottom Border */}
            <rect y="424" width="720" height="16" fill="url(#metal-grad-mob)"/>
            {/* Left Border */}
            <rect width="16" height="440" fill="url(#metal-grad-mob)"/>
            {/* Right Border */}
            <rect x="704" width="16" height="440" fill="url(#metal-grad-mob)"/>

            {/* Corner Plates */}
            <path d="M0 0h60v16H16v44H0z" fill="url(#metal-grad-mob)"/>
            <circle cx="28" cy="28" r="7" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="1.5"/>

            <path d="M720 0h-60v16h44v44h16z" fill="url(#metal-grad-mob)"/>
            <circle cx="692" cy="28" r="7" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="1.5"/>

            <path d="M0 440h60v-16H16v-44H0z" fill="url(#metal-grad-mob)"/>
            <circle cx="28" cy="412" r="7" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="1.5"/>

            <path d="M720 440h-60v-16h44v-44h16z" fill="url(#metal-grad-mob)"/>
            <circle cx="692" cy="412" r="7" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="1.5"/>

            <circle cx="180" cy="8" r="5" fill="url(#rivet-grad-mob)"/>
            <circle cx="360" cy="8" r="5" fill="url(#rivet-grad-mob)"/>
            <circle cx="540" cy="8" r="5" fill="url(#rivet-grad-mob)"/>

            <circle cx="180" cy="432" r="5" fill="url(#rivet-grad-mob)"/>
            <circle cx="360" cy="432" r="5" fill="url(--metal-plug-grad)"/>
            <circle cx="540" cy="432" r="5" fill="url(#rivet-grad-mob)"/>

            {/* Red Duct Tape Mobile */}
            <path 
              d="M480 415 L590 405 L587 428 L477 435 Z" 
              fill="#9F0D15" 
              fillOpacity="0.88" 
              stroke="#5F050A" 
              strokeWidth="0.5" 
              filter="drop-shadow(0 -2px 4px rgba(0,0,0,0.4))"
            />
          </svg>
        </div>

      </div>
    </section>
  );
}
