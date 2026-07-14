import { X } from 'lucide-react';
import './PrivacyModal.css';

interface UsagePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UsagePolicyModal({ isOpen, onClose }: UsagePolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="privacy-modal-overlay" onClick={onClose}>
      <div className="privacy-modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="privacy-close-btn" onClick={onClose} aria-label="Cerrar políticas de uso">
          <X size={32} />
        </button>

        <div className="privacy-modal-bg-text">BRUUK</div>

        <div className="privacy-modal-inner">
          <span className="privacy-eyebrow">COMUNIDAD</span>
          <h2 className="privacy-lead">Políticas de uso</h2>

          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', lineHeight: '1.7', color: '#ffffff', textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '1.5rem' }}>Última actualización: Julio 2026</p>

            <p>BRUUK es una guía creada para descubrir lugares y vivir la ciudad. Al usarla, aceptas que las recomendaciones son una referencia y que cada visita es una decisión personal.</p>

            <h3 style={headingStyle}>1. Visitar spots</h3>
            <p>La experiencia en cada spot depende del lugar, su equipo, aforo, clima, horarios y de cada visitante. BRUUK no opera ni controla los establecimientos recomendados, por lo que no garantiza disponibilidad, precios, calidad del servicio, accesibilidad, seguridad ni que la experiencia de una persona sea igual a la de otra.</p>
            <p>Antes de visitar un spot, te corresponde verificar horarios, reservaciones, costos, requisitos de acceso, restricciones de edad y cualquier condición relevante directamente con el establecimiento.</p>

            <h3 style={headingStyle}>2. Responsabilidad individual</h3>
            <p>Al desplazarte o participar en actividades relacionadas con los spots, actúas bajo tu propia responsabilidad. Cuida tu seguridad, tus pertenencias y a las personas con quienes compartes el espacio. En la medida permitida por la legislación aplicable, BRUUK no se hace responsable por incidentes, pérdidas, daños, lesiones, cancelaciones o situaciones que ocurran durante o a causa de una visita a un spot.</p>

            <h3 style={headingStyle}>3. Información de la comunidad</h3>
            <p>Las recomendaciones y aportaciones de Bruukos reflejan perspectivas personales. Procuramos mantener la información actualizada, pero puede cambiar sin previo aviso. Si detectas datos incorrectos o un lugar que ya no representa los valores de la comunidad, escríbenos para revisarlo.</p>

            <h3 style={headingStyle}>4. Convivencia</h3>
            <p>Usa BRUUK con respeto hacia los lugares, sus equipos y la comunidad. No toleramos acoso, discriminación, actividades ilegales ni el uso de la plataforma para perjudicar a otras personas o negocios.</p>

            <h3 style={headingStyle}>5. Contacto</h3>
            <p>Para reportar información, hacer una pregunta o compartir una inquietud sobre estas políticas, contáctanos en <a href="mailto:contacto@bruuk.space" style={{ color: 'var(--accent-light)', fontWeight: 'bold', textDecoration: 'none' }}>contacto@bruuk.space</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const headingStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 900,
  textTransform: 'uppercase' as const,
  fontSize: '1.2rem',
  marginTop: '2rem',
  marginBottom: '0.8rem',
  color: '#ffffff',
  borderBottom: '2px solid #ffffff',
  paddingBottom: '0.3rem',
};
