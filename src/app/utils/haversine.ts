// Haversine distance in km between two coordinates
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const aa =
    sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) *
    Math.cos(b.lat * Math.PI / 180) *
    sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function estimateTravelMin(
  a: { lat: number; lng: number } | undefined,
  b: { lat: number; lng: number } | undefined,
  mode: 'walk' | 'drive'
): number | null {
  if (!a || !b) return null;
  const d = haversineKm(a, b);
  return mode === 'walk'
    ? Math.ceil((d / 4.5) * 60)
    : Math.ceil((d / 25) * 60);
}
