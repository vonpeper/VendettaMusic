const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public', 'images');
const OG_SUBDIR = path.join(IMG_DIR, 'og');
const HERO_PATH = path.join(IMG_DIR, 'vendetta-web-assets', 'vendetta-hero-2560.jpg');
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

  if (!fs.existsSync(OG_SUBDIR)) {
    fs.mkdirSync(OG_SUBDIR, { recursive: true });
  }

  // Cargar y recortar el logotipo oficial transparente
  const logoTrimmed = await sharp(LOGO_PATH).trim().toBuffer();
  
  // Fondo de la banda en alta resolución escalado a 1200x630
  const heroBg = await sharp(HERO_PATH)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Helper para generar tarjetas OpenGraph: Fondo + Logo + Label
  async function buildOgCard({
    label = '',
    outJpg,
    outPng,
    syncPaths = []
  }) {
    const escLabel = escapeXml(label);

    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.1"/>
            <stop offset="70%" stop-color="#07080D" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#040407" stop-opacity="0.9"/>
          </radialGradient>
          <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <!-- Filtro dark stage para legibilidad del logo y label -->
        <rect width="${width}" height="${height}" fill="#07080D" fill-opacity="0.68"/>
        <rect width="${width}" height="${height}" fill="url(#vignette)"/>

        ${label ? `
          <!-- Label del mensaje correspondiente -->
          <text x="600" y="525" text-anchor="middle" font-family="'Impact', 'Arial Black', -apple-system, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" letter-spacing="14" filter="url(#labelShadow)">
            ${escLabel}
          </text>
        ` : ''}
      </svg>
    `);

    // Dimensionar logotipo según si lleva label o es el logo centrado de marca
    const logoWidth = label ? 560 : 620;
    const logoBuffer = await sharp(logoTrimmed).resize({ width: logoWidth }).toBuffer();
    const logoMeta = await sharp(logoBuffer).metadata();

    const logoTop = label 
      ? Math.round((430 - logoMeta.height) / 2) + 35 
      : Math.round((height - logoMeta.height) / 2);
    const logoLeft = Math.round((width - logoMeta.width) / 2);

    const finalImage = await sharp(heroBg)
      .composite([
        { input: svgOverlay, top: 0, left: 0 },
        { input: logoBuffer, top: logoTop, left: logoLeft }
      ])
      .png({ quality: 95 })
      .toBuffer();

    if (outPng) {
      fs.writeFileSync(outPng, finalImage);
      console.log('✓ Guardado PNG:', path.basename(outPng));
    }

    if (outJpg) {
      await sharp(finalImage).jpeg({ quality: 94 }).toFile(outJpg);
      console.log('✓ Guardado JPG:', path.basename(outJpg));
    }

    for (const targetPath of syncPaths) {
      fs.copyFileSync(outJpg || outPng, targetPath);
      console.log('✓ Sincronizado:', path.basename(targetPath));
    }
  }

  // 1. PROPUESTA (Para links de cotización: /propuesta/[id] y /status/[id])
  await buildOgCard({
    label: 'PROPUESTA',
    outPng: path.join(IMG_DIR, 'opengraph-cotizacion.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-cotizacion.jpg'),
    syncPaths: [
      path.join(OG_SUBDIR, 'vendetta-proposal-card.jpg')
    ]
  });

  // 2. CONTRATO (Para eventos confirmados y firmas: /status/[id])
  await buildOgCard({
    label: 'CONTRATO',
    outPng: path.join(IMG_DIR, 'opengraph-confirmacion.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-confirmacion.jpg'),
    syncPaths: [
      path.join(OG_SUBDIR, 'vendetta-contract-card.jpg')
    ]
  });

  // 3. COTIZACIÓN (Para cotizador en línea: /cotizar)
  await buildOgCard({
    label: 'COTIZACIÓN',
    outPng: path.join(IMG_DIR, 'opengraph-cotizar.png'),
    outJpg: path.join(IMG_DIR, 'opengraph-cotizar.jpg')
  });

  // 4. IDENTIDAD DE LA BANDA (Para home y Mensaje 2: https://vendetta.mx)
  await buildOgCard({
    label: '',
    outPng: path.join(IMG_DIR, 'opengraph-evento.png'),
    outJpg: path.join(IMG_DIR, 'vendetta-hero-og-v2.jpg'),
    syncPaths: [
      path.join(IMG_DIR, 'og-vendetta.jpg'),
      path.join(IMG_DIR, 'vendetta-hero-og.jpg'),
      path.join(OG_SUBDIR, 'vendetta-brand-card.jpg')
    ]
  });

  console.log('✨ Tarjetas OpenGraph generadas con éxito: Fondo + Logo + Label.');
}

generateAll().catch(console.error);

