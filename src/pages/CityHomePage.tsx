import { ArrowUpRight, Compass, Radio, Store } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AsciiDiscoveryBackground } from '../components/AsciiDiscoveryBackground';
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
      <AsciiDiscoveryBackground />
      <main>
        <section className="city-index" aria-labelledby="city-index-title">
          <header className="city-index-heading">
            <span>/ ELIGE UNA CATEGORÍA</span>
            <h2 id="city-index-title">¿QUÉ QUIERES DESCUBRIR HOY?</h2>
            <p>Elige una categoría con un toque.</p>
          </header>

          <nav className="city-gateways" aria-label="Categorías para descubrir">
            <Link to="/guadalajara/spots" className="city-gateway city-gateway-spots">
              <div className="city-gateway-number">01</div>
              <div className="city-gateway-icon"><Compass size={27} strokeWidth={1.8} /></div>
              <div className="city-gateway-copy">
                <span>SPOTS · CAFÉS, COMIDA Y NOCHE</span>
                <h3>COMER Y TOMAR</h3>
                <p>Cafés, comida, bares y rincones elegidos para encontrar un plan sin perderte en el feed.</p>
              </div>
              <div className="city-gateway-action">
                <span>{spotCount} LUGARES</span>
                <strong>EXPLORAR <ArrowUpRight size={22} /></strong>
              </div>
            </Link>
            <Link to="/guadalajara/rack" className="city-gateway city-gateway-rack">
              <div className="city-gateway-number">02</div>
              <div className="city-gateway-icon"><Store size={27} strokeWidth={1.8} /></div>
              <div className="city-gateway-copy">
                <span>RACK · ROPA, OBJETOS Y MERCADOS</span>
                <h3>VINTAGE Y TIANGUIS</h3>
                <p>Moda, tianguis, antigüedades y objetos para encontrar piezas y lugares con historia propia.</p>
              </div>
              <div className="city-gateway-action">
                <span>{rackCount} LUGARES</span>
                <strong>EXPLORAR <ArrowUpRight size={22} /></strong>
              </div>
            </Link>
            <Link to="/guadalajara/senales" className="city-gateway city-gateway-plans">
              <div className="city-gateway-number">03</div>
              <div className="city-gateway-icon"><Radio size={27} strokeWidth={1.8} /></div>
              <div className="city-gateway-copy">
                <span>SEÑALES · LO QUE ESTÁ PASANDO</span>
                <h3>PLANES Y RUTAS</h3>
                <p>Planes, eventos, aperturas y cosas que están por pasar en la ciudad.</p>
              </div>
              <div className="city-gateway-action">
                <span>3 PLANES</span>
                <strong>EXPLORAR <ArrowUpRight size={22} /></strong>
              </div>
            </Link>
          </nav>
        </section>

        <footer className="city-home-footer">
          <span>BRUUK / 2026</span>
          <span>MENOS PANTALLA · MÁS MUNDO</span>
        </footer>
      </main>
    </div>
  );
}
