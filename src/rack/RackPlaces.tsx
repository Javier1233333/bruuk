import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Disc3,
  Grid3X3,
  List,
  Map,
  MapPin,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import placesData from '../../lugares-mapa-gdl.json';
import { SPOT_IMAGES } from './spotImages';
import { SPOT_MAP_LINKS } from './spotMapLinks';
import './RackPlaces.css';
import { CityNav } from '../components/CityNav';
import { RadarPromo } from '../components/RadarPromo';
import { RegistrationModal } from '../components/RegistrationModal';
import { BruukSelect } from '../components/BruukSelect';

type SourceCategory = 'Rack recomienda' | 'Vinilos y antigüedades' | 'Tianguis';
type PlaceKind = 'tiendas' | 'antiguedades' | 'tianguis';
type PlaceFilter = 'todos' | PlaceKind;
type ViewMode = 'feed' | 'grid' | 'history';

interface RackPlace {
  name: string;
  category: SourceCategory;
  description: string;
  geometry?: {
    type: 'Point';
    latitude?: number;
    longitude?: number;
  };
  google_maps_url: string;
}

const FILTER_LABELS: Record<PlaceFilter, string> = {
  todos: 'Todos',
  tiendas: 'Tiendas',
  antiguedades: 'Antigüedades',
  tianguis: 'Tianguis',
};

const filterFromSearchParams = (
  searchParams: URLSearchParams,
): PlaceFilter => {
  const requestedFilter = searchParams.get('filter');
  return requestedFilter === 'tiendas' ||
    requestedFilter === 'antiguedades' ||
    requestedFilter === 'tianguis'
    ? requestedFilter
    : 'todos';
};

const viewFromSearchParams = (
  searchParams: URLSearchParams,
  filter: PlaceFilter,
): ViewMode => {
  const requestedView = searchParams.get('view');
  if (requestedView === 'grid') return 'grid';
  if (requestedView === 'history' && filter === 'tianguis') {
    return 'history';
  }
  return 'feed';
};

const kindForPlace = (place: RackPlace): PlaceKind => {
  if (place.category === 'Rack recomienda') return 'tiendas';
  if (place.category === 'Tianguis') return 'tianguis';
  return 'antiguedades';
};

const directMapsUrl = (place: RackPlace) => SPOT_MAP_LINKS[place.name];

const KIND_COLORS: Record<PlaceKind, string> = {
  tiendas: '#64d23c',
  antiguedades: '#e8a145',
  tianguis: '#a78bfa',
};

const MAP_COORDINATE_OVERRIDES: Partial<
  Record<string, { latitude: number; longitude: number }>
> = {
  'Tianguis del Sol': {
    latitude: 20.6517874,
    longitude: -103.4328311,
  },
  'Tianguis de Mezquitan': {
    latitude: 20.69128,
    longitude: -103.3536592,
  },
  'Tianguis San Juan Bosco': {
    latitude: 20.6749382,
    longitude: -103.3108693,
  },
  'Tianguis Cultural': {
    latitude: 20.6597335,
    longitude: -103.3506883,
  },
  'Tianguis del trocadero': {
    latitude: 20.6791183,
    longitude: -103.3700777,
  },
};

const coordinatesForPlace = (place: RackPlace) =>
  MAP_COORDINATE_OVERRIDES[place.name] ?? {
    latitude: place.geometry?.latitude,
    longitude: place.geometry?.longitude,
  };

type RoutePoint = {
  place: RackPlace;
  latitude: number;
  longitude: number;
};

const orderPlacesForRoute = (places: RackPlace[]) => {
  const points = places
    .map((place): RoutePoint | null => {
      const coordinates = coordinatesForPlace(place);
      if (
        coordinates.latitude == null ||
        coordinates.longitude == null
      ) {
        return null;
      }

      return {
        place,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    })
    .filter((point): point is RoutePoint => point !== null);

  if (points.length < 2) return points;

  const remaining = [...points].sort(
    (a, b) =>
      a.longitude - b.longitude || b.latitude - a.latitude,
  );
  const ordered = [remaining.shift() as RoutePoint];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const latitudeDistance =
        candidate.latitude - current.latitude;
      const longitudeDistance =
        candidate.longitude - current.longitude;
      const distance =
        latitudeDistance * latitudeDistance +
        longitudeDistance * longitudeDistance;

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return ordered;
};

const createRackMarkerIcon = (color: string) =>
  L.divIcon({
    className: 'rack-map-marker',
    html: `<span style="--rack-marker-color:${color}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

const escapeMapHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const ALL_RACK_PLACES = (placesData.places as RackPlace[]).filter(
  (place) =>
    place.category === 'Rack recomienda' ||
    place.category === 'Vinilos y antigüedades' ||
    place.category === 'Tianguis'
).filter(
  (place) =>
    ![
      'jamaica records',
      'maple showroom',
      'bazar moda diseño',
      'lopa',
      'con b de vintage',
      'apartamento 102',
    ].includes(
      place.name.toLocaleLowerCase('es-MX'),
    ),
);

const FIRST_TEN_TIANGUIS = new Set(
  ALL_RACK_PLACES.filter((place) => place.category === 'Tianguis').slice(0, 10),
);

const RACK_PLACES = ALL_RACK_PLACES.filter(
  (place) => !FIRST_TEN_TIANGUIS.has(place),
);

const modulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const VIRTUAL_FEED_OFFSETS = [-2, -1, 0, 1, 2] as const;

export function RackPlaces() {
  const { city } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = filterFromSearchParams(searchParams);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const scrollSettleRef = useRef<number | null>(null);
  const isRecenteringRef = useRef(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapDialogRef = useRef<HTMLDivElement | null>(null);
  const mapCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const radarBoundariesRef = useRef<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] =
    useState<PlaceFilter>(initialFilter);
  const [mapFilter, setMapFilter] =
    useState<PlaceFilter>(initialFilter);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    viewFromSearchParams(searchParams, initialFilter),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(
    () => searchParams.get('view') === 'map',
  );
  const [radarSeen, setRadarSeen] = useState(0);
  const [isRadarSlide, setIsRadarSlide] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  const updateRackUrl = useCallback(
    (
      filter: PlaceFilter,
      view: ViewMode,
      mapOpen = false,
    ) => {
      const nextParams = new URLSearchParams();
      if (filter !== 'todos') nextParams.set('filter', filter);
      if (mapOpen) {
        nextParams.set('view', 'map');
      } else if (view !== 'feed') {
        nextParams.set('view', view);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams],
  );

  const filteredPlaces = useMemo(() => {
    if (activeFilter === 'todos') return RACK_PLACES;
    return RACK_PLACES.filter((place) => kindForPlace(place) === activeFilter);
  }, [activeFilter]);

  const virtualFeedPlaces = useMemo(
    () =>
      VIRTUAL_FEED_OFFSETS.map((offset) => {
        const index = modulo(activeIndex + offset, filteredPlaces.length);
        return {
          index,
          offset,
          place: filteredPlaces[index],
        };
      }),
    [activeIndex, filteredPlaces],
  );

  useLayoutEffect(() => {
    if (viewMode !== 'feed' || !feedRef.current) return;

    const feed = feedRef.current;
    isRecenteringRef.current = true;
    feed.scrollTop = feed.clientHeight * 2;

    const releaseFrame = window.requestAnimationFrame(() => {
      isRecenteringRef.current = false;
    });
    return () => window.cancelAnimationFrame(releaseFrame);
  }, [activeIndex, filteredPlaces, isRadarSlide, viewMode]);

  useEffect(() => {
    const nextPlace = filteredPlaces[
      modulo(activeIndex + 1, filteredPlaces.length)
    ];
    const nextImage = nextPlace ? SPOT_IMAGES[nextPlace.name] : undefined;
    if (!nextImage) return;

    const preload = new Image();
    preload.decoding = 'async';
    preload.src = nextImage;
  }, [activeIndex, filteredPlaces]);

  useEffect(
    () => () => {
      if (scrollSettleRef.current !== null) {
        window.clearTimeout(scrollSettleRef.current);
      }
    },
    [],
  );

  const handleFeedScroll = () => {
    const feed = feedRef.current;
    const count = filteredPlaces.length;
    if (!feed || count === 0 || isRecenteringRef.current) return;

    if (scrollSettleRef.current !== null) {
      window.clearTimeout(scrollSettleRef.current);
    }

    scrollSettleRef.current = window.setTimeout(() => {
      const slideHeight = feed.clientHeight;
      const virtualIndex = Math.round(feed.scrollTop / slideHeight);
      const offset = Math.max(-2, Math.min(2, virtualIndex - 2));
      if (offset !== 0) {
        if (isRadarSlide) {
          setIsRadarSlide(false);
          if (offset < 0) setActiveIndex(modulo(activeIndex - 1, count));
        } else {
          const nextIndex = modulo(activeIndex + offset, count);
          const returningToRadar = offset < 0 && radarBoundariesRef.current.has(activeIndex);
          const knownRadarBoundary = radarBoundariesRef.current.has(nextIndex);
          const reachesRadarBoundary = offset > 0 && nextIndex !== 0 && nextIndex % 6 === 0;

          if (returningToRadar) {
            setIsRadarSlide(true);
          } else if (reachesRadarBoundary && (knownRadarBoundary || radarSeen < 3)) {
            if (!knownRadarBoundary) {
              radarBoundariesRef.current.add(nextIndex);
              setRadarSeen((seen) => seen + 1);
            }
            setIsRadarSlide(true);
            setActiveIndex(nextIndex);
          } else {
            setActiveIndex(nextIndex);
          }
        }
      }
      scrollSettleRef.current = null;
    }, 90);
  };

  const changeFilter = (filter: PlaceFilter) => {
    const nextView =
      filter !== 'tianguis' && viewMode === 'history'
        ? 'feed'
        : viewMode;
    setActiveFilter(filter);
    setActiveIndex(0);
    setIsRadarSlide(false);
    setRadarSeen(0);
    radarBoundariesRef.current.clear();
    setViewMode(nextView);
    updateRackUrl(filter, nextView);
  };

  const changeView = (view: ViewMode) => {
    setViewMode(view);
    updateRackUrl(activeFilter, view);
  };

  const openMap = () => {
    setMapFilter(activeFilter);
    setIsMapOpen(true);
    updateRackUrl(activeFilter, viewMode, true);
  };

  const closeMap = useCallback(() => {
    setIsMapOpen(false);
    updateRackUrl(activeFilter, viewMode);
  }, [activeFilter, updateRackUrl, viewMode]);

  const showPlaceInFeed = useCallback((place: RackPlace) => {
    const targetFilter = kindForPlace(place);
    const targetPlaces = RACK_PLACES.filter(
      (candidate) => kindForPlace(candidate) === targetFilter,
    );
    const targetIndex = targetPlaces.findIndex(
      (candidate) => candidate.name === place.name,
    );

    setActiveFilter(targetFilter);
    setViewMode('feed');
    setActiveIndex(Math.max(targetIndex, 0));
    setIsMapOpen(false);
    updateRackUrl(targetFilter, 'feed');
  }, [updateRackUrl]);

  useEffect(() => {
    if (!isMapOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusFrame = window.requestAnimationFrame(() => {
      mapCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMap();
        return;
      }

      if (event.key !== 'Tab' || !mapDialogRef.current) return;
      const focusable = Array.from(
        mapDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
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
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [closeMap, isMapOpen]);

  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current) return;

    const visibleMapPlaces =
      mapFilter === 'todos'
        ? RACK_PLACES
        : RACK_PLACES.filter(
            (place) => kindForPlace(place) === mapFilter,
          );

    const container = mapContainerRef.current;
    const map = L.map(container, {
      center: [20.6736, -103.35],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    ).addTo(map);

    const routeKinds: PlaceKind[] =
      mapFilter === 'todos'
        ? ['tiendas', 'antiguedades', 'tianguis']
        : [mapFilter];

    routeKinds.forEach((kind) => {
      const orderedRoute = orderPlacesForRoute(
        visibleMapPlaces.filter(
          (place) => kindForPlace(place) === kind,
        ),
      );
      const routeCoordinates = orderedRoute.map(
        ({ latitude, longitude }) =>
          [latitude, longitude] as L.LatLngTuple,
      );

      if (routeCoordinates.length < 2) return;

      L.polyline(routeCoordinates, {
        color: KIND_COLORS[kind],
        weight: 11,
        opacity: 0.16,
        interactive: false,
        lineCap: 'round',
        lineJoin: 'round',
        className: `rack-map-route-shadow is-${kind}`,
      }).addTo(map);

      L.polyline(routeCoordinates, {
        color: KIND_COLORS[kind],
        weight: 3.5,
        opacity: 0.92,
        interactive: false,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '10 10',
        className: `rack-map-route is-${kind}`,
      }).addTo(map);
    });

    const markers: L.Marker[] = [];

    visibleMapPlaces.forEach((place) => {
      const coordinates = coordinatesForPlace(place);
      if (
        coordinates.latitude == null ||
        coordinates.longitude == null
      ) {
        return;
      }

      const kind = kindForPlace(place);
      const imageUrl =
        kind !== 'tianguis' ? SPOT_IMAGES[place.name] : undefined;
      const placeIndex = RACK_PLACES.indexOf(place);
      const imageMarkup = imageUrl
        ? `<img class="rack-map-popup-image" src="${escapeMapHtml(
            imageUrl,
          )}" alt="" loading="lazy" />`
        : '';

      const marker = L.marker(
        [coordinates.latitude, coordinates.longitude],
        {
          icon: createRackMarkerIcon(KIND_COLORS[kind]),
          title: place.name,
          keyboard: true,
        },
      ).addTo(map);

      marker.bindPopup(
        `<article class="rack-map-popup">
          ${imageMarkup}
          <span class="rack-map-popup-kind">${escapeMapHtml(
            FILTER_LABELS[kind],
          )}</span>
          <h3>${escapeMapHtml(place.name)}</h3>
          <p>${escapeMapHtml(place.description)}</p>
          <div class="rack-map-popup-actions">
            <button type="button" class="rack-map-feed-btn" data-place-index="${placeIndex}">
              VER EN FEED
            </button>
            <a href="${escapeMapHtml(
              directMapsUrl(place),
            )}" target="_blank" rel="noreferrer">
              CÓMO LLEGAR
            </a>
          </div>
        </article>`,
        {
          maxWidth: 290,
          minWidth: 230,
        },
      );

      markers.push(marker);
    });

    const handleMapAction = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>(
              '.rack-map-feed-btn',
            )
          : null;
      const placeIndex = Number(target?.dataset.placeIndex);
      if (!target || !Number.isInteger(placeIndex)) return;

      const place = RACK_PLACES[placeIndex];
      if (place) showPlaceInFeed(place);
    };

    container.addEventListener('click', handleMapAction);

    if (markers.length > 0) {
      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, {
        padding: [44, 44],
        maxZoom: 14,
        animate: false,
      });
    }

    const sizeFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(sizeFrame);
      container.removeEventListener('click', handleMapAction);
      map.remove();
    };
  }, [isMapOpen, mapFilter, showPlaceInFeed]);

  if (city && city !== 'guadalajara') return <Navigate to="/guadalajara/rack" replace />;

  return (
    <div className="rack-places-page">
      <CityNav active="rack" />
      <section className="rack-places-controls" aria-label="Controles del directorio">
        <div className="rack-places-filter-select">
          <span>CATEGORÍA</span>
          <BruukSelect
            ariaLabel="Filtrar lugares por categoría"
            value={activeFilter}
            onChange={(filter) => changeFilter(filter as PlaceFilter)}
            options={(Object.keys(FILTER_LABELS) as PlaceFilter[]).map((filter) => ({
              value: filter,
              label: FILTER_LABELS[filter],
            }))}
          />
        </div>
        <div className="rack-places-filters" role="group" aria-label="Filtrar lugares">
          {(Object.keys(FILTER_LABELS) as PlaceFilter[]).map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? 'is-active' : ''}
              aria-pressed={activeFilter === filter}
              onClick={() => changeFilter(filter)}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        <div
          className={`rack-places-view-toggle${activeFilter === 'tianguis' ? ' has-history' : ''}`}
          role="group"
          aria-label="Cambiar vista"
        >
          <button
            type="button"
            className={viewMode === 'feed' ? 'is-active' : ''}
            aria-pressed={viewMode === 'feed'}
            onClick={() => changeView('feed')}
          >
            <List size={17} aria-hidden="true" />
            FEED
          </button>
          <button
            type="button"
            className={viewMode === 'grid' ? 'is-active' : ''}
            aria-pressed={viewMode === 'grid'}
            onClick={() => changeView('grid')}
          >
            <Grid3X3 size={17} aria-hidden="true" />
            GRID
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isMapOpen}
            onClick={openMap}
          >
            <Map size={17} aria-hidden="true" />
            MAPA
          </button>
          {activeFilter === 'tianguis' && (
            <button
              type="button"
              className={viewMode === 'history' ? 'is-active' : ''}
              aria-pressed={viewMode === 'history'}
              onClick={() => changeView('history')}
            >
              <BookOpen size={17} aria-hidden="true" />
              HISTORIA
            </button>
          )}
        </div>
      </section>

      {viewMode === 'history' ? (
        <TianguisHistory />
      ) : viewMode === 'feed' ? (
        <main
          key="feed"
          ref={feedRef}
          className="rack-places-feed"
          onScroll={handleFeedScroll}
          aria-label="Feed infinito de lugares"
        >
          {virtualFeedPlaces.map(({ place, index, offset }) => {
            return offset === 0 && isRadarSlide ? (
              <section className="rack-place-slide rack-radar-slide" key={offset}>
                <RadarPromo variant="rack" onJoin={() => setIsRadarOpen(true)} />
              </section>
            ) : (
              <PlaceFeedCard
                key={offset}
                place={place}
                index={index}
                total={filteredPlaces.length}
                isClone={offset !== 0}
                isActive={offset === 0}
              />
            );
          })}
          <div className="rack-places-feed-status" aria-live="polite">
            {isRadarSlide ? 'RADAR / BRUUK' : <>{String(activeIndex + 1).padStart(2, '0')} / {String(filteredPlaces.length).padStart(2, '0')}</>}
          </div>
        </main>
      ) : (
        <main key="grid" className="rack-places-grid-view">
          <header className="rack-places-grid-intro">
            <span>/ DIRECTORIO COMPLETO · GDL</span>
            <h1>{FILTER_LABELS[activeFilter]}</h1>
            <p>{filteredPlaces.length} lugares únicos seleccionados por Rack.</p>
          </header>
          <div className="rack-places-grid">
            {filteredPlaces.map((place, index) => (
              <PlaceGridCard
                key={`${place.name}-${index}`}
                place={place}
                index={index}
              />
            ))}
          </div>
        </main>
      )}

      {isMapOpen && (
        <div
          className="rack-map-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMap();
          }}
        >
          <section
            ref={mapDialogRef}
            className="rack-map-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rack-map-title"
          >
            <header className="rack-map-header">
              <div>
                <span>/ RACK EN EL MAPA · GDL</span>
                <h2 id="rack-map-title">46 SPOTS, UNA CIUDAD.</h2>
              </div>
              <button
                ref={mapCloseButtonRef}
                type="button"
                className="rack-map-close"
                onClick={closeMap}
                aria-label="Cerrar mapa"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </header>

            <div
              className="rack-map-filters"
              role="group"
              aria-label="Filtrar marcadores del mapa"
            >
              {(Object.keys(FILTER_LABELS) as PlaceFilter[]).map(
                (filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={
                      mapFilter === filter ? 'is-active' : ''
                    }
                    aria-pressed={mapFilter === filter}
                    onClick={() => setMapFilter(filter)}
                  >
                    <span
                      className={`rack-map-filter-dot is-${filter}`}
                      aria-hidden="true"
                    />
                    {FILTER_LABELS[filter]}
                  </button>
                ),
              )}
            </div>

            <div
              ref={mapContainerRef}
              className="rack-map-container"
              aria-label={`Mapa con ${
                mapFilter === 'todos'
                  ? RACK_PLACES.length
                  : RACK_PLACES.filter(
                      (place) =>
                        kindForPlace(place) === mapFilter,
                    ).length
              } lugares de Rack`}
            />
          </section>
        </div>
      )}
      <RegistrationModal isOpen={isRadarOpen} onClose={() => setIsRadarOpen(false)} />
    </div>
  );
}

function TianguisHistory() {
  return (
    <main className="rack-tianguis-history">
      <section className="rack-tianguis-history-hero" aria-labelledby="tianguis-history-title">
        <div className="rack-tianguis-history-copy">
          <span>/ ARCHIVO CALLEJERO · GDL</span>
          <h1 id="tianguis-history-title">
            EL TIANGUIS<br />NO ES SOLO<br />UN MERCADO.
          </h1>
          <p>
            Su nombre viene del náhuatl y su forma de ocupar la calle conserva una
            tradición de intercambio anterior a la ciudad moderna. En Guadalajara,
            comprar, comer, conversar y encontrarse siguen ocurriendo bajo las mismas
            lonas, un día distinto en cada barrio.
          </p>
        </div>

        <figure className="rack-tianguis-history-lead">
          <img
            src="/img/tianguis/baratillo.jpg"
            alt="Pasillo concurrido entre los puestos de El Baratillo en Guadalajara"
            width="1200"
            height="832"
            decoding="async"
          />
          <figcaption>
            <span>01 / EL BARATILLO</span>
            <a
              href="https://melissa-montalvo.com/2019/08/22/el-baratillo-the-tapatio-mecca-for-market-lovers/"
              target="_blank"
              rel="noreferrer"
            >
              FOTO: MELISSA MONTALVO ↗
            </a>
          </figcaption>
        </figure>
      </section>

      <section className="rack-tianguis-history-timeline" aria-label="Línea del tiempo de los tianguis tapatíos">
        <article>
          <time dateTime="1570">1570</time>
          <div>
            <span>/ EL BARATILLO</span>
            <h2>UNA CIUDAD QUE COMERCIA EN LA CALLE</h2>
            <p>
              Investigaciones citadas por la prensa local ubican las primeras
              apariciones de El Baratillo hacia 1570, junto a la antigua Plaza de
              San Agustín. Con los siglos cambió de sede, pero no perdió su carácter
              popular ni su ritmo dominical.
            </p>
          </div>
        </article>

        <article>
          <time dateTime="1930">SIGLO XX</time>
          <div>
            <span>/ DEL CENTRO A LOS BARRIOS</span>
            <h2>EL MERCADO SE MUEVE, LA RED PERMANECE</h2>
            <p>
              La modernización desplazó distintos baratillos del centro hacia barrios
              del oriente. Ahí crecieron como redes de abasto, trabajo y convivencia:
              puestos temporales que regresan cada semana y transforman la calle.
            </p>
          </div>
        </article>

        <article>
          <time dateTime="1995-12-09">1995</time>
          <div>
            <span>/ TIANGUIS CULTURAL</span>
            <h2>VENDER TAMBIÉN ES HACER ESCENA</h2>
            <p>
              El 9 de diciembre de 1995 se instaló por primera vez el Tianguis
              Cultural en la plaza José Rolón, con música y poesía. Lo que comenzó
              como un espacio juvenil de intercambio se convirtió en un punto de
              encuentro para distintas expresiones de la cultura tapatía.
            </p>
          </div>
        </article>
      </section>

      <section className="rack-tianguis-history-gallery" aria-label="Imágenes de la cultura de tianguis en Guadalajara">
        <figure>
          <img
            src="/img/tianguis/cultural.jpg"
            alt="Visitantes y músicos en el Tianguis Cultural de Guadalajara"
            width="1200"
            height="678"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <span>02 / CULTURA, MÚSICA Y TRIBUS URBANAS</span>
            <a
              href="https://www.milenio.com/cultura/cual-es-la-historia-del-tianguis-cultural-de-guadalajara"
              target="_blank"
              rel="noreferrer"
            >
              FUENTE: MILENIO ↗
            </a>
          </figcaption>
        </figure>

        <figure>
          <img
            src="/img/tianguis/francisco-villa.jpg"
            alt="Puestos de frutas y verduras en un tianguis vecinal de Guadalajara"
            width="608"
            height="342"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <span>03 / ABASTO COTIDIANO Y COMUNIDAD</span>
            <a
              href="https://udgtv.com/noticias/ante-abusos-de-lideres-comerciantes-de-guadalajara-urgen-a-reordenar-comercio/34890"
              target="_blank"
              rel="noreferrer"
            >
              FOTO: JULIO RÍOS / UDGTV ↗
            </a>
          </figcaption>
        </figure>
      </section>

      <footer className="rack-tianguis-history-footer">
        <span>HOY / NUEVE PARADAS EN RACK</span>
        <p>
          Los tianguis continúan como mercados itinerantes, espacios de economía
          popular y archivos vivos del gusto de la ciudad. La selección de Rack no
          intenta encerrarlos: es una invitación a caminar sus pasillos.
        </p>
        <a
          href="https://www.redalyc.org/journal/5727/572761146001/html/"
          target="_blank"
          rel="noreferrer"
        >
          LEER SOBRE EL COMERCIO TRADICIONAL EN LA ZMG <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </footer>
    </main>
  );
}

function PlaceFeedCard({
  place,
  index,
  total,
  isClone,
  isActive,
}: {
  place: RackPlace;
  index: number;
  total: number;
  isClone: boolean;
  isActive: boolean;
}) {
  const kind = kindForPlace(place);
  const imageUrl = SPOT_IMAGES[place.name];
  const showPhoto = kind !== 'tianguis' && Boolean(imageUrl);

  return (
    <article
      className={`rack-place-slide is-${kind}`}
      aria-hidden={isClone || undefined}
    >
      <div
        className={`rack-place-visual rack-place-visual--${index % 4}${
          showPhoto ? ' has-photo' : ''
        }`}
      >
        <div className="rack-place-visual-top">
          <span>GDL / {String(index + 1).padStart(2, '0')}</span>
          <span>
            {place.geometry?.latitude != null
              ? `${place.geometry.latitude.toFixed(4)}° N`
              : 'TIANGUIS · GDL'}
          </span>
        </div>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        <MapPin size={34} strokeWidth={1.35} aria-hidden="true" />
        {showPhoto && (
          <figure className="rack-place-photo-inset">
            <img
              src={imageUrl}
              alt={`Vista de ${place.name}`}
              width="640"
              height="640"
              loading={isActive ? 'eager' : 'lazy'}
              fetchPriority={isActive ? 'high' : 'low'}
              decoding="async"
            />
            <figcaption>FOTO / {String(index + 1).padStart(2, '0')}</figcaption>
          </figure>
        )}
        <span className="rack-place-visual-coordinate">
          {place.geometry?.longitude != null
            ? `${Math.abs(place.geometry.longitude).toFixed(4)}° O`
            : 'FICHA DE MERCADO'}
        </span>
      </div>

      <div className="rack-place-copy">
        <div className="rack-place-meta">
          <span className="rack-place-kind">
            {kind === 'tiendas' ? (
              <Store size={16} aria-hidden="true" />
            ) : kind === 'tianguis' ? (
              <ShoppingBag size={16} aria-hidden="true" />
            ) : (
              <Disc3 size={16} aria-hidden="true" />
            )}
            {FILTER_LABELS[kind]}
          </span>
          <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        </div>
        <h1>{place.name}</h1>
        <p>{place.description}</p>
        <a
          href={directMapsUrl(place)}
          target="_blank"
          rel="noreferrer"
          tabIndex={isClone ? -1 : undefined}
          aria-label={`Abrir ${place.name} en Google Maps`}
        >
          ABRIR EN MAPS <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <span className="rack-place-scroll-hint">DESLIZA PARA SEGUIR ↓</span>
      </div>
    </article>
  );
}

function PlaceGridCard({ place, index }: { place: RackPlace; index: number }) {
  const kind = kindForPlace(place);
  const imageUrl = SPOT_IMAGES[place.name];
  const showPhoto = kind !== 'tianguis' && Boolean(imageUrl);

  return (
    <article className={`rack-place-grid-card is-${kind}`}>
      <div className="rack-place-grid-ticket" aria-label={`Ficha ${index + 1}`}>
        <span>
          {place.geometry?.latitude != null
            ? `${place.geometry.latitude.toFixed(4)}° N`
            : `${FILTER_LABELS[kind]} · GDL`}
        </span>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        {showPhoto && (
          <img
            className="rack-place-grid-photo-inset"
            src={imageUrl}
            alt={`Vista de ${place.name}`}
            width="400"
            height="400"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="rack-place-grid-number">
        <span>{String(index + 1).padStart(2, '0')}</span>
        {kind === 'tiendas' ? (
          <Store size={20} aria-hidden="true" />
        ) : kind === 'tianguis' ? (
          <ShoppingBag size={20} aria-hidden="true" />
        ) : (
          <Disc3 size={20} aria-hidden="true" />
        )}
      </div>
      <span className="rack-place-grid-kind">{FILTER_LABELS[kind]}</span>
      <h2>{place.name}</h2>
      <p>{place.description}</p>
      <a
        href={directMapsUrl(place)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Cómo llegar a ${place.name} en Google Maps`}
      >
        CÓMO LLEGAR <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}
