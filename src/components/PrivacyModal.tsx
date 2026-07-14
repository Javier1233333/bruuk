import { X } from 'lucide-react';
import './PrivacyModal.css';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="privacy-modal-overlay" onClick={onClose}>
      <div className="privacy-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="privacy-close-btn" onClick={onClose} aria-label="Cerrar modal">
          <X size={32} />
        </button>

        <div className="privacy-modal-bg-text">BRUUK</div>

        <div className="privacy-modal-inner">
          <span className="privacy-eyebrow">LEGAL</span>
          <h2 className="privacy-lead">Aviso de Privacidad</h2>
          
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', lineHeight: '1.7', color: '#ffffff', textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '1.5rem' }}>Última actualización: Julio 2026</p>

            <p>
              En <strong>BRUUK</strong> ("nosotros"), nos tomamos muy en serio tu privacidad. Este aviso describe cómo manejamos tu información cuando usas nuestra plataforma y participas en nuestra comunidad.
            </p>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#ffffff', borderBottom: '2px solid #ffffff', paddingBottom: '0.3rem' }}>
              1. Información que recopilamos
            </h3>
            <p>
              Únicamente recopilamos los datos estrictamente necesarios para permitirte el acceso anticipado a la plataforma y coordinar tu cuenta:
            </p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0.8rem 0' }}>
              <li><strong>Información de registro:</strong> Correo electrónico que utilizas para crear tu cuenta y confirmar accesos.</li>
              <li><strong>Perfil básico:</strong> Nombre o alias opcional para que otros usuarios te reconozcan en la comunidad.</li>
              <li><strong>Registro para ser Bruuko:</strong> Si completas el formulario “Tu ciudad necesita Bruuk”, recopilamos tu correo electrónico y la ciudad que seleccionas o escribes.</li>
            </ul>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#ffffff', borderBottom: '2px solid #ffffff', paddingBottom: '0.3rem' }}>
              2. Uso de los datos
            </h3>
            <p>
              Tus datos se utilizan con la única finalidad de:
            </p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0.8rem 0' }}>
              <li>Administrar y validar tus invitaciones VIP a la comunidad.</li>
              <li>Mostrarte quién forma parte de la comunidad.</li>
              <li>Enviarte alertas importantes relacionadas con cambios de última hora en los spots del día.</li>
              <li>Enviarte actualizaciones, novedades e información sobre lo nuevo en BRUUK en general.</li>
              <li><strong>Coordinar la red de Bruukos:</strong> Identificar ciudades con interés, evaluar dónde expandir BRUUK y contactarte sobre oportunidades para compartir tus rincones favoritos, participar en la comunidad local o activar experiencias en tu ciudad.</li>
            </ul>
            <p>La ciudad que compartes para ser Bruuko se usa únicamente para organizar y expandir la comunidad. No publicamos tu correo ni tu información de contacto.</p>
            <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>No vendemos, comercializamos, ni compartimos tu información personal con anunciantes ni terceros ajenos a BRUUK.</p>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#ffffff', borderBottom: '2px solid #ffffff', paddingBottom: '0.3rem' }}>
              3. Seguridad y almacenamiento
            </h3>
            <p>
              Utilizamos servicios de infraestructura modernos y seguros (como Supabase) para el resguardo de las credenciales de ingreso y los registros correspondientes.
            </p>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#ffffff', borderBottom: '2px solid #ffffff', paddingBottom: '0.3rem' }}>
              4. Contacto y Derechos ARCO
            </h3>
            <p>
              Puedes rectificar o solicitar la eliminación total de tus datos en cualquier momento enviándonos un correo simple a: <a href="mailto:contacto@bruuk.space" style={{ color: 'var(--accent-light)', fontWeight: 'bold', textDecoration: 'none' }}>contacto@bruuk.space</a>. Tu solicitud será atendida en un plazo no mayor a 48 horas laborales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
