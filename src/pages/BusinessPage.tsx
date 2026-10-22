import { useState } from 'react';
import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import './BusinessPage.css';

// Sólo por enlace directo (bruuk.space/negocios): no hay links a esta página en la web ni en la app.
const RULES = [
  'No cobramos ni aceptamos intercambios.',
  'Vamos como cualquier cliente, sin avisar.',
  'Si no nos convence, no se publica.',
];

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function BusinessPage() {
  const [businessName, setBusinessName] = useState('');
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/place-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'negocio', businessName: businessName.trim(), link: link.trim(), email: email.trim(), phone: phone.trim(), accepted, website }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No pudimos enviar tu solicitud.');
      setStatus('sent');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar tu solicitud. Inténtalo otra vez.');
    }
  };

  return (
    <div className="business-page">
      <header className="business-nav">
        <Link to="/" aria-label="Ir a Bruuk"><BruukLogo width={92} /></Link>
        <span>/ PARA NEGOCIOS</span>
      </header>

      <main className="business-main">
        <section className="business-intro" aria-labelledby="business-title">
          <h1 id="business-title">RESEÑA HONESTA.<br /><em>CERO PAGADA.</em></h1>
          <ul className="business-rules">
            {RULES.map((rule) => <li key={rule}><Check size={15} strokeWidth={3} aria-hidden="true" />{rule}</li>)}
          </ul>
        </section>

        <div className="business-card">
          {status === 'sent' ? (
            <div className="business-sent" role="status">
              <Check size={28} strokeWidth={3} aria-hidden="true" />
              <h2>LISTO. YA NOS LLEGÓ.</h2>
              <p>Si vamos, no te avisaremos antes. Si publicamos, te escribimos a {email.trim()} con el enlace.</p>
              <Link to="/guadalajara/spots" className="business-submit">VER BRUUK <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          ) : (
            <form className="business-form" onSubmit={(event) => void submit(event)}>
              <div className="business-field">
                <label htmlFor="business-name">Nombre del negocio</label>
                <input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required minLength={2} maxLength={120} autoComplete="organization" placeholder="Café Ejemplo" />
              </div>
              <div className="business-field">
                <label htmlFor="business-link">Instagram o Google Maps</label>
                <input id="business-link" value={link} onChange={(event) => setLink(event.target.value)} required minLength={4} maxLength={300} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="@tunegocio o enlace de Maps" />
              </div>
              <div className="business-row">
                <div className="business-field">
                  <label htmlFor="business-email">Correo</label>
                  <input id="business-email" type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={180} autoComplete="email" autoCapitalize="none" placeholder="tu@correo.com" />
                </div>
                <div className="business-field">
                  <label htmlFor="business-phone">WhatsApp <small>(opcional)</small></label>
                  <input id="business-phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} autoComplete="tel" placeholder="33 1234 5678" />
                </div>
              </div>

              {/* Trampa para bots: las personas no ven este campo */}
              <label className="business-honeypot" aria-hidden="true">
                Sitio web
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>

              <label className="business-accept">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required />
                <span>Entiendo que la reseña es honesta, no se paga y puede no publicarse.</span>
              </label>

              {error && <p className="business-error" role="alert">{error}</p>}

              <button type="submit" className="business-submit" disabled={status === 'sending'}>
                {status === 'sending'
                  ? <><LoaderCircle className="business-spinner" size={18} aria-hidden="true" /> ENVIANDO…</>
                  : <>PEDIR RESEÑA <ArrowRight size={17} aria-hidden="true" /></>}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
