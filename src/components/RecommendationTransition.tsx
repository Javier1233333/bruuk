import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import './RecommendationTransition.css';

type TransitionTo = (destination: string) => void;

const TransitionContext = createContext<TransitionTo | null>(null);
const RECOMMENDATION_ROUTE = /^\/(?:guadalajara(?:\/(?:spots|rack|senales|ruta-museos))?|radar(?:\/|$))/;

export function RecommendationLoadingScreen({ overlay = false }: { overlay?: boolean }) {
  return (
    <div className={`recommendation-loading ${overlay ? 'is-overlay' : ''}`} role="status" aria-live="polite" aria-label="Cargando recomendaciones">
      <div className="recommendation-loading-mark">
        <BruukLogo width={154} />
        <span aria-hidden="true"><i /><i /><i /><i /><i /></span>
      </div>
      <p>CARGANDO RECOMENDACIONES</p>
      <small>SELECCIÓN HECHA POR PERSONAS</small>
    </div>
  );
}

export function RecommendationTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const navigationTimer = useRef<number | undefined>(undefined);
  const releaseTimer = useRef<number | undefined>(undefined);

  const transitionTo = useCallback<TransitionTo>((destination) => {
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (destination === current || loading) return;

    window.clearTimeout(navigationTimer.current);
    window.clearTimeout(releaseTimer.current);
    setLoading(true);

    navigationTimer.current = window.setTimeout(() => {
      navigate(destination);
      releaseTimer.current = window.setTimeout(() => setLoading(false), 220);
    }, 1100);
  }, [loading, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const interceptRecommendationLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !RECOMMENDATION_ROUTE.test(url.pathname)) return;
      const isSamePageAnchor = url.pathname === location.pathname
        && url.search === location.search
        && Boolean(url.hash);
      if (isSamePageAnchor) return;

      event.preventDefault();
      transitionTo(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener('click', interceptRecommendationLink, true);
    return () => document.removeEventListener('click', interceptRecommendationLink, true);
  }, [location.pathname, location.search, transitionTo]);

  useEffect(() => () => {
    window.clearTimeout(navigationTimer.current);
    window.clearTimeout(releaseTimer.current);
  }, []);

  return (
    <TransitionContext.Provider value={transitionTo}>
      {children}
      {loading && <RecommendationLoadingScreen overlay />}
    </TransitionContext.Provider>
  );
}

export function useRecommendationTransition() {
  const transition = useContext(TransitionContext);
  if (!transition) throw new Error('useRecommendationTransition debe usarse dentro de RecommendationTransitionProvider.');
  return transition;
}
