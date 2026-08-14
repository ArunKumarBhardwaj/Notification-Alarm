// Renders every icon slot (app icon, adaptive icon layers, splash mark, favicon)
// from one vector source so the brand stays consistent.
// Run: node scripts/generate-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.join(process.cwd(), 'assets', 'images');

const EMBER_LIGHT = '#FB8C3C';
const EMBER = '#C2410C';
const EMBER_DEEP = '#6B240A';
const CREAM = '#FFF6EF';

// Bell + sound waves, drawn in a 1024 box and centred on (512, 512).
// Intrinsic bounds are ~806 wide, so scale is expressed against that width.
const GLYPH_WIDTH = 806;

function glyph({ fill, stroke = fill, shadow = false, waveOpacity = 0.55 }) {
  return `
    <g${shadow ? ' filter="url(#drop)"' : ''}>
      <g transform="translate(0,37)">
        <path fill="${fill}" d="M512 262 C424 262 352 334 352 422 V520 C352 566 336 596 306 616 C292 626 300 648 318 648 H706 C724 648 732 626 718 616 C688 596 672 566 672 520 V422 C672 334 600 262 512 262 Z"/>
        <circle cx="512" cy="230" r="38" fill="${fill}"/>
        <path fill="${fill}" d="M442 684 a70 70 0 0 0 140 0 z"/>
        <g fill="none" stroke="${stroke}" stroke-linecap="round">
          <path d="M760 372 Q826 484 760 596" stroke-width="38"/>
          <path d="M264 372 Q198 484 264 596" stroke-width="38"/>
          <path d="M852 322 Q944 484 852 646" stroke-width="34" opacity="${waveOpacity}"/>
          <path d="M172 322 Q80 484 172 646" stroke-width="34" opacity="${waveOpacity}"/>
        </g>
      </g>
    </g>`;
}

function scaleToWidth(width) {
  const s = width / GLYPH_WIDTH;
  return `translate(512,512) scale(${s}) translate(-512,-512)`;
}

const dropShadow = `
  <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#3B1206" flood-opacity="0.35"/>
  </filter>`;

function fullIcon({ rounded = 0 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${EMBER_LIGHT}"/>
      <stop offset="0.52" stop-color="${EMBER}"/>
      <stop offset="1" stop-color="${EMBER_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.16" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    ${dropShadow}
  </defs>
  <rect width="1024" height="1024" rx="${rounded}" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="${rounded}" fill="url(#glow)"/>
  <g transform="${scaleToWidth(660)}">${glyph({ fill: CREAM, shadow: true })}</g>
</svg>`;
}

const backgroundLayer = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${EMBER_LIGHT}"/>
      <stop offset="0.52" stop-color="${EMBER}"/>
      <stop offset="1" stop-color="${EMBER_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.16" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
</svg>`;

// Adaptive layers get a tighter glyph: only the centre 66% survives every mask.
function layer({ fill, shadow }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${dropShadow}</defs>
  <g transform="${scaleToWidth(560)}">${glyph({ fill, shadow })}</g>
</svg>`;
}

// Splash sits on cream in light mode and near-black in dark mode, so the mark
// itself carries the ember gradient instead of relying on a backdrop.
const splashMark = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="mark" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#F97316"/>
      <stop offset="1" stop-color="${EMBER}"/>
    </linearGradient>
  </defs>
  <g transform="${scaleToWidth(900)}">${glyph({ fill: 'url(#mark)', waveOpacity: 0.72 })}</g>
</svg>`;

async function png(svg, file, size) {
  const buf = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(OUT, file), buf);
  console.log(`${file}  ${size}x${size}  ${(buf.length / 1024).toFixed(0)} KB`);
}

await mkdir(OUT, { recursive: true });
await png(fullIcon(), 'icon.png', 1024);
await png(backgroundLayer, 'android-icon-background.png', 1024);
await png(layer({ fill: CREAM, shadow: true }), 'android-icon-foreground.png', 1024);
await png(layer({ fill: '#FFFFFF', shadow: false }), 'android-icon-monochrome.png', 1024);
await png(splashMark, 'splash-icon.png', 1024);
await png(fullIcon({ rounded: 96 }), 'favicon.png', 256);
