# Bruuk app (React Native)

App de Bruuk para iOS y Android hecha con Expo (SDK 58) y Expo Router. Vive junto a la web en el mismo repositorio y **comparte el catálogo** con ella: los lugares salen de `../src/data/planBuilder.ts` (que lee `spots.json`, `atardeceres.json` y `lugares-mapa-gdl.json`), así que un spot agregado a la web aparece en la app sin copiar nada.

## Pantallas

| Pestaña / ruta | Qué hace |
|---|---|
| Inicio (`/`) | Portada, accesos a cada sección y spots destacados |
| Comer (`/comer`) | Cafés, comida y noche con búsqueda y filtros |
| Rack (`/rack`) | Vintage, tianguis, vinilos y cultura |
| Tu plan (`/plan`) | "Arma tu plan": mismas preguntas que la web, usa `POST /api/custom-plan` |
| Más (`/mas`) | Sube un spot, atardeceres, Señales, ruta de museos, contacto, privacidad |
| `/lugar/[id]` | Detalle de un lugar con "Ve por" y "Cómo llegar" |
| `/atardeceres` | Miradores |
| `/sube-un-spot` | Formulario que usa `POST /api/place-proposal` |

Las imágenes y las APIs se piden a `extra.siteUrl` de `app.json` (`https://bruuk.space`). "Arma tu plan" necesita que `api/custom-plan.ts` esté desplegado ahí.

## Desarrollo

```bash
cd mobile
npm install
npm start          # abre Expo; escanea el QR con Expo Go
npm run typecheck
```

Instala dependencias con `npx expo install <paquete>` para que la versión sea compatible con el SDK.

## Publicar en tiendas

Con EAS no hace falta Xcode ni Android Studio:

```bash
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

Los identificadores son `space.bruuk.app` (iOS y Android). Antes de publicar falta reemplazar los íconos y el splash de `assets/` por los de Bruuk.
