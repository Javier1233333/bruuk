import { ArrowUpRight, Compass, Store } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CityNav } from '../components/CityNav';
import spotsData from '../data/spots.json';
import './CityHomePage.css';

export default function CityHomePage() {
  const { city } = useParams();
  if (city !== 'guadalajara') return <Navigate to="/guadalajara" replace />;
  const spotCount = (spotsData as Array<{ city: string }>).filter((spot) => spot.city === 'guadalajara').length;
  const rackCount = 46;

  return (
    <div className="city-home">
      <CityNav />
      <main>
        <section className="city-home-hero" aria-labelledby="city-home-title">
          <div className="city-home-hero-copy">
            <span className="city-home-kicker">/ BRUUK · CITY EDITION 001</span>
            <h1
              id="city-home-title"
              className="brand-gradient-text animate-glitch-loop glitch-hover"
              data-text="GUADALAJARA."
            >
              GUADALA—<br />JARA.
            </h1>
          </div>
          <div className="city-home-hero-note">
            <span>20.6597° N · 103.3496° O</span>
            <p>Una ciudad seleccionada por personas, no por algoritmos. Elige cómo quieres recorrerla.</p>
          </div>
          <div className="city-home-hero-stamp" aria-hidden="true">
            <strong>GDL</strong><span>2026 / 001</span>
          </div>
        </section>

        <section className="city-index" aria-labelledby="city-index-title">
          <header className="city-index-heading">
            <span>/ DIRECTORIO DE CIUDAD</span>
            <h2 id="city-index-title">ELIGE TU<br />FORMA DE SALIR.</h2>
            <p>Dos puertas, la misma ciudad. Empieza por lo que buscas hoy.</p>
          </header>

          <nav className="city-gateways" aria-label="Explorar Guadalajara">
            <Link to="/guadalajara/spots" className="city-gateway city-gateway-spots">
              <div className="city-gateway-number">01</div>
              <div className="city-gateway-icon"><Compass size={27} strokeWidth={1.8} /></div>
              <div className="city-gateway-copy">
                <span>GUÍA GENERAL · PARA EMPEZAR</span>
                <h3>SPOTS</h3>
                <p>Cafés, comida, bares y rincones elegidos para descubrir Guadalajara sin perderte en el feed.</p>
              </div>
              <div className="city-gateway-action">
                <span>{spotCount} LUGARES</span>
                <strong>EXPLORAR <ArrowUpRight size={22} /></strong>
              </div>
            </Link>

            <Link to="/guadalajara/rack" className="city-gateway city-gateway-rack" aria-label="Explorar Rack: Vintage">
              <div className="city-gateway-number">02</div>
              <div className="city-gateway-icon"><Store size={27} strokeWidth={1.8} /></div>
              <div className="city-gateway-copy">
                <span>COLECCIÓN ESPECIALIZADA · RACK</span>
                <h3>VINTAGE</h3>
                <p>Tiendas, archivo, antigüedades y tianguis para encontrar piezas y lugares con historia propia.</p>
              </div>
              <div className="city-gateway-action">
                <span>{rackCount} LUGARES</span>
                <strong>EXPLORAR <ArrowUpRight size={22} /></strong>
              </div>
            </Link>
          </nav>
        </section>

        <footer className="city-home-footer">
          <span>BRUUK / GUADALAJARA / 2026</span>
          <span>MENOS PANTALLA · MÁS MUNDO</span>
        </footer>
      </main>
    </div>
  );
}
