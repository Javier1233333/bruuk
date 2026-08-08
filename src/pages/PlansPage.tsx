import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CityNav } from '../components/CityNav';
import { getManagedEvents, type CommunityEvent } from '../data/communityEvents';
import './Plans.css';

const statusLabel: Record<CommunityEvent['status'], string> = {
  open: 'REGISTRO ABIERTO',
  limited: 'CUPO LIMITADO',
  'sold-out': 'CUPO COMPLETO',
};

export default function PlansPage() {
  const { city = 'guadalajara' } = useParams();
  const plansPath = `/${city}/planes`;
  const [events, setEvents] = useState(() => getManagedEvents().filter((event) => event.published !== false));

  useEffect(() => {
    const refresh = () => setEvents(getManagedEvents().filter((event) => event.published !== false));
    window.addEventListener('bruuk-events-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('bruuk-events-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (city !== 'guadalajara') return <Navigate to="/guadalajara/planes" replace />;

  return (
    <div className="plans-page">
      <CityNav active="planes" />
      <main>
        <section className="plans-hero" aria-labelledby="plans-title">
          <div className="plans-shell plans-hero-grid">
            <div>
              <span className="plans-eyebrow">/ BRUUK PLANES · GDL</span>
              <h1 id="plans-title">MENOS CHAT.<br />MÁS PLAN.</h1>
            </div>
            <div className="plans-hero-copy">
              <p>Encuentros pequeños, lugares reales y una razón concreta para salir.</p>
              <span>{events.length} PRÓXIMOS EVENTOS</span>
            </div>
          </div>
        </section>

        <section className="plans-list-section" aria-labelledby="upcoming-title">
          <div className="plans-shell">
            <header className="plans-section-heading">
              <span>/ CALENDARIO</span>
              <h2 id="upcoming-title">PRÓXIMOS PLANES</h2>
            </header>
            <div className="plans-grid">
              {events.map((event, index) => (
                <article className="plan-card" key={event.slug} style={{ '--plan-accent': event.accent } as CSSProperties}>
                  <Link to={`${plansPath}/${event.slug}`} className="plan-card-image" aria-label={`Ver ${event.title}`}>
                    <img src={event.image} alt={event.imageAlt} width="720" height="540" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </Link>
                  <div className="plan-card-body">
                    <div className="plan-card-status"><span aria-hidden="true" />{statusLabel[event.status]}</div>
                    <h3><Link to={`${plansPath}/${event.slug}`}>{event.title}</Link></h3>
                    <p>{event.summary}</p>
                    <dl>
                      <div><dt><CalendarDays size={16} aria-hidden="true" /> Fecha</dt><dd>{event.dateLabel} · {event.timeLabel}</dd></div>
                      <div><dt><MapPin size={16} aria-hidden="true" /> Lugar</dt><dd>{event.venue}</dd></div>
                      <div><dt><Users size={16} aria-hidden="true" /> Cupo</dt><dd>{event.capacity} personas</dd></div>
                    </dl>
                    <Link className="plans-button" to={`${plansPath}/${event.slug}`}>VER PLAN Y UNIRME <ArrowUpRight size={18} aria-hidden="true" /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="plans-host-banner">
          <div className="plans-shell plans-host-banner-inner">
            <Building2 size={34} aria-hidden="true" />
            <div><span>/ PARA COMERCIOS</span><h2>¿QUIERES HOSTEAR EL SIGUIENTE PLAN?</h2></div>
            <Link to="/para-lugares">CONOCER LA PROPUESTA <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
