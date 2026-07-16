import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { authService } from '@bruuk/shared-logic/services';
import { BruukLogo } from '../components/BruukLogo';
import { validatePassword } from '../lib/authValidation';
import './LoginPage.css';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  
  const from = location.state?.from?.pathname || '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      const { error } = await authService.signInWithPassword({ email, password });
      if (error) {
        setError(translateError(error.message));
      } else {
        navigate(from, { replace: true });
      }
    } else {
      // Validate password security requirements (standard rules)
      const valResult = validatePassword(password);
      if (!valResult.isValid) {
        setError(valResult.error || 'Contraseña inválida.');
        setLoading(false);
        return;
      }

      const { error: signUpErr } = await authService.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/setup'
        }
      });
      if (signUpErr) {
        setError(translateError(signUpErr.message));
        setLoading(false);
        return;
      }
      setSuccessMsg('¡Cuenta creada! Revisa tu correo para confirmarla.');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await authService.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + from },
    });
  };

  const handleAppleLogin = async () => {
    await authService.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + from },
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>

      <div className="login-container animate-fade-in">
        <button className="login-close-mobile" onClick={handleBack} aria-label="Cerrar">
          <X size={24} />
        </button>

        <Link to="/" className="login-logo">
          <BruukLogo />
        </Link>

        <div className="login-card">
          {successMsg ? (
            <div className="login-success-card animate-fade-in" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>📧</div>
              <h1 className="login-title brand-gradient-text" style={{ marginBottom: '1rem', textTransform: 'uppercase' }}>¡Cuenta creada!</h1>
              <p className="login-subtitle" style={{ marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                Te hemos enviado un correo de confirmación a <strong>{email}</strong>.<br /><br />
                Por favor, abre el enlace en ese correo para verificar tu cuenta e iniciar el setup de tu perfil.
              </p>
              <button 
                type="button"
                onClick={() => { setSuccessMsg(null); setMode('login'); }} 
                className="btn btn-primary w-full"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              <div className="login-tabs">
                <button
                  className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                >
                  Entrar
                </button>
                <button
                  className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
                >
                  Crear cuenta
                </button>
              </div>

              <h1 className="login-title brand-gradient-text">
                {mode === 'login' ? 'Bienvenido de vuelta.' : 'Únete al movimiento.'}
              </h1>
              <p className="login-subtitle">
                {mode === 'login'
                  ? 'Inicia sesión y sigue explorando.'
                  : 'Crea tu cuenta y únete a la comunidad.'}
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

                <div className="login-field">
                  <label htmlFor="password">Contraseña</label>
                  <div className="password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Crea una contraseña' : '••••••••'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={mode === 'signup' ? 8 : 6}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                  {mode === 'signup' && (
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
                  )}
                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                      <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#8b7cf6', textDecoration: 'none', fontWeight: 600 }}>
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  )}
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Procesando...' : (
                    <>
                      {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                      <ArrowRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>

              <div className="login-divider"><span>o continúa con</span></div>
              <div className="social-buttons">
                <button className="btn-social" onClick={handleGoogleLogin} type="button">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="btn-social" onClick={handleAppleLogin} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.15.67-2.87 1.51-.62.71-1.16 1.86-1.01 2.98 1.12.09 2.23-.62 2.89-1.43z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}
        </div>

        <p className="login-back">
          <button onClick={handleBack} className="btn-link">← Volver</button>
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de entrar.';
  if (msg.includes('User already registered')) return 'Este correo ya tiene una cuenta. Inicia sesión.';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate email')) return 'El correo no es válido.';
  return msg;
}
