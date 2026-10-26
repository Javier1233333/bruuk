import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Momento } from './db';
import { claveMes, nombreMes } from './fecha';
import { MemoryNode } from './MemoryNode';
import { desvioDe, flotacionDe, tamanoDe } from './orbita';

const POR_TANDA = 24;
const MARGEN = 16;
const CABEZA = 64;

type Punto = { x: number; y: number };
type Pieza =
  | { tipo: 'mes'; clave: string; y: number }
  | { tipo: 'nodo'; momento: Momento; x: number; y: number; tamano: number; lado: 'izq' | 'der' };

// Curva suave entre los puntos: cada tramo baja en vertical y gira hacia el siguiente, como un camino.
function trazo(puntos: Punto[]) {
  return puntos.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = puntos[i - 1];
    const medio = (p.y - prev.y) / 2;
    return `${d} C ${prev.x} ${prev.y + medio}, ${p.x} ${p.y - medio}, ${p.x} ${p.y}`;
  }, '');
}

type Props = {
  momentos: Momento[];
  variosAnios: boolean;
  onOpen: (id: string) => void;
  onNuevo: () => void;
};

// El camino de momentos: arriba lo que sigue (+), abajo lo que ya pasó. Se dibuja por tandas
// conforme bajas, así que no tiene final aunque haya cientos de momentos.
export function MemoryRoad({ momentos, variosAnios, onOpen, onNuevo }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const centinela = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [cuantos, setCuantos] = useState(POR_TANDA);

  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const observer = new ResizeObserver(([entrada]) => setAncho(Math.round(entrada.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visibles = useMemo(() => momentos.slice(0, cuantos), [momentos, cuantos]);
  const hayMas = momentos.length > cuantos;

  useEffect(() => {
    const el = centinela.current;
    if (!el || !hayMas) return;
    const observer = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) setCuantos((actual) => actual + POR_TANDA);
    }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
    // ancho: el centinela sólo existe una vez medido el camino
  }, [hayMas, cuantos, ancho]);

  const { piezas, puntos, alto, cabeza } = useMemo(() => {
    const piezas: Pieza[] = [];
    const cabeza = { x: ancho / 2, y: 20 + CABEZA / 2 };
    const puntos: Punto[] = [cabeza];
    let cursor = cabeza.y + CABEZA / 2;
    let mesAnterior = '';
    let previo: { lado: 'izq' | 'der'; tamano: number } | null = null;

    visibles.forEach((momento, index) => {
      const mes = claveMes(momento.fecha);
      if (mes !== mesAnterior) {
        mesAnterior = mes;
        const y = cursor + 40;
        piezas.push({ tipo: 'mes', clave: mes, y });
        puntos.push({ x: ancho / 2, y });
        cursor = y + 14;
        previo = null;
      }
      const tamano = tamanoDe(momento, ancho);
      const lado = index % 2 === 0 ? 'izq' : 'der';
      const desvio = Math.abs(desvioDe(momento.id));
      const x = lado === 'izq' ? MARGEN + 6 + desvio + tamano / 2 : ancho - MARGEN - 6 - desvio - tamano / 2;
      // Lados alternos: el siguiente círculo puede subir un poco junto al anterior.
      const encimado = previo && previo.lado !== lado ? Math.min(previo.tamano, tamano) * 0.3 : 0;
      const y = cursor + 28 - encimado + tamano / 2;
      piezas.push({ tipo: 'nodo', momento, x, y, tamano, lado });
      puntos.push({ x, y });
      cursor = y + tamano / 2;
      previo = { lado, tamano };
    });

    const final = { x: ancho / 2, y: cursor + 80 };
    puntos.push(final);
    return { piezas, puntos, alto: final.y + 70, cabeza };
  }, [visibles, ancho]);

  return (
    <div ref={contenedor} className="momentos-road" style={{ height: ancho ? alto : 0 }}>
      {ancho > 0 && (
        <>
          <svg className="momentos-road-path" width={ancho} height={alto} aria-hidden="true">
            <path d={trazo(puntos)} />
            {!hayMas && <circle cx={puntos[puntos.length - 1].x} cy={puntos[puntos.length - 1].y} r={5} />}
          </svg>

          <button type="button" className="momentos-road-nuevo" style={{ left: cabeza.x - CABEZA / 2, top: cabeza.y - CABEZA / 2 }} onClick={onNuevo}>
            <i><Plus size={24} strokeWidth={2} aria-hidden="true" /></i>
            <span>¿Qué pasó?</span>
          </button>

          <ol className="momentos-road-list">
            {piezas.map((pieza) => pieza.tipo === 'mes' ? (
              <li key={`mes-${pieza.clave}`} className="momentos-road-mes" style={{ top: pieza.y }}>
                <span>{nombreMes(pieza.clave, variosAnios)}</span>
              </li>
            ) : (
              <li key={pieza.momento.id}>
                <MemoryNode
                  momento={pieza.momento}
                  tamano={pieza.tamano}
                  lado={pieza.lado}
                  flotacion={flotacionDe(pieza.momento.id)}
                  onOpen={() => onOpen(pieza.momento.id)}
                  style={pieza.lado === 'izq'
                    ? { top: pieza.y - pieza.tamano / 2, left: pieza.x - pieza.tamano / 2, right: 8, height: pieza.tamano }
                    : { top: pieza.y - pieza.tamano / 2, left: 8, right: ancho - pieza.x - pieza.tamano / 2, height: pieza.tamano }}
                />
              </li>
            ))}
          </ol>

          {hayMas
            ? <div ref={centinela} className="momentos-road-centinela" style={{ top: Math.max(alto - 400, 0) }} />
            : <p className="momentos-road-fin" style={{ top: alto - 50 }}>Aquí empieza tu camino.</p>}
        </>
      )}
    </div>
  );
}
