import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Dices } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { IS_APP_MODE } from '../lib/appMode';
import { BruukLogo } from '../components/BruukLogo';
import { RegistrationModal } from '../components/RegistrationModal';
import './EventsPage.css';

const FORMATS = [
  { number: '01', title: 'Pocos lugares', copy: 'Grupos chicos, para que sí se pueda platicar.' },
  { number: '02', title: 'Spots de la guía', copy: 'Cada encuentro pasa en un lugar que ya recomendamos.' },
  { number: '03', title: 'Sin pantalla', copy: 'El plan es estar ahí, no grabarlo.' },
];

export default function EventsPage() {
  const { city } = useParams();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  if (city !== 'guadalajara') return <Navigate to="/guadalajara/eventos" replace />;

  return (
    <div className="events-page">
      <header className="events-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        {/* En la app Eventos es una pestaña: título en vez de "regresar" */}
        {IS_APP_MODE ? <span className="app-screen-title">/ EVENTOS</span> : <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>}
      </header>

      <main className="events-main">
        <span className="events-kicker">/ BRUUK EVENTOS · GDL</span>
        <h1>ENCUENTROS<br />EN PERSONA.</h1>
        <span className="events-soon">PRÓXIMAMENTE</span>
        <p className="events-lead">Estamos armando eventos de Bruuk en Guadalajara: planes reales con gente real. Cuando abramos el primero, la comunidad de Radar se entera antes.</p>

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
            <Dices size={18} aria-hidden="true" /> MIENTRAS, GIRA UN PLAN <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>

      <RegistrationModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}
