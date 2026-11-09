import Constants from 'expo-constants';

// Versión de app.json: en un build de EAS es la que se publicó en la tienda, y con
// runtimeVersion "appVersion" una actualización OTA nunca la cambia. (En Expo Go,
// expo-application daría la versión de Expo Go, no la de Bruuk.)
export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

// "1.10.0" > "1.9.2". Lo que no es número cuenta como 0.
export function isOlder(version: string, than: string) {
  const parts = (value: string) => value.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const [a, b] = [parts(version), parts(than)];
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) < (b[index] ?? 0);
  }
  return false;
}
