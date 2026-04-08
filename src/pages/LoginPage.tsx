import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BruukLogo } from '../components/BruukLogo';
import './LoginPage.css';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateError(error.message));
      } else {
        navigate('/app');
      }
    } else {
      // Validar código de invitación antes de crear cuenta
      const code = inviteCode.trim().toUpperCase();

      const { data: codeRow, error: codeErr } = await supabase
        .from('invite_codes')
        .select('id, used')
        .eq('code', code)
        .single();

      if (codeErr || !codeRow) {
        setError('Código de invitación inválido. Únete al newsletter para obtener el tuyo.');
        setLoading(false);
        return;
      }

      if (codeRow.used) {
        setError('Este código ya fue utilizado.');
        setLoading(false);
        return;
      }

      // Crear cuenta
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setError(translateError(signUpErr.message));
        setLoading(false);
        return;
      }

      // Marcar código como usado
      await supabase
        .from('invite_codes')
        .update({ used: true, used_by: email.toLowerCase().trim() })
        .eq('id', codeRow.id);

      setSuccessMsg('¡Cuenta creada! Revisa tu correo para confirmarla.');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
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

          {mode === 'signup' && (
            <div className="invite-banner">
              <Lock size={15} />
              <span>¿No tienes código? <Link to="/">Únete al acceso anticipado.</Link></span>
            </div>
          )}

          <h1 className="login-title brand-gradient-text">
            {mode === 'login' ? 'Bienvenido de vuelta.' : 'Únete al movimiento.'}
          </h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Inicia sesión y sigue explorando.'
              : 'Ingresa tu código de invitación para entrar.'}
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
            </div>

            {mode === 'signup' && (
              <div className="login-field">
                <label htmlFor="invite-code">Código de invitación</label>
                <input
                  id="invite-code"
                  type="text"
                  placeholder="BRUUK-XXXX"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  required
                  autoComplete="off"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
              </div>
            )}

            {error && <p className="login-error">{error}</p>}
            {successMsg && <p className="login-success">{successMsg}</p>}

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

        <p className="login-back">
          <Link to="/">← Volver al inicio</Link>
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
