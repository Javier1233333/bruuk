import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { authService } from '@bruuk/shared-logic/services';
import { BruukLogo } from '../components/BruukLogo';
import './LoginPage.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: resetErr } = await authService.requestPasswordReset(email);
      if (resetErr) {
        setError(resetErr.message || 'Ocurrió un error al enviar el correo de recuperación.');
      } else {
        setSuccessMsg('¡Enlace enviado! Revisa tu correo electrónico para restablecer tu contraseña.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>

      <div className="login-container animate-fade-in">
        <button className="login-close-mobile" onClick={handleBack} aria-label="Volver">
          <X size={24} />
        </button>

        <Link to="/" className="login-logo">
          <BruukLogo />
        </Link>

        <div className="login-card">
          {successMsg ? (
            <div className="login-success-card animate-fade-in" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>📧</div>
              <h1 className="login-title brand-gradient-text" style={{ marginBottom: '1rem', textTransform: 'uppercase' }}>¡Correo Enviado!</h1>
              <p className="login-subtitle" style={{ marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                Te hemos enviado un enlace de recuperación a <strong>{email}</strong>.<br /><br />
                Por favor, abre el enlace en ese correo para poder restablecer tu contraseña.
              </p>
              <button 
                type="button"
                onClick={() => navigate('/login')} 
                className="btn btn-primary w-full"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              <h1 className="login-title brand-gradient-text">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="login-subtitle">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label htmlFor="email">Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Enviando...' : (
                    <>
                      Enviar enlace
                      <ArrowRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to="/login" style={{ fontSize: '0.85rem', color: '#a6a6a6', textDecoration: 'none', fontWeight: 600 }}>
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
