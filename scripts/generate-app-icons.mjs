// Genera los íconos PNG para "Agregar a inicio" (PWA y iOS) a partir de public/favicon.svg.
import { mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const glyph = svg.slice(svg.indexOf('<g transform'), svg.lastIndexOf('</svg>'));
const background = '#6d4cf6';

// Fondo cuadrado completo: los sistemas operativos aplican su propia máscara (círculo, squircle).
// `scale` encoge la letra para que quede dentro de la zona segura de los íconos "maskable".
const squareIcon = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">
  <rect width="375" height="375" fill="${background}"/>
  <g transform="translate(187.5 187.5) scale(${scale}) translate(-187.5 -187.5)">${glyph}</g>
</svg>`;

const outDir = new URL('../public/icons/', import.meta.url);
await mkdir(outDir, { recursive: true });

const icons = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.9 },
];

for (const icon of icons) {
  await sharp(Buffer.from(squareIcon(icon.scale))).resize(icon.size, icon.size).png().toFile(new URL(icon.file, outDir).pathname);
  console.log(`public/icons/${icon.file}`);
}
