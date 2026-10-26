import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BruukLogo } from '../components/BruukLogo';
import type { Momento } from './db';
import { diaDelMes, mesCorto } from './fecha';
import { tonoDe, trazarCirculo } from './orbita';

// Imágenes verticales (formato historia) para compartir Momentos: "tus 3" del año sobre el camino,
// o todas tus burbujas con el número de momentos guardados.
// Se arman en el teléfono: las fotos nunca salen de ahí salvo que la persona la comparta.
const ANCHO = 1080;
const ALTO = 1920;
const PAD = 84;
const TINTA = '#0b0a12';
const PAPEL = '#f7f6ff';
const VIOLETA = '#8b7cf6';
const VIOLETA_PROFUNDO = '#6557d8';
const LAVANDA = '#b8affe';
const SITIO = 'bruuk.app';

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// El logo es un SVG blanco: aquí va en tinta sobre papel.
async function logoEnTinta(ancho: number) {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => root.render(createElement(BruukLogo, { width: ancho, height: ancho * (120 / 375) })));
  const svg = container.innerHTML.replaceAll('#ffffff', TINTA);
  root.unmount();
  return cargarImagen(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

async function fotoComoImagen(foto: Blob | null) {
  if (!foto) return null;
  const url = URL.createObjectURL(foto);
  const image = await cargarImagen(url);
  URL.revokeObjectURL(url);
  return image;
}

function partirLineas(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number, maxLineas: number) {
  const lineas: string[] = [];
  let linea = '';
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const siguiente = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(siguiente).width <= maxAncho || !linea) {
      linea = siguiente;
      continue;
    }
    lineas.push(linea);
    linea = palabra;
    if (lineas.length === maxLineas) break;
  }
  if (lineas.length < maxLineas && linea) lineas.push(linea);
  if (lineas.length === maxLineas && lineas.join(' ').length < texto.trim().length) {
    let ultima = lineas[maxLineas - 1];
    while (ultima && ctx.measureText(`${ultima}…`).width > maxAncho) ultima = ultima.slice(0, -1);
    lineas[maxLineas - 1] = `${ultima.trimEnd()}…`;
  }
  return lineas;
}

// Lienzo de papel con el logo, un kicker a la derecha y el pie de Bruuk; cada imagen dibuja lo de en medio.
async function lienzo(kicker: string, fotos: (Blob | null)[]) {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No pudimos crear la imagen.');

  await Promise.all(['900 150px Outfit', '800 30px Outfit', '700 56px "DM Sans"'].map((font) => document.fonts?.load(font).catch(() => undefined)));
  const [logo, ...imagenes] = await Promise.all([logoEnTinta(260), ...fotos.map(fotoComoImagen)]);

  ctx.fillStyle = PAPEL;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.textBaseline = 'top';
  if (logo) ctx.drawImage(logo, PAD, PAD, 260, 260 * (120 / 375));
  ctx.fillStyle = VIOLETA_PROFUNDO;
  ctx.font = '800 30px Outfit';
  ctx.fillText(kicker, ANCHO - PAD - ctx.measureText(kicker).width, PAD + 26);

  ctx.fillStyle = 'rgba(11, 10, 18, .12)';
  ctx.fillRect(PAD, ALTO - PAD - 90, ANCHO - PAD * 2, 3);
  ctx.fillStyle = TINTA;
  ctx.font = '900 46px Outfit';
  ctx.fillText(SITIO, PAD, ALTO - PAD - 54);
  ctx.fillStyle = '#8a879b';
  ctx.font = '800 26px Outfit';
  const lema = 'MENOS PANTALLA · MÁS MUNDO';
  ctx.fillText(lema, ANCHO - PAD - ctx.measureText(lema).width, ALTO - PAD - 42);

  const terminar = () => new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No pudimos crear la imagen.'))), 'image/jpeg', 0.9),
  );
  return { ctx, imagenes, terminar };
}

// Un círculo con su foto (recortada como object-fit: cover) o su color Bruuk.
function dibujarCirculo(ctx: CanvasRenderingContext2D, momento: Momento, foto: HTMLImageElement | null, x: number, y: number, radio: number, conFecha: boolean) {
  const tono = tonoDe(momento.id);
  ctx.save();
  trazarCirculo(ctx, x, y, radio, momento.id);
  // Con foto no se pinta el fondo: se asomaría como una orilla de color.
  if (!foto) {
    ctx.fillStyle = tono.fondo;
    ctx.fill();
  }
  ctx.clip();
  if (foto) {
    const escala = Math.max((radio * 2) / foto.naturalWidth, (radio * 2) / foto.naturalHeight);
    const w = foto.naturalWidth * escala;
    const h = foto.naturalHeight * escala;
    ctx.drawImage(foto, x - w / 2, y - h / 2, w, h);
  } else if (conFecha) {
    ctx.fillStyle = tono.texto;
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.round(radio * 0.62)}px Outfit`;
    ctx.fillText(diaDelMes(momento.fecha), x, y - radio * 0.44);
    ctx.font = `800 ${Math.round(radio * 0.16)}px Outfit`;
    ctx.fillText(mesCorto(momento.fecha.slice(0, 7)).toUpperCase(), x, y + radio * 0.22);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

export async function dibujarTus3(momentos: Momento[], anio: string) {
  const { ctx, imagenes, terminar } = await lienzo(`MIS 3 · ${anio}`, momentos.map((m) => m.foto));

  ctx.fillStyle = TINTA;
  ctx.font = '900 150px Outfit';
  ctx.fillText(`MI ${anio}`, PAD - 6, 250);
  ctx.fillStyle = VIOLETA;
  ctx.fillText('AFUERA.', PAD - 6, 390);

  // Los tres círculos van en zigzag; el camino punteado los une y sigue hacia abajo.
  const radios = [210, 180, 195];
  const centros = momentos.map((_, i) => ({
    x: i % 2 === 0 ? PAD + 40 + radios[i] : ANCHO - PAD - 40 - radios[i],
    y: 780 + i * 355,
  }));
  const puntos = [{ x: ANCHO / 2, y: 590 }, ...centros, { x: ANCHO / 2, y: ALTO - 200 }];
  ctx.strokeStyle = LAVANDA;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.setLineDash([1, 26]);
  ctx.beginPath();
  puntos.forEach((p, i) => {
    if (i === 0) return ctx.moveTo(p.x, p.y);
    const prev = puntos[i - 1];
    const medio = (p.y - prev.y) / 2;
    ctx.bezierCurveTo(prev.x, prev.y + medio, p.x, p.y - medio, p.x, p.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  momentos.forEach((momento, i) => {
    const { x, y } = centros[i];
    const radio = radios[i];
    dibujarCirculo(ctx, momento, imagenes[i], x, y, radio, true);

    // Cédula del lado contrario al círculo
    const izquierda = i % 2 === 0;
    const textoX = izquierda ? x + radio + 44 : PAD;
    const textoAncho = izquierda ? ANCHO - PAD - textoX : x - radio - 44 - PAD;
    ctx.textAlign = izquierda ? 'left' : 'right';
    const anclaX = izquierda ? textoX : textoX + textoAncho;
    ctx.fillStyle = VIOLETA_PROFUNDO;
    ctx.font = '800 28px Outfit';
    ctx.fillText(`0${i + 1} · ${diaDelMes(momento.fecha)} ${mesCorto(momento.fecha.slice(0, 7)).toUpperCase()}`, anclaX, y - 70);
    ctx.fillStyle = TINTA;
    ctx.font = '700 50px "DM Sans"';
    partirLineas(ctx, momento.titulo, textoAncho, 3).forEach((linea, n) => ctx.fillText(linea, anclaX, y - 26 + n * 58));
    ctx.textAlign = 'left';
  });

  return terminar();
}

// Cuántas burbujas caben dibujadas; el número grande siempre dice el total real.
const MAX_BURBUJAS = 150;
const ZONA = { izq: PAD, der: ANCHO - PAD, arriba: 760, abajo: ALTO - PAD - 130 };

// Acomoda las burbujas desde el centro hacia afuera en espiral, sin que se encimen.
// Las más "pesadas" (con foto, de tus 3, con historia larga) son más grandes y quedan al centro.
function acomodarBurbujas(momentos: Momento[]) {
  const pesos = momentos.map((m) => 1 + (m.foto ? 0.4 : 0) + (m.destacado ? 0.8 : 0) + Math.min(m.descripcion.length / 400, 0.3));
  const ancho = ZONA.der - ZONA.izq;
  const alto = ZONA.abajo - ZONA.arriba;
  const k = Math.sqrt((0.5 * ancho * alto) / (Math.PI * pesos.reduce((a, b) => a + b, 0)));
  const orden = momentos.map((m, i) => ({ m, r: Math.min(k * Math.sqrt(pesos[i]), 230) })).sort((a, b) => b.r - a.r);
  const centro = { x: ANCHO / 2, y: (ZONA.arriba + ZONA.abajo) / 2 };
  const puestas: { m: Momento; x: number; y: number; r: number }[] = [];
  for (const { m, r } of orden) {
    for (let t = 0; t < 6000; t++) {
      const angulo = t * 0.31;
      const distancia = t * 0.55;
      const x = centro.x + Math.cos(angulo) * distancia;
      const y = centro.y + Math.sin(angulo) * distancia * (alto / ancho);
      if (x - r < ZONA.izq || x + r > ZONA.der || y - r < ZONA.arriba || y + r > ZONA.abajo) continue;
      if (puestas.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + 8)) continue;
      puestas.push({ m, x, y, r });
      break;
    }
  }
  return puestas;
}

export async function dibujarBurbujas(momentos: Momento[], anio: string | null) {
  const dibujables = momentos.slice(0, MAX_BURBUJAS);
  const puestas = acomodarBurbujas(dibujables);
  const { ctx, imagenes, terminar } = await lienzo(anio ? `MIS MOMENTOS · ${anio}` : 'MIS MOMENTOS', puestas.map((p) => p.m.foto));

  // El número es el protagonista
  const total = String(momentos.length);
  ctx.fillStyle = TINTA;
  ctx.font = '900 300px Outfit';
  ctx.fillText(total, PAD - 14, 190);
  ctx.font = '900 84px Outfit';
  ctx.fillText(momentos.length === 1 ? 'MOMENTO' : 'MOMENTOS', PAD - 4, 500);
  ctx.fillStyle = VIOLETA;
  ctx.fillText('AFUERA.', PAD - 4, 584);
  ctx.fillStyle = '#8a879b';
  ctx.font = '700 36px "DM Sans"';
  ctx.fillText(anio ? `Guardados en Bruuk en ${anio}.` : 'Guardados en Bruuk.', PAD, 690);

  puestas.forEach((p, i) => {
    dibujarCirculo(ctx, p.m, imagenes[i], p.x, p.y, p.r, p.r > 90);
    if (p.m.destacado) {
      trazarCirculo(ctx, p.x, p.y, p.r + 9, p.m.id);
      ctx.strokeStyle = VIOLETA;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  });

  return terminar();
}

// Comparte la imagen con la hoja del sistema (Instagram, WhatsApp…); si no se puede, la descarga.
export async function compartirImagen(imagen: Blob, nombre: string, texto: string) {
  const file = new File([imagen], nombre, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${texto} · ${SITIO}` });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
    return;
  }
  const url = URL.createObjectURL(imagen);
  const link = Object.assign(document.createElement('a'), { href: url, download: nombre });
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
