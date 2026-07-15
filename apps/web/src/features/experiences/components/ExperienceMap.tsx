import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './ExperienceMap.module.css';

interface ExperienceMapProps {
  lat: number;
  lng: number;
  /** CSS custom property value for the neon pin color, e.g. '#8b7cf6' */
  accentColor?: string;
}

export function ExperienceMap({ lat, lng, accentColor = '#8b7cf6' }: ExperienceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    const icon = L.divIcon({
      className: 'custom-neon-pin',
      // Inline style justified: accentColor is a runtime prop, cannot be a static CSS class
      html: `<div style="background-color: ${accentColor}; box-shadow: 0 0 10px ${accentColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff;"></div>`,
      iconSize: [14, 14],
    });

    L.marker([lat, lng], { icon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, accentColor]);

  return (
    <div className={styles.mapSection}>
      <h4 className={styles.sectionHeading}>Ubicación</h4>
      <div ref={containerRef} className={styles.mapContainer} />
    </div>
  );
}
