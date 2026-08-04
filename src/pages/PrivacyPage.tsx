import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="spots-scroll-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="spots-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="spots-header-inner">
          <button className="spots-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} strokeWidth={2.5} />
            Inicio
          </button>
          <div className="spots-header-logo">
            <BruukLogo />
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', zIndex: 10 }}>
        <span className="spots-eyebrow" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>Legal</span>
        <h1 className="spots-title brand-gradient-text" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '3rem' }}>
          Aviso de Privacidad
        </h1>

        <div style={{
          background: '#ffffff',
          color: '#000000',
          border: '2px solid #000000',
          boxShadow: '8px 8px 0px #8b7cf6',
          padding: '2.5rem',
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: '1.7',
          fontSize: '0.95rem'
        }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Última actualización: Julio 2026</p>

          <p>
            En <strong>BRUUK</strong> ("nosotros"), nos tomamos muy en serio tu privacidad. Este aviso describe cómo manejamos tu información cuando usas nuestra plataforma y participas en nuestros eventos y comunidad.
          </p>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.3rem' }}>
            1. Información que recopilamos
          </h2>
          <p>
            Únicamente recopilamos los datos estrictamente necesarios para permitirte el acceso anticipado a la plataforma y coordinar tu asistencia a nuestros encuentros:
          </p>
          <ul>
            <li><strong>Información de registro:</strong> Correo electrónico que utilizas para crear tu cuenta y confirmar invitaciones.</li>
            <li><strong>Perfil básico:</strong> Nombre o alias opcional para que otros asistentes te reconozcan en las listas de eventos.</li>
          </ul>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.3rem' }}>
            2. Uso de los datos
          </h2>
          <p>
            Tus datos se utilizan con la única finalidad de:
          </p>
          <ul>
            <li>Administrar y validar tus invitaciones Vip.</li>
            <li>Mostrarte quién asistirá a cada evento (desglose de asistentes).</li>
            <li>Enviarte alertas importantes relacionadas con cambios de última hora en los planes del día.</li>
          </ul>
          <p><em>No vendemos, comercializamos, ni compartimos tu información personal con anunciantes ni terceros ajenos a BRUUK.</em></p>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.3rem' }}>
            3. Seguridad y almacenamiento
          </h2>
          <p>
            Protegemos los registros enviados desde nuestros formularios mediante
            servicios de infraestructura con controles de acceso y seguridad.
          </p>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.3rem' }}>
            4. Contacto y Derechos ARCO
          </h2>
          <p>
            Puedes rectificar o solicitar la eliminación total de tus datos en cualquier momento enviándonos un correo electrónico simple a: <a href="mailto:contacto@bruuk.space" style={{ color: '#8b7cf6', fontWeight: 'bold', textDecoration: 'none' }}>contacto@bruuk.space</a>. Tu solicitud será atendida en un plazo no mayor a 48 horas laborales.
          </p>
        </div>
      </main>

      <footer className="spots-footer">
        <div className="spots-footer-inner" style={{ maxWidth: '800px' }}>
          <p style={{ fontWeight: 'bold', margin: 0 }}>BRUUK</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>&copy; {new Date().getFullYear()} bruuk. Sin algoritmos.</p>
        </div>
      </footer>
    </div>
  );
}
export default PrivacyPage;
