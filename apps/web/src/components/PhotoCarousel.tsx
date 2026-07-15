import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PhotoCarousel.css';

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80',
    alt: 'Amigos en un evento',
  },
  {
    src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
    alt: 'Grupo de personas charlando',
  },
  {
    src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
    alt: 'Concierto en vivo',
  },
  {
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    alt: 'Gente brindando',
  },
  {
    src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
    alt: 'Amigos riendo en la calle',
  },
];

export function PhotoCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = () => setCurrent(i => (i === 0 ? PHOTOS.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === PHOTOS.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent(i => (i === PHOTOS.length - 1 ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div className="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {PHOTOS.map((photo, i) => (
          <div className="carousel-slide" key={i}>
            <img src={photo.src} alt={photo.alt} />
            <div className="carousel-overlay" />
          </div>
        ))}
      </div>

      <button className="carousel-btn carousel-btn--prev" onClick={prev} aria-label="Anterior">
        <ChevronLeft size={22} />
      </button>
      <button className="carousel-btn carousel-btn--next" onClick={next} aria-label="Siguiente">
        <ChevronRight size={22} />
      </button>

      <div className="carousel-dots">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === current ? 'carousel-dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Foto ${i + 1}`}
          />
        ))}
      </div>

      <div className="carousel-counter">
        {String(current + 1).padStart(2, '0')} / {String(PHOTOS.length).padStart(2, '0')}
      </div>
    </div>
  );
}
