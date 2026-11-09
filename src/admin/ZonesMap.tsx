import { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZONES, ZONE_BY_ID, spotZone, suggestZoneFor, type ZoneId } from '../lib/zones';
import { RowImage } from './adminShared';
import type { RackDoc, SpotDoc } from './spotsStore';
import { ZoneSelectRow } from './ZoneSelect';
import { placeRows, rowKind, setRowZone, type PlaceRow } from './zoneRows';

/* ============================================================
   Mapa por zonas: el círculo de cada una de las 7 zonas, cada
   spot y lugar de Rack como un punto del color de su zona (gris
   punteado si no tiene). Al tocar un punto se le asigna la zona
   ahí mismo. Lo que no tiene coordenadas va en la lista de al lado.
   ============================================================ */

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

function popupHtml(row: PlaceRow) {
  const zone = spotZone(row.item);
  const suggested = zone ? undefined : suggestZoneFor(row.item);
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
    const map = L.map(containerRef.current, { center: [20.68, -103.37], zoom: 13, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    for (const zone of ZONES) {
      L.circle([zone.center.lat, zone.center.lng], { radius: zone.radiusKm * 1000, color: zone.color, weight: 2, fillColor: zone.color, fillOpacity: 0.12, interactive: false }).addTo(map);
      L.marker([zone.center.lat, zone.center.lng], {
        icon: L.divIcon({ className: 'sa-map-label', html: `<span style="--zone-color:${zone.color}">${escapeHtml(zone.short)}</span>`, iconSize: [0, 0] }),
        interactive: false,
        keyboard: false,
      }).addTo(map);
    }
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

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
        .bindPopup(popupHtml(row), { maxWidth: 300, minWidth: 240 })
        .addTo(layer);
    }
  }, [rows, located]);

  const focusZone = (zoneId: ZoneId | null) => {
    setFilters((current) => ({ ...current, zone: current.zone === zoneId ? null : zoneId }));
    const zone = zoneId ? ZONE_BY_ID.get(zoneId) : null;
    if (zone && filters.zone !== zoneId) mapRef.current?.setView([zone.center.lat, zone.center.lng], 15);
    else mapRef.current?.setView([20.68, -103.37], 13);
  };

  return (
    <main className="sa-main sa-map-page">
      <div className="sa-map-layout">
        <div className="sa-map-wrap">
          <div ref={containerRef} className="sa-map" role="application" aria-label="Mapa de zonas" />
          {!loaded && <p className="sa-map-loading">Cargando lugares...</p>}
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

          <p className="sa-hint">Toca un punto para cambiar su zona. Los círculos son aproximados: la zona la decides tú.</p>
          {notice && <p className="sa-map-notice" role="status">{notice}</p>}
          {error && <p className="login-error">{error}</p>}

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
