export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export interface IGeolocationAdapter {
  getCurrentPosition(): Promise<GeolocationPosition>;
}

export let geoAdapter: IGeolocationAdapter;

export function setGeoAdapter(adapter: IGeolocationAdapter) {
  geoAdapter = adapter;
}
