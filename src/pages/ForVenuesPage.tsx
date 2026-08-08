import { ArrowLeft, ArrowUpRight, CalendarPlus, ChartNoAxesCombined, Link2, Settings2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import './Plans.css';

export default function ForVenuesPage() {
  return (
    <div className="plans-page venues-page">
      <header className="plans-header">
        <Link to="/guadalajara/planes" className="plans-header-back"><ArrowLeft size={18} aria-hidden="true" /> PLANES</Link>
        <Link to="/" className="plans-header-logo" aria-label="Ir al inicio de Bruuk"><BruukLogo width={112} /></Link>
        <nav aria-label="Navegación para lugares"><Link to="/guadalajara/planes">EVENTOS</Link><Link to="/admin/eventos"><Settings2 size={14} /> ADMIN</Link></nav>
      </header>
      <main>
        <section className="venues-hero">
          <div className="plans-shell venues-hero-grid">
            <div><span className="plans-eyebrow">/ HOSTEA UN COMMUNITY EVENT</span><h1>TU LUGAR.<br />NUESTRA<br />COMUNIDAD.</h1></div>
            <div><p>Bruuk diseña el plan, publica el enlace y reúne asistentes. Tu comercio recibe a una comunidad con una razón concreta para conocerte.</p><a href="mailto:contacto@bruuk.space?subject=Quiero hostear un Bruuk Plan" className="plans-button">PROPONER MI LUGAR <ArrowUpRight size={18} aria-hidden="true" /></a></div>
          </div>
        </section>
        <section className="venues-how plans-shell">
          <header className="plans-section-heading"><span>/ CÓMO FUNCIONA</span><h2>UN LINK. UN PLAN. GENTE REAL.</h2></header>
          <div className="venues-steps">
            <article><CalendarPlus size={28} aria-hidden="true" /><strong>01</strong><h3>DISEÑAMOS EL PLAN</h3><p>Definimos formato, fecha, cupo y experiencia junto con el comercio.</p></article>
            <article><Link2 size={28} aria-hidden="true" /><strong>02</strong><h3>PUBLICAMOS TU LINK</h3><p>Recibes una URL para compartir por Instagram, WhatsApp o tu propia comunidad.</p></article>
            <article><Users size={28} aria-hidden="true" /><strong>03</strong><h3>LA GENTE SE UNE</h3><p>Los asistentes se registran sin cuentas y llegan con la información necesaria.</p></article>
            <article><ChartNoAxesCombined size={28} aria-hidden="true" /><strong>04</strong><h3>MEDIMOS EL RESULTADO</h3><p>Entregamos lista de registros, asistencia y aprendizajes del evento.</p></article>
          </div>
        </section>
        <section className="venues-cta"><div className="plans-shell"><span>/ PRIMER EVENTO</span><h2>CONVIRTAMOS TU ESPACIO EN EL SIGUIENTE PUNTO DE ENCUENTRO.</h2><a href="mailto:contacto@bruuk.space?subject=Quiero hostear un Bruuk Plan&body=Nombre del lugar:%0ACiudad:%0ACapacidad aproximada:%0AIdea de evento:" className="plans-button">HABLAR CON BRUUK <ArrowUpRight size={18} aria-hidden="true" /></a></div></section>
      </main>
    </div>
  );
}
