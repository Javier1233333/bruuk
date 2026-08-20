import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Check, Copy, Eye, EyeOff,
  Link2, MapPin, Plus, RotateCcw, Save, Settings2, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import { BruukSelect } from '../components/BruukSelect';
import {
  COMMUNITY_EVENTS, getManagedEvents, resetManagedEvents, saveManagedEvents,
  type CommunityEvent,
} from '../data/communityEvents';
import './EventAdminPage.css';

const blankEvent = (position: number): CommunityEvent => ({
  slug: `nuevo-plan-${Date.now().toString(36)}`,
  title: 'Nuevo community event',
  kicker: `BRUUK PLAN / ${String(position).padStart(3, '0')}`,
  summary: 'Describe en una frase por qué vale la pena aparecer.',
  description: 'Cuenta qué sucederá, cómo será la dinámica y qué debe esperar la comunidad.',
  date: '2026-09-12T18:00:00-06:00',
  dateLabel: 'SÁBADO 12 SEP',
  timeLabel: '18:00 — 20:00',
  venue: 'Nombre del lugar',
  neighborhood: 'Colonia · Guadalajara',
  address: 'Guadalajara, Jalisco',
  mapsUrl: 'https://maps.google.com/',
  image: '/img/spots/34-la-perla-records-books.jpg',
  imageAlt: 'Imagen del evento',
  capacity: 20,
  priceLabel: 'ENTRADA LIBRE · REGISTRO PREVIO',
  status: 'open',
  accent: '#8c7cff',
  includes: ['Actividad principal', 'Conversación en comunidad'],
  hostMessage: 'Comparte este enlace con tu comunidad para registrar asistentes.',
  published: false,
  depositAmount: 100,
  depositCurrency: 'MXN',
  paypalUrl: '',
});

const statusText: Record<CommunityEvent['status'], string> = {
  open: 'Abierto', limited: 'Cupo limitado', 'sold-out': 'Cupo completo',
};

export default function EventAdminPage() {
  const [events, setEvents] = useState<CommunityEvent[]>(getManagedEvents);
  const [selectedSlug, setSelectedSlug] = useState(events[0]?.slug ?? '');
  const [draft, setDraft] = useState<CommunityEvent | null>(events[0] ?? null);
  const [saved, setSaved] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState('');

  const selectedIndex = useMemo(() => events.findIndex((event) => event.slug === selectedSlug), [events, selectedSlug]);
  const publicBase = typeof window === 'undefined' ? '' : window.location.origin;
  const update = <K extends keyof CommunityEvent>(key: K, value: CommunityEvent[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  };

  const selectEvent = (event: CommunityEvent) => {
    setSelectedSlug(event.slug);
    setDraft({ ...event, includes: [...event.includes] });
    setSaved(false);
  };

  const createEvent = () => {
    const event = blankEvent(events.length + 1);
    const next = [...events, event];
    setEvents(next);
    saveManagedEvents(next);
    selectEvent(event);
  };

  const saveEvent = (formEvent?: FormEvent) => {
    formEvent?.preventDefault();
    if (!draft) return;
    const next = selectedIndex >= 0
      ? events.map((event, index) => index === selectedIndex ? draft : event)
      : [...events, draft];
    setEvents(next);
    setSelectedSlug(draft.slug);
    saveManagedEvents(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const togglePublished = () => {
    if (!draft) return;
    const nextDraft = { ...draft, published: draft.published === false };
    const next = events.map((event, index) => index === selectedIndex ? nextDraft : event);
    setDraft(nextDraft);
    setEvents(next);
    saveManagedEvents(next);
  };

  const copyLink = async (event: CommunityEvent) => {
    const link = `${publicBase}/guadalajara/planes/${event.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedSlug(event.slug);
      window.setTimeout(() => setCopiedSlug(''), 2000);
    } catch {
      window.prompt('Copia el enlace del evento:', link);
    }
  };

  const restoreDefaults = () => {
    if (!window.confirm('Esto descartará todos los borradores y cambios guardados en este navegador.')) return;
    resetManagedEvents();
    setEvents(COMMUNITY_EVENTS);
    selectEvent(COMMUNITY_EVENTS[0]);
  };

  return (
    <div className="event-admin">
      <header className="event-admin-header">
        <Link to="/guadalajara/planes" className="event-admin-back"><ArrowLeft size={18} /> PLANES</Link>
        <Link to="/" aria-label="Inicio de Bruuk"><BruukLogo width={108} /></Link>
        <span className="event-admin-mode"><span /> MODO LOCAL</span>
      </header>

      <main className="event-admin-shell">
        <section className="event-admin-intro">
          <div><span>/ ADMIN DE EVENTOS</span><h1>GESTIONA<br />EL PLAN.</h1></div>
          <div className="event-admin-note"><Settings2 size={22} /><p>Sin inicio de sesión por ahora. Los cambios se guardan únicamente en este navegador.</p></div>
        </section>

        <section className="event-admin-stats" aria-label="Resumen de eventos">
          <div><CalendarDays size={20} /><span>EVENTOS</span><strong>{events.length}</strong></div>
          <div><Eye size={20} /><span>PUBLICADOS</span><strong>{events.filter((event) => event.published !== false).length}</strong></div>
          <div><Users size={20} /><span>CUPO TOTAL</span><strong>{events.reduce((total, event) => total + event.capacity, 0)}</strong></div>
        </section>

        <div className="event-admin-workspace">
          <aside className="event-admin-list" aria-label="Lista de eventos">
            <div className="event-admin-list-head"><span>TUS EVENTOS</span><button type="button" onClick={createEvent}><Plus size={17} /> NUEVO</button></div>
            <div className="event-admin-list-items">
              {events.map((event) => (
                <button type="button" key={event.slug} className={event.slug === selectedSlug ? 'active' : ''} onClick={() => selectEvent(event)}>
                  <span className="event-admin-list-date">{event.dateLabel}</span>
                  <strong>{event.title}</strong>
                  <small><MapPin size={13} /> {event.venue}</small>
                  <i className={event.published === false ? 'draft' : ''}>{event.published === false ? 'BORRADOR' : statusText[event.status].toUpperCase()}</i>
                </button>
              ))}
            </div>
            <button type="button" className="event-admin-reset" onClick={restoreDefaults}><RotateCcw size={15} /> RESTAURAR EJEMPLOS</button>
          </aside>

          {draft && (
            <section className="event-admin-editor">
              <header className="event-admin-editor-head">
                <div><span>/ EDITANDO</span><h2>{draft.title}</h2></div>
                <div className="event-admin-editor-actions">
                  <button type="button" className="secondary" onClick={() => copyLink(draft)}><Copy size={17} /> {copiedSlug === draft.slug ? 'COPIADO' : 'COPIAR LINK'}</button>
                  {draft.published !== false && <Link to={`/guadalajara/planes/${draft.slug}`} target="_blank"><ArrowUpRight size={17} /> VER PÁGINA</Link>}
                </div>
              </header>

              <form onSubmit={saveEvent}>
                <fieldset><legend>INFORMACIÓN PRINCIPAL</legend>
                  <label className="wide">TÍTULO<input required value={draft.title} onChange={(event) => update('title', event.target.value)} /></label>
                  <label className="wide">RESUMEN<textarea required rows={2} value={draft.summary} onChange={(event) => update('summary', event.target.value)} /></label>
                  <label className="wide">DESCRIPCIÓN<textarea required rows={4} value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
                  <label>FECHA VISIBLE<input required value={draft.dateLabel} onChange={(event) => update('dateLabel', event.target.value)} /></label>
                  <label>HORARIO<input required value={draft.timeLabel} onChange={(event) => update('timeLabel', event.target.value)} /></label>
                </fieldset>

                <fieldset><legend>LUGAR Y CUPO</legend>
                  <label>LUGAR<input required value={draft.venue} onChange={(event) => update('venue', event.target.value)} /></label>
                  <label>COLONIA / CIUDAD<input required value={draft.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} /></label>
                  <label className="wide">LINK DIRECTO DE MAPS<input type="url" required value={draft.mapsUrl} onChange={(event) => update('mapsUrl', event.target.value)} /></label>
                  <label>CUPO<input type="number" min="1" max="500" required value={draft.capacity} onChange={(event) => update('capacity', Number(event.target.value))} /></label>
                  <div className="event-admin-field"><span>ESTADO</span><BruukSelect ariaLabel="Estado del evento" value={draft.status} onChange={(status) => update('status', status as CommunityEvent['status'])} options={[{ value: 'open', label: 'REGISTRO ABIERTO' }, { value: 'limited', label: 'CUPO LIMITADO' }, { value: 'sold-out', label: 'CUPO COMPLETO' }]} /></div>
                  <label className="wide">PRECIO / CONDICIÓN<input value={draft.priceLabel} onChange={(event) => update('priceLabel', event.target.value)} /></label>
                </fieldset>

                <fieldset><legend>CONTENIDO Y ENLACE</legend>
                  <label className="wide">RUTA DE IMAGEN<input value={draft.image} onChange={(event) => update('image', event.target.value)} /></label>
                  <label className="wide">INCLUYE <span>Una línea por elemento</span><textarea rows={4} value={draft.includes.join('\n')} onChange={(event) => update('includes', event.target.value.split('\n').filter(Boolean))} /></label>
                  <label className="wide">SLUG DEL ENLACE <span>No uses espacios</span><div className="event-admin-slug"><Link2 size={17} /><input pattern="[a-z0-9-]+" required value={draft.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} /></div></label>
                </fieldset>

                <fieldset><legend>ANTICIPO CON PAYPAL</legend>
                  <label>MONTO DEL ANTICIPO<input type="number" min="0" step="1" required value={draft.depositAmount ?? 0} onChange={(event) => update('depositAmount', Number(event.target.value))} /></label>
                  <div className="event-admin-field"><span>MONEDA</span><BruukSelect ariaLabel="Moneda del anticipo" value={draft.depositCurrency ?? 'MXN'} onChange={(currency) => update('depositCurrency', currency as 'MXN' | 'USD')} options={[{ value: 'MXN', label: 'MXN — PESO MEXICANO' }, { value: 'USD', label: 'USD — DÓLAR' }]} /></div>
                  <label className="wide">LINK DE PAYPAL <span>Usa tu PayPal.Me base o un Payment Link completo</span><input type="url" placeholder="https://paypal.me/TuComercio" value={draft.paypalUrl ?? ''} onChange={(event) => update('paypalUrl', event.target.value)} /></label>
                  <div className="event-admin-payment-note wide">Bruuk agregará el monto al enlace PayPal.Me. Si pegas un Payment Link de PayPal, se abrirá exactamente ese enlace.</div>
                </fieldset>

                <footer className="event-admin-form-footer">
                  <button type="button" className={draft.published === false ? 'publish' : 'unpublish'} onClick={togglePublished}>{draft.published === false ? <Eye size={18} /> : <EyeOff size={18} />}{draft.published === false ? 'PUBLICAR EVENTO' : 'OCULTAR EVENTO'}</button>
                  <button type="submit" className="save"><Save size={18} /> {saved ? 'CAMBIOS GUARDADOS' : 'GUARDAR CAMBIOS'} {saved && <Check size={17} />}</button>
                </footer>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
