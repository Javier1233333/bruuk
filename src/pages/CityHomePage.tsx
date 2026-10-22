import { ArrowUpRight, CalendarDays, Compass, Dices, Lock, Radio, Store, type LucideIcon } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AsciiDiscoveryBackground } from '../components/AsciiDiscoveryBackground';
import { CityNav } from '../components/CityNav';
import { useSpots } from '../lib/useSpots';
import { IS_APP_MODE } from '../lib/appMode';
import { hasSignedIn } from '../lib/appSession';
import './CityHomePage.css';

type Section = {
  to: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  meta?: string;
  // Spots y Rack son libres; lo demás pide iniciar sesión
  free?: boolean;
};

export default function CityHomePage() {
  const { city } = useParams();
  const allSpots = useSpots();
  if (city !== 'guadalajara') return <Navigate to="/guadalajara" replace />;
  // En el modo app, Inicio es Comer y tomar.
  if (IS_APP_MODE) return <Navigate to="/guadalajara/spots" replace />;
  const spotCount = (allSpots as Array<{ city: string }>).filter((spot) => spot.city === 'guadalajara').length;
  const rackCount = 46;
  const signedIn = hasSignedIn();
  const sections: Section[] = [
    { to: '/guadalajara/spots', title: 'Comer y tomar', copy: 'Cafés, comida y bares elegidos a mano.', icon: Compass, meta: `${spotCount} lugares`, free: true },
    { to: '/guadalajara/rack', title: 'Vintage y tianguis', copy: 'Ropa, objetos y mercados con historia.', icon: Store, meta: `${rackCount} lugares`, free: true },
    { to: '/guadalajara/senales', title: 'Planes y rutas', copy: 'Lo que está por pasar en la ciudad.', icon: Radio },
    { to: '/guadalajara/arma-tu-plan', title: 'Arma tu plan', copy: 'Gira la ruleta y sal hoy.', icon: Dices },
    { to: '/guadalajara/eventos', title: 'Eventos', copy: 'Encuentros en persona. Próximamente.', icon: CalendarDays },
  ];

  return (
    <div className="city-home">
      <CityNav />
      <AsciiDiscoveryBackground />
      {/* Todo en una pantalla: nadie tiene que deslizar para ver las secciones */}
      <main className="city-menu">
        <header className="city-menu-heading">
          <span>/ GUADALAJARA</span>
          <h1>¿Qué quieres descubrir hoy?</h1>
        </header>

        <nav className="city-menu-grid" aria-label="Secciones de Bruuk">
          {sections.map(({ to, title, copy, icon: Icon, meta, free }) => {
            const locked = !free && !signedIn;
            return (
              <Link key={to} to={to} className={`city-menu-item ${free ? 'is-main' : ''}`}>
                <span className="city-menu-icon"><Icon size={free ? 24 : 20} strokeWidth={1.9} aria-hidden="true" /></span>
                <span className="city-menu-copy">
                  <strong>{title}</strong>
                  <span>{copy}</span>
                </span>
                <span className="city-menu-meta">
                  {locked
                    ? <><Lock size={13} strokeWidth={2.4} aria-hidden="true" /> CON CUENTA</>
                    : <>{meta && <em>{meta}</em>}<ArrowUpRight size={18} aria-hidden="true" /></>}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
