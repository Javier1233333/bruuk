import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ClipboardPaste, LocateFixed, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as validator from 'email-validator';
import { BruukLogo } from '../components/BruukLogo';
import './SubmitSpotPage.css';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type StepId = 'spot' | 'city' | 'location' | 'reason' | 'email';

const STEPS: StepId[] = ['spot', 'city', 'location', 'reason', 'email'];
const CITY_SHORTCUTS = ['Guadalajara', 'Zapopan', 'Tlaquepaque'];
const EMAIL_STORAGE_KEY = 'bruuk-submit-email';

const STEP_COPY: Record<StepId, { question: string; helper: string }> = {
  spot: { question: '¿Cómo se llama el lugar?', helper: 'Una cafetería, tienda, museo, mirador… lo que te guste.' },
  city: { question: '¿En qué ciudad está?', helper: 'Puede ser Guadalajara o cualquier ciudad del mundo.' },
  location: { question: '¿Dónde lo encontramos?', helper: 'Opcional. Un enlace de Google Maps o Instagram, o la dirección.' },
  reason: { question: '¿Por qué te gusta?', helper: 'Cuéntalo como se lo contarías a un amigo: qué pedir, cuándo ir, qué lo hace especial.' },
  email: { question: '¿A dónde te escribimos?', helper: 'Sólo por si necesitamos confirmar algo. Tu correo nunca se publica.' },
};

const readStoredEmail = () => {
  try {
    return window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const storeEmail = (value: string) => {
  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, value);
  } catch {
    // Sin almacenamiento disponible: el correo simplemente no se recuerda.
  }
};

const canPaste = typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';
const canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

export function SubmitSpotPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotName, setSpotName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState(readStoredEmail);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const hasMovedRef = useRef(false);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isLoading = status === 'loading';

  // Enfoca el campo al avanzar (no al cargar, para no abrir el teclado de golpe).
  useEffect(() => {
    if (hasMovedRef.current) fieldRef.current?.focus({ preventScroll: true });
  }, [stepIndex]);

  const validateStep = (id: StepId) => {
    if (id === 'spot' && spotName.trim().length < 2) return 'Escribe el nombre del spot.';
    if (id === 'city' && city.trim().length < 2) return 'Escribe la ciudad del spot.';
    if (id === 'reason' && reason.trim().length < 10) return 'Cuéntanos un poco más: ¿por qué te gusta este lugar?';
    if (id === 'email' && !validator.validate(email.trim())) return 'Escribe un correo válido para poder preguntarte si falta algún dato.';
    return '';
  };

  const goTo = (index: number) => {
    hasMovedRef.current = true;
    setError('');
    setStatus('idle');
    setStepIndex(index);
  };

  const submit = async () => {
    setStatus('loading');
    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetch('/api/place-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotName: spotName.trim(),
          city: city.trim(),
          location: location.trim(),
          reason: reason.trim(),
          email: cleanEmail,
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar el spot.');
      storeEmail(cleanEmail);
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el spot. Inténtalo otra vez.');
    }
  };

  const handleNext = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stepError = validateStep(step);
    if (stepError) {
      setStatus('error');
      setError(stepError);
      fieldRef.current?.focus({ preventScroll: true });
      return;
    }
    if (isLastStep) {
      void submit();
      return;
    }
    goTo(stepIndex + 1);
  };

  const pasteLocation = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) setLocation(text.slice(0, 500));
    } catch {
      setStatus('error');
      setError('No pudimos leer el portapapeles. Mantén presionado el campo y elige «Pegar».');
    }
  };

  const useCurrentLocation = () => {
    setIsLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(`https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setStatus('error');
        setError('No pudimos obtener tu ubicación. Pega un enlace o escribe la dirección.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetForm = () => {
    setSpotName('');
    setCity('');
    setLocation('');
    setReason('');
    setWebsite('');
    goTo(0);
  };

  const primaryLabel = isLoading
    ? 'ENVIANDO...'
    : isLastStep
      ? <>SUBIR A BRUUK <Send size={18} aria-hidden="true" /></>
      : step === 'location' && !location.trim()
        ? <>OMITIR <ArrowRight size={18} aria-hidden="true" /></>
        : <>SIGUIENTE <ArrowRight size={18} aria-hidden="true" /></>;

  return (
    <div className="submit-spot-page">
      <header className="submit-spot-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <span>/ APORTA AL MAPA</span>
        <Link to="/"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>
      </header>

      <main className="submit-spot-main">
        <section className="submit-spot-copy" aria-labelledby="submit-spot-title">
          <span className="submit-spot-kicker">/ NO IMPORTA LA CIUDAD</span>
          <h1 id="submit-spot-title">¿TE GUSTA UN SPOT? <em>SÚBELO.</em></h1>
          <p>Toma menos de un minuto. Lo revisamos antes de publicarlo: aquí no entran rankings pagados.</p>
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
              <p>Gracias por compartir <strong>{spotName.trim()}</strong>. Lo revisaremos con calma antes de sumarlo a Bruuk.</p>
              <button type="button" onClick={resetForm}>SUBIR OTRO SPOT <ArrowRight size={17} aria-hidden="true" /></button>
              <Link className="submit-spot-success-link" to="/guadalajara">Explorar Bruuk</Link>
            </div>
          ) : (
            <form className="spot-step-form" onSubmit={handleNext} noValidate>
              <div className="spot-step-top">
                <span>PASO {stepIndex + 1} DE {STEPS.length}</span>
                <div className="spot-step-bar" aria-hidden="true">
                  <i style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
                </div>
              </div>

              <div className="spot-step-body" key={step}>
                <label className="spot-step-question" htmlFor={`spot-${step}`}>{STEP_COPY[step].question}</label>
                <p className="spot-step-helper">{STEP_COPY[step].helper}</p>

                {step === 'spot' && (
                  <input id="spot-spot" ref={fieldRef} value={spotName} onChange={(event) => setSpotName(event.target.value)} placeholder="Nombre del lugar" maxLength={120} autoCapitalize="words" enterKeyHint="next" disabled={isLoading} />
                )}

                {step === 'city' && (
                  <>
                    <input id="spot-city" ref={fieldRef} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Escribe la ciudad" maxLength={100} autoComplete="address-level2" autoCapitalize="words" enterKeyHint="next" disabled={isLoading} />
                    <div className="spot-step-chips" role="group" aria-label="Ciudades frecuentes">
                      {CITY_SHORTCUTS.map((option) => (
                        <button key={option} type="button" className={city === option ? 'is-active' : ''} aria-pressed={city === option} onClick={() => { setCity(option); setError(''); }}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 'location' && (
                  <>
                    <input id="spot-location" ref={fieldRef} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Enlace o dirección" maxLength={500} inputMode="url" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" disabled={isLoading} />
                    {(canLocate || canPaste) && (
                      <div className="spot-step-tools">
                        {canLocate && (
                          <button type="button" onClick={useCurrentLocation} disabled={isLocating || isLoading}>
                            <LocateFixed size={18} aria-hidden="true" /> {isLocating ? 'UBICANDO...' : 'ESTOY AHÍ AHORA'}
                          </button>
                        )}
                        {canPaste && (
                          <button type="button" onClick={pasteLocation} disabled={isLoading}>
                            <ClipboardPaste size={18} aria-hidden="true" /> PEGAR ENLACE
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {step === 'reason' && (
                  <>
                    <textarea id="spot-reason" ref={fieldRef} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. El pan francés es increíble y la terraza es perfecta por la mañana." maxLength={1200} autoCapitalize="sentences" disabled={isLoading} />
                    <span className="spot-step-count" aria-live="polite">{reason.trim().length < 10 ? `Mínimo 10 caracteres · ${reason.trim().length}/10` : `${reason.length}/1200`}</span>
                  </>
                )}

                {step === 'email' && (
                  <>
                    <input id="spot-email" ref={fieldRef} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" maxLength={180} enterKeyHint="send" disabled={isLoading} />
                    <p className="spot-step-summary"><b>{spotName.trim()}</b> · {city.trim()}</p>
                  </>
                )}
              </div>

              <div className="submit-spot-trap" aria-hidden="true"><label htmlFor="spot-website">Sitio web</label><input id="spot-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div>

              {status === 'error' && error && <p className="submit-spot-error" role="alert">{error}</p>}

              <div className="spot-step-actions">
                {stepIndex > 0 && (
                  <button type="button" className="spot-step-back" onClick={() => goTo(stepIndex - 1)} disabled={isLoading} aria-label="Paso anterior">
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                )}
                <button className="submit-spot-button" type="submit" disabled={isLoading || isLocating}>{primaryLabel}</button>
              </div>
              {isLastStep && <p className="submit-spot-privacy">Al enviarlo aceptas que Bruuk revise la recomendación. Tu correo nunca se publica.</p>}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default SubmitSpotPage;
