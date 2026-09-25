// Genera una versión .webp ligera junto a cada JPG/PNG de public/img y public/radar.
// Uso: npm run images  (sólo procesa imágenes nuevas o modificadas)
import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import sharp from 'sharp';

const ROOTS = ['public/img', 'public/radar'];
const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
// Lado largo máximo: las fotos de artículos se ven a pantalla completa; el resto en tarjetas.
const maxSideFor = (file) => (file.startsWith('public/radar') ? 1800 : 1200);
const QUALITY = 78;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
let before = 0;
let after = 0;
let converted = 0;

for (const root of ROOTS) {
  for await (const file of walk(root)) {
    const extension = extname(file);
    if (!SOURCE_EXTENSIONS.has(extension.toLowerCase())) continue;

    const target = file.slice(0, -extension.length) + '.webp';
    const source = await stat(file);
    const existing = await stat(target).catch(() => null);
    if (existing && existing.mtimeMs >= source.mtimeMs) continue;

    const maxSide = maxSideFor(relative('.', file).replaceAll('\\', '/'));
    const info = await sharp(file)
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);

    before += source.size;
    after += info.size;
    converted += 1;
    console.log(`${relative('.', target)}  ${kb(source.size)} → ${kb(info.size)}  (${info.width}×${info.height})`);
  }
}

console.log(converted
  ? `\n${converted} imágenes: ${kb(before)} → ${kb(after)} (${Math.round((1 - after / before) * 100)}% menos)`
  : 'Todas las imágenes ya estaban optimizadas.');
