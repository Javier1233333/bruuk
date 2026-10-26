import { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { db, type Momento } from './db';
import { fechaLarga } from './fecha';
import { Foto } from './MemoryCard';
import { useSheet } from './useSheet';

// La historia completa: foto grande (tocarla la abre sin recortes) y el texto entero.
export function MemoryDetail({ momento, onClose, onEdit }: { momento: Momento; onClose: () => void; onEdit: () => void }) {
  useSheet(onClose);
  const [fotoCompleta, setFotoCompleta] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  const borrar = async () => {
    if (!confirmarBorrar) {
      setConfirmarBorrar(true);
      return;
    }
    await db.momentos.delete(momento.id);
    onClose();
  };

  return (
    <div className="momentos-sheet momento-detail" role="dialog" aria-modal="true" aria-labelledby="momento-detail-title">
      <header className="momentos-sheet-head">
        <span>/ {fechaLarga(momento.fecha).toUpperCase()}</span>
        <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
      </header>

      <div className="momento-detail-scroll">
        {momento.foto && (
          <button type="button" className="momento-detail-photo" onClick={() => setFotoCompleta(true)} aria-label="Ver foto completa">
            <Foto foto={momento.foto} alt={momento.titulo} />
          </button>
        )}
        <article className="momento-detail-body">
          <h2 id="momento-detail-title">{momento.titulo}</h2>
          {momento.etiquetas.length > 0 && (
            <div className="momento-card-tags">{momento.etiquetas.map((tag) => <i key={tag}>{tag}</i>)}</div>
          )}
          {momento.descripcion
            ? momento.descripcion.split(/\n{2,}/).map((parrafo, index) => <p key={index}>{parrafo}</p>)
            : <p className="momento-detail-empty">Sin historia escrita.</p>}
        </article>
      </div>

      <footer className="momento-detail-foot">
        <button type="button" className="momentos-secondary" onClick={onEdit}><Pencil size={17} aria-hidden="true" /> EDITAR</button>
        <button type="button" className={`momentos-secondary is-danger ${confirmarBorrar ? 'is-confirming' : ''}`} onClick={() => void borrar()}>
          <Trash2 size={17} aria-hidden="true" /> {confirmarBorrar ? 'TOCA PARA BORRAR' : 'BORRAR'}
        </button>
      </footer>

      {fotoCompleta && momento.foto && (
        <button type="button" className="momento-lightbox" onClick={() => setFotoCompleta(false)} aria-label="Cerrar foto">
          <Foto foto={momento.foto} alt={momento.titulo} />
        </button>
      )}
    </div>
  );
}
