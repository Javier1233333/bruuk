import { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PenLine, Trash2 } from 'lucide-react';
import { MIN_SHAPE_POINTS, MAX_SHAPE_POINTS, ZONES, ZONE_BY_ID, insideShape, spotZone, suggestZoneFor, type LatLng, type ZoneId, type ZoneShapes } from '../lib/zones';
import { RowImage } from './adminShared';
import { OsmCoords } from './OsmCoords';
import { saveZoneShape, type RackDoc, type SpotDoc } from './spotsStore';
import { useZoneGuides } from './useZoneGuides';
import { ZoneSelectRow } from './ZoneSelect';
import { placeRows, rowKind, setRowZone, type PlaceRow } from './zoneRows';

/* ============================================================
   Mapa por zonas: cada una de las 7 zonas con su trazo (o un
   círculo punteado aproximado mientras no la traces), cada spot
   y lugar de Rack como un punto del color de su zona (gris
   punteado si no tiene). Al tocar un punto se le asigna la zona
   ahí mismo. "Trazar" dibuja el contorno de una zona punto por
   punto. Lo que no tiene coordenadas va en la lista de al lado,
   con la búsqueda de coordenadas en OpenStreetMap.
   ============================================================ */

// Mapa base minimalista (CARTO Positron): calles claras, sin ruido.
const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const HOME: L.LatLngExpression = [20.68, -103.37];

const NO_ZONE_COLOR = '#8f8a9f';

const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const markerIcon = (color: string, pending: boolean) =>
  L.divIcon({
    className: 'sa-map-marker',
    html: `<span class="${pending ? 'is-pending' : ''}" style="--marker-color:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });

const vertexIcon = (color: string, first: boolean) =>
  L.divIcon({ className: 'sa-map-vertex', html: `<span class="${first ? 'is-first' : ''}" style="--zone-color:${color}"></span>`, iconSize: [16, 16], iconAnchor: [8, 8] });

// Donde va la etiqueta de una zona trazada: el promedio de sus puntos.
const centroid = (shape: LatLng[]): LatLng => ({
  lat: shape.reduce((sum, point) => sum + point.lat, 0) / shape.length,
  lng: shape.reduce((sum, point) => sum + point.lng, 0) / shape.length,
});

function popupHtml(row: PlaceRow, shapes: ZoneShapes) {
  const zone = spotZone(row.item);
  const suggested = zone ? undefined : suggestZoneFor(row.item, shapes);
  const buttons = ZONES.map((option) => {
    const active = zone?.id === option.id;
    const hint = suggested?.id === option.id ? ' is-suggested' : '';
    return `<button type="button" class="sa-map-zone${active ? ' is-active' : ''}${hint}" data-key="${escapeHtml(row.key)}" data-zone="${option.id}" style="--zone-color:${option.color}">${escapeHtml(option.short)}</button>`;
  }).join('');
  return `
    <div class="sa-map-popup">
      <strong>${escapeHtml(row.item.name)}</strong>
      <span>${escapeHtml(rowKind(row))}${row.item.active ? '' : ' · oculto'}</span>
      <span class="sa-map-popup__zone">${zone ? `Zona: ${escapeHtml(zone.name)}` : `Sin zona${suggested ? ` · sugerida: ${escapeHtml(suggested.short)}` : ''}`}</span>
      <div class="sa-map-zones">${buttons}<button type="button" class="sa-map-zone is-none${zone ? '' : ' is-active'}" data-key="${escapeHtml(row.key)}" data-zone="">Sin zona</button></div>
    </div>`;
}

type Filters = { spots: boolean; rack: boolean; onlyPending: boolean; zone: ZoneId | null };

export function ZonesMapView({ spots, rack, loaded }: { spots: SpotDoc[]; rack: RackDoc[]; loaded: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const drawLayerRef = useRef<L.LayerGroup | null>(null);
  const previewRef = useRef<L.Marker | null>(null);
  const { shapes, error: guidesError } = useZoneGuides();
  // Trazo en curso: la zona y sus puntos. El click del mapa lo lee del ref.
  const [drawing, setDrawing] = useState<{ zoneId: ZoneId; points: LatLng[] } | null>(null);
  const drawingRef = useRef(drawing);
  useEffect(() => {
    drawingRef.current = drawing;
  }, [drawing]);
  const [savingShape, setSavingShape] = useState(false);
  // Después de guardar un trazo: los lugares que caen dentro y todavía no son de esa zona.
  const [inside, setInside] = useState<{ zoneId: ZoneId; rows: PlaceRow[] } | null>(null);
  const rowsRef = useRef<Map<string, PlaceRow>>(new Map());
  const [filters, setFilters] = useState<Filters>({ spots: true, rack: true, onlyPending: false, zone: null });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => placeRows(spots, rack), [spots, rack]);
  const visible = useMemo(
    () => rows.filter((row) =>
      (row.source === 'spots' ? filters.spots : filters.rack)
      && (!filters.onlyPending || !spotZone(row.item))
      && (!filters.zone || spotZone(row.item)?.id === filters.zone)),
    [rows, filters],
  );
  const located = visible.filter((row) => row.item.coordinates);
  const withoutCoords = visible.filter((row) => !row.item.coordinates);

  const counts = useMemo(() => {
    const byZone = new Map<string, number>();
    let pending = 0;
    for (const row of rows) {
      const zone = spotZone(row.item);
      if (zone) byZone.set(zone.id, (byZone.get(zone.id) ?? 0) + 1);
      else pending += 1;
    }
    return { byZone, pending };
  }, [rows]);

  const assign = async (key: string, zoneId: string | null) => {
    const row = rowsRef.current.get(key);
    if (!row) return;
    setError(null);
    try {
      await setRowZone(row, zoneId);
      setNotice(`${row.item.name} → ${zoneId ? ZONE_BY_ID.get(zoneId as ZoneId)?.name : 'sin zona'}`);
    } catch (err) {
      setError(`No se pudo guardar la zona de ${row.item.name}: ${(err as Error).message}`);
    }
  };

  // El mapa y los círculos de las zonas se crean una vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: HOME, zoom: 13, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    L.tileLayer(TILES, { maxZoom: 20, subdomains: 'abcd', attribution: TILES_ATTRIBUTION }).addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    drawLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Trazando: cada click en el mapa agrega un punto al contorno.
    map.on('click', (event: L.LeafletMouseEvent) => {
      const current = drawingRef.current;
      if (!current || current.points.length >= MAX_SHAPE_POINTS) return;
      setDrawing({ ...current, points: [...current.points, { lat: event.latlng.lat, lng: event.latlng.lng }] });
    });

    // Un solo listener para los botones de zona de todos los popups.
    const container = containerRef.current;
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.sa-map-zone');
      if (!button?.dataset.key) return;
      map.closePopup();
      void assign(button.dataset.key, button.dataset.zone || null);
    };
    container.addEventListener('click', onClick);
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      container.removeEventListener('click', onClick);
      map.remove();
      mapRef.current = null;
    };
    // assign sólo lee rowsRef, que siempre está al día: el mapa no se recrea.
  }, []);

  // Las zonas: su trazo, o el círculo aproximado (punteado) si todavía no tiene.
  useEffect(() => {
    const layer = zonesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const zone of ZONES) {
      if (drawing?.zoneId === zone.id) continue;
      const shape = shapes[zone.id];
      const focused = filters.zone === zone.id;
      let labelAt: LatLng = zone.center;
      if (shape) {
        L.polygon(shape.map((point) => [point.lat, point.lng] as L.LatLngTuple), { color: zone.color, weight: focused ? 3 : 2, fillColor: zone.color, fillOpacity: focused ? 0.2 : 0.12, interactive: false }).addTo(layer);
        labelAt = centroid(shape);
      } else {
        L.circle([zone.center.lat, zone.center.lng], { radius: zone.radiusKm * 1000, color: zone.color, weight: 1.5, dashArray: '6 6', fillColor: zone.color, fillOpacity: 0.06, interactive: false }).addTo(layer);
      }
      L.marker([labelAt.lat, labelAt.lng], {
        icon: L.divIcon({ className: 'sa-map-label', html: `<span style="--zone-color:${zone.color}">${escapeHtml(zone.short)}</span>`, iconSize: [0, 0] }),
        interactive: false,
        keyboard: false,
      }).addTo(layer);
    }
  }, [shapes, drawing?.zoneId, filters.zone]);

  // El trazo en curso: polígono y puntos arrastrables (click en un punto lo quita).
  useEffect(() => {
    const layer = drawLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    map.getContainer().classList.toggle('is-drawing', Boolean(drawing));
    if (drawing) map.doubleClickZoom.disable(); else map.doubleClickZoom.enable();
    if (!drawing) return;
    const color = ZONE_BY_ID.get(drawing.zoneId)!.color;
    const latlngs = drawing.points.map((point) => [point.lat, point.lng] as L.LatLngTuple);
    if (latlngs.length >= MIN_SHAPE_POINTS) L.polygon(latlngs, { color, weight: 3, fillColor: color, fillOpacity: 0.18, interactive: false }).addTo(layer);
    else if (latlngs.length === 2) L.polyline(latlngs, { color, weight: 3, interactive: false }).addTo(layer);
    drawing.points.forEach((point, index) => {
      const vertex = L.marker([point.lat, point.lng], { icon: vertexIcon(color, index === 0), draggable: true, keyboard: false, title: `Punto ${index + 1}` }).addTo(layer);
      vertex.on('dragend', () => {
        const { lat, lng } = vertex.getLatLng();
        const current = drawingRef.current;
        if (current) setDrawing({ ...current, points: current.points.map((item, i) => (i === index ? { lat, lng } : item)) });
      });
      vertex.on('click', () => {
        const current = drawingRef.current;
        if (current) setDrawing({ ...current, points: current.points.filter((_, i) => i !== index) });
      });
    });
  }, [drawing]);

  // Los puntos se vuelven a pintar cada vez que cambia un lugar o un filtro.
  useEffect(() => {
    rowsRef.current = new Map(rows.map((row) => [row.key, row]));
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const row of located) {
      const zone = spotZone(row.item);
      const { lat, lng } = row.item.coordinates!;
      L.marker([lat, lng], { icon: markerIcon(zone?.color ?? NO_ZONE_COLOR, !zone), title: row.item.name, keyboard: true })
        .bindPopup(popupHtml(row, shapes), { maxWidth: 300, minWidth: 240 })
        .addTo(layer);
    }
  }, [rows, located, shapes]);

  const startDrawing = (zoneId: ZoneId) => {
    const zone = ZONE_BY_ID.get(zoneId)!;
    const shape = shapes[zoneId];
    setInside(null);
    setNotice(null);
    mapRef.current?.closePopup();
    setDrawing({ zoneId, points: shape ? [...shape] : [] });
    // En celular el mapa queda arriba de la lista: se lleva a la vista para trazar.
    requestAnimationFrame(() => containerRef.current?.scrollIntoView({ block: 'center' }));
    if (shape) mapRef.current?.fitBounds(L.latLngBounds(shape.map((point) => [point.lat, point.lng] as L.LatLngTuple)), { padding: [40, 40] });
    else mapRef.current?.setView([zone.center.lat, zone.center.lng], 15);
  };

  const saveDrawing = async () => {
    if (!drawing || drawing.points.length < MIN_SHAPE_POINTS) return;
    const zone = ZONE_BY_ID.get(drawing.zoneId)!;
    setSavingShape(true);
    setError(null);
    try {
      await saveZoneShape(drawing.zoneId, drawing.points);
      const within = rows.filter((row) => row.item.coordinates
        && spotZone(row.item)?.id !== drawing.zoneId
        && insideShape(row.item.coordinates.lat, row.item.coordinates.lng, drawing.points));
      setInside(within.length > 0 ? { zoneId: drawing.zoneId, rows: within } : null);
      setNotice(`Trazo de ${zone.name} guardado.`);
      setDrawing(null);
    } catch (err) {
      setError(`No se pudo guardar el trazo: ${(err as Error).message}`);
    }
    setSavingShape(false);
  };

  const removeShape = async (zoneId: ZoneId) => {
    const zone = ZONE_BY_ID.get(zoneId)!;
    if (!window.confirm(`¿Quitar el trazo de ${zone.name}? Vuelve al círculo aproximado.`)) return;
    try {
      await saveZoneShape(zoneId, null);
      setNotice(`Se quitó el trazo de ${zone.name}.`);
    } catch (err) {
      setError(`No se pudo quitar el trazo: ${(err as Error).message}`);
    }
  };

  const assignInside = async () => {
    if (!inside) return;
    const zone = ZONE_BY_ID.get(inside.zoneId)!;
    const failed: string[] = [];
    for (const row of inside.rows) {
      try {
        await setRowZone(row, inside.zoneId);
      } catch {
        failed.push(row.item.name);
      }
    }
    setInside(null);
    setNotice(`${inside.rows.length - failed.length} lugares → ${zone.name}`);
    if (failed.length) setError(`No se pudo asignar: ${failed.join(', ')}`);
  };

  // Vista previa de lo que encontró OpenStreetMap, sin guardar.
  const focusPoint = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    previewRef.current?.remove();
    previewRef.current = L.marker([lat, lng], { icon: L.divIcon({ className: 'sa-map-preview', html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }), interactive: false }).addTo(map);
    map.setView([lat, lng], 17);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const focusZone = (zoneId: ZoneId | null) => {
    setFilters((current) => ({ ...current, zone: current.zone === zoneId ? null : zoneId }));
    const zone = zoneId ? ZONE_BY_ID.get(zoneId) : null;
    const shape = zoneId ? shapes[zoneId] : undefined;
    if (zone && filters.zone !== zoneId) {
      if (shape) mapRef.current?.fitBounds(L.latLngBounds(shape.map((point) => [point.lat, point.lng] as L.LatLngTuple)), { padding: [30, 30] });
      else mapRef.current?.setView([zone.center.lat, zone.center.lng], 15);
    } else mapRef.current?.setView(HOME, 13);
  };

  return (
    <main className="sa-main sa-map-page">
      <div className="sa-map-layout">
        <div className="sa-map-wrap">
          <div ref={containerRef} className="sa-map" role="application" aria-label="Mapa de zonas" />
          {!loaded && <p className="sa-map-loading">Cargando lugares...</p>}
          {drawing && (
            <div className="sa-map-draw" role="toolbar" aria-label="Trazar zona" style={{ '--zone-color': ZONE_BY_ID.get(drawing.zoneId)!.color } as React.CSSProperties}>
              <p>
                <strong>Trazando {ZONE_BY_ID.get(drawing.zoneId)!.name}</strong>
                <span>
                  {drawing.points.length < MIN_SHAPE_POINTS
                    ? `Toca el mapa para marcar el contorno (${drawing.points.length}/${MIN_SHAPE_POINTS} puntos mínimo).`
                    : `${drawing.points.length} puntos. Arrastra un punto para moverlo; tócalo para quitarlo.`}
                </span>
              </p>
              <div className="sa-map-draw__actions">
                <button type="button" onClick={() => setDrawing({ ...drawing, points: drawing.points.slice(0, -1) })} disabled={drawing.points.length === 0}>Deshacer</button>
                <button type="button" onClick={() => setDrawing({ ...drawing, points: [] })} disabled={drawing.points.length === 0}>Borrar todo</button>
                <button type="button" onClick={() => setDrawing(null)}>Cancelar</button>
                <button type="button" className="is-primary" onClick={() => void saveDrawing()} disabled={savingShape || drawing.points.length < MIN_SHAPE_POINTS}>
                  {savingShape ? 'Guardando…' : 'Guardar trazo'}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="sa-map-side">
          <div className="sa-map-filters">
            <label><input type="checkbox" checked={filters.spots} onChange={(event) => setFilters((current) => ({ ...current, spots: event.target.checked }))} /> Spots</label>
            <label><input type="checkbox" checked={filters.rack} onChange={(event) => setFilters((current) => ({ ...current, rack: event.target.checked }))} /> Rack</label>
            <label><input type="checkbox" checked={filters.onlyPending} onChange={(event) => setFilters((current) => ({ ...current, onlyPending: event.target.checked }))} /> Sólo sin zona</label>
          </div>

          <ul className="sa-map-legend" aria-label="Zonas">
            {ZONES.map((zone) => (
              <li key={zone.id}>
                <button
                  type="button"
                  className={filters.zone === zone.id ? 'is-active' : ''}
                  style={{ '--zone-color': zone.color } as React.CSSProperties}
                  onClick={() => focusZone(zone.id)}
                  aria-pressed={filters.zone === zone.id}
                >
                  <span className="sa-map-legend__dot" aria-hidden="true" />
                  <span className="sa-map-legend__name">{zone.name}</span>
                  <span className="sa-map-legend__count">{counts.byZone.get(zone.id) ?? 0}</span>
                </button>
                <button type="button" className="sa-map-legend__tool" onClick={() => startDrawing(zone.id)} disabled={Boolean(drawing)} title={shapes[zone.id] ? 'Editar trazo' : 'Trazar zona'} aria-label={`${shapes[zone.id] ? 'Editar trazo' : 'Trazar'} ${zone.name}`}>
                  <PenLine size={15} />
                </button>
                {shapes[zone.id] && (
                  <button type="button" className="sa-map-legend__tool" onClick={() => void removeShape(zone.id)} disabled={Boolean(drawing)} title="Quitar trazo" aria-label={`Quitar trazo de ${zone.name}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
            <li>
              <button type="button" className={filters.onlyPending ? 'is-active' : ''} style={{ '--zone-color': NO_ZONE_COLOR } as React.CSSProperties} onClick={() => setFilters((current) => ({ ...current, onlyPending: !current.onlyPending, zone: null }))}>
                <span className="sa-map-legend__dot is-pending" aria-hidden="true" />
                <span className="sa-map-legend__name">Sin zona</span>
                <span className="sa-map-legend__count">{counts.pending}</span>
              </button>
            </li>
          </ul>

          <p className="sa-hint">
            Toca un punto para cambiar su zona. Con <PenLine size={12} aria-label="el lápiz" /> trazas el contorno de una zona; los círculos punteados son aproximados mientras no la traces.
          </p>
          {notice && <p className="sa-map-notice" role="status">{notice}</p>}
          {(error ?? guidesError) && <p className="login-error">{error ?? guidesError}</p>}
          {inside && (
            <div className="sa-map-inside">
              <p>{inside.rows.length} {inside.rows.length === 1 ? 'lugar cae' : 'lugares caen'} dentro del trazo de {ZONE_BY_ID.get(inside.zoneId)!.name} y no {inside.rows.length === 1 ? 'es' : 'son'} de esa zona: {inside.rows.slice(0, 6).map((row) => row.item.name).join(', ')}{inside.rows.length > 6 ? '…' : ''}</p>
              <div>
                <button type="button" className="btn btn-primary" onClick={() => void assignInside()}>Asignarlos a {ZONE_BY_ID.get(inside.zoneId)!.short}</button>
                <button type="button" className="btn" onClick={() => setInside(null)}>Ahora no</button>
              </div>
            </div>
          )}

          <OsmCoords rows={rows} onFocus={focusPoint} />

          <h3 className="sa-map-side__title">Sin coordenadas <span>{withoutCoords.length}</span></h3>
          {withoutCoords.length === 0 ? (
            <p className="sa-hint">Todos los lugares visibles están en el mapa.</p>
          ) : (
            <ul className="sa-list">
              {withoutCoords.map((row) => (
                <li key={row.key} className={`sa-row${spotZone(row.item) ? '' : ' is-no-zone'}`}>
                  <RowImage src={row.item.imageUrl} name={row.item.name} />
                  <div className="sa-row__info">
                    <span className="sa-row__name">{row.item.name}</span>
                    <span className="sa-row__meta">{rowKind(row)}</span>
                  </div>
                  <ZoneSelectRow ariaLabel={`Zona de ${row.item.name}`} value={row.item.zone} onChange={(zoneId) => void assign(row.key, zoneId)} />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
