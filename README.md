# Bruuk

Bruuk es una guía editorial para descubrir Guadalajara a través de lugares, cultura local, rutas y recomendaciones seleccionadas por personas. La idea central es sencilla: menos pantalla, más mundo.

Sitio público: [bruuk.space](https://bruuk.space)

## Qué incluye

- Portada general y navegación por ciudad.
- Directorio de spots de Guadalajara.
- Rack de tiendas vintage, vinilos, antigüedades y tianguis.
- Radar editorial con artículos y recorridos escritos desde una voz local.
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


Los formularios públicos incluyen un campo trampa `website` y validación básica en servidor. El Apps Script debe comprobar `SHEETS_SECRET` antes de escribir en la hoja. El rate limiting por IP todavía no está implementado y debe añadirse antes de exponer campañas de alto tráfico.



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
