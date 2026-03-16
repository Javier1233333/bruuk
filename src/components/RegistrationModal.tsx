import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Headphones, Utensils, Coffee, Palette, Guitar, Paintbrush, Zap, Tent, Map, Users, PartyPopper, Network } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        try {
            // Validación estricta de formato de correo (estándar RFC)
            if (!validator.validate(email.toLowerCase().trim())) {
                setErrorMsg("Por favor, ingresa un correo electrónico válido.");
                setIsSubmitting(false);
                return;
            }

            const leadsRef = collection(db, 'earlyAccessLeads');
            const q = query(leadsRef, where('email', '==', email.toLowerCase().trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setErrorMsg("Este correo ya está en la lista VIP.");
                setIsSubmitting(false);
                return;
            }

            // Llamada al servidor puente de Vercel para mandar el correo a Beehiiv
            // Lo hacemos ANTES de Firebase para asegurar que se completa la red
            try {
                const userTags = Object.values(answers).map(String);
                
                const beehiivRes = await fetch(window.location.origin + '/api/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email.toLowerCase().trim(),
                        tags: ['VIP Access', ...userTags]
                    }),
                });

                const resText = await beehiivRes.text();

                if (!beehiivRes.ok) {
                    try {
                        const errorData = JSON.parse(resText);
                        const beehiivMsg = errorData.errors?.[0]?.message || 'El correo fue rechazado';
                        throw new Error(`Beehiiv: ${beehiivMsg}`);
                    } catch (parseErr) {
                        throw new Error(`Fallo de conexión: ${resText.substring(0, 50)}`);
                    }
                }

                if (resText.includes('<html')) {
                    throw new Error('Vercel devolvió HTML en vez de la API.');
                }
            } catch (beehiivErr: any) {
                console.error("Error crítico de Beehiiv:", beehiivErr);
                
                // Extraemos el mensaje limpio para mostrarlo al usuario
                const errorStr = beehiivErr.message;
                if (errorStr.includes('Beehiiv:')) {
                    setErrorMsg("Este correo no parece válido o fue rechazado.");
                } else {
                    setErrorMsg(`Error de sistema: ${errorStr}`);
                }
                
                setIsSubmitting(false);
                return; // ESTE RETURN ES LA CLAVE PARA FRENAR FIREBASE
            }

            // Si Beehiiv fue exitoso, guardamos respaldo en Firebase
            await addDoc(leadsRef, {
                email: email.toLowerCase().trim(),
                preferences: answers,
                createdAt: serverTimestamp()
            });

            setIsSubmitted(true);

            // Cierra el modal después de mostrar el éxito
            setTimeout(() => {
                onClose();
                // Reset state for next time
                setTimeout(() => {
                    setStep(0);
                    setAnswers({});
                    setEmail('');
                    setErrorMsg(null);
                    setIsSubmitted(false);
                    setIsSubmitting(false);
                }, 500);
            }, 2500);

        } catch (error) {
            console.error("Error adding document: ", error);
            setErrorMsg("Ocurrió un error inesperado al conectar. Intenta de nuevo.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header-actions">
                    {step > 0 && !isSubmitted && (
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
                        {step < QUESTIONS.length ? (
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
                            </div>
                        ) : (
                            <div className="modal-step">
                                <div className="step-indicator">Paso Final</div>
                                <h2>¿A dónde enviamos el acceso?</h2>
                                <p>Cero spam, cero distracciones. Solo tu boleto de salida.</p>
                                <form onSubmit={handleSubmit} className="email-form">
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
                                            <>Entrar a BRUUK <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="modal-success animate-fade-in">
                        <div className="success-icon-wrapper">
                            <Check size={40} className="success-icon" />
                        </div>
                        <h2>Ya estás dentro.</h2>
                        <p>Hemos guardado tu perfil. Prepárate para dejar la pantalla y salir al mundo real.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
