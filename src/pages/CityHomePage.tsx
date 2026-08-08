import { ArrowUpRight, Compass, Store } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CityNav } from '../components/CityNav';
import spotsData from '../data/spots.json';
import './CityHomePage.css';
import './CityHomeMobileFix.css';

export default function CityHomePage() {
  const { city } = useParams();
  if (city !== 'guadalajara') return <Navigate to="/guadalajara" replace />;
  const spotCount = (spotsData as Array<{ city: string }>).filter((spot) => spot.city === 'guadalajara').length;
  const rackCount = 46;

  return <div className="city-home">
    <CityNav />
    <main>
      <section className="city-home-hero">
        <div><span>/ BRUUK CITY EDITION 001</span><h1>GUADALAJARA.</h1></div>
        <p>Dos formas distintas de vivir la ciudad. Elige una sección para empezar.</p>
      </section>
      <section className="city-gateways" aria-label="Explorar Guadalajara">
        <Link to="/guadalajara/spots" className="city-gateway city-gateway-spots">
          <div className="city-gateway-number">01</div><Compass size={28} /><span>GUÍA GENERAL</span><h2>SPOTS</h2><p>Cafés, comida, bares y rincones curados de la ciudad.</p><strong>{spotCount} LUGARES <ArrowUpRight size={19} /></strong>
        </Link>
        <Link to="/guadalajara/rack" className="city-gateway city-gateway-rack">
          <div className="city-gateway-number">02</div><Store size={28} /><span>COLECCIÓN ESPECIALIZADA</span><h2>RACK</h2><p>Tiendas, antigüedades y tianguis con identidad propia.</p><strong>{rackCount} LUGARES <ArrowUpRight size={19} /></strong>
        </Link>
      </section>
      <footer className="city-home-footer"><span>BRUUK / GUADALAJARA / 2026</span></footer>
    </main>
  </div>;
}
