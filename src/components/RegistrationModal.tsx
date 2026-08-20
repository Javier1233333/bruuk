import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Check, Headphones, Utensils, Coffee, Palette, Guitar, Paintbrush, Zap, Tent, Map, Users, PartyPopper, Network, Radio } from 'lucide-react';
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
    const [step, setStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(-1);
            setAnswers({});
            setEmail('');
            setErrorMsg(null);
            setIsSubmitted(false);
            setIsAlreadyRegistered(false);
            setIsSubmitting(false);
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleContinue = () => {
        const currentQuestion = QUESTIONS[step];

        if (currentQuestion && answers[currentQuestion.id]) {
            setStep(prev => prev + 1);
            setErrorMsg(null);
        }
    };

    const handleBack = () => {
        if (step >= 0) {
            setStep(prev => prev - 1);
            setErrorMsg(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmitting) return;
        const formData = new FormData(e.currentTarget);
        const website = String(formData.get('website') ?? '').trim();
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
                    body: JSON.stringify({ email: cleanEmail, website, tags: ['VIP Access', 'Radar Bruuk', ...userTags] }),
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
                        setStep(-1);
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
                    body: JSON.stringify({ email: cleanEmail, preferences: answers, website }),
                }),
                fetch(window.location.origin + '/api/welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, website }),
                }),
            ]);

            setIsSubmitted(true);

            setTimeout(() => {
                onClose();
                setTimeout(() => {
                    setStep(-1);
                    setAnswers({});
                    setEmail('');
                    setErrorMsg(null);
                    setIsSubmitted(false);
                    setIsAlreadyRegistered(false);
                    setIsSubmitting(false);
                }, 500);
            }, 2500);

        } catch (error: any) {
            console.error('Submit error:', error);
            setErrorMsg("Ocurrió un error inesperado. Intenta de nuevo.");
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-enter" onClick={e => e.stopPropagation()}>
                <div className="modal-header-actions">
                    {step >= 0 && !isSubmitted && (
                        <button className="modal-back" onClick={handleBack} aria-label="Retroceder">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <button className="modal-close-new" onClick={onClose} aria-label="Cerrar modal">
                        <X size={24} />
                    </button>
                </div>

                {!isSubmitted ? (
                    <>
                        {step === -1 ? (
                            <div className="modal-step radar-modal-intro">
                                <div className="radar-modal-eyebrow">
                                    <Radio size={17} aria-hidden="true" /> / RADAR BRUUK
                                </div>
                                <h2>LO QUE PASA EN LA CIUDAD, ANTES DE QUE SE VUELVA OBVIO.</h2>
                                <p>
                                    Radar es la comunidad activa de Bruuk. Reunimos planes, eventos, aperturas y cosas que están por pasar en Guadalajara.
                                </p>
                                <div className="radar-modal-signals" aria-label="Lo que recibirás en Radar">
                                    <div><strong>SEÑALES</strong><span>Planes, eventos y cosas que están por pasar.</span></div>
                                    <div><strong>CIUDAD</strong><span>Aperturas, encuentros y hallazgos compartidos por la comunidad.</span></div>
                                    <div><strong>SIN RUIDO</strong><span>Actualizaciones constantes, correo solo cuando hay algo valioso.</span></div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary w-full radar-modal-start"
                                    onClick={() => setStep(0)}
                                >
                                    Quiero recibir señales <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : step < QUESTIONS.length ? (
                            <div className="modal-step">
                                <div className="step-indicator">
                                    Paso {step + 1} de {QUESTIONS.length}
                                </div>
                                <h2>{QUESTIONS[step].title}</h2>
                                <div className="options-grid">
                                    {QUESTIONS[step].options.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`option-btn ${answers[QUESTIONS[step].id] === opt.id ? 'selected' : ''}`}
                                            onClick={() => handleOptionSelect(QUESTIONS[step].id, opt.id)}
                                        >
                                            <span className="option-icon">{opt.icon}</span>
                                            <span className="option-label">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary w-full modal-continue"
                                    onClick={handleContinue}
                                    disabled={!answers[QUESTIONS[step].id]}
                                >
                                    Continuar <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="modal-step">
                                <div className="step-indicator">Paso Final</div>
                                <h2>¿A dónde enviamos las señales?</h2>
                                <p>Nuevos spots, planes y actualizaciones antes que nadie. Cero spam.</p>
                                <form onSubmit={handleSubmit} className="email-form">
                                    <label className="radar-honeypot" aria-hidden="true">
                                        Sitio web
                                        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        className={errorMsg ? 'input-error' : ''}
                                    />
                                    {errorMsg && (
                                        <p className="error-message">{errorMsg}</p>
                                    )}
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-full mt-4"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Procesando...' : (
                                            <>Unirme al Radar <ArrowRight size={18} /></>
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
                        <h2>Ya eres parte del Radar.</h2>
                        <p>Este correo ya estaba registrado. Revisa tu bandeja de entrada — y también <strong>spam</strong>, <strong>promociones</strong> y <strong>otras</strong>. Tu señal ya está ahí.</p>
                    </div>
                ) : (
                    <div className="modal-success animate-fade-in">
                        <div className="success-icon-wrapper">
                            <Check size={40} className="success-icon" />
                        </div>
                        <h2>Ya estás en el Radar.</h2>
                        <p>Guardamos tu perfil. Recibirás nuevos spots, planes y actualizaciones antes que nadie.</p>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
