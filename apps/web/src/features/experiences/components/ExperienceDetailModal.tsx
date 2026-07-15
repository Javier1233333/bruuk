import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, MapPin, Calendar, X, MessageCircle, AlertTriangle } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../lib/utils';
import type { Experience } from './ExperienceCard';
import { ExperienceMap } from './ExperienceMap';
import styles from './ExperienceDetailModal.module.css';

interface Attendee {
  first_name: string;
  avatar_url?: string;
}

interface ExperienceDetailModalProps {
  exp: Experience | null;
  attendees: Attendee[];
  attendeesCount: number;
  isReserving: boolean;
  onClose: () => void;
  onReserve: () => void;
}

export function ExperienceDetailModal({
  exp,
  attendees,
  attendeesCount,
  isReserving,
  onClose,
  onReserve,
}: ExperienceDetailModalProps) {
  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const dots = el.parentElement?.querySelectorAll(`.${styles.dot}`);
    dots?.forEach((dot, i) => {
      if (i === index) dot.classList.add(styles.activeDot);
      else dot.classList.remove(styles.activeDot);
    });
  };

  return (
    <AnimatePresence>
      {exp && (
        <div className={styles.backdrop} onClick={onClose}>
          <motion.div
            className={styles.content}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>

            {/* Carousel Cover Images */}
            <div className={styles.carouselWrapper}>
              <div
                className={styles.categoryBadge}
                style={{ background: 'var(--city-accent)', color: '#000', borderColor: '#fff' }}
              >
                {exp.category}
              </div>
              <div className={styles.carousel} onScroll={handleCarouselScroll}>
                {exp.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={styles.carouselItem}
                    style={{ backgroundImage: `url(${getOptimizedImageUrl(img, 800)})` }}
                  />
                ))}
              </div>
              {exp.images.length > 1 && (
                <div className={styles.dotsContainer}>
                  {exp.images.map((_, idx) => (
                    <div key={idx} className={`${styles.dot} ${idx === 0 ? styles.activeDot : ''}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Sheet Body Scrollable Area */}
            <div className={styles.body}>
              <h2 className={styles.title}>{exp.name}</h2>

              {/* Meta details strip */}
              <div className={styles.metaStrip}>
                <div className={styles.metaItem}>
                  <Star size={13} fill="currentColor" className={styles.starIcon} />
                  <span>{exp.rating} ({exp.reviewsCount} reseñas)</span>
                </div>
                <div className={styles.metaItem}>
                  <Clock size={13} />
                  <span>{exp.duration}</span>
                </div>
              </div>

              {/* Host Card Section */}
              <div className={styles.hostCard}>
                <img src={exp.hostAvatar} alt={exp.host} className={styles.hostAvatar} />
                <div>
                  <span className={styles.hostLabel}>Anfitrión local</span>
                  <h3 className={styles.hostName}>{exp.host}</h3>
                </div>
              </div>

              {/* Description */}
              <div className={styles.descriptionSection}>
                <h4 className={styles.sectionHeading}>¿De qué se trata?</h4>
                <p>{exp.longDescription}</p>
              </div>

              {/* Attendees */}
              {attendeesCount > 0 && (
                <div className={styles.attendeesSection}>
                  <h4 className={styles.sectionHeading}>Quiénes van</h4>
                  <div className={styles.attendeesRow}>
                    <div className={styles.attendeesAvatars}>
                      {attendees.map((att, i) => (
                        <img
                          key={i}
                          src={att.avatar_url || 'https://via.placeholder.com/40'}
                          alt={att.first_name}
                          className={styles.attendeeAvatar}
                        />
                      ))}
                    </div>
                    <span className={styles.attendeesText}>
                      {attendees[0]?.first_name}
                      {attendeesCount > 1 && `, ${attendees[1]?.first_name}`}
                      {attendeesCount > 2 && ` y ${attendeesCount - 2} más`}
                    </span>
                  </div>
                </div>
              )}

              {/* Map */}
              {exp.lat && exp.lng && (
                <ExperienceMap
                  lat={exp.lat}
                  lng={exp.lng}
                  accentColor="var(--city-accent, #8b7cf6)"
                />
              )}

              {/* Logistics */}
              <div className={styles.logisticsList}>
                <div className={styles.logisticsItem}>
                  <MapPin size={16} />
                  <div>
                    <h5>Punto de encuentro</h5>
                    <p>{exp.location} · {exp.city}</p>
                  </div>
                </div>
                <div className={styles.logisticsItem}>
                  <Calendar size={16} />
                  <div>
                    <h5>Próxima fecha disponible</h5>
                    <p>{exp.nextDate}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actionsRow}>
                <button
                  className={styles.actionBtn}
                  onClick={() => window.open(exp.whatsAppLink || '#', '_blank')}
                >
                  <MessageCircle size={15} /> Contactar Host
                </button>
                <button className={`${styles.actionBtn} ${styles.danger}`}>
                  <AlertTriangle size={15} /> Reportar
                </button>
              </div>
            </div>

            {/* Sticky bottom checkout row */}
            <div className={styles.checkoutRow}>
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>PRECIO</span>
                <span className={styles.priceValue}>
                  {exp.price} <span className={styles.priceUnit}>/ pers</span>
                </span>
              </div>
              <button
                onClick={onReserve}
                disabled={isReserving || !exp.nextEventId}
                className={styles.reserveBtn}
              >
                {isReserving ? 'Procesando...' : (
                  <>Reservar lugar <MessageCircle size={15} fill="currentColor" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
