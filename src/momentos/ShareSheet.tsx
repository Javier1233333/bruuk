import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Plus, Share2, X } from 'lucide-react';
import { alternarDestacado, MAX_DESTACADOS, type Momento } from './db';
import { Circulo } from './MemoryNode';
import { compartirImagen, dibujarBurbujas, dibujarTus3 } from './shareImages';
import { useSheet } from './useSheet';

export type Modo = 'tus3' | 'burbujas';
type Props = { momentos: Momento[]; modoInicial: Modo; anioInicial: string; onClose: () => void };
type Imagen = { blob: Blob; url: string; clave: string };

// Compartir Momentos como imagen: "Tus 3" (tres momentos que la persona elige de un año)
// o "Burbujas" (todos sus momentos y cuántos lleva guardados en Bruuk).
export function ShareSheet({ momentos, modoInicial, anioInicial, onClose }: Props) {
  useSheet(onClose);
  const anios = useMemo(() => [...new Set(momentos.map((m) => m.fecha.slice(0, 4)))].sort().reverse(), [momentos]);
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [anio, setAnio] = useState(anios.includes(anioInicial) ? anioInicial : anios[0] ?? anioInicial);
  // En burbujas, null es "todo": todos los años juntos.
  const [anioBurbujas, setAnioBurbujas] = useState<string | null>(null);
  const [imagen, setImagen] = useState<Imagen | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState('');

  const delAnio = useMemo(() => momentos.filter((m) => m.fecha.startsWith(anio)).sort((a, b) => a.fecha.localeCompare(b.fecha)), [momentos, anio]);
  const elegidos = delAnio.filter((m) => m.destacado).slice(0, MAX_DESTACADOS);
  const necesarios = Math.min(MAX_DESTACADOS, delAnio.length);
  const tus3Listo = elegidos.length > 0 && elegidos.length === necesarios;
  const burbujas = useMemo(() => (anioBurbujas ? momentos.filter((m) => m.fecha.startsWith(anioBurbujas)) : momentos), [momentos, anioBurbujas]);

  // Cambia cuando cambia lo que va en la imagen; con ella se vuelve a dibujar.
  const clave = modo === 'tus3'
    ? (tus3Listo ? `tus3|${anio}|${elegidos.map((m) => `${m.id}:${m.titulo}:${m.fecha}:${m.foto?.size ?? 0}`).join('|')}` : '')
    : `burbujas|${anioBurbujas ?? 'todo'}|${burbujas.map((m) => `${m.id}${m.destacado ? '*' : ''}`).join(',')}`;

  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    let url = '';
    const dibujo = modo === 'tus3' ? dibujarTus3(elegidos, anio) : dibujarBurbujas(burbujas, anioBurbujas);
    dibujo
      .then((blob) => {
        if (!vigente) return;
        url = URL.createObjectURL(blob);
        setImagen({ blob, url, clave });
      })
      .catch(() => vigente && setError('No pudimos crear la imagen.'));
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
    // Todo lo que entra al dibujo ya va dentro de la clave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const vistaPrevia = imagen && imagen.clave === clave ? imagen : null;

  const compartir = async () => {
    if (!vistaPrevia) return;
    setCompartiendo(true);
    setError('');
    try {
      if (modo === 'tus3') await compartirImagen(vistaPrevia.blob, `mis-3-de-${anio}-bruuk.jpg`, `Mis 3 de ${anio}`);
      else await compartirImagen(vistaPrevia.blob, 'mis-momentos-bruuk.jpg', `${burbujas.length} momentos afuera`);
    } catch {
      setError('No se pudo compartir. Intenta otra vez.');
    }
    setCompartiendo(false);
  };

  const alternar = async (momento: Momento) => {
    setError('');
    if ((await alternarDestacado(momento)) === 'lleno') setError(`Ya elegiste ${MAX_DESTACADOS}. Quita uno para cambiarlo.`);
  };

  const opcionesAnio = modo === 'tus3'
    ? anios.map((a) => ({ valor: a, etiqueta: a }))
    : [{ valor: null, etiqueta: 'Todo' }, ...anios.map((a) => ({ valor: a, etiqueta: a }))];
  const anioActivo = modo === 'tus3' ? anio : anioBurbujas;

  return (
    <div className="momentos-sheet momentos-share" role="dialog" aria-modal="true" aria-label="Compartir momentos">
      <header className="momentos-sheet-head">
        <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        <div className="momentos-share-modos" role="tablist" aria-label="Qué compartir">
          <button type="button" role="tab" aria-selected={modo === 'tus3'} className={modo === 'tus3' ? 'is-active' : ''} onClick={() => setModo('tus3')}>TUS 3</button>
          <button type="button" role="tab" aria-selected={modo === 'burbujas'} className={modo === 'burbujas' ? 'is-active' : ''} onClick={() => setModo('burbujas')}>BURBUJAS</button>
        </div>
      </header>

      <div className="momentos-share-scroll">
        {opcionesAnio.length > 1 && (
          <div className="momentos-share-anios" role="tablist" aria-label="Año">
            {opcionesAnio.map(({ valor, etiqueta }) => (
              <button
                key={etiqueta}
                type="button"
                role="tab"
                aria-selected={valor === anioActivo}
                className={valor === anioActivo ? 'is-active' : ''}
                onClick={() => (modo === 'tus3' ? setAnio(valor ?? anio) : setAnioBurbujas(valor))}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        )}

        {modo === 'tus3' ? (
          <>
            <h2>TUS 3 DE {anio}</h2>
            {/* Los tres lugares, unidos por el camino */}
            <ol className="momentos-tus3-slots">
              {Array.from({ length: MAX_DESTACADOS }, (_, i) => elegidos[i]).map((momento, i) => (
                <li key={momento?.id ?? `vacio-${i}`}>
                  {momento ? (
                    <button type="button" onClick={() => void alternar(momento)} aria-label={`Quitar ${momento.titulo}`}>
                      <Circulo momento={momento} tamano={84} />
                      <X className="momentos-tus3-quitar" size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="momentos-tus3-vacio"><Plus size={20} aria-hidden="true" /></span>
                  )}
                  <small>{momento ? momento.titulo : `0${i + 1}`}</small>
                </li>
              ))}
            </ol>
            {!tus3Listo && <p className="momentos-share-hint">Elige {necesarios - elegidos.length === 1 ? 'uno más' : `${necesarios - elegidos.length} más`}.</p>}
          </>
        ) : (
          <h2>{burbujas.length} {burbujas.length === 1 ? 'MOMENTO' : 'MOMENTOS'}</h2>
        )}

        {clave && (
          <div className="momentos-share-preview">
            {vistaPrevia
              ? <img src={vistaPrevia.url} alt="Vista previa de la imagen para compartir" />
              : <span><LoaderCircle className="momentos-spin" size={22} aria-hidden="true" /></span>}
          </div>
        )}

        {modo === 'tus3' && (
          <ul className="momentos-tus3-opciones">
            {delAnio.map((momento) => (
              <li key={momento.id}>
                <button type="button" className={momento.destacado ? 'is-on' : ''} onClick={() => void alternar(momento)} aria-pressed={!!momento.destacado}>
                  <Circulo momento={momento} tamano={64} />
                  <span>{momento.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="momentos-share-foot">
        {error && <p role="alert">{error}</p>}
        <button type="button" className="momentos-primary" onClick={() => void compartir()} disabled={!vistaPrevia || compartiendo}>
          {compartiendo ? <LoaderCircle className="momentos-spin" size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          {modo === 'tus3' ? ' COMPARTIR MIS 3' : ' COMPARTIR MIS BURBUJAS'}
        </button>
      </footer>
    </div>
  );
}
