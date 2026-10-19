import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BruukLogo } from '../components/BruukLogo';
import { IS_APP_MODE } from '../lib/appMode';
import './LoginPage.css';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Solo rutas internas: evita redirigir a otro sitio con ?next=//evil.com
  const nextParam = params.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/guadalajara';
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Con sesión iniciada no tiene caso quedarse en /login
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === 'login') {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err) {
        setError(translateError(err));
      }
      setLoading(false);
      return;
    }

    try {
      const created = await createUserWithEmailAndPassword(auth, email.trim(), password);
      sendEmailVerification(created.user).catch(() => {});
    } catch (err) {
      setError(translateError(err));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const target = email.trim();
    if (!target) {
      setError('Escribe tu correo y te mandamos un enlace para cambiar tu contraseña.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, target);
      // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
      setNotice(`Si ${target} tiene cuenta, te llegará un correo para cambiar tu contraseña.`);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setNotice(`Si ${target} tiene cuenta, te llegará un correo para cambiar tu contraseña.`);
      } else {
        setError(translateError(err));
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = translateError(err);
      if (msg) setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>

      <div className="login-container animate-fade-in">
        <Link to="/" className="login-logo">
          <BruukLogo />
        </Link>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); setNotice(null); }}
            >
              Entrar
            </button>
            <button
              className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(null); setNotice(null); }}
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
              : 'Crea tu cuenta y sal a explorar.'}
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
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
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
              {mode === 'login' && (
                <button type="button" className="login-forgot" onClick={handleForgotPassword}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>

            {error && <p className="login-error">{error}</p>}
            {notice && <p className="login-success">{notice}</p>}

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
          <button className="btn-google" onClick={handleGoogleLogin} type="button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        {!IS_APP_MODE && (
          <p className="login-back">
            <Link to="/">← Volver al inicio</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function translateError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta. Inicia sesión.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Intenta de nuevo.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo. Entra con tu contraseña.';
    default:
      return (err as Error)?.message ?? 'Algo salió mal.';
  }
}
