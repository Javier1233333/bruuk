import type { Momento } from './db';
import { diaDelMes, mesCorto } from './fecha';
import { usePhotoRef } from './photo';

export function Foto({ foto, alt, className }: { foto: Blob; alt: string; className?: string }) {
  const ref = usePhotoRef(foto);
  return <img ref={ref} className={className} alt={alt} decoding="async" />;
}

export function MemoryCard({ momento, onOpen }: { momento: Momento; onOpen: () => void }) {
  return (
    <button type="button" className="momento-card" onClick={onOpen}>
      <span className="momento-card-date" aria-hidden="true">
        <b>{diaDelMes(momento.fecha)}</b>
        {mesCorto(momento.fecha.slice(0, 7))}
      </span>
      <span className="momento-card-body">
        <strong>{momento.titulo}</strong>
        {momento.descripcion && <span className="momento-card-text">{momento.descripcion}</span>}
        {momento.etiquetas.length > 0 && (
          <span className="momento-card-tags">{momento.etiquetas.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</span>
        )}
      </span>
      {momento.foto && <span className="momento-card-photo"><Foto foto={momento.foto} alt="" /></span>}
    </button>
  );
}
