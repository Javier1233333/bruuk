import { BruukLogo } from '../../components/BruukLogo';
import type { BruukEvent } from '../types/rack';
import './BruukEventAd.css';

interface BruukEventAdProps {
  variant: 'centered' | 'lateral' | 'banner';
  event: BruukEvent;
  title?: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  ctaLabel?: string;
}

export function BruukEventAd({
  variant,
  event,
  title,
  subtitle,
  description,
  tag,
  ctaLabel = 'VER MÁS →',
}: BruukEventAdProps) {
  const displayTitle    = title    ?? event.title.toUpperCase();
  const displaySubtitle = subtitle ?? event.date + ' · ' + event.location;
  const displayTag      = tag      ?? (variant === 'banner' ? 'EVENTO' : 'BRUUK');

  const handleCta = () => {
    window.location.href = event.link;
  };

  if (variant === 'centered') {
    return (
      <div className="rack-event-ad rack-event-ad--centered">
        <div className="rack-event-ad__centered-inner">
          <BruukLogo width={80} className="rack-event-ad__logo" />
          <h3 className="rack-event-ad__title">{displayTitle}</h3>
          <p className="rack-event-ad__subtitle">{displaySubtitle}</p>
          <button className="rack-event-ad__btn rack-event-ad__btn--indigo" onClick={handleCta}>
            {ctaLabel}
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'lateral') {
    return (
      <div className="rack-event-ad rack-event-ad--lateral">
        <span className="rack-event-ad__tag">{displayTag}</span>
        <h3 className="rack-event-ad__title">{displayTitle}</h3>
        {description && (
          <p className="rack-event-ad__description">{description}</p>
        )}
        {!description && (
          <p className="rack-event-ad__description">{displaySubtitle}</p>
        )}
        <button className="rack-event-ad__btn rack-event-ad__btn--amber" onClick={handleCta}>
          {ctaLabel}
        </button>
      </div>
    );
  }

  // variant === 'banner'
  return (
    <div className="rack-event-ad rack-event-ad--banner">
      <div className="rack-event-ad__banner-left">
        <span className="rack-event-ad__tag rack-event-ad__tag--indigo">{displayTag}</span>
        <h3 className="rack-event-ad__title">{displayTitle}</h3>
        <p className="rack-event-ad__date">{event.date} · {event.location}</p>
      </div>
      <div className="rack-event-ad__banner-right">
        <BruukLogo width={60} className="rack-event-ad__logo" />
      </div>
    </div>
  );
}
