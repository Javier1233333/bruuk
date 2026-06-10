import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { useRsvp } from '../hooks/useRsvp';
import { EventCard } from '../components/EventCard';
import { supabase } from '../../lib/supabase';
import './EventosTab.css';

interface OrderConfirmation {
  status: 'paid' | 'pending' | 'expired';
  event_id: string;
  amount_total: number;
  currency: string;
}

export function EventosTab() {
  const { events, loading, error, reload } = useEvents();
  const { rsvpedEventIds, rsvp, cancelRsvp } = useRsvp();
  const location = useLocation();

  // Eventos de pago ya adquiridos (por session_id en URL o cacheado)
  const [paidEventIds, setPaidEventIds] = useState<Set<string>>(new Set());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  // Detectar ?session_id= al retornar de Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return;

    fetch(`/api/app/event-orders?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.ok ? r.json() as Promise<OrderConfirmation> : null)
      .then((data) => {
        if (data) {
          setConfirmation(data);
          if (data.status === 'paid') {
            setPaidEventIds((prev) => new Set([...prev, data.event_id]));
            reload();
          }
        }
      })
      .catch(() => { /* silencioso */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleRsvp = async (eventId: string) => {
    setLoadingAction(eventId);
    setActionError(null);
    const result = await rsvp(eventId);
    if (!result.ok) setActionError(result.error ?? 'Error');
    else reload();
    setLoadingAction(null);
  };

  const handleCancelRsvp = async (eventId: string) => {
    setLoadingAction(eventId);
    setActionError(null);
    const result = await cancelRsvp(eventId);
    if (!result.ok) setActionError(result.error ?? 'Error');
    else reload();
    setLoadingAction(null);
  };

  const handleBuyTicket = async (eventId: string) => {
    setLoadingAction(eventId);
    setActionError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setActionError('No autenticado');
      setLoadingAction(null);
      return;
    }

    const res = await fetch('/api/app/event-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: eventId }),
    });

    if (res.ok) {
      const { url } = await res.json() as { url: string };
      window.location.assign(url);
      return; // no limpiar loading — la página cambia
    }

    const data = await res.json() as { error?: string; code?: string };
    if (data.code === 'full') {
      setActionError('El evento ya no tiene lugares disponibles.');
    } else if (data.code === 'stripe_not_configured') {
      setActionError('Los pagos aún no están configurados.');
    } else {
      setActionError(data.error ?? 'Error al iniciar el pago');
    }
    setLoadingAction(null);
  };

  return (
    <section className="eventos-tab">
      <span className="eventos-tab__tag">/ Eventos</span>
      <h2 className="eventos-tab__title">Pasa en tu ciudad.</h2>
      <div className="eventos-tab__separator" />

      {/* Confirmación de pago al regresar de Stripe */}
      {confirmation && (
        <div className="eventos-tab__confirmation">
          <p className="eventos-tab__confirmation-title">Registro de boleto</p>
          <p className="eventos-tab__confirmation-text">
            Total: ${(confirmation.amount_total / 100).toFixed(0)} {confirmation.currency}
          </p>
          <p
            className={`eventos-tab__confirmation-status ${
              confirmation.status === 'paid'
                ? 'eventos-tab__confirmation-status--paid'
                : 'eventos-tab__confirmation-status--pending'
            }`}
          >
            {confirmation.status === 'paid' ? 'BOLETO CONFIRMADO' : 'PAGO PENDIENTE'}
          </p>
        </div>
      )}

      {/* Error de acción */}
      {actionError && (
        <p style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 'var(--rack-font-label)',
          color: '#ff6b6b',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          {actionError}
        </p>
      )}

      {loading && <p className="eventos-tab__loading">CARGANDO EVENTOS...</p>}
      {!loading && error && <p className="eventos-tab__error">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="eventos-tab__empty">NO HAY EVENTOS PRÓXIMOS</p>
      )}

      {!loading && !error && events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          hasRsvp={rsvpedEventIds.has(event.id)}
          hasPaidTicket={paidEventIds.has(event.id)}
          onRsvp={() => handleRsvp(event.id)}
          onCancelRsvp={() => handleCancelRsvp(event.id)}
          onBuyTicket={() => handleBuyTicket(event.id)}
          loadingAction={loadingAction === event.id}
        />
      ))}
    </section>
  );
}
