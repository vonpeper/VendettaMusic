const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public', 'images');
const HERO_PATH = path.join(IMG_DIR, 'vendetta-web-assets', 'vendetta-hero-4k.jpg');
const LOGO_PATH = path.join(IMG_DIR, 'logo-vendetta-horizontal.png');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

async function generateAll() {
  const width = 1200;
  const height = 630;

  // 1. Preparar imagen base de la banda
  // Alineada hacia la derecha para dar espacio al bloque editorial izquierdo
  const bandBuffer = await sharp(HERO_PATH)
    .resize(1260, 660, { fit: 'cover', position: 'right' })
    .extract({ left: 60, top: 15, width: 1200, height: 630 })
    .toBuffer();

  // Logo horizontal de Vendetta (~290px de ancho)
  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ width: 290 })
    .toBuffer();

  // Helper de construcción de cada variante
  async function buildOg({
    badgeText,
    badgeBg = 'url(#redGrad)',
    badgeColor = '#FFFFFF',
    cornerText = 'VIP ACCESS',
    cornerColor = '#DC2626',
    headlineMain,
    headlineSub,
    headlineSubColor = '#E11D48',
    description,
    tagline,
    p1Title,
    p1Sub,
    p1Color = '#E11D48',
    p2Title,
    p2Sub,
    p2Color = '#F59E0B',
    p3Title,
    p3Sub,
    p3Color = '#10B981',
    footerText = 'VENDETTA.MX • TOLUCA • METEPEC • CDMX • DESTINOS',
    outPng,
    outJpg,
  }) {
    const escBadgeText = escapeXml(badgeText);
    const escCornerText = escapeXml(cornerText);
    const escHeadlineMain = escapeXml(headlineMain);
    const escHeadlineSub = escapeXml(headlineSub);
    const escDescription = escapeXml(description);
    const escTagline = escapeXml(tagline);
    const escP1Title = escapeXml(p1Title);
    const escP1Sub = escapeXml(p1Sub);
    const escP2Title = escapeXml(p2Title);
    const escP2Sub = escapeXml(p2Sub);
    const escP3Title = escapeXml(p3Title);
    const escP3Sub = escapeXml(p3Sub);
    const escFooter = escapeXml(footerText);

    // Calcular ancho dinámico para el badge superior
    const badgeW = Math.max(220, badgeText.length * 8.8 + 36);

    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Degradado de viñeta horizontal: negro profundo editorial a la izquierda, transparencia total sobre la banda -->
          <linearGradient id="editorialFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#040407" stop-opacity="0.98"/>
            <stop offset="36%" stop-color="#05060A" stop-opacity="0.95"/>
            <stop offset="52%" stop-color="#06070E" stop-opacity="0.82"/>
            <stop offset="68%" stop-color="#07080E" stop-opacity="0.40"/>
            <stop offset="85%" stop-color="#07080E" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#07080E" stop-opacity="0.0"/>
          </linearGradient>

          <!-- Viñeta inferior para proteger pie de página -->
          <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="65%" stop-color="#040407" stop-opacity="0"/>
            <stop offset="100%" stop-color="#040407" stop-opacity="0.95"/>
          </linearGradient>

          <!-- Viñeta superior muy sutil -->
          <linearGradient id="topFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#040407" stop-opacity="0.6"/>
            <stop offset="25%" stop-color="#040407" stop-opacity="0"/>
          </linearGradient>

          <!-- Paleta de Degradados de Marca Vendetta -->
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#B91C1C"/>
            <stop offset="100%" stop-color="#E11D48"/>
          </linearGradient>

          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#10B981"/>
          </linearGradient>

          <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#B45309"/>
            <stop offset="100%" stop-color="#F59E0B"/>
          </linearGradient>

          <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.85"/>
          </filter>
        </defs>

        <!-- Capas de oscurecimiento -->
        <rect x="0" y="0" width="${width}" height="${height}" fill="url(#editorialFade)"/>
        <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bottomFade)"/>
        <rect x="0" y="0" width="${width}" height="${height}" fill="url(#topFade)"/>

        <!-- Marco exterior sutil con estética de credencial / flightcase -->
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="14" fill="none" stroke="#DC2626" stroke-opacity="0.4" stroke-width="1.5"/>
        <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="10" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>

        <!-- Badge de categoría superior -->
        <g transform="translate(68, 175)">
          <rect x="0" y="0" width="${badgeW}" height="32" rx="16" fill="${badgeBg}" filter="url(#textGlow)"/>
          <text x="18" y="21" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11.5" font-weight="900" fill="${badgeColor}" letter-spacing="2">
            ${escBadgeText}
          </text>
        </g>

        <!-- Badge de esquina superior derecha -->
        <g transform="translate(980, 42)">
          <rect x="0" y="0" width="165" height="30" rx="15" fill="#040407" fill-opacity="0.85" stroke="${cornerColor}" stroke-width="1.2"/>
          <circle cx="18" cy="15" r="4.5" fill="${cornerColor}"/>
          <text x="32" y="20" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" letter-spacing="1.5">
            ${escCornerText}
          </text>
        </g>

        <!-- Título Principal (2 renglones sin colisión de caracteres) -->
        <g transform="translate(68, 268)">
          <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="58" font-weight="900" fill="#FFFFFF" letter-spacing="3" filter="url(#textGlow)">
            ${escHeadlineMain}
          </text>
          <text x="0" y="42" font-family="'Helvetica Neue', Arial, sans-serif" font-size="24" font-weight="900" fill="${headlineSubColor}" letter-spacing="3.5" filter="url(#textGlow)">
            ${escHeadlineSub}
          </text>
        </g>

        <!-- Subtítulo descriptivo -->
        <text x="68" y="352" font-family="'Helvetica Neue', Arial, sans-serif" font-size="19" font-weight="700" fill="#F3F4F6" letter-spacing="0.4" filter="url(#textGlow)">
          ${escDescription}
        </text>

        <!-- Tagline técnico -->
        <text x="68" y="380" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14.5" font-weight="500" fill="#9CA3AF" letter-spacing="0.2">
          ${escTagline}
        </text>

        <!-- Línea divisoria elegante -->
        <line x1="68" y1="410" x2="600" y2="410" stroke="#374151" stroke-width="1" stroke-opacity="0.8"/>
        <line x1="68" y1="410" x2="160" y2="410" stroke="${headlineSubColor}" stroke-width="2.5"/>

        <!-- 3 Pilares informativos / Highlights con anchos y paddings calibrados -->
        <!-- Pilar 1 -->
        <g transform="translate(68, 438)">
          <rect x="0" y="0" width="160" height="52" rx="8" fill="#0C0D14" fill-opacity="0.9" stroke="#2D3748" stroke-width="1"/>
          <text x="14" y="23" font-family="'Impact', Arial, sans-serif" font-size="17.5" font-weight="900" fill="#FFFFFF">${escP1Title}</text>
          <text x="14" y="40" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10.5" font-weight="800" fill="${p1Color}" letter-spacing="1">${escP1Sub}</text>
        </g>

        <!-- Pilar 2 -->
        <g transform="translate(240, 438)">
          <rect x="0" y="0" width="175" height="52" rx="8" fill="#0C0D14" fill-opacity="0.9" stroke="#2D3748" stroke-width="1"/>
          <text x="14" y="23" font-family="'Impact', Arial, sans-serif" font-size="17.5" font-weight="900" fill="#FFFFFF">${escP2Title}</text>
          <text x="14" y="40" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10.5" font-weight="800" fill="${p2Color}" letter-spacing="1">${escP2Sub}</text>
        </g>

        <!-- Pilar 3 -->
        <g transform="translate(427, 438)">
          <rect x="0" y="0" width="175" height="52" rx="8" fill="#0C0D14" fill-opacity="0.9" stroke="#2D3748" stroke-width="1"/>
          <text x="14" y="23" font-family="'Impact', Arial, sans-serif" font-size="17.5" font-weight="900" fill="#FFFFFF">${escP3Title}</text>
          <text x="14" y="40" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10.5" font-weight="800" fill="${p3Color}" letter-spacing="1">${escP3Sub}</text>
        </g>

        <!-- Footer oficial con URL -->
        <g transform="translate(68, 552)">
          <text x="0" y="18" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="800" fill="#9CA3AF" letter-spacing="1.8">
            ${escFooter}
          </text>
        </g>

        <!-- Código de barras estilo backstage pass -->
        <g transform="translate(545, 545)" fill="#6B7280" opacity="0.6">
          <rect x="0" y="0" width="3" height="24"/>
          <rect x="5" y="0" width="2" height="24"/>
          <rect x="9" y="0" width="4" height="24"/>
          <rect x="16" y="0" width="2" height="24"/>
          <rect x="20" y="0" width="5" height="24"/>
          <rect x="28" y="0" width="2" height="24"/>
          <rect x="33" y="0" width="4" height="24"/>
          <rect x="40" y="0" width="2" height="24"/>
          <rect x="44" y="0" width="6" height="24"/>
          <rect x="53" y="0" width="3" height="24"/>
          <rect x="59" y="0" width="2" height="24"/>
          <rect x="63" y="0" width="4" height="24"/>
          <rect x="70" y="0" width="3" height="24"/>
          <rect x="76" y="0" width="5" height="24"/>
        </g>
      </svg>
    `);

    const finalImage = await sharp(bandBuffer)
      .composite([
        { input: svgOverlay, top: 0, left: 0 },
        // Logo de Vendetta en top: 44, left: 66
        { input: logoBuffer, top: 44, left: 66 }
      ])
      .png({ quality: 95 })
      .toBuffer();

    if (outPng) {
      fs.writeFileSync(outPng, finalImage);
      console.log('✓ Guardado PNG:', path.basename(outPng));
    }
    if (outJpg) {
      await sharp(finalImage).jpeg({ quality: 92 }).toFile(outJpg);
      console.log('✓ Guardado JPG:', path.basename(outJpg));
    }
  }

  // 1. COTIZACIÓN / PROPUESTA (Para links de cotización: /propuesta/[id] y /status/[id])
  await buildOg({
    badgeText: 'PROPUESTA EXCLUSIVA DE SHOW',
    badgeBg: 'url(#redGrad)',
    cornerText: 'VIP ACCESS PASS',
    cornerColor: '#DC2626',
    headlineMain: 'COTIZACIÓN',
    headlineSub: 'PROPUESTA FORMAL DE SHOW',
    headlineSubColor: '#E11D48',
    description: 'Banda de Pop & Rock en Vivo para Bodas y Eventos',
    tagline: 'Ficha técnica oficial • Rider de audio profesional • Esquema de pago',
    p1Title: '5 MÚSICOS',
    p1Sub: 'EN ESCENA',
    p1Color: '#E11D48',
    p2Title: 'AUDIO Y LUCES',
    p2Sub: 'ELECTRO-VOICE',
    p2Color: '#F59E0B',
    p3Title: 'BLOQUEO 50/50',
    p3Sub: 'FECHA BLINDADA',
    p3Color: '#10B981',
    footerText: 'VENDETTA.MX • TOLUCA • METEPEC • CDMX • DESTINOS',
    outPng: path.join(IMG_DIR, 'opengraph-cotizacion.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-cotizacion.jpg'),
  });

  // 2. CONFIRMACIÓN Y CONTRATO (Para eventos confirmados y firmas: /propuesta, /status, /confirmar)
  await buildOg({
    badgeText: 'CONTRATO DIGITAL • SHOW CONFIRMADO',
    badgeBg: 'url(#emeraldGrad)',
    cornerText: 'FECHA CONFIRMADA',
    cornerColor: '#10B981',
    headlineMain: 'SHOW CONFIRMADO',
    headlineSub: 'FECHA RESERVADA & CONTRATO',
    headlineSubColor: '#10B981',
    description: 'Garantía Oficial de Fecha y Contrato de Prestación de Servicios',
    tagline: 'Ficha técnica de producción • Horarios de montaje y prueba de audio',
    p1Title: 'FECHA BLINDADA',
    p1Sub: 'CON ANTICIPO',
    p1Color: '#10B981',
    p2Title: 'RIDER TÉCNICO',
    p2Sub: 'AUDIO Y MONTAJE',
    p2Color: '#F59E0B',
    p3Title: 'SHOW COMPLETO',
    p3Sub: 'POP Y ROCK VIVO',
    p3Color: '#E11D48',
    footerText: 'VENDETTA.MX • CONTRATO DIGITAL OFICIAL',
    outPng: path.join(IMG_DIR, 'opengraph-confirmacion.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-confirmacion.jpg'),
  });

  // 3. COTIZADOR EN LÍNEA (/cotizar)
  await buildOg({
    badgeText: 'COTIZADOR EN LÍNEA EN TIEMPO REAL',
    badgeBg: 'url(#redGrad)',
    cornerText: 'COTIZACIÓN INMEDIATA',
    cornerColor: '#DC2626',
    headlineMain: 'COTIZA TU SHOW',
    headlineSub: 'PRESUPUESTO EN SEGUNDOS',
    headlineSubColor: '#E11D48',
    description: 'Calcula tu cotización al instante para bodas y eventos',
    tagline: 'Paquetes Essential, Experience y Festival • Audio, iluminación y backline',
    p1Title: 'DESDE 2 HORAS',
    p1Sub: 'DE SHOW EN VIVO',
    p1Color: '#E11D48',
    p2Title: 'WHATSAPP',
    p2Sub: 'RESPUESTA RÁPIDA',
    p2Color: '#10B981',
    p3Title: 'SIN COMPROMISO',
    p3Sub: 'PRECIOS CLAROS',
    p3Color: '#F59E0B',
    footerText: 'VENDETTA.MX/COTIZAR • DISPONIBILIDAD INMEDIATA',
    outPng: path.join(IMG_DIR, 'opengraph-cotizar.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-cotizar.jpg'),
  });

  // 4. SITIO GENERAL / HOME / EVENTOS (/ y metadata base vendetta-hero-og-v2.jpg)
  await buildOg({
    badgeText: 'BANDA DE POP Y ROCK EN VIVO • TOUR LEVEL',
    badgeBg: 'url(#redGrad)',
    cornerText: 'CONCIERTO EN VIVO',
    cornerColor: '#E11D48',
    headlineMain: 'VENDETTA',
    headlineSub: 'LIVE MUSIC EXPERIENCE',
    headlineSubColor: '#E11D48',
    description: 'La experiencia de un concierto real en tu boda o evento privado',
    tagline: 'Pop y rock en inglés y español • Producción de gira con 5 músicos en escena',
    p1Title: '+500 SHOWS',
    p1Sub: 'REALIZADOS',
    p1Color: '#E11D48',
    p2Title: '100% EN VIVO',
    p2Sub: 'CERO PISTAS',
    p2Color: '#F59E0B',
    p3Title: 'TOUR LEVEL',
    p3Sub: 'AUDIO PROFESIONAL',
    p3Color: '#10B981',
    footerText: 'VENDETTA.MX • MÚSICA EN VIVO DE ALTO NIVEL',
    outPng: path.join(IMG_DIR, 'opengraph-evento.png'),
    outJpg: path.join(IMG_DIR, 'vendetta-hero-og-v2.jpg'),
  });

  // Sincronizar og-vendetta.jpg y vendetta-hero-og.jpg
  fs.copyFileSync(
    path.join(IMG_DIR, 'vendetta-hero-og-v2.jpg'),
    path.join(IMG_DIR, 'og-vendetta.jpg')
  );
  fs.copyFileSync(
    path.join(IMG_DIR, 'vendetta-hero-og-v2.jpg'),
    path.join(IMG_DIR, 'vendetta-hero-og.jpg')
  );
  console.log('✓ Sincronizado og-vendetta.jpg y vendetta-hero-og.jpg');
}

generateAll().catch(console.error);
