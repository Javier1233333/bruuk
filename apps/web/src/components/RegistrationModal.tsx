import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Headphones, Utensils, Coffee, Palette, Guitar, Paintbrush, Zap, Tent, Map, Users, PartyPopper, Network } from 'lucide-react';
import * as validator from 'email-validator';
import './RegistrationModal.css';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QUESTIONS = [
    {
        id: 'weekend_vibe',
        title: 'Viernes 9:00 PM. ¿Dónde estás?',
        options: [
            { id: 'underground', label: 'En un evento que pocos conocen', icon: <Headphones size={24} color="#fff" /> },
            { id: 'gastronomy', label: 'Probando comida y tragos nuevos', icon: <Utensils size={24} color="#fff" /> },
            { id: 'chill', label: 'Charla profunda en un lugar oculto', icon: <Coffee size={24} color="#fff" /> },
        ]
    },
    {
        id: 'cultural_interest',
        title: 'Tu lado cultural tira hacia...',
        options: [
            { id: 'arts', label: 'Galerías, Indie y Exposiciones', icon: <Palette size={24} color="#fff" /> },
            { id: 'music', label: 'Música en vivo y Festivales', icon: <Guitar size={24} color="#fff" /> },
            { id: 'urban', label: 'Arte Urbano y Diseño', icon: <Paintbrush size={24} color="#fff" /> },
        ]
    },
    {
        id: 'routine_breaker',
        title: '¿Qué te saca de la rutina?',
        options: [
            { id: 'spontaneous', label: 'Planes repentinos de último minuto', icon: <Zap size={24} color="#fff" /> },
            { id: 'experience', label: 'Talleres o Actividades Inmersivas', icon: <Tent size={24} color="#fff" /> },
            { id: 'outdoors', label: 'Escapar de la ciudad unas horas', icon: <Map size={24} color="#fff" /> },
        ]
    },
    {
        id: 'social_goal',
        title: 'Cuando sales, buscas conectar con...',
        options: [
            { id: 'creatives', label: 'Mentes creativas y raras', icon: <Users size={24} color="#fff" /> },
            { id: 'party', label: 'Gente con energía explosiva', icon: <PartyPopper size={24} color="#fff" /> },
            { id: 'networking', label: 'Perfiles interesantes para hacer red', icon: <Network size={24} color="#fff" /> },
        ]
    }
];

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusable = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter(element => !element.hasAttribute('hidden'));

            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        window.requestAnimationFrame(() => closeButtonRef.current?.focus());

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
        setTimeout(() => {
            setStep(prev => prev + 1);
        }, 300); // Pequeño delay para mostrar la selección
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(prev => prev - 1);
            setErrorMsg(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg(null);

        const cleanEmail = email.toLowerCase().trim();

        if (!validator.validate(cleanEmail)) {
            setErrorMsg("Por favor, ingresa un correo electrónico válido.");
            setIsSubmitting(false);
            return;
        }

        try {
            const userTags = Object.values(answers).map(String);

            // Verificar si ya existe + suscribir a Beehiiv
            let alreadyRegistered = false;
            try {
                const joinRes = await fetch(window.location.origin + '/api/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, tags: ['Radar Subscriber', ...userTags] }),
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
                setTimeout(() => {
                    onClose();
                    setTimeout(() => {
                        setStep(0);
                        setAnswers({});
                        setEmail('');
                        setErrorMsg(null);
                        setIsSubmitted(false);
                        setIsAlreadyRegistered(false);
                        setIsSubmitting(false);
                    }, 500);
                }, 3000);
                return;
            }

            // Email nuevo: guardar en Google Sheets y enviar correo de bienvenida
            await Promise.allSettled([
                fetch(window.location.origin + '/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, preferences: answers }),
                }),
                fetch(window.location.origin + '/api/welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail }),
                }),
            ]);

            setIsSubmitted(true);

            setTimeout(() => {
                onClose();
                setTimeout(() => {
                    setStep(0);
                    setAnswers({});
                    setEmail('');
                    setErrorMsg(null);
                    setIsSubmitted(false);
                    setIsAlreadyRegistered(false);
                    setIsSubmitting(false);
                }, 500);
            }, 2500);

        } catch (error: unknown) {
            console.error('Submit error:', error);
            setErrorMsg("Ocurrió un error inesperado. Intenta de nuevo.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                ref={dialogRef}
                className="modal-content animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="registration-modal-title"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header-actions">
                    {step > 0 && !isSubmitted && (
                        <button className="modal-back" onClick={handleBack} aria-label="Retroceder">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <button ref={closeButtonRef} className="modal-close-new" onClick={onClose} aria-label="Cerrar modal">
                        <X size={24} />
                    </button>
                </div>

                {!isSubmitted ? (
                    <>
                        {step === 0 ? (
                            /* Step 0: Welcome / Explanation */
                            <div className="modal-step modal-step--intro">
                                <span className="step-indicator">El Radar</span>
                                <h2 id="registration-modal-title">EL RADAR DE LA COMUNIDAD</h2>
                                <p className="intro-text">
                                    ¿Sientes que necesitas saber más? Únete a esto.
                                </p>
                                <p className="intro-subtext">
                                    El <strong>Radar de la Comunidad</strong> es nuestra señal semanal de actualizaciones con nuevas rutas locales, experiencias secretas y avisos de encuentros en tu ciudad antes que nadie.
                                </p>
                                <button 
                                    className="btn btn-primary w-full mt-6"
                                    onClick={() => setStep(1)}
                                >
                                    UNIRSE AL RADAR <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : step <= QUESTIONS.length ? (
                            /* Step 1 to 4: Preferences Questionnaire */
                            <div className="modal-step">
                                <div className="step-indicator">
                                    Paso {step} de {QUESTIONS.length}
                                </div>
                                <p className="question-purpose">
                                    Estas preguntas sirven para reconocer qué tipo de miembro se une a nuestro Radar.
                                </p>
                                <h2 id="registration-modal-title">{QUESTIONS[step - 1].title}</h2>
                                <div className="options-grid">
                                    {QUESTIONS[step - 1].options.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`option-btn ${answers[QUESTIONS[step - 1].id] === opt.id ? 'selected' : ''}`}
                                            onClick={() => handleOptionSelect(QUESTIONS[step - 1].id, opt.id)}
                                        >
                                            <span className="option-icon">{opt.icon}</span>
                                            <span className="option-label">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Step 5: Email entry */
                            <div className="modal-step">
                                <div className="step-indicator">Paso Final</div>
                                <h2 id="registration-modal-title">¿A dónde enviamos el Radar?</h2>
                                <p>Ingresa tu correo para recibir los avisos y actualizaciones.</p>
                                <form onSubmit={handleSubmit} className="email-form">
                                    <label className="sr-only" htmlFor="registration-email">Correo electrónico</label>
                                    <input
                                        id="registration-email"
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        className={errorMsg ? 'input-error' : ''}
                                    />
                                    {errorMsg && (
                                        <p className="error-message" role="alert">{errorMsg}</p>
                                    )}
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-full mt-4"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Procesando...' : (
                                            <>SUSCRIBIRSE AL RADAR <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : isAlreadyRegistered ? (
                    <div className="modal-success animate-fade-in">
                        <div className="success-icon-wrapper">
                            <Check size={40} className="success-icon" />
                        </div>
                        <h2 id="registration-modal-title">Ya estás en el Radar.</h2>
                        <p>Este correo ya está suscrito. Revisa tu bandeja de entrada (y carpetas de spam o promociones) para ver nuestras señales anteriores.</p>
                    </div>
                ) : (
                    <div className="modal-success animate-fade-in">
                        <div className="success-icon-wrapper">
                            <Check size={40} className="success-icon" />
                        </div>
                        <h2 id="registration-modal-title">¡Suscripción completa!</h2>
                        <p>Te has unido al Radar de la Comunidad. Pronto recibirás nuestra primera señal en tu correo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
