import type { Momento } from './db';

// Forma y color de cada círculo del camino. Todo sale del id para que un momento
// se vea siempre igual: nada es un círculo perfecto, cada uno tiene su leve temblor.

// Colores Bruuk para los momentos sin foto (texto en tinta o en papel según el fondo).
const TONOS = [
  { fondo: '#8b7cf6', texto: '#fff' },
  { fondo: '#6557d8', texto: '#fff' },
  { fondo: '#b8affe', texto: '#0b0a12' },
  { fondo: '#0b0a12', texto: '#f7f6ff' },
  { fondo: '#e8a145', texto: '#0b0a12' },
  { fondo: '#7fc36a', texto: '#0b0a12' },
];

export function semilla(texto: string) {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i++) hash = Math.imul(hash ^ texto.charCodeAt(i), 16777619);
  return hash >>> 0;
}

// Número entre 0 y 1, distinto para cada id y cada "canal".
const azar = (id: string, canal: number) => (semilla(`${id}:${canal}`) % 1000) / 1000;

export const tonoDe = (id: string) => TONOS[semilla(id) % TONOS.length];

// border-radius irregular: un círculo hecho a mano, distinto en cada momento.
export function formaDe(id: string) {
  const r = (canal: number) => Math.round(46 + azar(id, canal) * 8);
  return `${r(1)}% ${100 - r(2)}% ${r(3)}% ${100 - r(4)}% / ${r(5)}% ${r(6)}% ${100 - r(7)}% ${100 - r(8)}%`;
}

// Cada círculo flota en su propia órbita, con duración y desfase distintos para que no vayan sincronizados.
export const flotacionDe = (id: string) => ({
  duracion: `${11 + azar(id, 9) * 4}s`,
  retraso: `${-azar(id, 10) * 12}s`,
});

// El "peso" del momento define su tamaño: foto, historia larga y ser uno de tus 3.
export function tamanoDe(momento: Momento, ancho: number) {
  let tamano = 96;
  if (momento.foto) tamano += 26;
  tamano += Math.min(momento.descripcion.length / 18, 20);
  if (momento.destacado) tamano += 16;
  return Math.round(Math.min(tamano, 158) * (ancho < 360 ? 0.88 : 1));
}

export const desvioDe = (id: string) => (azar(id, 11) - 0.5) * 36;

// Contorno irregular para dibujar el círculo en la imagen para compartir (canvas).
export function trazarCirculo(ctx: CanvasRenderingContext2D, x: number, y: number, radio: number, id: string) {
  const fase = azar(id, 12) * Math.PI * 2;
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const angulo = (i / 96) * Math.PI * 2;
    const r = radio * (1 + 0.011 * Math.sin(angulo * 3 + fase) + 0.008 * Math.sin(angulo * 5 + fase * 2));
    const px = x + Math.cos(angulo) * r;
    const py = y + Math.sin(angulo) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
