import { PLAN_PLACES_BY_ID, type CustomPlan } from '../data/planBuilder';

// Imagen vertical (formato historia) para mandar el plan por WhatsApp o Instagram.
// Sólo lleva "bruuk.space" como texto: nada de links al plan.
const WIDTH = 1080;
const HEIGHT = 1920;
const PAD = 84;
const INK = '#0b0a12';
const PAPER = '#f7f6ff';
const PURPLE = '#8b7cf6';
const LILAC = '#b8affe';

const SHARE_TEXT = 'Mi plan en Bruuk · bruuk.space';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && lines.join(' ').length < text.trim().length) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
};

// Recorta la imagen para llenar el cuadro, como object-fit: cover.
const drawCover = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, size: number) => {
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const width = size / scale;
  const height = size / scale;
  ctx.drawImage(image, (image.naturalWidth - width) / 2, (image.naturalHeight - height) / 2, width, height, x, y, size, size);
};

const drawPlan = async (plan: CustomPlan) => {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No pudimos crear la imagen.');

  await Promise.all(['900 120px Outfit', '800 40px Outfit', '500 36px "DM Sans"'].map((font) => document.fonts?.load(font).catch(() => undefined)));

  const stops = plan.stops
    .map((stop) => ({ stop, place: PLAN_PLACES_BY_ID.get(stop.placeId) }))
    .filter((item): item is { stop: typeof item.stop; place: NonNullable<typeof item.place> } => Boolean(item.place))
    .slice(0, 5);
  const images = await Promise.all(stops.map(({ place }) => (place.imageUrl ? loadImage(place.imageUrl) : Promise.resolve(null))));

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textBaseline = 'top';

  // Encabezado
  let y = PAD + 10;
  ctx.fillStyle = PAPER;
  ctx.font = '900 64px Outfit';
  ctx.fillText('BRUUK', PAD, y);
  ctx.fillStyle = LILAC;
  ctx.font = '800 30px Outfit';
  const kicker = 'MI PLAN · GDL';
  ctx.fillText(kicker, WIDTH - PAD - ctx.measureText(kicker).width, y + 22);

  // Título
  y += 140;
  ctx.fillStyle = PAPER;
  ctx.font = '900 104px Outfit';
  for (const line of wrapLines(ctx, plan.title.toUpperCase(), WIDTH - PAD * 2, 3)) {
    ctx.fillText(line, PAD, y);
    y += 100;
  }

  // El hilo
  if (plan.thread) {
    y += 28;
    ctx.font = '800 38px Outfit';
    const lines = wrapLines(ctx, plan.thread, WIDTH - PAD * 2 - 72, 3);
    const boxHeight = 96 + lines.length * 50;
    ctx.fillStyle = PURPLE;
    ctx.fillRect(PAD + 14, y + 14, WIDTH - PAD * 2, boxHeight);
    ctx.fillStyle = PAPER;
    ctx.fillRect(PAD, y, WIDTH - PAD * 2, boxHeight);
    ctx.fillStyle = '#6557d8';
    ctx.font = '800 26px Outfit';
    ctx.fillText('EL HILO', PAD + 36, y + 32);
    ctx.fillStyle = INK;
    ctx.font = '800 38px Outfit';
    lines.forEach((line, index) => ctx.fillText(line, PAD + 36, y + 76 + index * 50));
    y += boxHeight + 14;
  }

  // Paradas: se reparten el espacio que queda antes del pie.
  const footerTop = HEIGHT - PAD - 90;
  y += 56;
  const rowGap = 26;
  const rowHeight = Math.min(220, (footerTop - 40 - y - rowGap * (stops.length - 1)) / Math.max(stops.length, 1));
  const thumb = rowHeight;
  stops.forEach(({ stop, place }, index) => {
    const top = y + index * (rowHeight + rowGap);
    const image = images[index];
    ctx.fillStyle = '#1c1930';
    ctx.fillRect(PAD, top, thumb, thumb);
    if (image) drawCover(ctx, image, PAD, top, thumb);
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 4;
    ctx.strokeRect(PAD, top, thumb, thumb);

    const textX = PAD + thumb + 36;
    const textWidth = WIDTH - PAD - textX;
    ctx.fillStyle = LILAC;
    ctx.font = '800 28px Outfit';
    const meta = [String(index + 1).padStart(2, '0'), stop.time, place.type.toUpperCase()].filter(Boolean).join(' · ');
    ctx.fillText(wrapLines(ctx, meta, textWidth, 1)[0] ?? '', textX, top + 8);
    ctx.fillStyle = PAPER;
    const nameSize = rowHeight < 170 ? 44 : 52;
    ctx.font = `900 ${nameSize}px Outfit`;
    wrapLines(ctx, place.name, textWidth, 2).forEach((line, lineIndex) => ctx.fillText(line, textX, top + 52 + lineIndex * (nameSize + 4)));
  });

  // Pie: sólo el sitio, como texto.
  ctx.fillStyle = 'rgba(247, 246, 255, .2)';
  ctx.fillRect(PAD, footerTop, WIDTH - PAD * 2, 3);
  ctx.fillStyle = PAPER;
  ctx.font = '900 48px Outfit';
  ctx.fillText('bruuk.space', PAD, footerTop + 34);
  ctx.fillStyle = '#aaa7ba';
  ctx.font = '800 26px Outfit';
  const motto = 'MENOS PANTALLA · MÁS MUNDO';
  ctx.fillText(motto, WIDTH - PAD - ctx.measureText(motto).width, footerTop + 48);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No pudimos crear la imagen.'))), 'image/jpeg', 0.9),
  );
};

// Comparte el JPG con la hoja del sistema (WhatsApp, Instagram…); si no se puede, lo descarga.
export async function sharePlanImage(plan: CustomPlan) {
  const blob = await drawPlan(plan);
  const file = new File([blob], 'plan-bruuk.jpg', { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: SHARE_TEXT });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
