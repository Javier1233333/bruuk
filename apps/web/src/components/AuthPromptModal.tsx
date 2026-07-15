import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AuthPromptModal.css';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  action?: string;
}

export default function AuthPromptModal({ 
  isOpen, 
  onClose, 
  message = "Únete a nuestra comunidad para continuar",
  action = "Iniciar Sesión / Registrarse"
}: AuthPromptModalProps) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-prompt-backdrop" onClick={onClose}>
        <motion.div 
          className="auth-prompt-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="auth-prompt-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="auth-prompt-content">
            <h2 className="auth-prompt-title">¡Hola! 👋</h2>
            <p className="auth-prompt-desc">{message}</p>
            
            <button 
              className="auth-prompt-btn"
              onClick={() => {
                onClose();
                navigate('/login', { state: { from: location } });
              }}
            >
              <LogIn size={18} /> {action}
            </button>
            <button className="auth-prompt-cancel" onClick={onClose}>
              Seguir explorando
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
