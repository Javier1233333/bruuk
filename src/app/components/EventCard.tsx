import { MapPin, Users, Check } from 'lucide-react';
import type { AppEvent } from '../hooks/useEvents';
import './EventCard.css';

interface EventCardProps {
  event: AppEvent;
  hasRsvp: boolean;
  hasPaidTicket: boolean;
  onRsvp: () => void;
  onCancelRsvp: () => void;
  onBuyTicket: () => void;
  loadingAction: boolean;
}

export function EventCard({
  event,
  hasRsvp,
  hasPaidTicket,
  onRsvp,
  onCancelRsvp,
  onBuyTicket,
  loadingAction,
}: EventCardProps) {
  const {
    title,
    description,
    date_label,
    location_text,
    category,
    category_color,
    capacity,
    capacity_remaining,
    price_mxn,
    is_free,
    is_full,
  } = event;

  const displayCount = capacity - capacity_remaining;

  return (
    <article
      className="event-card"
      style={{ borderTop: `3px solid ${category_color}` }}
    >
      {/* Header: chip + fecha */}
      <div className="event-card__header">
        <span
          className="event-card__category-badge"
          style={{ backgroundColor: category_color }}
        >
          {category}
        </span>
        <span className="event-card__date">{date_label}</span>
      </div>

      {/* Título */}
      <h3 className="event-card__title">{title}</h3>

      {/* Descripción */}
      {description && (
        <p className="event-card__description">{description}</p>
      )}

      <div className="event-card__separator" />

      {/* Metadata */}
      <div className="event-card__meta">
        <div className="event-card__meta-row">
          <MapPin size={13} />
          <span>{location_text}</span>
        </div>
        <div
          className={`event-card__capacity ${
            is_full ? 'event-card__capacity--full' : 'event-card__capacity--available'
          }`}
        >
          <Users size={13} />
          <span>
            {displayCount}/{capacity}{' '}
            {is_full ? '— AGOTADO' : `— QUEDAN ${capacity_remaining} LUGARES`}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="event-card__actions">
        {is_free ? (
          <>
            {hasRsvp ? (
              <>
                <button
                  className="event-card__btn-action event-card__btn-action--secondary"
                  disabled
                >
                  <Check size={14} />
                  ASISTIENDO
                </button>
                <button
                  className="event-card__cancel-link"
                  onClick={onCancelRsvp}
                  disabled={loadingAction}
                >
                  CANCELAR
                </button>
              </>
            ) : (
              <>
                <button
                  className="event-card__btn-action event-card__btn-action--primary"
                  onClick={onRsvp}
                  disabled={loadingAction || is_full}
                >
                  {loadingAction ? 'UN MOMENTO...' : 'ASISTIR'}
                </button>
                <span className="event-card__price-label">GRATIS</span>
              </>
            )}
          </>
        ) : (
          <>
            {hasPaidTicket ? (
              <button
                className="event-card__btn-action event-card__btn-action--secondary"
                disabled
              >
                <Check size={14} />
                BOLETO ADQUIRIDO
              </button>
            ) : (
              <>
                <button
                  className="event-card__btn-action event-card__btn-action--primary"
                  onClick={onBuyTicket}
                  disabled={loadingAction || is_full}
                >
                  {loadingAction ? 'UN MOMENTO...' : 'COMPRAR BOLETO'}
                </button>
                <span className="event-card__price-label">${price_mxn}</span>
              </>
            )}
          </>
        )}
      </div>
    </article>
  );
}
