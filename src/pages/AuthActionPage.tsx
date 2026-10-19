import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { BruukLogo } from '../components/BruukLogo';
import './LoginPage.css';

// Manejador de la "URL de acción" de Firebase Auth.
// Firebase manda aquí los enlaces de sus correos: /auth/action?mode=...&oobCode=...
type Status =
  | { kind: 'loading' }
  | { kind: 'reset-form'; email: string }
  | { kind: 'done'; title: string; message: string; email?: string; offerReset?: boolean }
  | { kind: 'error'; title: string; message: string };

export function AuthActionPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode');
  const oobCode = params.get('oobCode') ?? '';
  const continueUrl = safeContinueUrl(params.get('continueUrl'));

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  // StrictMode ejecuta el efecto dos veces y los códigos son de un solo uso
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (!oobCode) {
      setStatus({ kind: 'error', title: 'Enlace incompleto.', message: 'Abre el enlace completo desde tu correo.' });
      return;
    }

    switch (mode) {
      case 'resetPassword':
        verifyPasswordResetCode(auth, oobCode)
          .then(email => setStatus({ kind: 'reset-form', email }))
          .catch(err => setStatus(errorStatus(err)));
        break;

      case 'verifyEmail':
        applyActionCode(auth, oobCode)
          .then(async () => {
            await auth.currentUser?.reload().catch(() => {});
            setStatus({
              kind: 'done',
              title: 'Correo verificado.',
              message: 'Tu cuenta está lista. Ya puedes salir a explorar.',
            });
          })
          .catch(err => setStatus(errorStatus(err)));
        break;

      case 'recoverEmail':
        checkActionCode(auth, oobCode)
          .then(async info => {
            await applyActionCode(auth, oobCode);
            setStatus({
              kind: 'done',
              title: 'Correo restaurado.',
              message: `Tu cuenta vuelve a usar ${info.data.email}. Si tú no pediste el cambio, cambia tu contraseña ahora.`,
              email: info.data.email ?? undefined,
              offerReset: true,
            });
          })
          .catch(err => setStatus(errorStatus(err)));
        break;

      case 'verifyAndChangeEmail':
        checkActionCode(auth, oobCode)
          .then(async info => {
            await applyActionCode(auth, oobCode);
            setStatus({
              kind: 'done',
              title: 'Correo actualizado.',
              message: `Desde ahora entras con ${info.data.email}.`,
            });
          })
          .catch(err => setStatus(errorStatus(err)));
        break;

      default:
        setStatus({ kind: 'error', title: 'Enlace no válido.', message: 'Este enlace no corresponde a ninguna acción.' });
    }
  }, [mode, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus({
        kind: 'done',
        title: 'Contraseña actualizada.',
        message: 'Ya puedes entrar con tu nueva contraseña.',
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/weak-password') {
        setFormError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setStatus(errorStatus(err));
      }
    }
    setSaving(false);
  };

  const handleSendReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setFormError('No pudimos enviar el correo. Intenta desde la pantalla de inicio de sesión.');
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
          {status.kind === 'loading' && (
            <>
              <h1 className="login-title brand-gradient-text">Un momento.</h1>
              <p className="login-subtitle">Estamos revisando tu enlace...</p>
            </>
          )}

          {status.kind === 'reset-form' && (
            <>
              <h1 className="login-title brand-gradient-text">Nueva contraseña.</h1>
              <p className="login-subtitle">Para {status.email}</p>

              <form onSubmit={handleReset} className="login-form">
                <div className="login-field">
                  <label htmlFor="new-password">Contraseña</label>
                  <div className="password-wrapper">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      autoFocus
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

                {formError && <p className="login-error">{formError}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                  {saving ? 'Guardando...' : (
                    <>
                      Guardar contraseña
                      <ArrowRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {status.kind === 'done' && (
            <>
              <h1 className="login-title brand-gradient-text">{status.title}</h1>
              <p className="login-subtitle">{status.message}</p>

              <div className="login-form">
                {status.offerReset && status.email && (
                  resetSent
                    ? <p className="login-success">Te enviamos un correo para cambiar tu contraseña.</p>
                    : (
                      <button type="button" className="btn-google" onClick={() => handleSendReset(status.email!)}>
                        Cambiar mi contraseña
                      </button>
                    )
                )}
                {formError && <p className="login-error">{formError}</p>}

                {continueUrl ? (
                  <a href={continueUrl} className="btn btn-primary w-full">
                    Continuar
                    <ArrowRight size={18} strokeWidth={3} />
                  </a>
                ) : (
                  <Link to="/login" className="btn btn-primary w-full">
                    Ir a iniciar sesión
                    <ArrowRight size={18} strokeWidth={3} />
                  </Link>
                )}
              </div>
            </>
          )}

          {status.kind === 'error' && (
            <>
              <h1 className="login-title brand-gradient-text">{status.title}</h1>
              <p className="login-subtitle">{status.message}</p>
              <Link to="/login" className="btn btn-primary w-full">
                Ir a iniciar sesión
                <ArrowRight size={18} strokeWidth={3} />
              </Link>
            </>
          )}
        </div>

        <p className="login-back">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}

function errorStatus(err: unknown): Status {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/expired-action-code':
      return { kind: 'error', title: 'Enlace vencido.', message: 'Este enlace ya expiró. Pide uno nuevo.' };
    case 'auth/invalid-action-code':
      return { kind: 'error', title: 'Enlace ya usado.', message: 'Este enlace no es válido o ya se usó. Pide uno nuevo.' };
    case 'auth/user-disabled':
      return { kind: 'error', title: 'Cuenta desactivada.', message: 'Esta cuenta está desactivada. Escríbenos a contacto@bruuk.space.' };
    case 'auth/user-not-found':
      return { kind: 'error', title: 'Cuenta no encontrada.', message: 'No existe una cuenta para este enlace.' };
    case 'auth/network-request-failed':
      return { kind: 'error', title: 'Sin conexión.', message: 'Revisa tu internet y vuelve a abrir el enlace.' };
    default:
      return { kind: 'error', title: 'Algo salió mal.', message: (err as Error)?.message ?? 'Intenta de nuevo.' };
  }
}

// Solo seguimos continueUrl si apunta a este mismo sitio
function safeContinueUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}
