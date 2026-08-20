import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Copy, CreditCard, MapPin, MessageCircle, Share2, Users } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CityNav } from '../components/CityNav';
import { BruukSelect } from '../components/BruukSelect';
import { getCommunityEvent, getPaypalDepositUrl } from '../data/communityEvents';
import './Plans.css';

type JoinState = 'idle' | 'loading' | 'success' | 'error';

export default function PlanDetailPage() {
  const { slug, city = 'guadalajara' } = useParams();
  const plansPath = `/${city}/planes`;
  const event = getCommunityEvent(slug);
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [reservationCode, setReservationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayAuthorized, setDisplayAuthorized] = useState(false);

  useEffect(() => {
    if (!event) return;
    document.title = `${event.title} — Bruuk Planes`;
    return () => { document.title = 'Bruuk'; };
  }, [event]);

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
  const whatsappUrl = useMemo(() => {
    if (!event || !shareUrl) return '#';
    return `https://wa.me/?text=${encodeURIComponent(`Nos vemos en ${event.title}. Únete aquí: ${shareUrl}`)}`;
  }, [event, shareUrl]);

  if (city !== 'guadalajara') return <Navigate to="/guadalajara/planes" replace />;
  if (!event) return <Navigate to={plansPath} replace />;
  const paypalDepositUrl = getPaypalDepositUrl(event);
  const depositCurrency = event.depositCurrency ?? 'MXN';
  const depositLabel = `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: depositCurrency, maximumFractionDigits: 0 }).format(event.depositAmount ?? 0)} ${depositCurrency}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copia el enlace del evento:', shareUrl);
    }
  };

  const sharePlan = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.summary, url: shareUrl });
      } catch {
        // Cerrar la hoja nativa de compartir no requiere mostrar un error.
      }
      return;
    }
    await copyLink();
  };

  const handleJoin = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const data = new FormData(form);
    setJoinState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/event-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: event.slug,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          instagram: data.get('instagram'),
          guests: Number(data.get('guests')),
          depositAmount: event.depositAmount ?? 0,
          depositCurrency: event.depositCurrency ?? 'MXN',
          consent: data.get('consent') === 'on',
          displayConsent: data.get('displayConsent') === 'on',
          website: data.get('website'),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo completar el registro.');
      setReservationCode(result.reservationCode);
      setDisplayAuthorized(data.get('displayConsent') === 'on');
      setJoinState('success');
      form.reset();
    } catch (error) {
      setJoinState('error');
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar tu lugar. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="plans-page plan-detail-page" style={{ '--plan-accent': event.accent } as CSSProperties}>
      <CityNav active="planes" />
      <div className="plan-detail-actions"><Link to={plansPath}><ArrowLeft size={17} /> TODOS LOS PLANES</Link><button type="button" onClick={sharePlan}><Share2 size={17} aria-hidden="true" /> COMPARTIR</button></div>

      <main>
        <section className="plan-detail-hero">
          <div className="plan-detail-image">
            <img src={event.image} alt={event.imageAlt} width="960" height="960" fetchPriority="high" decoding="async" />
            <span>{event.kicker}</span>
          </div>
          <div className="plan-detail-copy">
            <div className="plan-detail-status"><span aria-hidden="true" /> {event.status === 'limited' ? 'CUPO LIMITADO' : 'REGISTRO ABIERTO'}</div>
            <h1>{event.title}</h1>
            <p className="plan-detail-summary">{event.summary}</p>
            <div className="plan-detail-facts">
              <div><CalendarDays size={20} aria-hidden="true" /><span>CUÁNDO</span><strong>{event.dateLabel}<br />{event.timeLabel}</strong></div>
              <div><MapPin size={20} aria-hidden="true" /><span>DÓNDE</span><strong>{event.venue}<br />{event.neighborhood}</strong></div>
              <div><Users size={20} aria-hidden="true" /><span>CUPO</span><strong>{event.capacity} PERSONAS<br />{(event.depositAmount ?? 0) > 0 ? `ANTICIPO ${depositLabel} · PAYPAL` : event.priceLabel}</strong></div>
            </div>
            <a href="#unirme" className="plans-button plan-primary-cta">QUIERO UNIRME <ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="plan-detail-content plans-shell">
          <article>
            <span className="plans-eyebrow">/ SOBRE EL PLAN</span>
            <h2>UNA RAZÓN PARA APARECER.</h2>
            <p>{event.description}</p>
            <h3>ESTE PLAN INCLUYE</h3>
            <ul>{event.includes.map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul>
            <a className="plan-map-link" href={event.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={18} aria-hidden="true" /> ABRIR {event.venue} EN MAPS <ArrowUpRight size={16} aria-hidden="true" /></a>
          </article>

          <aside id="unirme" className="plan-join-card" aria-labelledby="join-title">
            {joinState === 'success' ? (
              <div className="plan-join-success" role="status">
                <span><Check size={28} aria-hidden="true" /></span>
                <p>/ REGISTRO RECIBIDO</p>
                <h2 id="join-title">YA ESTÁS EN LA LISTA.</h2>
                <p>Guarda tu folio. Usaremos tu correo para enviarte cualquier actualización del plan.</p>
                <strong>{reservationCode}</strong>
                {displayAuthorized && <p className="plan-display-confirmation">Autorizaste mostrar tu nombre y usuario de Instagram en la lista pública de asistentes.</p>}
                {(event.depositAmount ?? 0) > 0 && (
                  <div className="plan-deposit-success">
                    <span>PENDIENTE DE ANTICIPO</span>
                    <p>Completa el pago de <strong>{depositLabel}</strong> para confirmar tu lugar.</p>
                    {paypalDepositUrl ? <a href={paypalDepositUrl} target="_blank" rel="noreferrer">PAGAR ANTICIPO CON PAYPAL <ArrowUpRight size={17} /></a> : <em>El comercio todavía debe configurar su enlace de PayPal.</em>}
                  </div>
                )}
                <Link to={plansPath}>VER MÁS PLANES</Link>
              </div>
            ) : (
              <>
                <span className="plans-eyebrow">/ APARTA TU LUGAR</span>
                <h2 id="join-title">ÚNETE SIN CREAR UNA CUENTA.</h2>
                <p>Completa estos datos. El registro es personal y recibirás las actualizaciones del evento.</p>
                {(event.depositAmount ?? 0) > 0 && <div className="plan-deposit-summary"><CreditCard size={19} /><div><span>ANTICIPO PARA CONFIRMAR</span><strong>{depositLabel} · PAYPAL</strong></div></div>}
                <form onSubmit={handleJoin}>
                  <label>NOMBRE COMPLETO<input name="name" type="text" autoComplete="name" required minLength={2} /></label>
                  <label>CORREO<input name="email" type="email" autoComplete="email" required /></label>
                  <label>USUARIO DE INSTAGRAM<input name="instagram" type="text" inputMode="text" autoComplete="off" placeholder="@tuusuario" pattern="@?[A-Za-z0-9._]{1,30}" title="Usa únicamente letras, números, puntos o guion bajo" required /></label>
                  <label>WHATSAPP <span>(OPCIONAL)</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" /></label>
                  <div className="plan-select-field"><span>PERSONAS</span><BruukSelect name="guests" ariaLabel="Número de personas" defaultValue="1" options={[{ value: '1', label: '1 PERSONA' }, { value: '2', label: '2 PERSONAS' }, { value: '3', label: '3 PERSONAS' }, { value: '4', label: '4 PERSONAS' }]} /></div>
                  <label className="plan-honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
                  <label className="plan-consent"><input name="consent" type="checkbox" required /> <span>Acepto que Bruuk use estos datos para gestionar mi asistencia. Entiendo que el registro se confirma al completar el anticipo.</span></label>
                  <label className="plan-consent plan-display-consent"><input name="displayConsent" type="checkbox" /> <span><strong>AUTORIZACIÓN PÚBLICA</strong> Autorizo que Bruuk muestre mi nombre y usuario de Instagram en la lista de asistentes de este evento. Es opcional y puedo solicitar que se retire.</span></label>
                  {joinState === 'error' && <div className="plan-form-error" role="alert">{errorMessage}</div>}
                  <button type="submit" disabled={joinState === 'loading'}>{joinState === 'loading' ? 'GUARDANDO…' : 'APARTAR MI LUGAR'} <ArrowUpRight size={18} aria-hidden="true" /></button>
                </form>
              </>
            )}
          </aside>
        </section>

        <section className="plan-share-strip" aria-labelledby="share-title">
          <div className="plans-shell">
            <div><span>/ LINK DEL EVENTO</span><h2 id="share-title">COMPARTE EL PLAN.</h2><p>{event.hostMessage}</p></div>
            <div className="plan-share-actions">
              <button type="button" onClick={copyLink}><Copy size={18} aria-hidden="true" /> {copied ? 'LINK COPIADO' : 'COPIAR LINK'}</button>
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> WHATSAPP</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
