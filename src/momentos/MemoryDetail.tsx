import { useState, type CSSProperties } from 'react';
import { Expand, Pencil, Star, Trash2, X } from 'lucide-react';
import { alternarDestacado, db, MAX_DESTACADOS, type Momento } from './db';
import { fechaLarga } from './fecha';
import { Circulo, Foto } from './MemoryNode';
import { useSheet } from './useSheet';

type Props = {
  momento: Momento;
  posicion: { numero: number; total: number };
  onClose: () => void;
  onEdit: () => void;
  onCompartir: () => void;
};

// Al tocar un momento su círculo crece al centro y le salen satélites (editar, tus 3, foto, borrar).
// Abajo va la cédula: la historia completa, como la etiqueta junto a una obra.
export function MemoryDetail({ momento, posicion, onClose, onEdit, onCompartir }: Props) {
  useSheet(onClose);
  const [fotoCompleta, setFotoCompleta] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [aviso, setAviso] = useState('');
  const anio = momento.fecha.slice(0, 4);

  const borrar = async () => {
    if (!confirmarBorrar) {
      setConfirmarBorrar(true);
      return;
    }
    await db.momentos.delete(momento.id);
    onClose();
  };

  const destacar = async () => {
    const resultado = await alternarDestacado(momento);
    setAviso(resultado === 'lleno' ? `Ya elegiste ${MAX_DESTACADOS} de ${anio}. Quita uno para cambiarlo.` : '');
  };

  const satelites = [
    { clave: 'editar', etiqueta: 'EDITAR', icono: Pencil, accion: onEdit, clase: '' },
    { clave: 'tus3', etiqueta: momento.destacado ? 'EN TUS 3' : 'TUS 3', icono: Star, accion: () => void destacar(), clase: momento.destacado ? 'is-on' : '' },
    { clave: 'borrar', etiqueta: confirmarBorrar ? '¿SEGURO?' : 'BORRAR', icono: Trash2, accion: () => void borrar(), clase: `is-danger ${confirmarBorrar ? 'is-confirming' : ''}` },
    ...(momento.foto ? [{ clave: 'foto', etiqueta: 'FOTO', icono: Expand, accion: () => setFotoCompleta(true), clase: '' }] : []),
  ];

  return (
    <div className="momentos-sheet momento-detail" role="dialog" aria-modal="true" aria-labelledby="momento-detail-title">
      <header className="momentos-sheet-head">
        <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        <span className="momento-detail-count">{String(posicion.numero).padStart(2, '0')} / {String(posicion.total).padStart(2, '0')}</span>
      </header>

      <div className="momento-detail-scroll">
        <div className="momento-orbita">
          <Circulo momento={momento} tamano={176} className="momento-orbita-centro" />
          {satelites.map(({ clave, etiqueta, icono: Icono, accion, clase }, index) => (
            <button
              key={clave}
              type="button"
              className={`momento-satelite ${clase}`}
              style={{ '--angulo': `${index * 90}deg`, '--orden': index } as CSSProperties}
              onClick={accion}
              onBlur={clave === 'borrar' ? () => setConfirmarBorrar(false) : undefined}
            >
              <Icono size={18} aria-hidden="true" />
              <span>{etiqueta}</span>
            </button>
          ))}
        </div>
        {aviso && <p className="momento-detail-aviso" role="status">{aviso}</p>}

        <article className="momento-cedula">
          <span className="momento-cedula-kicker">MOMENTO · {String(posicion.numero).padStart(2, '0')} / {String(posicion.total).padStart(2, '0')}</span>
          <h2 id="momento-detail-title">{momento.titulo}</h2>
          <hr />
          {momento.descripcion && momento.descripcion.split(/\n{2,}/).map((parrafo, index) => <p key={index}>{parrafo}</p>)}
          <dl>
            <dt>FECHA</dt>
            <dd className="momento-cedula-fecha">{fechaLarga(momento.fecha)}</dd>
            {momento.etiquetas.length > 0 && <><dt>ETIQUETAS</dt><dd>{momento.etiquetas.map((tag) => `#${tag}`).join('  ')}</dd></>}
            {momento.destacado && (
              <>
                <dt>TUS 3</dt>
                <dd><button type="button" className="momento-cedula-link" onClick={onCompartir}>Uno de tus 3 de {anio} · Compartir</button></dd>
              </>
            )}
          </dl>
        </article>
      </div>

      {fotoCompleta && momento.foto && (
        <button type="button" className="momento-lightbox" onClick={() => setFotoCompleta(false)} aria-label="Cerrar foto">
          <Foto foto={momento.foto} alt={momento.titulo} />
        </button>
      )}
    </div>
  );
}
