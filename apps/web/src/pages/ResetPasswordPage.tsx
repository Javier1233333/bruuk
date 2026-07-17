import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { authService } from '@bruuk/shared-logic/services';
import { BruukLogo } from '../components/BruukLogo';
import { validatePassword } from '../lib/authValidation';
import './LoginPage.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Validate password security requirements (standard rules)
    const valResult = validatePassword(password);
    if (!valResult.isValid) {
      setError(valResult.error || 'Contraseña inválida.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetErr } = await authService.updatePassword(password);
      if (resetErr) {
        setError(resetErr.message || 'Ocurrió un error al actualizar la contraseña.');
      } else {
        await authService.signOut();
        setSuccessMsg('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva contraseña.');
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
              <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>🎉</div>
              <h1 className="login-title brand-gradient-text" style={{ marginBottom: '1rem', textTransform: 'uppercase' }}>¡Contraseña Actualizada!</h1>
              <p className="login-subtitle" style={{ marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                Tu contraseña ha sido restablecida de manera exitosa.
              </p>
              <button 
                type="button"
                onClick={() => navigate('/login')} 
                className="btn btn-primary w-full"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              <h1 className="login-title brand-gradient-text">
                Restablecer Contraseña
              </h1>
              <p className="login-subtitle">
                Ingresa tu nueva contraseña a continuación.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label htmlFor="password">Nueva contraseña</label>
                  <div className="password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crea una nueva contraseña"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label="Mostrar/ocultar contraseña"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  <label htmlFor="confirmPassword" style={{ marginTop: '1rem', display: 'block' }}>Confirmar contraseña</label>
                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label="Mostrar/ocultar confirmación de contraseña"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="password-requirements">
                    <span>La contraseña debe tener:</span>
                    <ul>
                      <li className={password.length >= 8 ? 'valid' : ''}>
                        Mínimo 8 caracteres
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'valid' : ''}>
                        Al menos una mayúscula
                      </li>
                      <li className={/[a-z]/.test(password) ? 'valid' : ''}>
                        Al menos una minúscula
                      </li>
                      <li className={/\d/.test(password) ? 'valid' : ''}>
                        Al menos un número
                      </li>
                    </ul>
                  </div>
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Restableciendo...' : (
                    <>
                      Restablecer contraseña
                      <ArrowRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
