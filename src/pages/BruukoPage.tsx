import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Mail, MapPin, Store, Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as validator from 'email-validator';
import { BruukLogo } from '../components/BruukLogo';
import { BruukCombobox } from '../components/BruukSelect';
import '../App.css';

const CITIES = ['Ciudad de México', 'Monterrey', 'Madrid', 'Buenos Aires', 'Bogotá', 'Barcelona'];
const SUGGESTIONS = ['Barcelona', 'Bogotá', 'Buenos Aires', 'Ciudad de México', 'Guadalajara', 'Lima', 'Madrid', 'Medellín', 'Monterrey', 'Oaxaca', 'Quito', 'Santiago de Chile'];

export function BruukoPage() {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [otherCity, setOtherCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [activeProposal, setActiveProposal] = useState<'venue' | 'spot' | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const selectedCity = city === 'other' ? otherCity.trim() : city;
    if (!validator.validate(cleanEmail)) { setStatus('error'); setError('Escribe un correo válido para continuar.'); return; }
    if (!selectedCity) { setStatus('error'); setError('Elige o busca la ciudad desde la que quieres activar Bruuk.'); return; }
    setStatus('loading'); setError('');
    try {
      const proposalResponse = await fetch('/api/city-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, city: selectedCity, website: '' }),
      });
      if (!proposalResponse.ok) throw new Error('No se pudo guardar la propuesta.');
      setStatus('success'); setEmail(''); setCity(''); setOtherCity('');
    } catch { setStatus('error'); setError('No pudimos enviar tu registro. Inténtalo de nuevo en un momento.'); }
  };

  return <><header className="expand-nav">
    <Link className="expand-nav-logo" to="/" aria-label="Volver al inicio de Bruuk"><BruukLogo width={104} /></Link>
    <div className="expand-nav-context"><span>/ PARTICIPA</span><strong>EXPANDE BRUUK</strong></div>
    <Link className="expand-nav-back" to="/"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>
  </header><main className="bruuko-callout bruuko-page" aria-labelledby="bruuko-title">
    <section className="bruuko-main-hero" aria-labelledby="bruuko-title">
      <div className="bruuko-main-hero-copy">
        <span className="bruuko-main-kicker">/ BRUUK · CRECIMIENTO LOCAL</span>
        <h1 id="bruuko-title">EXPANDE—<br />BRUUK.</h1>
      </div>
      <div className="bruuko-main-hero-note">
        <span>CIUDAD · LUGARES · COMUNIDAD</span>
        <p>Lleva Bruuk a tu ciudad y ayúdanos a encontrar los espacios, ideas y personas que hacen que algo pase.</p>
      </div>
      <div className="bruuko-main-hero-stamp" aria-hidden="true"><strong>MX</strong><span>ABIERTO / 2026</span></div>
    </section>

    <section className="bruuko-activation" aria-labelledby="bruuko-activation-title"><div className="container"><div className="bruuko-grid">
      <div className="bruuko-intro"><span className="bruuko-eyebrow"><MapPin size={16} /> / ACTIVA TU CIUDAD</span><h2 id="bruuko-activation-title">PROPÓN EL SIGUIENTE PUNTO DEL MAPA.</h2><p>Conoces los lugares, el ritmo y los planes que hacen única a tu ciudad. Cuéntanos desde dónde quieres empezar.</p><div className="bruuko-route" aria-label="Cómo se activa una ciudad"><span><b>01</b> PROPÓN</span><i aria-hidden="true">→</i><span><b>02</b> EVALUAMOS</span><i aria-hidden="true">→</i><span><b>03</b> ACTIVAMOS</span></div><p className="bruuko-note">No necesitas seguidores ni experiencia. Sólo mirada local y ganas de crear comunidad.</p></div>
      <div className="bruuko-form-card"><div className="bruuko-form-heading"><span>/ REGISTRO DE CIUDAD</span><strong>EMPIEZA AQUÍ</strong></div>{status === 'success' ? <div className="bruuko-success" role="status"><span className="bruuko-success-icon"><Check size={30} strokeWidth={3} /></span><h2>YA ERES PARTE DEL MAPA.</h2><p>Te escribiremos cuando sea momento de llevar Bruuk a tu ciudad.</p><button className="bruuko-reset" type="button" onClick={() => setStatus('idle')}>Registrar otra ciudad</button></div> : <form onSubmit={submit} noValidate>
        <label className="bruuko-label" htmlFor="bruuko-email"><Mail size={16} /> Tu correo</label><input id="bruuko-email" className="bruuko-email-input" type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === 'loading'} required />
        <fieldset className="bruuko-cities" disabled={status === 'loading'}><legend>¿En qué ciudad estás?</legend><div className="bruuko-city-options">{CITIES.map((option) => <label className={`bruuko-city-option ${city === option ? 'is-selected' : ''}`} key={option}><input type="radio" name="bruuko-city" value={option} checked={city === option} onChange={() => { setCity(option); setOtherCity(''); }} /><span>{option}</span></label>)}<label className={`bruuko-city-option bruuko-city-search ${city === 'other' ? 'is-selected' : ''}`}><input type="radio" name="bruuko-city" value="other" checked={city === 'other'} onChange={() => setCity('other')} /><BruukCombobox id="bruuko-page-city-search" className="is-light" inputClassName="bruuko-city-input" floatingLabel="¿NO VES TU CIUDAD?" value={otherCity} suggestions={SUGGESTIONS} placeholder="Escribe o busca tu ciudad" ariaLabel="Busca tu ciudad" disabled={status === 'loading'} onFocus={() => setCity('other')} onChange={(value) => { setOtherCity(value); setCity('other'); }} /></label></div></fieldset>
        {status === 'error' && <p className="bruuko-error" role="alert">{error}</p>}<button className="btn btn-primary bruuko-submit" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'ENVIANDO...' : <>PROPONER MI CIUDAD <ArrowRight size={19} strokeWidth={3} /></>}</button>
      </form>}</div>
    </div></div></section>
    <section className="expand-opportunities" aria-labelledby="opportunities-title"><div className="container"><span>/ CRECEMOS EN COMUNIDAD</span><h2 id="opportunities-title">ABRE MÁS POSIBILIDADES EN TU CIUDAD.</h2><p>Bruuk no sólo necesita nuevas ciudades. También necesita espacios donde pasen cosas y recomendaciones que merezcan llegar al mapa.</p><aside className="expand-organizers" aria-labelledby="expand-organizers-title"><span className="expand-organizers-icon"><CalendarDays size={24} aria-hidden="true" /></span><div><small>/ ORGANIZADORES BRUUK</small><h3 id="expand-organizers-title">LAS IDEAS NECESITAN A ALGUIEN QUE LAS HAGA PASAR.</h3></div><p>Quienes imaginan, producen y coordinan eventos son parte vital del crecimiento de Bruuk: conectan lugares, comunidad y planes que vale la pena vivir.</p><div className="expand-organizers-flow" aria-label="Idea, lugar y comunidad"><span>IDEA</span><i>→</i><span>LUGAR</span><i>→</i><span>COMUNIDAD</span></div></aside><div className="expand-opportunity-grid">
      <article><Store size={28} aria-hidden="true" /><h3>¿TIENES UN LUGAR?</h3><p>Propón tu café, bar, galería o espacio para un Plan Bruuk: encuentros pequeños, talleres, rutas y noches con comunidad.</p><button className="expand-opportunity-cta" type="button" onClick={() => setActiveProposal('venue')}>PROPONER MI LUGAR <ArrowRight size={16} /></button></article>
      <article><Heart size={28} aria-hidden="true" /><h3>DEJA TU SPOT FAVORITO</h3><p>¿Conoces un lugar que debería estar aquí? Déjanos su nombre, ubicación y por qué vale la pena. Lo evaluamos antes de sumarlo a la guía.</p><button className="expand-opportunity-cta" type="button" onClick={() => setActiveProposal('spot')}>RECOMENDAR UN SPOT <ArrowRight size={16} /></button></article>
    </div></div></section>
  </main>{activeProposal && <ProposalModal type={activeProposal} onClose={() => setActiveProposal(null)} />}</>;
}

function ProposalModal({ type, onClose }: { type: 'venue' | 'spot'; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isVenue = type === 'venue';
  const title = isVenue ? 'PROPÓN TU LUGAR' : 'RECOMIENDA UN SPOT';
  const placeholder = isVenue ? 'Nombre, zona, aforo e idea para un evento Bruuk' : 'Nombre, ubicación y por qué vale la pena';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  const advance = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validator.validate(email.trim())) { setStatus('error'); return; }
    setStatus('idle'); setStep(2);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!details.trim()) { setStatus('error'); return; }
    setStatus('loading');
    try {
      const proposalResponse = await fetch('/api/place-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          proposalType: type,
          details: details.trim(),
          website: '',
        }),
      });
      if (!proposalResponse.ok) throw new Error('No se pudo guardar la propuesta.');
      setStatus('success'); setEmail(''); setDetails('');
    } catch { setStatus('error'); }
  };
  return <div className="proposal-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="proposal-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-modal-title">
    <div className="proposal-modal-top"><span>PASO {step} DE 2</span><button type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
    {status === 'success' ? <div className="proposal-modal-success"><Check size={34} /><h2 id="proposal-modal-title">RECIBIMOS TU PROPUESTA.</h2><p>La revisaremos y te contactaremos si encaja con Bruuk.</p><button type="button" onClick={onClose}>LISTO</button></div> : <>
      <h2 id="proposal-modal-title">{title}</h2><p>{step === 1 ? 'Primero dinos cómo podemos contactarte.' : isVenue ? 'Cuéntanos lo esencial de tu espacio y la experiencia que imaginas.' : 'Cuéntanos qué lugar es y por qué debería estar en Bruuk.'}</p>
      {step === 1 ? <form className="proposal-modal-form" onSubmit={advance}><label htmlFor="proposal-email">TU CORREO</label><input id="proposal-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoFocus required />{status === 'error' && <small>Escribe un correo válido.</small>}<button type="submit">CONTINUAR <ArrowRight size={17} /></button></form> : <form className="proposal-modal-form" onSubmit={submit}><label htmlFor="proposal-details">DETALLES</label><textarea id="proposal-details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder={placeholder} autoFocus required />{status === 'error' && <small>Cuéntanos un poco más para poder evaluarlo.</small>}<div className="proposal-modal-actions"><button className="is-back" type="button" onClick={() => { setStatus('idle'); setStep(1); }}><ArrowLeft size={17} /> ATRÁS</button><button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'ENVIANDO...' : <>ENVIAR <ArrowRight size={17} /></>}</button></div></form>}
    </>}
  </section></div>;
}
