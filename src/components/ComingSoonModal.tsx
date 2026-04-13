import { X } from 'lucide-react';
import { BruukLogo } from './BruukLogo';
import './ComingSoonModal.css';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: () => void;
}

export function ComingSoonModal({ isOpen, onClose, onJoin }: ComingSoonModalProps) {
    if (!isOpen) return null;

    return (
        <div className="cs-overlay" onClick={onClose}>
            <div className="cs-content animate-fade-in" onClick={e => e.stopPropagation()}>
                <button className="cs-close" onClick={onClose} aria-label="Cerrar">
                    <X size={20} />
                </button>
                <BruukLogo width={140} />
                <h2 className="cs-title">Seguimos trabajando en la mejor versión.</h2>
                <p className="cs-sub">Mientras tanto, organizamos eventos exclusivos para nuestra comunidad fundadora — antes de que la app salga al mundo.</p>
                <button className="cs-btn" onClick={onJoin}>
                    Únete al acceso VIP anticipado
                </button>
            </div>
        </div>
    );
}
