import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BruukLogo } from '../components/BruukLogo';
import './LoginPage.css';

export function VerifyInvitePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmed = code.trim().toUpperCase();

    const { data: codeRow, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, used')
      .eq('code', trimmed)
      .single();

    if (codeErr || !codeRow) {
      setError('Código inválido. ¿No tienes uno? Únete al newsletter VIP.');
      setLoading(false);
      return;
    }

    if (codeRow.used) {
      setError('Este código ya fue utilizado.');
      setLoading(false);
      return;
    }

    await supabase
      .from('invite_codes')
      .update({ used: true, used_by: user?.email })
      .eq('id', codeRow.id);

    // Marcamos en el perfil que ya verificó el código
    await supabase.auth.updateUser({ data: { invite_verified: true } });

    navigate('/app');
  };

  const handleCancel = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>
      <div className="login-container animate-fade-in">
        <Link to="/" className="login-logo">
          <BruukLogo />
        </Link>

        <div className="login-card">
          <div className="invite-banner">
            <Lock size={15} />
            <span>¿No tienes código? <Link to="/">Únete al acceso anticipado.</Link></span>
          </div>

          <h1 className="login-title brand-gradient-text">Un paso más.</h1>
          <p className="login-subtitle">
            Ingresa tu código de invitación para acceder a BRUUK.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="code">Código de invitación</label>
              <input
                id="code"
                type="text"
                placeholder="BRUUK-XXXX"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                autoComplete="off"
                autoFocus
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Verificando...' : <>Verificar código <ArrowRight size={18} strokeWidth={3} /></>}
            </button>

            <button type="button" className="btn btn-secondary w-full" onClick={handleCancel}>
              Cancelar y salir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
