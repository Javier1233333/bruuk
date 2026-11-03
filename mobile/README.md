# Bruuk app (React Native)

App de Bruuk para iOS y Android hecha con Expo (SDK 58) y Expo Router. Es la versión nativa del modo app de bruuk.space: **Inicio · Rack · + · Plan · Momentos**, con login obligatorio (Firebase Auth). Esta primera versión no tiene pagos ni eventos.

## Todo el contenido sale de la API

La app no trae el contenido "horneado": al abrir pide `GET https://bruuk.space/api/app` y pinta lo que llegue. Así, **cambiar contenido nunca obliga a publicar otra versión**:

| Quieres cambiar… | Dónde |
|---|---|
| Spots, Rack, hotspots de la semana, colonias | El admin de la web (`/admin/spots`). Firestore → `/api/app` en ~1 minuto. |
| Textos de portada, aviso (banner), enlaces | Firestore `meta/app` (campos `copy`, `banner`, `links`) |
| Prender o apagar Ruleta, 5 preguntas, Momentos, Sube un spot | Firestore `meta/app.features` |
| Obligar a actualizar una versión vieja | Firestore `meta/app.minVersion` (p. ej. `"1.1.0"`) |
| Código de la app (pantallas, diseño) | `eas update` (actualización OTA, ver abajo) |

Los valores por defecto de `meta/app` están en `../src/data/appConfig.ts`; cualquier campo que falte o tenga un tipo equivocado se ignora. Ejemplo de documento `meta/app`:

```json
{
  "minVersion": "1.0.0",
  "features": { "momentos": true, "ruleta": true },
  "copy": { "homeTitle": "Menos pantalla.", "homeAccent": "Más mundo." },
  "banner": { "text": "Nuevo: hotspots de la semana", "url": "https://bruuk.space" },
  "links": { "ios": "https://apps.apple.com/…", "android": "https://play.google.com/…" }
}
```

Sin internet, la app abre con lo último que descargó (AsyncStorage) o, la primera vez, con el catálogo empaquetado de `../src/data`.

## Pantallas

| Ruta | Qué hace |
|---|---|
| `(tabs)/index` | Inicio: aviso, filtros (Cafés, Comida, Bares, Atardeceres), hotspots primero y el resto al azar |
| `(tabs)/rack` | Tiendas, antigüedades, tianguis y cultura; búsqueda, lista o cuadrícula |
| `(tabs)/plan` | Ruleta y 5 preguntas con `POST /api/custom-plan`; compartir el plan como imagen 1080×1920 |
| `(tabs)/momentos` | Diario de fotos sólo en el teléfono: camino de círculos, "Tus 3", historias, respaldo compatible con la web |
| `sube-un-spot` | El "+" de la barra: 5 pasos, `POST /api/place-proposal` |
| `lugar/[id]`, `atardeceres`, `cuenta`, `login` | Detalle, miradores, cuenta (incluye borrar cuenta, que pide Apple) y login |

Las llamadas a la API mandan el ID token de Firebase: el límite de planes cuenta por cuenta y no por IP.

## Desarrollo

```bash
cd mobile
npm install
npm start          # abre Expo; escanea el QR con Expo Go
npm run typecheck
npm run icons      # regenera íconos y splash desde ../public/favicon.svg
```

Instala dependencias con `npx expo install <paquete>` para que la versión sea compatible con el SDK.

## Publicar

Una sola vez, para ligar el proyecto a tu cuenta de Expo y prender las actualizaciones OTA:

```bash
npx eas-cli@latest init
npx eas-cli@latest update:configure
```

Builds (no hace falta Xcode ni Android Studio):

```bash
npx eas-cli@latest build --profile preview --platform android   # APK para probar en tu teléfono
npx eas-cli@latest build --profile production --platform all    # para las tiendas
npx eas-cli@latest submit --platform all
```

Cambios de código sin pasar por la tienda (misma versión de app):

```bash
npx eas-cli@latest update --channel production --message "lo que cambió"
```

La app los descarga al abrir y los aplica en el siguiente arranque. Si cambias algo nativo (un paquete nuevo con código nativo, permisos, íconos), sube `version` en `app.json` y haz un build nuevo. Cuando la app esté en las tiendas, pon sus enlaces en `meta/app.links.ios` / `links.android`.
