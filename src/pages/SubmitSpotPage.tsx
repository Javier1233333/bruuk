import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as validator from 'email-validator';
import { BruukLogo } from '../components/BruukLogo';
import './SubmitSpotPage.css';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function SubmitSpotPage() {
  const [spotName, setSpotName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (spotName.trim().length < 2 || city.trim().length < 2) {
      setStatus('error');
      setError('Escribe el nombre del spot y su ciudad.');
      return;
    }
    if (reason.trim().length < 10) {
      setStatus('error');
      setError('Cuéntanos un poco más: ¿por qué te gusta este lugar?');
      return;
    }
    if (!validator.validate(email.trim())) {
      setStatus('error');
      setError('Escribe un correo válido para poder preguntarte si falta algún dato.');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/place-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotName: spotName.trim(),
          city: city.trim(),
          location: location.trim(),
          reason: reason.trim(),
          email: email.trim().toLowerCase(),
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar el spot.');
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el spot. Inténtalo otra vez.');
    }
  };

  return (
    <div className="submit-spot-page">
      <header className="submit-spot-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={104} /></Link>
        <span>/ APORTA AL MAPA</span>
        <Link to="/"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>
      </header>

      <main className="submit-spot-main">
        <section className="submit-spot-copy" aria-labelledby="submit-spot-title">
          <span className="submit-spot-kicker">/ NO IMPORTA LA CIUDAD</span>
          <h1 id="submit-spot-title">¿TE GUSTA<br />UN SPOT?<br /><em>SÚBELO.</em></h1>
          <p>Cada cierto tiempo subiré una guía hecha por una persona: con mis descubrimientos y, espero, también con los de ustedes.</p>
          <p className="submit-spot-note">Puede estar en Guadalajara o en cualquier otra ciudad. Lo revisaremos antes de publicarlo: aquí no entran rankings pagados.</p>
          <div className="submit-spot-flow" aria-label="Proceso de una recomendación">
            <span><b>01</b> TÚ LO COMPARTES</span>
            <span><b>02</b> LO REVISAMOS</span>
            <span><b>03</b> PUEDE LLEGAR A UNA GUÍA</span>
          </div>
        </section>

        <section className="submit-spot-card" aria-label="Formulario para recomendar un spot">
          {status === 'success' ? (
            <div className="submit-spot-success" role="status">
              <Check size={38} strokeWidth={3} aria-hidden="true" />
              <span>/ RECIBIDO</span>
              <h2>YA ESTÁ EN<br />NUESTRO RADAR.</h2>
              <p>Gracias por compartir un lugar que te importa. Lo revisaremos con calma antes de sumarlo a Bruuk.</p>
              <button type="button" onClick={() => {
                setSpotName(''); setCity(''); setLocation(''); setReason(''); setEmail(''); setWebsite(''); setStatus('idle');
              }}>SUBIR OTRO SPOT <ArrowRight size={17} /></button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="submit-spot-form-heading"><span>/ NUEVO HALLAZGO</span><strong>CUÉNTANOS CUÁL</strong></div>

              <label htmlFor="spot-name">NOMBRE DEL SPOT</label>
              <input id="spot-name" value={spotName} onChange={(event) => setSpotName(event.target.value)} placeholder="Ej. una cafetería, tienda o museo" maxLength={120} disabled={status === 'loading'} required />

              <label htmlFor="spot-city">CIUDAD</label>
              <input id="spot-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cualquier ciudad del mundo" maxLength={100} autoComplete="address-level2" disabled={status === 'loading'} required />

              <label htmlFor="spot-location">UBICACIÓN O ENLACE <small>OPCIONAL</small></label>
              <div className="submit-spot-icon-field"><MapPin size={18} aria-hidden="true" /><input id="spot-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Google Maps, Instagram o dirección" maxLength={500} disabled={status === 'loading'} /></div>

              <label htmlFor="spot-reason">¿POR QUÉ TE GUSTA?</label>
              <textarea id="spot-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Cuéntalo como se lo contarías a un amigo." maxLength={1200} disabled={status === 'loading'} required />

              <label htmlFor="spot-email">TU CORREO</label>
              <input id="spot-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Sólo por si necesitamos confirmar algo" maxLength={180} disabled={status === 'loading'} required />

              <div className="submit-spot-trap" aria-hidden="true"><label htmlFor="spot-website">Sitio web</label><input id="spot-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div>

              {status === 'error' && <p className="submit-spot-error" role="alert">{error}</p>}
              <button className="submit-spot-button" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'ENVIANDO...' : <>SUBIR A BRUUK <Send size={18} /></>}</button>
              <p className="submit-spot-privacy">Al enviarlo aceptas que Bruuk revise la recomendación. Tu correo nunca se publica.</p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default SubmitSpotPage;
