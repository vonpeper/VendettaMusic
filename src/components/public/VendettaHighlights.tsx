export function VendettaHighlights() {
  return (
    <section 
      className="w-full bg-[#050505] px-6 py-7 overflow-hidden" 
      aria-label="Experiencia y producción de Vendetta"
    >
      {/* Flight case interior */}
      <div 
        style={{
          backgroundColor: "#08090a",
          backgroundImage: "linear-gradient(rgba(5, 5, 5, 0.18), rgba(5, 5, 5, 0.38)), -webkit-image-set(url('/images/vendetta-highlights-kit/flightcase-texture.avif') type('image/avif'), url('/images/vendetta-highlights-kit/flightcase-texture.webp') type('image/webp'))",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        className="max-w-[1280px] h-auto md:h-[400px] lg:h-[292px] mx-auto relative overflow-hidden rounded-[6px] border-t-[10px] border-t-[#56595c] border-b-[10px] border-b-[#36393c] shadow-[inset_0_1px_rgba(255,255,255,0.25),inset_0_-1px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.5)]"
      >
        
        {/* --- DECORATIVE ELEMENTS (aria-hidden) --- */}
        {/* Case Corner Rivets */}
        <div aria-hidden="true" className="absolute top-[10px] left-[10px] w-2 h-2 rounded-full shadow-[1px_1px_2px_rgba(0,0,0,0.8)] bg-[radial-gradient(circle_at_30%_30%,#a8adb0_0%,#56595c_60%,#1e2022_100%)]" />
        <div aria-hidden="true" className="absolute top-[10px] right-[10px] w-2 h-2 rounded-full shadow-[1px_1px_2px_rgba(0,0,0,0.8)] bg-[radial-gradient(circle_at_30%_30%,#a8adb0_0%,#56595c_60%,#1e2022_100%)]" />
        <div aria-hidden="true" className="absolute bottom-[10px] left-[10px] w-2 h-2 rounded-full shadow-[1px_1px_2px_rgba(0,0,0,0.8)] bg-[radial-gradient(circle_at_30%_30%,#a8adb0_0%,#56595c_60%,#1e2022_100%)]" />
        <div aria-hidden="true" className="absolute bottom-[10px] right-[10px] w-2 h-2 rounded-full shadow-[1px_1px_2px_rgba(0,0,0,0.8)] bg-[radial-gradient(circle_at_30%_30%,#a8adb0_0%,#56595c_60%,#1e2022_100%)]" />

        {/* Technical Labels */}
        <span aria-hidden="true" className="absolute left-[34px] bottom-[14px] text-[9px] font-mono tracking-widest text-[#f2efe8]/40 select-none pointer-events-none">
          INPUT 01
        </span>
        <span aria-hidden="true" className="absolute right-[34px] bottom-[14px] text-[9px] font-mono tracking-widest text-[#f2efe8]/40 select-none pointer-events-none">
          OUTPUT 05
        </span>

        {/* --- DESKTOP CABLE SYSTEM (z-index 1) --- */}
        <div 
          aria-hidden="true"
          className="hidden lg:block absolute left-[34px] right-[34px] bottom-[54px] height-[4px] z-1 select-none pointer-events-none"
        >
          {/* Red Cable */}
          <div className="w-full h-1 rounded-full opacity-[0.82] shadow-[0_0_9px_rgba(227,27,35,0.28)] bg-[linear-gradient(90deg,#55080c,#d31821_14%,#e31b23_50%,#9f0d14_86%,#3b0709)]" />
          
          {/* Left Plug (Metal sleeve) */}
          <div 
            style={{ width: "32px", height: "10px", background: "#333", border: "1px solid #666", borderRadius: "2px" }}
            className="absolute left-0 top-[-3px]"
          />
          {/* Right Plug (Metal sleeve) */}
          <div 
            style={{ width: "32px", height: "10px", background: "#333", border: "1px solid #666", borderRadius: "2px" }}
            className="absolute right-0 top-[-3px]"
          />
        </div>

        {/* --- DESKTOP LAYOUT (5 columns grid) --- */}
        <ul 
          className="hidden lg:grid w-full h-full relative z-10 items-center pl-[54px] pr-[54px] pt-[42px] pb-[38px] select-none"
          style={{ gridTemplateColumns: "1.18fr 0.82fr 0.68fr 1fr 1.22fr" }}
        >
          {/* 1. +500 */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(72px, 7vw, 104px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              +500
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-3.5 leading-[1.1] max-w-[170px]"
            >
              EVENTOS REALIZADOS
            </span>
          </li>

          {/* 2. +15 */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(56px, 5vw, 78px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              +15
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-3.5 leading-[1.1] max-w-[140px]"
            >
              AÑOS DE EXPERIENCIA
            </span>
          </li>

          {/* 3. 5 */}
          <li className="flex flex-col items-start text-left z-10 relative">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(64px, 5.5vw, 86px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              5
            </span>
            
            {/* Small Blue LED Indicator */}
            <div 
              aria-hidden="true" 
              className="w-[4px] h-[4px] rounded-full bg-[#2797ff] shadow-[0_0_6px_#2797ff] my-[5px]" 
            />

            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-1 leading-[1.1] max-w-[120px]"
            >
              MÚSICOS EN ESCENA
            </span>
          </li>

          {/* 4. DESDE 2 H */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "15px", letterSpacing: ".18em", color: "#e31b23" }} 
              className="font-bold uppercase mb-[2px]"
            >
              DESDE
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.8, fontSize: "clamp(60px, 5.5vw, 88px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              2 H
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-3 leading-[1.1] max-w-[150px]"
            >
              DE SHOW EN VIVO
            </span>
          </li>

          {/* 5. TOUR LEVEL */}
          <li className="flex flex-col items-center justify-center text-center z-10">
            {/* Plate Box */}
            <div 
              style={{ width: "220px", height: "108px", backgroundColor: "#111315", border: "1px solid rgba(190, 190, 190, 0.5)" }}
              className="relative rounded-[4px] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            >
              {/* Plate corner rivets */}
              <div className="absolute top-[6px] left-[6px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
              <div className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
              <div className="absolute bottom-[6px] left-[6px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
              <div className="absolute bottom-[6px] right-[6px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />

              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.9 }}
                className="text-[#f2efe8] text-[26px] tracking-tight uppercase"
              >
                TOUR<br />LEVEL
              </span>
            </div>

            {/* Subtitle below plate */}
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#e31b23] mt-3.5 leading-none"
            >
              PRODUCCIÓN DE GIRA
            </span>
            {/* Inspector Red Line */}
            <div aria-hidden="true" className="w-[45px] h-[2px] bg-[#e31b23] mt-[6px] rounded-full" />
          </li>
        </ul>

        {/* --- TABLET CABLE SYSTEM (z-index 1) --- */}
        <div 
          aria-hidden="true"
          className="hidden md:max-lg:block absolute left-[34px] right-[34px] bottom-[120px] height-[4px] z-1 select-none pointer-events-none"
        >
          {/* Red Cable */}
          <div className="w-full h-1 rounded-full opacity-[0.82] shadow-[0_0_9px_rgba(227,27,35,0.28)] bg-[linear-gradient(90deg,#55080c,#d31821_14%,#e31b23_50%,#9f0d14_86%,#3b0709)]" />
          
          {/* Left Plug (Metal sleeve) */}
          <div 
            style={{ width: "32px", height: "10px", background: "#333", border: "1px solid #666", borderRadius: "2px" }}
            className="absolute left-0 top-[-3px]"
          />
          {/* Right Plug (Metal sleeve) */}
          <div 
            style={{ width: "32px", height: "10px", background: "#333", border: "1px solid #666", borderRadius: "2px" }}
            className="absolute right-0 top-[-3px]"
          />
        </div>

        {/* --- TABLET LAYOUT (3 columns top, 2 columns bottom) --- */}
        <div className="hidden md:max-lg:flex flex-col justify-between h-full w-full pl-12 pr-12 pt-10 pb-8 select-none">
          {/* Row 1 (3 stats) */}
          <ul className="flex justify-between items-center w-full">
            {/* 1. +500 */}
            <li className="flex flex-col items-start text-left z-10">
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(64px, 5vw, 84px)" }} 
                className="text-[#f2efe8] tracking-tighter"
              >
                +500
              </span>
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
              >
                EVENTOS REALIZADOS
              </span>
            </li>

            {/* 2. +15 */}
            <li className="flex flex-col items-start text-left z-10">
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(50px, 4vw, 68px)" }} 
                className="text-[#f2efe8] tracking-tighter"
              >
                +15
              </span>
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
              >
                AÑOS DE EXPERIENCIA
              </span>
            </li>

            {/* 3. 5 */}
            <li className="flex flex-col items-start text-left z-10">
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(56px, 4.5vw, 76px)" }} 
                className="text-[#f2efe8] tracking-tighter"
              >
                5
              </span>
              {/* Small Blue LED Indicator */}
              <div 
                aria-hidden="true" 
                className="w-[4px] h-[4px] rounded-full bg-[#2797ff] shadow-[0_0_6px_#2797ff] my-[5px]" 
              />
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-1 leading-[1.1]"
              >
                MÚSICOS EN ESCENA
              </span>
            </li>
          </ul>

          {/* Row 2 (2 stats) */}
          <ul className="flex justify-around items-center w-full mt-4">
            {/* 4. DESDE 2 H */}
            <li className="flex flex-col items-start text-left z-10">
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "14px", letterSpacing: ".18em", color: "#e31b23" }} 
                className="font-bold uppercase mb-[1px]"
              >
                DESDE
              </span>
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.8, fontSize: "clamp(54px, 4.5vw, 76px)" }} 
                className="text-[#f2efe8] tracking-tighter"
              >
                2 H
              </span>
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
              >
                DE SHOW EN VIVO
              </span>
            </li>

            {/* 5. TOUR LEVEL */}
            <li className="flex flex-col items-center justify-center text-center z-10">
              <div 
                style={{ width: "210px", height: "100px", backgroundColor: "#111315", border: "1px solid rgba(190, 190, 190, 0.5)" }}
                className="relative rounded-[4px] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                {/* Plate corner rivets */}
                <div className="absolute top-[5px] left-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute bottom-[5px] left-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute bottom-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),1px_1px_1px_rgba(0,0,0,0.5)]" />

                <span 
                  style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.9 }}
                  className="text-[#f2efe8] text-[24px] tracking-tight uppercase"
                >
                  TOUR<br />LEVEL
                </span>
              </div>

              {/* Subtitle below plate */}
              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#e31b23] mt-2 leading-none"
              >
                PRODUCCIÓN DE GIRA
              </span>
            </li>
          </ul>
        </div>


        {/* --- MOBILE LAYOUT (<767px) --- */}
        <ul className="md:hidden grid grid-cols-2 gap-x-6 gap-y-[30px] w-full px-[22px] py-[34px] relative z-10 select-none">
          
          {/* Fila 1 Col 1: +500 */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(56px, 12vw, 84px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              +500
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
            >
              EVENTOS REALIZADOS
            </span>
          </li>

          {/* Fila 1 Col 2: +15 */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(48px, 10vw, 68px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              +15
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
            >
              AÑOS DE EXPERIENCIA
            </span>
          </li>

          {/* Fila 2 Col 1: 5 */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.78, fontSize: "clamp(52px, 11vw, 76px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              5
            </span>
            {/* Small Blue LED Indicator */}
            <div 
              aria-hidden="true" 
              className="w-[4px] h-[4px] rounded-full bg-[#2797ff] shadow-[0_0_6px_#2797ff] my-[5px]" 
            />
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#f2efe8]/72 mt-1 leading-[1.1]"
            >
              MÚSICOS EN ESCENA
            </span>
          </li>

          {/* Fila 2 Col 2: DESDE 2 H */}
          <li className="flex flex-col items-start text-left z-10">
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "13px", letterSpacing: ".15em", color: "#e31b23" }} 
              className="font-bold uppercase mb-[1px]"
            >
              DESDE
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.8, fontSize: "clamp(50px, 11vw, 76px)" }} 
              className="text-[#f2efe8] tracking-tighter"
            >
              2 H
            </span>
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#f2efe8]/72 mt-2 leading-[1.1]"
            >
              DE SHOW EN VIVO
            </span>
          </li>

          {/* Fila 3: TOUR LEVEL (Centrado ocupando ambas columnas) */}
          <li className="col-span-2 flex flex-col items-center justify-center text-center mt-3 z-10 relative">
            
            {/* Short Red Line behind Tour Level on Mobile */}
            <div 
              aria-hidden="true" 
              className="absolute left-[-22px] right-[-22px] h-[2px] bg-[#e31b23]/30 z-0 top-[50%] select-none pointer-events-none" 
            />

            <div 
              style={{ width: "210px", height: "100px", backgroundColor: "#111315", border: "1px solid rgba(190, 190, 190, 0.5)" }}
              className="relative rounded-[4px] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10"
            >
              {/* Plate corner rivets */}
              <div className="absolute top-[5px] left-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c]" />
              <div className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c]" />
              <div className="absolute bottom-[5px] left-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c]" />
              <div className="absolute bottom-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#56595c]" />

              <span 
                style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 900, lineHeight: 0.9 }}
                className="text-[#f2efe8] text-[24px] tracking-tight uppercase"
              >
                TOUR<br />LEVEL
              </span>
            </div>

            {/* Subtitle below plate */}
            <span 
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
              className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#e31b23] mt-3 leading-none z-10"
            >
              PRODUCCIÓN DE GIRA
            </span>
          </li>
        </ul>

      </div>
    </section>
  );
}
