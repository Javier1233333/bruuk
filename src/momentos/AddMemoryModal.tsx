import { useRef, useState, type FormEvent } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { db, hoy, nuevoId, pedirPersistencia, type Momento } from './db';
import { leerEtiquetas, normalizar } from './fecha';
import { Foto } from './MemoryCard';
import { comprimirFoto } from './photo';
import { useSheet } from './useSheet';

type Props = {
  momento?: Momento;
  etiquetasUsadas: string[];
  onClose: () => void;
  onSaved: (momento: Momento) => void;
};

// Crear o editar un momento. Todo se guarda en el teléfono; la foto se reduce antes.
export function AddMemoryModal({ momento, etiquetasUsadas, onClose, onSaved }: Props) {
  useSheet(onClose);
  const fileRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState(momento?.titulo ?? '');
  const [fecha, setFecha] = useState(momento?.fecha ?? hoy());
  const [descripcion, setDescripcion] = useState(momento?.descripcion ?? '');
  const [etiquetas, setEtiquetas] = useState(momento?.etiquetas.join(', ') ?? '');
  const [foto, setFoto] = useState<Blob | null>(momento?.foto ?? null);
  const [estado, setEstado] = useState<'idle' | 'foto' | 'guardando'>('idle');
  const [error, setError] = useState('');

  const actuales = leerEtiquetas(etiquetas).map(normalizar);
  const sugeridas = etiquetasUsadas.filter((tag) => !actuales.includes(normalizar(tag))).slice(0, 6);

  const elegirFoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Eso no es una foto.');
      return;
    }
    setError('');
    setEstado('foto');
    setFoto(await comprimirFoto(file));
    setEstado('idle');
  };

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!titulo.trim()) {
      setError('Ponle un título.');
      return;
    }
    setEstado('guardando');
    const guardado: Momento = {
      id: momento?.id ?? nuevoId(),
      fecha,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      etiquetas: leerEtiquetas(etiquetas),
      foto,
      creadoEn: momento?.creadoEn ?? Date.now(),
    };
    try {
      await db.momentos.put(guardado);
      void pedirPersistencia();
      onSaved(guardado);
    } catch {
      setEstado('idle');
      setError('No se pudo guardar. Revisa que el teléfono tenga espacio.');
    }
  };

  return (
    <div className="momentos-sheet" role="dialog" aria-modal="true" aria-labelledby="momento-form-title">
      <header className="momentos-sheet-head">
        <span id="momento-form-title">{momento ? '/ EDITAR MOMENTO' : '/ NUEVO MOMENTO'}</span>
        <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
      </header>

      <form className="momento-form" onSubmit={guardar} noValidate>
        <div className="momento-form-scroll">
          <div className={`momento-form-photo ${foto ? 'has-photo' : ''}`}>
            {foto && <Foto foto={foto} alt="Foto del momento" />}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={estado === 'foto'}>
              {estado === 'foto'
                ? <><LoaderCircle className="momentos-spin" size={20} aria-hidden="true" /> PREPARANDO FOTO</>
                : <><ImagePlus size={20} aria-hidden="true" /> {foto ? 'CAMBIAR FOTO' : 'AGREGAR FOTO'}</>}
            </button>
            {foto && <button type="button" className="momento-form-photo-remove" onClick={() => setFoto(null)}>QUITAR</button>}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => { void elegirFoto(event.target.files?.[0]); event.target.value = ''; }} />
          </div>

          <div className="momento-form-row">
            <label>
              <span>Título</span>
              <input value={titulo} onChange={(event) => setTitulo(event.target.value)} placeholder="La noche del tianguis" maxLength={80} autoComplete="off" />
            </label>
            <label className="momento-form-date">
              <span>Fecha</span>
              <input type="date" value={fecha} max={hoy()} onChange={(event) => setFecha(event.target.value || hoy())} />
            </label>
          </div>

          <label>
            <span>Qué pasó</span>
            <textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder="Con quién estabas, qué viste, por qué lo quieres recordar." rows={5} />
          </label>

          <label>
            <span>Etiquetas</span>
            <input value={etiquetas} onChange={(event) => setEtiquetas(event.target.value)} placeholder="amigos, café, centro" autoComplete="off" />
          </label>
          {sugeridas.length > 0 && (
            <div className="momento-form-suggest">
              {sugeridas.map((tag) => (
                <button type="button" key={tag} onClick={() => setEtiquetas((value) => (value.trim() ? `${value.replace(/[,\s]+$/, '')}, ${tag}` : tag))}>+ {tag}</button>
              ))}
            </div>
          )}
        </div>

        <footer className="momento-form-foot">
          {error && <p role="alert">{error}</p>}
          <button type="submit" className="momentos-primary" disabled={estado !== 'idle'}>
            {estado === 'guardando' ? 'GUARDANDO…' : 'GUARDAR MOMENTO'}
          </button>
        </footer>
      </form>
    </div>
  );
}
