import { useEffect, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent } from 'react';
import { CalendarDays, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { db, hoy, nuevoId, pedirPersistencia, type Momento } from './db';
import { fechaCorta, leerEtiquetas, normalizar } from './fecha';
import { Foto } from './MemoryNode';
import { comprimirFoto } from './photo';
import { useSheet } from './useSheet';

type Props = {
  momento?: Momento;
  archivoInicial?: File;
  etiquetasUsadas: string[];
  onClose: () => void;
  onSaved: (momento: Momento) => void;
};

// Editor de un momento: la foto arriba, a todo lo ancho, y lo demás se escribe debajo sin etiquetas
// de formulario. La foto se ve al instante y se reduce en segundo plano; guardar espera a que termine.
export function AddMemoryModal({ momento, archivoInicial, etiquetasUsadas, onClose, onSaved }: Props) {
  useSheet(onClose);
  const fileRef = useRef<HTMLInputElement>(null);
  const textoRef = useRef<HTMLTextAreaElement>(null);
  const comprimiendo = useRef<Promise<Blob> | null>(null);
  const [titulo, setTitulo] = useState(momento?.titulo ?? '');
  const [fecha, setFecha] = useState(momento?.fecha ?? hoy());
  const [descripcion, setDescripcion] = useState(momento?.descripcion ?? '');
  const [etiquetas, setEtiquetas] = useState<string[]>(momento?.etiquetas ?? []);
  const [etiquetaNueva, setEtiquetaNueva] = useState('');
  const [foto, setFoto] = useState<Blob | null>(archivoInicial ?? momento?.foto ?? null);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const reducir = (file: File) => {
    const tarea = comprimirFoto(file);
    comprimiendo.current = tarea;
    void tarea.then((reducida) => {
      if (comprimiendo.current === tarea) setFoto(reducida);
    });
  };

  const elegirFoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Eso no es una foto.');
      return;
    }
    setError('');
    setFoto(file);
    reducir(file);
  };

  // La foto que llega de la galería al tocar "+" (el editor se abre detrás de la galería).
  useEffect(() => {
    if (archivoInicial) reducir(archivoInicial);
  }, [archivoInicial]);

  // La historia crece con el texto, sin barra de scroll propia.
  useEffect(() => {
    const el = textoRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [descripcion]);

  const agregarEtiqueta = (texto: string) => {
    const nuevas = leerEtiquetas(texto).filter((tag) => !etiquetas.some((actual) => normalizar(actual) === normalizar(tag)));
    if (nuevas.length) setEtiquetas((actuales) => [...actuales, ...nuevas].slice(0, 8));
    setEtiquetaNueva('');
  };

  const teclaEtiqueta = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      agregarEtiqueta(etiquetaNueva);
    } else if (event.key === 'Backspace' && !etiquetaNueva && etiquetas.length) {
      setEtiquetas((actuales) => actuales.slice(0, -1));
    }
  };

  const soltar = (event: DragEvent) => {
    event.preventDefault();
    setArrastrando(false);
    elegirFoto(event.dataTransfer.files[0]);
  };

  const guardar = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!titulo.trim()) {
      setError('Ponle nombre.');
      return;
    }
    setGuardando(true);
    try {
      const fotoFinal = foto && comprimiendo.current && foto instanceof File ? await comprimiendo.current : foto;
      const guardado: Momento = {
        id: momento?.id ?? nuevoId(),
        fecha,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        etiquetas: etiquetaNueva.trim() ? [...etiquetas, ...leerEtiquetas(etiquetaNueva)].slice(0, 8) : etiquetas,
        foto: fotoFinal,
        creadoEn: momento?.creadoEn ?? Date.now(),
        // "Tus 3" son por año: si la fecha cambia de año, deja de contar como uno de ellos.
        destacado: !!momento?.destacado && momento.fecha.slice(0, 4) === fecha.slice(0, 4),
      };
      await db.momentos.put(guardado);
      void pedirPersistencia();
      onSaved(guardado);
    } catch {
      setGuardando(false);
      setError('No se pudo guardar. Revisa que el teléfono tenga espacio.');
    }
  };

  const sugeridas = etiquetasUsadas.filter((tag) => !etiquetas.some((actual) => normalizar(actual) === normalizar(tag))).slice(0, 5);

  return (
    <div className="momentos-sheet momento-editor" role="dialog" aria-modal="true" aria-label={momento ? 'Editar momento' : 'Nuevo momento'}>
      <header className="momentos-sheet-head">
        <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        <button type="button" className="momentos-save" onClick={() => void guardar()} disabled={guardando || !titulo.trim()}>
          {guardando ? 'GUARDANDO…' : 'GUARDAR'}
        </button>
      </header>

      <form className="momento-editor-scroll" onSubmit={(event) => void guardar(event)} noValidate>
        <div
          className={`momento-editor-photo ${foto ? 'has-photo' : ''} ${arrastrando ? 'is-dragging' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
        >
          {foto ? (
            <>
              <Foto foto={foto} alt="Foto del momento" />
              <div className="momento-editor-photo-actions">
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Cambiar foto"><ImagePlus size={18} aria-hidden="true" /></button>
                <button type="button" onClick={() => { comprimiendo.current = null; setFoto(null); }} aria-label="Quitar foto"><Trash2 size={18} aria-hidden="true" /></button>
              </div>
            </>
          ) : (
            <button type="button" className="momento-editor-photo-empty" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={28} strokeWidth={1.6} aria-hidden="true" />
              <span>Agregar foto</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => { elegirFoto(event.target.files?.[0]); event.target.value = ''; }} />
        </div>

        <div className="momento-editor-fields">
          <label className="momento-editor-date">
            <CalendarDays size={15} aria-hidden="true" />
            <span>{fechaCorta(fecha)}</span>
            {/* El selector nativo queda encima, invisible: tocar la fecha lo abre */}
            <input type="date" value={fecha} max={hoy()} onChange={(event) => setFecha(event.target.value || hoy())} aria-label="Fecha" />
          </label>

          <input
            className="momento-editor-title"
            value={titulo}
            onChange={(event) => { setTitulo(event.target.value); setError(''); }}
            placeholder="Ponle nombre"
            aria-label="Título"
            maxLength={80}
            autoComplete="off"
            enterKeyHint="next"
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); textoRef.current?.focus(); } }}
          />

          <textarea
            ref={textoRef}
            className="momento-editor-text"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            placeholder="¿Qué pasó?"
            aria-label="Qué pasó"
            rows={3}
          />

          <div className="momento-editor-tags">
            {etiquetas.map((tag) => (
              <button type="button" key={tag} className="is-on" onClick={() => setEtiquetas((actuales) => actuales.filter((t) => t !== tag))} aria-label={`Quitar ${tag}`}>
                {tag} <X size={12} aria-hidden="true" />
              </button>
            ))}
            {etiquetas.length < 8 && (
              <input
                value={etiquetaNueva}
                onChange={(event) => (event.target.value.includes(',') ? agregarEtiqueta(event.target.value) : setEtiquetaNueva(event.target.value))}
                onKeyDown={teclaEtiqueta}
                onBlur={() => etiquetaNueva.trim() && agregarEtiqueta(etiquetaNueva)}
                placeholder="+ etiqueta"
                aria-label="Nueva etiqueta"
                autoComplete="off"
                enterKeyHint="done"
              />
            )}
          </div>
          {sugeridas.length > 0 && etiquetas.length < 8 && (
            <div className="momento-editor-tags is-suggested">
              {sugeridas.map((tag) => (
                <button type="button" key={tag} onClick={() => agregarEtiqueta(tag)}><Plus size={12} aria-hidden="true" /> {tag}</button>
              ))}
            </div>
          )}

          {error && <p className="momento-editor-error" role="alert">{error}</p>}
        </div>
      </form>
    </div>
  );
}
