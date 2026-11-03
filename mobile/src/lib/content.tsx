import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG, type AppConfig } from '../../../src/data/appConfig';
import { BUNDLED_SUNSETS, PLAN_PLACES, ROULETTE_ZONES, type PlanPlace } from './catalog';
import { getApi } from './api';

/* ============================================================
   Todo lo que la app muestra sale de GET /api/app: lugares,
   hotspots, atardeceres y la configuración (textos, funciones
   prendidas, versión mínima). Cambiar contenido = cambiar la API.

   Al abrir pinta lo último que descargó (AsyncStorage) o, la
   primera vez sin internet, el catálogo empaquetado. Vuelve a
   pedir /api/app al regresar a la app (máximo cada 5 minutos).
   ============================================================ */

export type AppContent = {
  version: string;
  config: AppConfig;
  places: PlanPlace[];
  hotspots: { ids: string[]; date?: string };
  sunsets: string[];
  zones: typeof ROULETTE_ZONES;
};

type ContentState = AppContent & {
  byId: Map<string, PlanPlace>;
  getPlace: (id: string) => PlanPlace | undefined;
  source: 'bundled' | 'cache' | 'live';
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const STORAGE_KEY = 'bruuk-content-v1';
const REFRESH_EVERY_MS = 5 * 60 * 1000;

const BUNDLED: AppContent = {
  version: 'bundled',
  config: DEFAULT_CONFIG,
  places: PLAN_PLACES,
  hotspots: { ids: [] },
  sunsets: BUNDLED_SUNSETS.map((entry) => (typeof entry === 'string' ? entry : entry.id)),
  zones: ROULETTE_ZONES,
};

// Una respuesta rara (o de una versión vieja de la API) no debe dejar la app en blanco.
const isContent = (value: unknown): value is AppContent => {
  const content = value as Partial<AppContent> | null;
  return Boolean(content && Array.isArray(content.places) && content.places.length > 0 && content.config && typeof content.version === 'string');
};

// La config guardada puede venir de una API más vieja: se completa con los valores por defecto.
const withDefaults = (content: AppContent): AppContent => ({
  ...content,
  config: {
    ...DEFAULT_CONFIG,
    ...content.config,
    features: { ...DEFAULT_CONFIG.features, ...content.config.features },
    copy: { ...DEFAULT_CONFIG.copy, ...content.config.copy },
    links: { ...DEFAULT_CONFIG.links, ...content.config.links },
  },
  hotspots: content.hotspots ?? { ids: [] },
  sunsets: content.sunsets ?? [],
  zones: content.zones ?? ROULETTE_ZONES,
});

const ContentContext = createContext<ContentState | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AppContent>(BUNDLED);
  const [source, setSource] = useState<ContentState['source']>('bundled');
  const [refreshing, setRefreshing] = useState(false);
  const lastFetch = useRef(0);

  const refresh = useCallback(async () => {
    lastFetch.current = Date.now();
    setRefreshing(true);
    try {
      const fresh = await getApi<AppContent>('app');
      if (!isContent(fresh)) return;
      setContent((current) => (current.version === fresh.version ? current : withDefaults(fresh)));
      setSource('live');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => undefined);
    } catch {
      // Sin conexión: se queda lo que ya había.
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const parsed: unknown = saved ? JSON.parse(saved) : null;
        if (alive && isContent(parsed)) {
          setContent(withDefaults(parsed));
          setSource('cache');
        }
      })
      .catch(() => undefined)
      .finally(() => void refresh());

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastFetch.current > REFRESH_EVERY_MS) void refresh();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [refresh]);

  const value = useMemo<ContentState>(() => {
    const byId = new Map(content.places.map((place) => [place.id, place]));
    return { ...content, byId, getPlace: (id) => byId.get(id), source, refreshing, refresh };
  }, [content, source, refreshing, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent debe usarse dentro de <ContentProvider>');
  return context;
}
