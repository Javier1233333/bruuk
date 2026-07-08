import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Spot {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  rating?: number;
  price?: string;
}

interface SpotCardProps {
  spot: Spot;
  clickX: number;
  clickY: number;
  cityName: string;
  onClose: () => void;
}

const CARD_W = 300;
const CARD_H = 240;
const OFFSET = 24;
const PAD = 12;

function getCardPos(cx: number, cy: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = cx + OFFSET;
  let y = cy - CARD_H / 2;

  if (x + CARD_W > vw - PAD) x = cx - CARD_W - OFFSET;
  if (x < PAD) x = PAD;
  if (y < PAD) y = PAD;
  if (y + CARD_H > vh - PAD) y = vh - CARD_H - PAD;

  return { x, y };
}

export function SpotCard({ spot, clickX, clickY, cityName, onClose }: SpotCardProps) {
  const pos = getCardPos(clickX, clickY);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handle, true);
    return () => document.removeEventListener('click', handle, true);
  }, [onClose]);

  return (
    <motion.div
      ref={cardRef}
      className="spot-card"
      style={{ left: pos.x, top: pos.y }}
      initial={{ opacity: 0, scale: 0.6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Accent color stripe */}
      <div
        className="spot-card__stripe"
        style={{ background: spot.colorAccent }}
      />

      {/* Image */}
      <div className="spot-card__img-wrap">
        <img
          src={spot.imageUrl}
          alt={spot.name}
          className="spot-card__img"
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <button className="spot-card__close" onClick={onClose} aria-label="Cerrar">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="spot-card__body">
        <div className="spot-card__meta">
          <span className="spot-card__type" style={{ background: spot.colorAccent }}>{spot.type}</span>
          <span className="spot-card__label">{cityName}</span>
        </div>
        <h3 className="spot-card__name">{spot.name}</h3>
        {(spot.rating || spot.price) && (
          <div className="spot-card__stats">
            {spot.rating && (
              <span className="spot-card__rating">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {spot.rating}
              </span>
            )}
            {spot.price && <span className="spot-card__price">{spot.price}</span>}
          </div>
        )}
        <p className="spot-card__desc">"{spot.description}"</p>
        <a
          href={spot.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="spot-card__link"
          onClick={e => e.stopPropagation()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ver en Maps
        </a>
      </div>
    </motion.div>
  );
}
