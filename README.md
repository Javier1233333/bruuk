# Bruuk

Bruuk es una guía editorial para descubrir Guadalajara a través de lugares, cultura local, rutas y recomendaciones seleccionadas por personas. La idea central es sencilla: menos pantalla, más mundo.

Sitio público: [bruuk.space](https://bruuk.space)

## Qué incluye

- Portada general y navegación por ciudad.
- Directorio de spots de Guadalajara.
- Rack de tiendas vintage, vinilos, antigüedades y tianguis.
- Radar y sus Señales: una comunidad activa de planes, eventos, aperturas y cosas que pasarán en la ciudad.
- Selección de diez museos y espacios culturales reales de Guadalajara y Zapopan.
- Formularios de comunidad, recomendaciones y registros para eventos.
- Integración con Beehiiv, Google Sheets mediante Apps Script y Resend.
- SEO específico por ruta, Open Graph, canonical, sitemap y robots.
- Experiencias móviles con scroll por bloques y progreso de lectura.

## Stack

- React 19
- TypeScript
- Vite 7
- React Router
- Framer Motion
- Leaflet
- Firebase
- Vercel Functions
- Vercel Analytics

## Desarrollo local

Requisitos:

- Node.js 20 o superior.
- npm.

Instala dependencias y levanta el proyecto:

```bash
npm install
npm run dev
```

Comandos disponibles:

```bash
npm run dev      # servidor de desarrollo
npm run build    # TypeScript, build de Vite y generación SEO
npm run preview  # previsualiza el build de producción
npm run lint     # ejecuta ESLint
```

El resultado de producción se genera en `dist/`.

## Variables de entorno

Las propuestas usan integraciones separadas para que no terminen en la hoja general:

```bash
# Hoja exclusiva para propuestas de ciudad
CITY_PROPOSALS_SCRIPT_URL=
CITY_PROPOSALS_SECRET=

# Hoja exclusiva para lugares y spots recomendados
PLACE_PROPOSALS_SCRIPT_URL=
PLACE_PROPOSALS_SECRET=
```

### Preparar las dos hojas de Google

1. Crea una hoja de cálculo para propuestas de ciudad.
2. Abre **Extensiones → Apps Script** y pega `scripts/google-apps-script-proposals.gs`.
3. En **Configuración del proyecto → Propiedades del script**, crea `PROPOSALS_SECRET` con el mismo valor que usarás en `CITY_PROPOSALS_SECRET`.
4. Despliega como aplicación web, con acceso para cualquier usuario, y copia la URL en `CITY_PROPOSALS_SCRIPT_URL`.
5. Repite el proceso en otra hoja para lugares. Usa otro secreto y coloca su URL y secreto en `PLACE_PROPOSALS_SCRIPT_URL` y `PLACE_PROPOSALS_SECRET`.

Ambas hojas crearán automáticamente una pestaña llamada `Respuestas` con sus encabezados. Las URLs y secretos solo deben configurarse en Vercel; nunca deben usar el prefijo `VITE_` ni incluirse en el frontend.


## Rutas principales

| Ruta | Contenido |
| --- | --- |
| `/` | Portada de Bruuk |
| `/guadalajara` | Entrada de la ciudad |
| `/guadalajara/spots` | Directorio de spots |
| `/guadalajara/rack` | Vintage, vinilos, archivo y tianguis |
| `/radar` | Archivo editorial Radar |
| `/radar/museo-cabanas-cafe-redescubrimiento` | Artículo del Museo Cabañas |
| `/radar/maz-desayuno-cafe-zapopan` | Recorrido del MAZ y Zapopan Centro |
| `/guadalajara/ruta-museos` | Selector de museos y espacios culturales |
| `/lleva-bruuk` | Recomendar un lugar o sumar una ciudad |
| `/privacidad` | Aviso de privacidad |

Las rutas antiguas de planes, administración y descubrimiento redirigen a las secciones públicas vigentes.

## API

Las funciones dentro de `api/` se despliegan como Vercel Functions.

| Endpoint | Destino |
| --- | --- |
| `POST /api/city-proposal` | Hoja exclusiva de propuestas de ciudad |
| `POST /api/place-proposal` | Hoja exclusiva de lugares y spots |
| `POST /api/sheets` | Perfiles generales de Radar |


Los formularios públicos incluyen un campo trampa `website` y validación básica en servidor. Cada Apps Script comprueba su secreto antes de escribir en su hoja. El rate limiting por IP todavía no está implementado y debe añadirse antes de exponer campañas de alto tráfico.



## SEO

La configuración vive en `src/data/seo.json`. Durante `npm run build`, `scripts/generate-seo-pages.mjs` crea HTML específico para cada ruta, además de:

- `sitemap.xml`
- `robots.txt`
- canonical por página
- Open Graph
- Twitter Cards
- metadatos de artículos

Si agregas una ruta pública, añade también su entrada SEO y su rewrite en `vercel.json`.


## Despliegue

El proyecto está preparado para Vercel:

1. Configura las variables de entorno.
2. Ejecuta `npm run build` localmente.
3. Publica el repositorio o conecta el proyecto con Vercel.

`vercel.json` conserva las funciones bajo `/api/*` y sirve HTML específico para las rutas que necesitan SEO.

## Criterio editorial

La voz de Bruuk busca ser directa, real y sencilla. Las recomendaciones deben partir de visitas o investigación verificable y evitar lenguaje promocional genérico. Antes de publicar horarios, precios o condiciones de acceso, comprueba la fuente oficial del lugar.
