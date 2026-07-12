import { useState } from 'react';
import { Lock, Shield, Check } from 'lucide-react';
import './ChatsPage.css';

export default function ChatsPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg("Por favor, ingresa un correo electrónico válido.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Registrar en Beehiiv
      let alreadyRegistered = false;
      try {
        const joinRes = await fetch(window.location.origin + '/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, tags: ['Radar Subscriber', 'Chats Page'] }),
        });
        if (joinRes.ok) {
          const joinData = await joinRes.json();
          alreadyRegistered = joinData.alreadyRegistered === true;
        }
      } catch {
        alreadyRegistered = false;
      }

      if (alreadyRegistered) {
        setIsAlreadyRegistered(true);
        setIsSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      // Guardar en Google Sheets + Enviar correo de bienvenida
      await Promise.allSettled([
        fetch(window.location.origin + '/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, preferences: { source: 'chats_page' } }),
        }),
        fetch(window.location.origin + '/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        }),
      ]);

      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMsg("Ocurrió un error inesperado. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const DUMMY_CHATS = [
    { id: 1, name: 'Comunidad Guadalajara 🗺️', lastMsg: 'Hola! Quién se apunta para la barranca mañana?', time: '10m', unread: 2 },
    { id: 2, name: 'Amantes del Mezcal 🥃', lastMsg: 'Ese Tobalá estuvo increíble...', time: '1h', unread: 0 },
    { id: 3, name: 'Senderistas Nocturnos ⛰️', lastMsg: 'Sofía: Recuerden traer linterna front...', time: '4h', unread: 0 },
  ];

  return (
    <div className="chats-page">
      {/* Header */}
      <header className="chats-header">
        <span className="chats-tag">/ chats</span>
        <h1 className="chats-title brand-gradient-text">Conversaciones</h1>
        <p className="chats-sub">Conecta con personas reales de tu misma ciudad.</p>
      </header>

      {/* Main chat list - blurred background */}
      <main className="chats-list-container">
        <div className="chats-blurred-list">
          {DUMMY_CHATS.map(chat => (
            <div key={chat.id} className="dummy-chat-row">
              <div className="dummy-chat-avatar">
                {chat.name.slice(-2)}
              </div>
              <div className="dummy-chat-info">
                <div className="dummy-chat-top">
                  <span className="dummy-chat-name">{chat.name}</span>
                  <span className="dummy-chat-time">{chat.time}</span>
                </div>
                <span className="dummy-chat-msg">{chat.lastMsg}</span>
              </div>
              {chat.unread > 0 && (
                <div className="dummy-chat-unread">{chat.unread}</div>
              )}
            </div>
          ))}
        </div>

        {/* Lock Overlay */}
        <div className="chats-lock-overlay">
          <div className="chats-lock-card">
            <div className="lock-icon-circle">
              <Lock size={22} className="lock-svg" />
            </div>
            <h2 className="lock-title">Conexión Real</h2>
            <p className="lock-desc">
              Esta sección está en desarrollo. Pronto podrás abrir salas de chat privadas y grupales con exploradores que reserven tus mismas experiencias o spots.
            </p>

            {/* Radar Form Replacement */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="chats-radar-form">
                <p className="chats-radar-intro">
                  Únete al <strong>Radar de la Comunidad</strong> para enterarte de los chats y recibir los planes semanales.
                </p>
                <div className="chats-radar-input-group">
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={`chats-radar-input ${errorMsg ? 'input-error' : ''}`}
                  />
                  <button 
                    type="submit" 
                    className="chats-radar-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '...' : 'UNIRSE'}
                  </button>
                </div>
                {errorMsg && (
                  <p className="chats-radar-error">{errorMsg}</p>
                )}
              </form>
            ) : isAlreadyRegistered ? (
              <div className="chats-radar-success animate-fade-in">
                <Check size={18} className="success-check-icon" />
                <span>Ya estás en el Radar. ¡Revisa tu bandeja!</span>
              </div>
            ) : (
              <div className="chats-radar-success animate-fade-in">
                <Check size={18} className="success-check-icon" />
                <span>¡Te has unido al Radar de la Comunidad!</span>
              </div>
            )}

            <div className="lock-footer">
              <Shield size={12} />
              <span>Privacidad garantizada. Sin spam.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
