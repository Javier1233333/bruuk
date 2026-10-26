const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Las fechas se guardan como AAAA-MM-DD (sin hora) para que no se muevan de día con la zona horaria.
const partes = (fecha: string) => fecha.split('-').map(Number) as [number, number, number];

export const claveMes = (fecha: string) => fecha.slice(0, 7);

export function nombreMes(clave: string, conAnio = true) {
  const [anio, mes] = partes(`${clave}-01`);
  return conAnio ? `${MESES[mes - 1]} ${anio}` : MESES[mes - 1];
}

export const mesCorto = (clave: string) => nombreMes(clave, false).slice(0, 3);

export const diaDelMes = (fecha: string) => String(partes(fecha)[2]).padStart(2, '0');

export function fechaLarga(fecha: string) {
  const [anio, mes, dia] = partes(fecha);
  return `${DIAS[new Date(anio, mes - 1, dia).getDay()]} ${dia} de ${MESES[mes - 1]} ${anio}`;
}

// "café", "Cafe" y "#café" cuentan como la misma etiqueta.
export const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function leerEtiquetas(texto: string) {
  const vistas = new Set<string>();
  return texto
    .split(/[,\n]/)
    .map((tag) => tag.replace(/^#+/, '').trim().toLowerCase())
    .filter((tag) => tag && !vistas.has(normalizar(tag)) && vistas.add(normalizar(tag)))
    .slice(0, 8);
}
