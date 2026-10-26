import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, ChevronLeft, Dices } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { IS_APP_MODE } from '../lib/appMode';
import { BruukLogo } from '../components/BruukLogo';
import { RegistrationModal } from '../components/RegistrationModal';
import './EventsPage.css';

const FORMATS = [
  { number: '01', title: 'Pocos lugares', copy: 'Grupos chicos para platicar.' },
  { number: '02', title: 'Spots de la guía', copy: 'En lugares que ya recomendamos.' },
  { number: '03', title: 'Sin pantalla', copy: 'Estar ahí, no grabarlo.' },
];

export default function EventsPage() {
  const { city } = useParams();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  if (city !== 'guadalajara') return <Navigate to="/guadalajara/eventos" replace />;

  return (
    <div className="events-page">
      <header className="events-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        {/* En la app Eventos se abre desde el encabezado (ya no es pestaña): regresa al inicio */}
        {IS_APP_MODE ? <Link to="/guadalajara/spots"><ChevronLeft size={17} aria-hidden="true" /> INICIO</Link> : <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>}
      </header>

      <main className="events-main">
        {/* Todo en una pantalla: textos de una línea, sin deslizar */}
        <div className="events-top">
          <span className="events-kicker">/ BRUUK EVENTOS · GDL</span>
          <span className="events-soon">PRÓXIMAMENTE</span>
        </div>
        <h1>ENCUENTROS<br />EN PERSONA.</h1>
        <p className="events-lead">Planes reales con gente real. Te avisamos cuando abramos el primero.</p>

        <ol className="events-formats">
          {FORMATS.map((format) => (
            <li key={format.number}>
              <b>{format.number}</b>
              <div><strong>{format.title}</strong><p>{format.copy}</p></div>
            </li>
          ))}
        </ol>

        <div className="events-actions">
          <button type="button" className="events-primary" onClick={() => setIsJoinOpen(true)}>
            <Bell size={18} aria-hidden="true" /> AVÍSAME
          </button>
          <Link className="events-secondary" to="/guadalajara/arma-tu-plan">
            <Dices size={18} aria-hidden="true" /> GIRA UN PLAN <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>

      <RegistrationModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}
