import { useState, useEffect } from 'react';
import { Bell, Check, Lock, Shield } from 'lucide-react';
import './ChatsPage.css';

export default function ChatsPage() {
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bruuk_chats_notified') === 'true';
    setNotified(saved);
  }, []);

  const handleNotifyToggle = () => {
    const next = !notified;
    setNotified(next);
    localStorage.setItem('bruuk_chats_notified', String(next));
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
            
            <button 
              className={`notify-btn ${notified ? 'active' : ''}`}
              onClick={handleNotifyToggle}
            >
              {notified ? (
                <>
                  <Check size={15} />
                  <span>Te avisaremos</span>
                </>
              ) : (
                <>
                  <Bell size={15} />
                  <span>Notificarme al lanzar</span>
                </>
              )}
            </button>

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
