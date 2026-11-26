import { useEffect, useMemo, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { Download, ImageUp, Share2 } from 'lucide-react';
import { SpotCard, type Spot } from '../components/SpotCard';
import { ZONES } from '../lib/zones';
import type { SpotDoc } from './spotsStore';
import '../components/OceanLanding.css';

/* ============================================================
   Fichas Bruuk: la tarjeta chica de Spots (el componente real
   SpotCard) de cualquier spot, editable sólo aquí, para bajarla
   en JPG y usarla en videos. Nada de esto cambia el spot.
   ============================================================ */

type Photo = 'spot' | 'upload' | 'none';
type Format = 'ficha' | 'vertical';

const BACKGROUNDS = [
  { value: '#0b0a12', label: 'Oscuro' },
  { value: '#8b7cf6', label: 'Morado' },
  { value: '#f7f6ff', label: 'Claro' },
];

// SpotCard sólo usa la foto si la URL termina en extensión de imagen; a la foto subida se le agrega una.
const withImageHint = (url: string) => `${url}#foto.jpg`;

const BLANK_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Los errores de carga de imágenes llegan como Event, sin mensaje.
const errorText = (err: unknown) => (err instanceof Error && err.message ? err.message : 'una imagen no se pudo cargar. Intenta con "Subir foto".');

const slugify = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'spot';

// ¿Se puede copiar la foto a la imagen? Las de otro dominio sin CORS (Storage) no se pueden.
async function canExport(url: string) {
  if (!/^https?:/i.test(url) || new URL(url, window.location.href).origin === window.location.origin) return true;
  try {
    const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export function FichaMaker({ spots, loaded }: { spots: SpotDoc[]; loaded: boolean }) {
  const [spotId, setSpotId] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Spot | null>(null);
  const [photo, setPhoto] = useState<Photo>('spot');
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>('ficha');
  const [background, setBackground] = useState(BACKGROUNDS[0].value);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const term = query.trim().toLowerCase();
    return spots.filter((spot) => !term || `${spot.name} ${spot.type}`.toLowerCase().includes(term));
  }, [spots, query]);

  // La foto subida vive sólo en este navegador: se libera al cambiarla o al salir.
  useEffect(() => () => {
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
  }, [uploadUrl]);

  const pick = (id: string) => {
    setSpotId(id);
    setNotice(null);
    setError(null);
    const spot = spots.find((item) => item.id === id);
    if (!spot) {
      setDraft(null);
      return;
    }
    setDraft({
      id: spot.id,
      name: spot.name,
      type: spot.type,
      description: spot.description,
      highlight: spot.highlight ?? '',
      imageUrl: spot.imageUrl,
      colorAccent: spot.colorAccent || '#8b7cf6',
      mapsLink: spot.mapsLink,
      city: spot.city || 'guadalajara',
      rating: spot.rating ?? undefined,
      price: spot.price ?? '',
      zone: spot.zone ?? undefined,
    });
    setPhoto('spot');
  };

  const update = (fields: Partial<Spot>) => setDraft((current) => (current ? { ...current, ...fields } : current));

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setPhoto('upload');
    setNotice(null);
  };

  const spot = draft && spots.find((item) => item.id === spotId);
  const imageUrl = photo === 'upload' && uploadUrl ? withImageHint(uploadUrl) : photo === 'spot' && spot ? spot.imageUrl : '';
  const preview: Spot | null = draft ? { ...draft, imageUrl, rating: draft.rating || undefined, price: draft.price || undefined, highlight: draft.highlight || undefined } : null;
  const hasSpotPhoto = Boolean(spot && /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(spot.imageUrl));

  const render = async () => {
    if (!stageRef.current || !preview) return null;
    if (photo === 'spot' && hasSpotPhoto && !(await canExport(spot!.imageUrl))) {
      setPhoto('none');
      setNotice('Esta foto no se puede exportar desde Storage: súbela desde tu equipo con "Subir foto". Por ahora la ficha sale con el arte de la categoría.');
      return null;
    }
    await document.fonts?.ready;
    // Si una imagen no carga (sin internet, sin CORS), se deja en blanco en lugar de fallar toda la ficha.
    return toJpeg(stageRef.current, { pixelRatio: 3, quality: 0.92, backgroundColor: background, cacheBust: true, imagePlaceholder: BLANK_PIXEL });
  };

  const fileName = () => `ficha-${slugify(preview?.name ?? 'spot')}${format === 'vertical' ? '-9x16' : ''}.jpg`;

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await render();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName();
      link.click();
      setNotice(`Listo: ${fileName()}`);
    } catch (err) {
      setError(`No se pudo crear la imagen: ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  // En el celular: la hoja de compartir deja guardarla en Fotos o mandarla directo.
  const canShareFiles = typeof navigator.canShare === 'function';
  const share = async () => {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await render();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName(), { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: preview?.name });
      else setError('Este navegador no deja compartir imágenes: usa "Bajar JPG".');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setError(`No se pudo compartir: ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <main className="sa-main"><p className="sa-empty">Cargando spots...</p></main>;

  return (
    <main className="sa-main sa-ficha-page">
      <header className="sa-zones-head">
        <div>
          <h2>Fichas Bruuk</h2>
          <p className="sa-hint">Elige un spot, ajusta lo que quieras y bájalo en JPG para tus videos. Los cambios son sólo para la ficha: el spot del sitio no se toca.</p>
        </div>
      </header>

      <div className="sa-ficha-layout">
        <section className="sa-ficha-form" aria-label="Datos de la ficha">
          <label className="sa-field">
            <span>Buscar spot</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o tipo" />
          </label>
          <label className="sa-field">
            <span>Spot</span>
            <select value={spotId} onChange={(event) => pick(event.target.value)}>
              <option value="">Elige un spot…</option>
              {options.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active ? '' : ' (oculto)'}</option>)}
            </select>
          </label>

          {draft && (
            <>
              <label className="sa-field"><span>Nombre</span><input value={draft.name} onChange={(event) => update({ name: event.target.value })} /></label>
              <label className="sa-field"><span>Tipo</span><input value={draft.type} onChange={(event) => update({ type: event.target.value })} /></label>
              <label className="sa-field"><span>VE POR</span><textarea rows={2} value={draft.highlight ?? ''} onChange={(event) => update({ highlight: event.target.value })} /></label>
              <div className="sa-ficha-row">
                <label className="sa-field"><span>Precio</span><input value={draft.price ?? ''} onChange={(event) => update({ price: event.target.value })} placeholder="$100-200" /></label>
                <label className="sa-field"><span>Estrellas</span><input type="number" min="0" max="5" step="0.1" value={draft.rating ?? ''} onChange={(event) => update({ rating: event.target.value ? Number(event.target.value) : undefined })} /></label>
              </div>
              <div className="sa-ficha-row">
                <label className="sa-field">
                  <span>Zona</span>
                  <select value={draft.zone ?? ''} onChange={(event) => update({ zone: event.target.value || undefined })}>
                    <option value="">Ciudad (Guadalajara)</option>
                    {ZONES.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                  </select>
                </label>
                <label className="sa-field sa-ficha-color"><span>Color</span><input type="color" value={draft.colorAccent} onChange={(event) => update({ colorAccent: event.target.value })} /></label>
              </div>

              <fieldset className="sa-ficha-choice">
                <legend>Foto</legend>
                <label><input type="radio" checked={photo === 'spot'} onChange={() => setPhoto('spot')} disabled={!hasSpotPhoto} /> La del spot{hasSpotPhoto ? '' : ' (no tiene)'}</label>
                <label><input type="radio" checked={photo === 'none'} onChange={() => setPhoto('none')} /> Sin foto (arte de la categoría)</label>
                <label><input type="radio" checked={photo === 'upload'} onChange={() => (uploadUrl ? setPhoto('upload') : fileRef.current?.click())} /> Una mía</label>
                <button type="button" className="btn sa-ficha-upload" onClick={() => fileRef.current?.click()}><ImageUp size={16} aria-hidden="true" /> Subir foto</button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => onFile(event.target.files?.[0])} />
              </fieldset>

              <fieldset className="sa-ficha-choice">
                <legend>Formato</legend>
                <label><input type="radio" checked={format === 'ficha'} onChange={() => setFormat('ficha')} /> Sólo la ficha</label>
                <label><input type="radio" checked={format === 'vertical'} onChange={() => setFormat('vertical')} /> Vertical 9:16 (1080×1920)</label>
              </fieldset>

              <fieldset className="sa-ficha-choice">
                <legend>Fondo</legend>
                {BACKGROUNDS.map((item) => (
                  <label key={item.value}><input type="radio" checked={background === item.value} onChange={() => setBackground(item.value)} /> <i style={{ background: item.value }} aria-hidden="true" /> {item.label}</label>
                ))}
              </fieldset>
            </>
          )}
        </section>

        <section className="sa-ficha-preview" aria-label="Vista previa">
          {preview ? (
            <>
              <div className="sa-ficha-frame">
                <div ref={stageRef} className={`sa-ficha-stage is-${format}`} style={{ background }}>
                  <div className="card-wrapper-centered">
                    <SpotCard key={`${preview.id}-${photo}-${imageUrl}`} spot={preview} variant="ficha" />
                  </div>
                </div>
              </div>
              <div className="sa-ficha-actions">
                <button type="button" className="btn btn-primary" onClick={() => void download()} disabled={busy}><Download size={17} aria-hidden="true" /> {busy ? 'Creando…' : 'Bajar JPG'}</button>
                {canShareFiles && <button type="button" className="btn" onClick={() => void share()} disabled={busy}><Share2 size={17} aria-hidden="true" /> Compartir / Guardar</button>}
              </div>
              {notice && <p className="sa-map-notice" role="status">{notice}</p>}
              {error && <p className="login-error">{error}</p>}
            </>
          ) : (
            <p className="sa-empty">Elige un spot para ver su ficha.</p>
          )}
        </section>
      </div>
    </main>
  );
}
