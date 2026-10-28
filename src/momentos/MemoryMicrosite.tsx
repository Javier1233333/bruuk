import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, Search, Share2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { BruukLogo } from '../components/BruukLogo';
import { IS_APP_MODE } from '../lib/appMode';
import { db, migrarFotos, type Momento } from './db';
import { claveMes, mesCorto, normalizar } from './fecha';
import { AddMemoryModal } from './AddMemoryModal';
import { HelpSheet } from './HelpSheet';
import { MemoryDetail } from './MemoryDetail';
import { MemoryRoad } from './MemoryRoad';
import { ShareSheet, type Modo } from './ShareSheet';
import './Momentos.css';

type Formulario = { momento?: Momento; archivo?: File } | null;

// Lo más nuevo arriba; dentro del mismo día, el último que se guardó.
const ordenar = (a: Momento, b: Momento) => b.fecha.localeCompare(a.fecha) || b.creadoEn - a.creadoEn;

export default function MemoryMicrosite() {
  const momentos = useLiveQuery(async () => (await db.momentos.toArray()).sort(ordenar), []);
  useEffect(() => void migrarFotos(), []);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mes, setMes] = useState('todos');
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [compartir, setCompartir] = useState<{ modo: Modo; anio: string } | null>(null);

  const meses = useMemo(() => [...new Set((momentos ?? []).map((m) => claveMes(m.fecha)))], [momentos]);
  const variosAnios = new Set(meses.map((clave) => clave.slice(0, 4))).size > 1;
  const mesActivo = meses.includes(mes) ? mes : 'todos';

  const etiquetasUsadas = useMemo(() => {
    const cuenta = new Map<string, number>();
    (momentos ?? []).forEach((m) => m.etiquetas.forEach((tag) => cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1)));
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [momentos]);

  const visibles = useMemo(() => {
    const texto = normalizar(busqueda);
    return (momentos ?? []).filter((m) =>
      (mesActivo === 'todos' || claveMes(m.fecha) === mesActivo)
      && (!texto || normalizar([m.titulo, m.descripcion, ...m.etiquetas].join(' ')).includes(texto)));
  }, [momentos, busqueda, mesActivo]);

  // Subir empieza por la foto: se abre la galería en el mismo toque y el editor queda detrás.
  // Si se cancela la galería, el editor sigue ahí para escribir sin foto.
  const nuevoMomento = () => {
    setFormulario({});
    fotoRef.current?.click();
  };

  const abierto = momentos?.find((m) => m.id === abiertoId);
  // Número del momento en su año, del más viejo al más nuevo (como "obra 02 / 05").
  const posicion = useMemo(() => {
    if (!abierto || !momentos) return { numero: 0, total: 0 };
    const delAnio = momentos.filter((m) => m.fecha.slice(0, 4) === abierto.fecha.slice(0, 4)).reverse();
    return { numero: delAnio.findIndex((m) => m.id === abierto.id) + 1, total: delAnio.length };
  }, [abierto, momentos]);
  const cerrarDetalle = useCallback(() => setAbiertoId(null), []);
  const cerrarFormulario = useCallback(() => setFormulario(null), []);
  const cerrarAyuda = useCallback(() => setAyudaAbierta(false), []);
  const cerrarCompartir = useCallback(() => setCompartir(null), []);
  const total = momentos?.length ?? 0;

  return (
    <div className="momentos-page">
      <header className="momentos-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={88} /></Link>
        <div className="momentos-nav-actions">
          {/* En la app Momentos es una pestaña: título en vez de "regresar" */}
          {IS_APP_MODE
            ? <span className="momentos-nav-title">/ MOMENTOS</span>
            : <Link className="momentos-back" to="/guadalajara"><ArrowLeft size={16} aria-hidden="true" /> REGRESAR</Link>}
          {total > 0 && (
            <button type="button" className="momentos-share-btn" onClick={() => setCompartir({ modo: 'tus3', anio: momentos?.[0]?.fecha.slice(0, 4) ?? '' })} aria-label="Compartir">
              <Share2 size={14} aria-hidden="true" /> COMPARTIR
            </button>
          )}
          <button type="button" className="momentos-help-btn" onClick={() => setAyudaAbierta(true)} aria-label="Cómo funciona y copia de seguridad">?</button>
        </div>
      </header>

      <main className="momentos-main">
        {total > 0 && (
          <div className="momentos-filters">
            <label className="momentos-search">
              <Search size={16} aria-hidden="true" />
              <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar" aria-label="Buscar momentos" enterKeyHint="search" />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda"><X size={16} aria-hidden="true" /></button>}
            </label>
            {meses.length > 1 && (
              <div className="momentos-months" role="tablist" aria-label="Filtrar por mes">
                {['todos', ...meses].map((clave) => (
                  <button
                    key={clave}
                    type="button"
                    role="tab"
                    aria-selected={mesActivo === clave}
                    className={mesActivo === clave ? 'is-active' : ''}
                    onClick={() => setMes(clave)}
                  >
                    {clave === 'todos' ? 'Todos' : `${mesCorto(clave)}${variosAnios ? ` ’${clave.slice(2, 4)}` : ''}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {momentos === undefined ? (
          <div className="momentos-loading" aria-label="Cargando momentos" role="status">
            <span /><span /><span />
          </div>
        ) : total === 0 ? (
          <button type="button" className="momentos-empty" onClick={nuevoMomento}>
            <i><Plus size={30} strokeWidth={2} aria-hidden="true" /></i>
            <strong>TU PRIMER MOMENTO</strong>
          </button>
        ) : visibles.length === 0 ? (
          <p className="momentos-no-results">Nada por aquí.</p>
        ) : (
          <MemoryRoad momentos={visibles} variosAnios={variosAnios} onOpen={setAbiertoId} onNuevo={nuevoMomento} />
        )}
      </main>

      {total > 0 && (
        <button type="button" className="momentos-fab" onClick={nuevoMomento} aria-label="Nuevo momento">
          <Plus size={26} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
      <input
        ref={fotoRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const archivo = event.target.files?.[0];
          event.target.value = '';
          if (archivo) setFormulario((actual) => (actual && !actual.momento ? { archivo } : actual));
        }}
      />

      {abierto && !formulario && (
        <MemoryDetail
          momento={abierto}
          posicion={posicion}
          onClose={cerrarDetalle}
          onEdit={() => setFormulario({ momento: abierto })}
          onCompartir={() => setCompartir({ modo: 'tus3', anio: abierto.fecha.slice(0, 4) })}
        />
      )}
      {formulario && (
        <AddMemoryModal
          key={formulario.archivo ? 'con-foto' : 'sin-foto'}
          momento={formulario.momento}
          archivoInicial={formulario.archivo}
          etiquetasUsadas={etiquetasUsadas}
          onClose={cerrarFormulario}
          onSaved={(guardado) => {
            // Al guardar se abre su órbita; al crear, además se quitan los filtros para encontrarlo en el camino.
            if (!formulario.momento) {
              setMes('todos');
              setBusqueda('');
            }
            setAbiertoId(guardado.id);
            setFormulario(null);
          }}
        />
      )}
      {ayudaAbierta && <HelpSheet total={total} onClose={cerrarAyuda} />}
      {compartir && momentos && <ShareSheet momentos={momentos} modoInicial={compartir.modo} anioInicial={compartir.anio} onClose={cerrarCompartir} />}
    </div>
  );
}
