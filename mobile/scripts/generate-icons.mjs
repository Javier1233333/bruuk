// Íconos y splash de la app desde el logo de la web (public/favicon.svg), como scripts/generate-app-icons.mjs.
// Uso: npm run icons (dentro de mobile/). sharp viene de las dependencias de la web.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile(new URL('../../public/favicon.svg', import.meta.url), 'utf8');
const glyph = svg.slice(svg.indexOf('<g transform'), svg.lastIndexOf('</svg>'));
const VIOLET = '#6d4cf6';

// La letra centrada y escalada; `fondo` null deja el fondo transparente.
const square = (scale, fondo, { monochrome = false } = {}) => {
  const body = monochrome ? glyph.replace(/fill="#[0-9a-f]{3,8}"/gi, 'fill="#ffffff"') : glyph;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">
  ${fondo ? `<rect width="375" height="375" fill="${fondo}"/>` : ''}
  <g transform="translate(187.5 187.5) scale(${scale}) translate(-187.5 -187.5)">${body}</g>
</svg>`;
};

const outputs = [
  // iOS y el ícono general: cuadrado lleno, el sistema le pone las esquinas.
  { file: 'icon.png', size: 1024, svg: square(0.9, VIOLET) },
  // Android adaptativo: fondo y figura por separado; la figura dentro de la zona segura (~66%).
  { file: 'android-icon-background.png', size: 1024, svg: square(0, VIOLET).replace(/<g[\s\S]*<\/g>/, '') },
  { file: 'android-icon-foreground.png', size: 1024, svg: square(0.62, null) },
  { file: 'android-icon-monochrome.png', size: 1024, svg: square(0.62, null, { monochrome: true }) },
  // Splash: el logo redondo completo sobre el fondo tinta de app.json.
  { file: 'splash-icon.png', size: 1024, svg },
  { file: 'favicon.png', size: 48, svg },
];

for (const { file, size, svg: source } of outputs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(new URL(`../assets/${file}`, import.meta.url).pathname);
  console.log(`assets/${file}`);
}
