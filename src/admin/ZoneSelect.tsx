import { MapPin } from 'lucide-react';
import { ZONES, suggestZone, zoneIdFrom } from '../lib/zones';
import { useZoneGuides } from './useZoneGuides';

type Props = {
  id?: string;
  value: string | null | undefined;
  coordinates?: { lat: number; lng: number } | null;
  onChange: (zoneId: string | null) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

// Las 7 zonas + "Sin zona". La sugerencia (trazo o círculo) sólo se muestra: asignar es a mano.
export function ZoneSelect({ id, value, coordinates, onChange, disabled, ariaLabel, className = '' }: Props) {
  const current = zoneIdFrom(value) ?? '';
  const { shapes } = useZoneGuides();
  const suggested = suggestZone(coordinates?.lat, coordinates?.lng, shapes);
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      className={`${className}${current ? '' : ' is-no-zone'}`}
      value={current}
      onChange={(event) => onChange(event.target.value || null)}
      disabled={disabled}
    >
      <option value="">{suggested ? `Sin zona (sugerida: ${suggested.short})` : 'Sin zona'}</option>
      {ZONES.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
    </select>
  );
}

// Versión con ícono para las filas de las listas.
export function ZoneSelectRow(props: Props) {
  return (
    <label className="sa-zone-select">
      <MapPin size={15} aria-hidden="true" />
      <ZoneSelect {...props} />
    </label>
  );
}
