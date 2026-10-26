import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, HardDriveDownload, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { BruukLogo } from '../components/BruukLogo';
import { IS_APP_MODE } from '../lib/appMode';
import { db, type Momento } from './db';
import { claveMes, mesCorto, nombreMes, normalizar } from './fecha';
import { AddMemoryModal } from './AddMemoryModal';
import { BackupSheet } from './BackupSheet';
import { MemoryCard } from './MemoryCard';
import { MemoryDetail } from './MemoryDetail';
import './Momentos.css';

type Formulario = { momento?: Momento } | null;

// Lo más nuevo arriba; dentro del mismo día, el último que se guardó.
const ordenar = (a: Momento, b: Momento) => b.fecha.localeCompare(a.fecha) || b.creadoEn - a.creadoEn;

export default function MemoryMicrosite() {
  const momentos = useLiveQuery(async () => (await db.momentos.toArray()).sort(ordenar), []);
  const [busqueda, setBusqueda] = useState('');
  const [mes, setMes] = useState('todos');
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [respaldoAbierto, setRespaldoAbierto] = useState(false);

  const meses = useMemo(() => [...new Set((momentos ?? []).map((m) => claveMes(m.fecha)))], [momentos]);
  const variosAnios = new Set(meses.map((clave) => clave.slice(0, 4))).size > 1;
  const mesActivo = meses.includes(mes) ? mes : 'todos';

  const etiquetasUsadas = useMemo(() => {
    const cuenta = new Map<string, number>();
    (momentos ?? []).forEach((m) => m.etiquetas.forEach((tag) => cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1)));
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [momentos]);

  const grupos = useMemo(() => {
    const texto = normalizar(busqueda);
    const visibles = (momentos ?? []).filter((m) =>
      (mesActivo === 'todos' || claveMes(m.fecha) === mesActivo)
      && (!texto || normalizar([m.titulo, m.descripcion, ...m.etiquetas].join(' ')).includes(texto)));
    const porMes = new Map<string, Momento[]>();
    visibles.forEach((m) => porMes.set(claveMes(m.fecha), [...(porMes.get(claveMes(m.fecha)) ?? []), m]));
    return [...porMes.entries()];
  }, [momentos, busqueda, mesActivo]);

  const abierto = momentos?.find((m) => m.id === abiertoId);
  const cerrarDetalle = useCallback(() => setAbiertoId(null), []);
  const cerrarFormulario = useCallback(() => setFormulario(null), []);
  const cerrarRespaldo = useCallback(() => setRespaldoAbierto(false), []);
  const total = momentos?.length ?? 0;

  return (
    <div className="momentos-page">
      <header className="momentos-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <div className="momentos-nav-actions">
          {/* En la app Momentos es una pestaña: título en vez de "regresar" */}
          {IS_APP_MODE
            ? <span className="app-screen-title">/ MOMENTOS</span>
            : <Link className="momentos-back" to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>}
          <button type="button" className="momentos-icon-btn" onClick={() => setRespaldoAbierto(true)} aria-label="Copia de seguridad">
            <HardDriveDownload size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="momentos-main">
        <div className="momentos-intro">
          <span className="momentos-kicker">/ TU AÑO AFUERA{total > 0 && ` · ${total}`}</span>
          <h1>LO QUE PASÓ<br />AFUERA.</h1>
          <p>Se guardan sólo en este teléfono. Nadie más los ve.</p>
        </div>

        {total > 0 && (
          <div className="momentos-filters">
            <label className="momentos-search">
              <Search size={17} aria-hidden="true" />
              <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Busca un lugar o una etiqueta" aria-label="Buscar momentos" enterKeyHint="search" />
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
                    {clave === 'todos' ? 'TODOS' : `${mesCorto(clave)}${variosAnios ? ` ’${clave.slice(2, 4)}` : ''}`}
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
          <div className="momentos-empty">
            <strong>TODAVÍA NO HAY MOMENTOS.</strong>
            <p>Sal. Luego guarda lo que pasó: una foto y dos líneas bastan.</p>
            <button type="button" className="momentos-primary" onClick={() => setFormulario({})}><Plus size={18} aria-hidden="true" /> GUARDAR EL PRIMERO</button>
          </div>
        ) : grupos.length === 0 ? (
          <div className="momentos-empty is-search">
            <strong>NADA POR AQUÍ.</strong>
            <p>Ningún momento coincide con esa búsqueda.</p>
          </div>
        ) : (
          <div className="momentos-timeline">
            {grupos.map(([clave, lista]) => (
              <section key={clave} aria-label={nombreMes(clave)}>
                <h2><span>{nombreMes(clave).toUpperCase()}</span><b>{String(lista.length).padStart(2, '0')}</b></h2>
                <ol>
                  {lista.map((momento) => (
                    <li key={momento.id}><MemoryCard momento={momento} onOpen={() => setAbiertoId(momento.id)} /></li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </main>

      {total > 0 && (
        <button type="button" className="momentos-fab" onClick={() => setFormulario({})}>
          <Plus size={20} strokeWidth={2.6} aria-hidden="true" /> MOMENTO
        </button>
      )}

      {abierto && !formulario && (
        <MemoryDetail momento={abierto} onClose={cerrarDetalle} onEdit={() => setFormulario({ momento: abierto })} />
      )}
      {formulario && (
        <AddMemoryModal
          momento={formulario.momento}
          etiquetasUsadas={etiquetasUsadas}
          onClose={cerrarFormulario}
          onSaved={(guardado) => {
            // Al editar se regresa a la historia; al crear, a la línea del tiempo sin filtros para verlo.
            if (formulario.momento) setAbiertoId(guardado.id);
            else {
              setMes('todos');
              setBusqueda('');
            }
            setFormulario(null);
          }}
        />
      )}
      {respaldoAbierto && <BackupSheet total={total} onClose={cerrarRespaldo} />}
    </div>
  );
}
