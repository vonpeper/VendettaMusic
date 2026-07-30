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
            linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15) 18%, rgba(0,0,0,0.15) 82%, rgba(0,0,0,0.5)),
            url("/images/vendetta-highlights-kit/flightcase-texture.webp");
          background-size: 100% 100%, 768px 768px;
          background-repeat: no-repeat, repeat;
        }
        @supports (background-image: url("/images/vendetta-highlights-kit/flightcase-texture.avif")) {
          .vendetta-highlights-surface {
            background-image:
              linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15) 18%, rgba(0,0,0,0.15) 82%, rgba(0,0,0,0.5)),
              url("/images/vendetta-highlights-kit/flightcase-texture.avif");
          }
        }
      `}</style>

      {/* 
        Flight Case Container
      */}
      <div className="w-full vendetta-highlights-surface h-[440px] lg:h-[320px] relative max-w-[1440px] mx-auto select-none overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.98)]">
        
        {/* Vignette Shadow Overlay (deep 3D lighting vignette) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

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
                Drop Shadow Filters for realistic 3D depth
              */}
              <filter id="shadow-text" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8"/>
              </filter>
              <filter id="shadow-panel" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000000" floodOpacity="0.75"/>
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

            {/* 2. Channel micro indicators on bottom metal profile */}
            <text x="135" y="327" fontFamily="var(--font-barlow-condensed)" fontWeight="bold" fontSize="10" fill="#626466" letterSpacing="0.18em">
              CH1   CH2   CH4   CH5   <tspan fill="#848688">CH6</tspan>   CH7   CH8
            </text>
            <circle cx="258" cy="333" r="2.5" fill="#2797ff" filter="drop-shadow(0 0 3px #2797ff)"/>

            {/* 
              3. Statistics Panels & Texts (Perfect crisp rendering)
              - Solid patch panels hide the continuous cable line behind them.
              - Plugs connect physically to the sides of each panel.
            */}
            
            {/* Stat 1: +500 (Peak 1 at X=238, Y_cable=137.5) */}
            <g filter="url(#shadow-panel)">
              <rect x="158" y="98" width="160" height="96" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2" />
              <rect x="164" y="104" width="148" height="84" rx="3" fill="none" stroke="#25282b" strokeWidth="1" />
            </g>
            <use href="#jack-plug-right-pointing" x="110" y="116"/>
            <use href="#jack-plug-left-pointing" x="278" y="116"/>
            <text x="238" y="152" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#shadow-text)">
              <tspan fontSize="36" dy="-14">+</tspan><tspan dy="14">500</tspan>
            </text>
            <text x="238" y="180" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="10" fill="#aaa8a2" letterSpacing="0.12em">
              EVENTOS REALIZADOS
            </text>

            {/* Stat 2: +15 (Valley 1 at X=398, Y_cable=201.6) */}
            <g filter="url(#shadow-panel)">
              <rect x="318" y="162" width="160" height="96" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2" />
              <rect x="324" y="168" width="148" height="84" rx="3" fill="none" stroke="#25282b" strokeWidth="1" />
            </g>
            <use href="#jack-plug-right-pointing" x="270" y="180"/>
            <use href="#jack-plug-left-pointing" x="438" y="180"/>
            <text x="398" y="216" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#shadow-text)">
              <tspan fontSize="36" dy="-14">+</tspan><tspan dy="14">15</tspan>
            </text>
            <text x="398" y="244" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="10" fill="#aaa8a2" letterSpacing="0.12em">
              AÑOS DE EXPERIENCIA
            </text>

            {/* Stat 3: 5 (Peak 2 at X=562, Y_cable=155.8) */}
            <g filter="url(#shadow-panel)">
              <rect x="482" y="116" width="160" height="96" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2" />
              <rect x="488" y="122" width="148" height="84" rx="3" fill="none" stroke="#25282b" strokeWidth="1" />
            </g>
            <use href="#jack-plug-right-pointing" x="434" y="134"/>
            <use href="#jack-plug-left-pointing" x="602" y="134"/>
            <text x="562" y="170" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="56" fill="#f2efe8" filter="url(#shadow-text)">
              5
            </text>
            <text x="562" y="198" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="10" fill="#aaa8a2" letterSpacing="0.12em">
              MÚSICOS EN ESCENA
            </text>

            {/* Stat 4: DESDE 2 H (Valley 2 at X=727, Y_cable=205.8) */}
            <g filter="url(#shadow-panel)">
              <rect x="647" y="164" width="160" height="96" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2" />
              <rect x="653" y="170" width="148" height="84" rx="3" fill="none" stroke="#25282b" strokeWidth="1" />
            </g>
            <use href="#jack-plug-right-pointing" x="599" y="182"/>
            <use href="#jack-plug-left-pointing" x="767" y="182"/>
            <text x="727" y="190" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9" fill="rgba(242,239,232,0.4)" letterSpacing="0.12em">
              DESDE
            </text>
            <text x="727" y="232" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="48" fill="#f2efe8" filter="url(#shadow-text)">
              2<tspan fontSize="36" dx="2">H</tspan>
            </text>
            <text x="727" y="248" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="9.5" fill="#aaa8a2" letterSpacing="0.12em">
              DE SHOW EN VIVO
            </text>

            {/* 4. Sello / Text inside Plate (Aligned with the plate at X=920-1140, Y=108-238) */}
            <use href="#jack-plug-left-pointing" x="842" y="148" />
            <text x="1030" y="165" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="24" fill="#ffffff" filter="url(#shadow-text)" letterSpacing="0.02em">
              TOUR LEVEL
            </text>
            <text x="1030" y="190" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9.5" fill="#e31b23" filter="url(#shadow-text)" letterSpacing="0.12em">
              PRODUCCIÓN DE GIRA
            </text>
            <line x1="1005" y1="205" x2="1055" y2="205" stroke="#e31b23" strokeWidth="2.5"/>

            {/* 5. Metallic Frame Overlay (Covers viewport, providing profiles, brackets, rivets) */}
            <image 
              href="/images/vendetta-highlights-kit/flightcase-hardware.svg" 
              x="0" 
              y="0" 
              width="1200" 
              height="360" 
              preserveAspectRatio="none"
              pointerEvents="none"
            />

            {/* 6. Recessed Handles & Tape Details (Positioned outside hardware profiles) */}
            {/* Left recessed handle */}
            <g transform="translate(30 110)">
              <rect width="48" height="140" rx="8" fill="#131517" stroke="#55595D" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))"/>
              <rect x="7" y="15" width="34" height="110" rx="4" fill="#000" />
              <rect x="20" y="25" width="8" height="90" rx="4" fill="url(#metal-plug-grad)" stroke="#1d1f21" strokeWidth="1"/>
              <circle cx="7" cy="7" r="1.5" fill="#74777b"/>
              <circle cx="41" cy="7" r="1.5" fill="#74777b"/>
              <circle cx="7" cy="133" r="1.5" fill="#74777b"/>
              <circle cx="41" cy="133" r="1.5" fill="#74777b"/>
            </g>

            {/* Right recessed handle */}
            <g transform="translate(1122 110)">
              <rect width="48" height="140" rx="8" fill="#131517" stroke="#55595D" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))"/>
              <rect x="7" y="15" width="34" height="110" rx="4" fill="#000" />
              <rect x="20" y="25" width="8" height="90" rx="4" fill="url(#metal-plug-grad)" stroke="#1d1f21" strokeWidth="1"/>
              <circle cx="7" cy="7" r="1.5" fill="#74777b"/>
              <circle cx="41" cy="7" r="1.5" fill="#74777b"/>
              <circle cx="7" cy="133" r="1.5" fill="#74777b"/>
              <circle cx="41" cy="133" r="1.5" fill="#74777b"/>
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

            {/* 2. Stats Rows with solid background panels to hide the mobile cable */}
            {/* Stat 1: +500 */}
            <g filter="url(#shadow-panel)">
              <rect x="35" y="55" width="180" height="110" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2"/>
            </g>
            <text x="125" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="48" fill="#f2efe8" filter="url(#shadow-text)">
              <tspan fontSize="30" dy="-12">+</tspan><tspan dy="12">500</tspan>
            </text>
            <text x="125" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              EVENTOS REALIZADOS
            </text>

            {/* Stat 2: +15 */}
            <g filter="url(#shadow-panel)">
              <rect x="270" y="55" width="180" height="110" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2"/>
            </g>
            <text x="360" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="48" fill="#f2efe8" filter="url(#shadow-text)">
              <tspan fontSize="30" dy="-12">+</tspan><tspan dy="12">15</tspan>
            </text>
            <text x="360" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              AÑOS DE EXPERIENCIA
            </text>

            {/* Stat 3: 5 */}
            <g filter="url(#shadow-panel)">
              <rect x="505" y="55" width="180" height="110" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2"/>
            </g>
            <text x="595" y="112" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="48" fill="#f2efe8" filter="url(#shadow-text)">
              5
            </text>
            <text x="595" y="142" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              MÚCOS EN ESCENA
            </text>

            {/* Stat 4: DESDE 2 H */}
            <g filter="url(#shadow-panel)">
              <rect x="120" y="220" width="180" height="120" rx="6" fill="#151719" stroke="#3c3f42" strokeWidth="2"/>
            </g>
            <text x="210" y="255" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="10" fill="rgba(242,239,232,0.4)" letterSpacing="0.12em">
              DESDE
            </text>
            <text x="210" y="295" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="48" fill="#f2efe8" filter="url(#shadow-text)">
              2<tspan fontSize="36" dx="2">H</tspan>
            </text>
            <text x="210" y="318" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="700" fontSize="9" fill="#aaa8a2" letterSpacing="0.1em">
              DE SHOW EN VIVO
            </text>

            {/* Mobile Plate Box */}
            <g transform="translate(390 220)" filter="url(#shadow-panel)">
              <rect width="210" height="120" rx="8" fill="#151719" stroke="url(#metal-grad-mob)" strokeWidth="4"/>
              <rect x="10" y="10" width="190" height="100" rx="3" fill="none" stroke="#55595D" strokeWidth="1.5"/>
              <circle cx="18" cy="18" r="4" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="192" cy="18" r="4" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="18" cy="102" r="4" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="0.5"/>
              <circle cx="192" cy="102" r="4" fill="url(#rivet-grad-mob)" stroke="#121416" strokeWidth="0.5"/>
              
              <text x="105" y="58" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="23" fill="#ffffff" filter="url(#shadow-text)" letterSpacing="0.02em">
                TOUR LEVEL
              </text>
              <text x="105" y="82" textAnchor="middle" fontFamily="var(--font-barlow-condensed)" fontWeight="900" fontSize="9.5" fill="#e31b23" filter="url(#shadow-text)" letterSpacing="0.12em">
                PRODUCCIÓN DE GIRA
              </text>
              <line x1="85" y1="94" x2="125" y2="94" stroke="#e31b23" strokeWidth="2"/>
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
            <circle cx="360" cy="432" r="5" fill="url(#rivet-grad-mob)"/>
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
