import { X } from 'lucide-react';
import { BruukLogo } from './BruukLogo';
import './ComingSoonModal.css';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: () => void;
    onOpenPrivacy: () => void;
}

export function ComingSoonModal({ isOpen, onClose, onJoin, onOpenPrivacy }: ComingSoonModalProps) {
    if (!isOpen) return null;

    return (
        <div className="cs-overlay" onClick={onClose}>
            <div className="cs-content animate-fade-in" onClick={e => e.stopPropagation()}>
                <button className="cs-close" onClick={onClose} aria-label="Cerrar">
                    <X size={20} />
                </button>
                <BruukLogo width={140} />
                <h2 className="cs-title">Entra al Radar de Bruuk</h2>
                <p className="cs-sub">Regístrate para recibir notificaciones sobre nuevos spots locales curados en Guadalajara, aperturas especiales e invitaciones a nuestros eventos exclusivos.</p>
                <button className="cs-btn" onClick={onJoin}>
                    Unirse
                </button>
                <p className="cs-privacy" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '1.2rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                    Al registrarte, aceptas nuestro <a href="#" onClick={(e) => { e.preventDefault(); onOpenPrivacy(); }} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'underline' }}>Aviso de Privacidad</a>.
                </p>
            </div>
        </div>
    );
}
