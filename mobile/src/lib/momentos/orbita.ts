import type { Momento } from './db';

// Forma y color de cada círculo del camino (como src/momentos/orbita.ts de la web). Todo sale del
// id para que un momento se vea siempre igual: nada es un círculo perfecto, cada uno tiene su leve temblor.

const TONOS = [
  { fondo: '#8b7cf6', texto: '#ffffff' },
  { fondo: '#6557d8', texto: '#ffffff' },
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
export const azar = (id: string, canal: number) => (semilla(`${id}:${canal}`) % 1000) / 1000;

export const tonoDe = (id: string) => TONOS[semilla(id) % TONOS.length];

// Esquinas un poco distintas: un círculo hecho a mano. React Native no tiene radios elípticos
// como el border-radius "a% b% / c% d%" de la web; con cuatro radios desiguales se logra el temblor.
export function formaDe(id: string, tamano: number) {
  const r = (canal: number) => tamano * (0.44 + azar(id, canal) * 0.1);
  return { borderTopLeftRadius: r(1), borderTopRightRadius: r(2), borderBottomRightRadius: r(3), borderBottomLeftRadius: r(4) };
}

// Cada círculo flota con su propio ritmo para que no vayan sincronizados.
export const flotacionDe = (id: string) => ({ duracion: 5500 + azar(id, 9) * 2000, retraso: azar(id, 10) * 2000 });

// El "peso" del momento define su tamaño: foto, historia larga y ser uno de tus 3.
export function tamanoDe(momento: Momento, ancho: number) {
  let tamano = 96;
  if (momento.foto) tamano += 26;
  tamano += Math.min(momento.descripcion.length / 18, 20);
  if (momento.destacado) tamano += 16;
  return Math.round(Math.min(tamano, 158) * (ancho < 360 ? 0.88 : 1));
}

export const desvioDe = (id: string) => (azar(id, 11) - 0.5) * 36;
