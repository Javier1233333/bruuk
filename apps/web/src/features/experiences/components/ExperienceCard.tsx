import { Star, Clock, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../lib/utils';
import type { Experience } from '@bruuk/shared-logic/hooks';
import styles from './ExperienceCard.module.css';

export type { Experience };


interface ExperienceCardProps {
  exp: Experience;
  onClick: (exp: Experience) => void;
  size?: 'standard' | 'large';
}

export function ExperienceCard({ 
  exp, 
  onClick, 
  size = 'standard' 
}: ExperienceCardProps) {
  return (
    <div 
      className={`${styles.experienceCard} ${size === 'large' ? styles.cardLarge : ''}`}
      onClick={() => onClick(exp)}
    >
      <div 
        className={styles.cardImage}
        style={{ backgroundImage: `url(${getOptimizedImageUrl(exp.imageUrl, 400)})` }}
      >
        <div className={styles.cardImageGradient}></div>
        <span 
          className={styles.cardBadge} 
          style={{ 
            borderColor: 'var(--city-accent)', 
            color: 'var(--city-accent)',
            boxShadow: '2px 2px 0px var(--city-accent)' 
          }}
        >
          {exp.category}
        </span>
        
        {/* Hover action preview */}
        <div className={styles.cardHoverAction}>
          <span>Ver Detalles</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardRating}>
          <Star size={11} fill="currentColor" />
          <span>{exp.rating} ({exp.reviewsCount})</span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
          <span className={styles.cardCityTag}>{exp.city}</span>
        </div>
        <h3 className={styles.cardTitle}>{exp.name}</h3>
        <p className={styles.cardDesc}>{exp.description}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{exp.price}</span>
          <span className={styles.cardDuration}><Clock size={11} /> {exp.duration}</span>
        </div>
      </div>
    </div>
  );
}
