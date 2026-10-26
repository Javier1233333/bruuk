import type { CSSProperties } from 'react';
import type { Momento } from './db';
import { diaDelMes, mesCorto } from './fecha';
import { formaDe, tonoDe } from './orbita';
import { usePhotoRef } from './photo';

export function Foto({ foto, alt, className }: { foto: Blob; alt: string; className?: string }) {
  const ref = usePhotoRef(foto);
  return <img ref={ref} className={className} alt={alt} decoding="async" draggable={false} />;
}

// El círculo de un momento: su foto, o el día sobre un color Bruuk si no tiene.
export function Circulo({ momento, tamano, className = '' }: { momento: Momento; tamano: number; className?: string }) {
  const tono = tonoDe(momento.id);
  const estilo = { width: tamano, height: tamano, borderRadius: formaDe(momento.id), background: tono.fondo, color: tono.texto } as CSSProperties;
  return (
    <span className={`momento-circulo ${className}`} style={estilo}>
      {momento.foto
        ? <Foto foto={momento.foto} alt="" />
        : <span className="momento-circulo-fecha"><b>{diaDelMes(momento.fecha)}</b>{mesCorto(momento.fecha.slice(0, 7))}</span>}
    </span>
  );
}

type Props = {
  momento: Momento;
  tamano: number;
  lado: 'izq' | 'der';
  flotacion: { duracion: string; retraso: string };
  style: CSSProperties;
  onOpen: () => void;
};

// Un punto del camino: el círculo flota en su propia órbita y la cédula corta va del lado contrario.
export function MemoryNode({ momento, tamano, lado, flotacion, style, onOpen }: Props) {
  return (
    <button
      type="button"
      className={`momento-nodo is-${lado} ${momento.destacado ? 'is-destacado' : ''}`}
      style={style}
      onClick={onOpen}
      aria-label={`${momento.titulo}, ${diaDelMes(momento.fecha)} de ${mesCorto(momento.fecha.slice(0, 7))}`}
    >
      <span className="momento-nodo-flota" style={{ '--flota-dur': flotacion.duracion, '--flota-delay': flotacion.retraso } as CSSProperties}>
        <Circulo momento={momento} tamano={tamano} />
      </span>
      <span className="momento-nodo-cedula" aria-hidden="true">
        <small>{diaDelMes(momento.fecha)} {mesCorto(momento.fecha.slice(0, 7))}{momento.destacado && <i> · TUS 3</i>}</small>
        <strong>{momento.titulo}</strong>
      </span>
    </button>
  );
}
