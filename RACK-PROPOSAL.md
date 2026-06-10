# RACK por BRUUK — Propuesta de Producto, UX y Arquitectura

> "No es una tienda. Es un rack. El tuyo, el mío, el de todos."

---

## 0. Filosofía Central

Rack no es un e-commerce. Es una **extensión física del universo Bruuk** que vive en digital. La metáfora es literal: un rack es un perchero, una estantería — un lugar donde las cosas se tocan, se huelen, se prueban. Cada pieza tiene historia. Cada creador tiene nombre.

**La promesa:** Cuando entras a Rack, no estás comprando — estás explorando un espacio curado. Piezas pre-owned con segunda vida. Cosas artesanales con alma. Sin ruido, sin algoritmo. Solo lo que vale la pena.

**Sobre eventos:** Los eventos Bruuk viven en su propio mundo. En Rack solo aparece un bloque informativo ("Lo que viene en Bruuk") como recordatorio de que la comunidad sigue activa — pero no se mezclan con la experiencia de compra. Rack es tienda. Bruuk es comunidad. Se complementan, no se fusionan.

---

## 1. Estrategia de UX y Flujo de Usuario

### El Problema a Resolver
Rack debe sentirse como un espacio con personalidad propia, no como un catálogo frío. Pero su misión es clara: **vender piezas curadas** (pre-owned y artesanal). Los eventos Bruuk se mencionan como contexto, nunca como parte del flujo de compra.

### Concepto de Navegación: "El Rack"

El usuario navega una tienda curada. Dos mundos de producto (pre-owned y artesanal) conviven en un solo feed, diferenciados por tags visuales. Simple, directo, sin fricción.

```
ARQUITECTURA DE NAVEGACION
===========================

bruuk.com/rack                    <- Landing / Puerta de entrada
bruuk.com/rack/explorar           <- Feed de productos (pre-owned + artesanal)
bruuk.com/rack/pieza/[slug]       <- Detalle de producto
bruuk.com/rack/drops              <- Proximos drops de producto
```

### Filtrado Simple

Tags toggle horizontales en el feed:

```
[ TODO ]  [ PRE-OWNED ]  [ ARTESANAL ]
```

"TODO" activo por defecto. Sin subcategorías. Sin complejidad. El catálogo será pequeño y curado — no necesita filtros avanzados.

### Flujo del Usuario (Happy Path)

```
1. LLEGA    -> Landing de Rack (Hero impactante, primera impresion)
2. EXPLORA  -> Scrollea el feed, ve piezas con historia y precio
3. SE DETIENE -> Abre una pieza. Lee la historia, ve el estado, ve al creador
4. CONECTA  -> Ve quien es el artesano/vendedor (CreatorChip)
5. ACTUA    -> Aparta la pieza (o la compra)
6. VUELVE   -> "Drops" le da razon para regresar cada semana
```

### Bloque de Eventos Bruuk (Separado)

Al final del landing (antes del CTA), un bloque simple muestra los próximos 2-3 eventos Bruuk. No es interactivo dentro de Rack — solo informa y linkea al ecosistema Bruuk principal. Es un recordatorio: "Esto es parte de algo más grande."

---

## 2. Estructura de la Landing Page (Wireframe de Contenido)

### Seccion 1: HERO — "La Puerta"
**Objetivo psicologico:** Ruptura. El usuario debe sentir que cruzó un umbral. No es Bruuk normal, es algo nuevo pero familiar.

```
+---------------------------------------------------------+
|                                                         |
|  [Tag: NUEVO]                                           |
|                                                         |
|  RACK.                                                  |
|  (display-xl, glitch-loop, offset shadow indigo)        |
|                                                         |
|  "Piezas con historia. Hechas a mano o                  |
|   con segunda vida. Curadas por Bruuk."                 |
|  (lead-text con borde izquierdo indigo)                 |
|                                                         |
|  [ EXPLORAR RACK -> ]    [ VER DROPS ]                  |
|  (btn-primary)            (btn-secondary)               |
|                                                         |
|  --- Ticker horizontal ----------------------------     |
|  "PIEZAS UNICAS * MODA CIRCULAR * HECHO A MANO *       |
|   CURADURIA BRUUK * RACK *"                             |
|  (rotado -2deg, fondo indigo, texto blanco)             |
|                                                         |
+---------------------------------------------------------+
```

**Notas para diseno:** Reutilizar `.ticker-wrap` con nuevo copy. Hero con glow radial sutil de fondo.

---

### Seccion 2: FEED PREVIEW — "El Vistazo"
**Objetivo psicologico:** Curiosidad inmediata. Mostrar que aquí hay cosas reales, tangibles, ya disponibles.

```
+---------------------------------------------------------+
|                                                         |
|  / AHORA EN EL RACK         (section tag, tracking 4px) |
|                                                         |
|  +----------+  +----------+  +----------+               |
|  | PRE-OWNED|  | ARTESANAL|  | PRE-OWNED|               |
|  | Chamarra |  | Ceramica |  | Levi's   |               |
|  | vintage  |  | oaxaquena|  | 501 '92  |               |
|  |          |  |          |  |          |               |
|  | $850     |  | $340     |  | $620     |               |
|  | [PIEZA   |  | [HECHO   |  | [PIEZA   |               |
|  |  UNICA]  |  |  A MANO] |  |  UNICA]  |               |
|  +----------+  +----------+  +----------+               |
|                                                         |
|  Grid de 3 cols desktop / scroll horizontal mobile      |
|  Cards con border 2px, shadow offset, hover lift        |
|                                                         |
|              [ VER TODO -> ]                            |
|                                                         |
+---------------------------------------------------------+
```

**Detalle clave de las cards:**
- **Imagen cuadrada arriba** (o color placeholder si no hay foto), nombre en Outfit 800 uppercase, precio en accent-text
- **Badge de categoria:** "PRE-OWNED" en verde (--rack-circular) o "ARTESANAL" en ambar (--rack-artesanal)
- **Badge de stock:** "PIEZA UNICA" en coral (--rack-pieza-unica) cuando solo hay 1

---

### Seccion 3: CATEGORIAS — "Los Dos Mundos"
**Objetivo psicologico:** Claridad. Despues de la emocion, dar estructura. Dos caminos claros.

```
+---------------------------------------------------------+
|                                                         |
|  +---------------------------+ +------------------------+|
|  |                           | |                        ||
|  |  PRE-OWNED                | |  ARTESANAL             ||
|  |                           | |                        ||
|  |  Moda con segunda         | |  Hecho a mano,         ||
|  |  vida. Curada,            | |  con alma. Piezas      ||
|  |  verificada,              | |  unicas de creadores   ||
|  |  con caracter.            | |  locales.              ||
|  |                           | |                        ||
|  |  [12 PIEZAS]              | |  [8 PIEZAS]            ||
|  |                           | |                        ||
|  |  -> EXPLORAR              | |  -> EXPLORAR           ||
|  |                           | |                        ||
|  +---------------------------+ +------------------------+|
|                                                         |
|  Dos cards grandes, 50/50 del ancho                     |
|  Cada una con color de fondo sutil de su categoria      |
|                                                         |
+---------------------------------------------------------+
```

**Diferenciacion visual:**
- **Pre-owned:** Tag `CIRCULAR` en verde (#52c41a). Icono de refresh/loop.
- **Artesanal:** Tag `HECHO A MANO` en ambar (#e8a045). Icono de palette/manos.

---

### Seccion 4: LA HISTORIA — "El Porque"
**Objetivo psicologico:** Conexion emocional. Explicar por que existe Rack. Plantar la semilla de la tienda fisica.

```
+---------------------------------------------------------+
|                                                         |
|  / POR QUE RACK             (section tag)               |
|                                                         |
|  +---------------------+--------------------------+     |
|  |                     |                          |     |
|  |  "QUERIAMOS UN      |  "Empezo como una idea   |     |
|  |   LUGAR DONDE       |   simple: un rack con    |     |
|  |   LAS COSAS         |   piezas que merecen     |     |
|  |   TUVIERAN          |   una segunda vida.      |     |
|  |   HISTORIA."        |   Artesanos locales con  |     |
|  |                     |   talento que nadie ve.  |     |
|  |  (display-md,       |   Un espacio donde cada  |     |
|  |   outline-text)     |   objeto cuenta algo."   |     |
|  |                     |                          |     |
|  +---------------------+--------------------------+     |
|                                                         |
|  +-----------------------------------------------------+|
|  |  "PRONTO: UN ESPACIO FISICO. TU RACK."               ||
|  |  (display-sm, con glitch sutil, centered)             ||
|  +-----------------------------------------------------+|
|                                                         |
+---------------------------------------------------------+
```

**Notas:** Reutiliza `.nos-layout` (grid 2 cols) del landing actual.

---

### Seccion 5: DROPS — "Lo Que Viene"
**Objetivo psicologico:** Anticipacion y retorno. Crear el habito de volver a Rack cada semana. Solo drops de producto.

```
+---------------------------------------------------------+
|                                                         |
|  / DROPS                    (section tag)               |
|                                                         |
|  "CADA SEMANA, ALGO NUEVO."                             |
|  (display-sm)                                           |
|                                                         |
|  +-----------------------------------------------------+|
|  |  18 JUN  |  Drop: Camisas vintage            | 5 pzs||
|  +----------+------------------------------------+------+|
|  |  22 JUN  |  Coleccion ceramica Oaxaca         | 3 pzs||
|  +----------+------------------------------------+------+|
|  |  28 JUN  |  Denim seleccion 90s               | 4 pzs||
|  +----------+------------------------------------+------+|
|  |  02 JUL  |  Bolsas tejidas a mano             | 2 pzs||
|  +-----------------------------------------------------+|
|                                                         |
|  Tabla brutalist. Bordes 2px. Hover lift.               |
|  Cada fila clickeable (lleva al drop o "proximamente")  |
|                                                         |
+---------------------------------------------------------+
```

---

### Seccion 6: WRAP DE EVENTOS BRUUK — "El Mundo Mas Grande"
**Objetivo psicologico:** Recordar que Rack es parte de Bruuk. No vender eventos, solo informar. Puente hacia la comunidad.

```
+---------------------------------------------------------+
|                                                         |
|  / EN BRUUK                 (section tag)               |
|                                                         |
|  "RACK ES PARTE DE ALGO MAS GRANDE."                   |
|  (display-sm, muted)                                    |
|                                                         |
|  +----------------+  +----------------+                 |
|  | Mercado        |  | Taller de      |                 |
|  | Nocturno       |  | Serigrafia     |                 |
|  | Vol.3          |  |                |                 |
|  |                |  |                |                 |
|  | 15 JUN         |  | 22 JUN         |                 |
|  +----------------+  +----------------+                 |
|                                                         |
|  Solo 2-3 eventos. Cards simples, sin CTA de compra.    |
|  Link: "VER MAS EN BRUUK ->"  (lleva al site principal) |
|                                                         |
+---------------------------------------------------------+
```

**Notas clave:**
- Este bloque es **informativo, no transaccional**
- Cards minimas: titulo + fecha. Sin boton de "asistir" ni contador de asistentes
- Un solo link al final que lleva fuera de Rack, de vuelta a Bruuk
- Visualmente mas tenue: usa `--fg2` (texto secundario) en lugar del blanco puro

---

### Seccion 7: CTA FINAL — "La Invitacion"
**Objetivo psicologico:** Cierre con urgencia suave. No vender, invitar.

```
+---------------------------------------------------------+
|                                                         |
|  +--- Bloque rotado 1deg, fondo indigo ---------------+ |
|  |                                                    |  |
|  |  "ESTO APENAS EMPIEZA."                            |  |
|  |  (display-lg, blanco, text-shadow negro)           |  |
|  |                                                    |  |
|  |  "Piezas que merecen una segunda vida.             |  |
|  |   Creadores que merecen ser vistos.                |  |
|  |   Un rack para los que buscan distinto."           |  |
|  |  (body, fondo negro inline, rotado -1deg)          |  |
|  |                                                    |  |
|  |  [ ENTRAR AL RACK -> ]                             |  |
|  |  (btn invertido: fondo negro, border blanco)       |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                         |
+---------------------------------------------------------+
```

**Notas:** Replica `.newsletter-wrapper` (rotado 1deg, fondo accent, shadow 12px). Solo cambia copy.

---

## 3. Guia para el Disenador UI

### Identidad Visual de Rack (Dentro del DS de Bruuk)

Rack vive dentro de Bruuk pero tiene su **temperatura** propia. No es un rebrand — es una **modulacion**.

### Que Mantener Exactamente Igual
- **Tipografia:** Outfit en todos los pesos. Sin excepciones.
- **Border radius:** 0px. Siempre. Es la firma de Bruuk.
- **Shadows:** Offset sin blur. Neo-brutalist.
- **Animaciones:** Glitch, slideUpHush, hover lift. Todo se reutiliza.
- **Espaciado:** Mismos tokens `--space-*`.
- **Fondo base:** `#09090f` y `#111120`.

### Que Modular para Rack

**1. Paleta extendida (sin romper el sistema)**

Rack necesita diferenciar dos categorias de producto + un estado de urgencia:

```css
/* Rack-specific color extensions */
--rack-circular:    #52c41a;  /* verde — ya existe como --color-success */
--rack-artesanal:   #e8a045;  /* ambar calido — nuevo, contrasta bien en dark */
--rack-pieza-unica: #ff6b6b;  /* coral/rojo suave — urgencia de "solo hay una" */
```

Estos colores solo se usan en **tags, badges y bordes laterales**, nunca como fondos principales. El 90% de la UI sigue siendo monocromatica dark + indigo.

**2. Textura fotografica**

A diferencia del Bruuk actual (sin fotos), Rack **necesita** imagenes de producto. Directrices:

- **Fotos cuadradas** (1:1) para productos en grid
- **Tratamiento:** Ligeramente desaturadas, contraste alto. No glossy, no stock. Vibe: foto tomada en un departamento con luz natural, no en estudio.
- **Fallback sin foto:** Color solido de la categoria (--rack-circular o --rack-artesanal) con el icono centrado en blanco
- **Hover sobre imagen:** Overlay semitransparente `rgba(9, 9, 15, 0.6)` con el precio en grande

**3. Componentes nuevos a disenar**

| Componente | Base del DS | Modificacion para Rack |
|---|---|---|
| **ProductCard** | `.feature-card` | Imagen superior, precio, badge de categoria + stock. Hover lift + shadow. |
| **PriceTag** | `.hero-badge` | Fondo negro, texto blanco, peso 800. Estilo "etiqueta de precio" cruda. |
| **StockBadge** | Tag component del app | "PIEZA UNICA" en --rack-pieza-unica. "DISPONIBLE" en verde. "AGOTADO" en --fg2 con line-through. |
| **DropRow** | Nuevo (tabla) | Fila horizontal: fecha / titulo / cantidad. Border 2px, hover lift, click full row. |
| **CategoryBlock** | `.feature-card` | Version grande (50% ancho). Color de fondo sutil de la categoria. Icono grande rotado. |
| **CreatorChip** | `Avatar` del app | Avatar + nombre del artesano/vendedor. Clickeable a su perfil/historia. |
| **BruukEventMini** | Nuevo (simple) | Card minima para el wrap de eventos: titulo + fecha, sin interactividad de compra. Tono muted. |

**4. Micro-identidad tipografica**

El titulo "RACK." se trata con respeto especial:
- Siempre en **display-xl** (peso 900, 6rem)
- Siempre con el **punto final** (como "BRUUK.")
- Shadow offset: `4px 4px 0px` en indigo (igual que `.brand-text`)
- Opcionalmente con `glitch-loop` ambient

Cuando aparece junto al logo de Bruuk:
```
BRUUK.
  +-- RACK.   (display-sm debajo, indented, como sub-marca)
```

**5. Tono visual general**

Si Bruuk es "night city digital", Rack es **"mercado nocturno urbano"**. Misma oscuridad, misma energia, pero con mas textura, mas tangibilidad. Las fotos de producto y los nombres de artesanos humanizan el espacio sin perder la estetica neo-brutalist.

---

## 4. Notas para el Implementador / Desarrollador

### Stack y Estructura

Rack vive dentro del proyecto Bruuk existente (React + TypeScript + Vite). No es un proyecto separado.

```
src/
  rack/
    RackLanding.tsx         <- Landing page (secciones 1-7 del wireframe)
    RackExplore.tsx         <- Feed de productos con filtros
    RackProductDetail.tsx   <- Detalle de pieza
    RackDrops.tsx           <- Calendario de proximos drops de producto
    components/
      ProductCard.tsx
      PriceTag.tsx
      StockBadge.tsx
      DropRow.tsx
      CategoryBlock.tsx
      CreatorChip.tsx
      FilterBar.tsx         <- Barra de filtros toggle (TODO / PRE-OWNED / ARTESANAL)
      BruukEventMini.tsx    <- Card minima para wrap de eventos Bruuk (solo informativo)
    hooks/
      useRackProducts.ts    <- Fetch + cache de productos
    types/
      rack.ts               <- Interfaces de Product, Creator, Drop
    rack.css                <- Estilos especificos de Rack (extiende index.css)
```

### Routing

Agregar al router existente:
```tsx
<Route path="/rack" element={<RackLanding />} />
<Route path="/rack/explorar" element={<RackExplore />} />
<Route path="/rack/pieza/:slug" element={<RackProductDetail />} />
<Route path="/rack/drops" element={<RackDrops />} />
```

### Modelo de Datos

```typescript
interface RackProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: 'MXN';
  category: 'pre-owned' | 'artesanal';
  status: 'disponible' | 'apartado' | 'agotado';
  images: string[];
  creator?: Creator;
  tags: string[];
  createdAt: string;
  condition?: string;       // Solo para pre-owned: "Excelente", "Bueno", "Con caracter"
  story?: string;           // Historia de la pieza (quien la uso, de donde viene)
}

interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  color: string;  // Fallback color (como en el app actual)
}

interface Drop {
  id: string;
  date: string;
  title: string;
  category: 'pre-owned' | 'artesanal';
  pieceCount: number;       // Cuantas piezas vienen en este drop
  teaser?: string;
}
```

### Manejo de Stock (Pieza Unica)

Esto es critico. La mayoria del inventario sera de **1 unidad**. Consideraciones:

**1. Optimistic UI con validacion server-side**
```
- Usuario ve "DISPONIBLE" -> hace click en "APARTAR"
- UI cambia a "APARTANDO..." inmediatamente (optimistic)
- Server valida que sigue disponible (race condition check)
- Si otro usuario ya la aparto -> revert UI, mostrar "ALGUIEN SE ADELANTO"
- Si exito -> "APARTADA POR 15 MIN" (timer visible)
```

**2. Estados de stock visibles**
```
DISPONIBLE  -> badge verde, boton activo
APARTADO    -> badge amarillo, "Alguien la tiene en su carrito" (sin boton)
AGOTADO     -> badge gris, line-through en precio, card visible con "YA NO ESTA"
```

**3. Real-time (opcional pero recomendado)**
Si usan Supabase (ya lo tienen en el proyecto), pueden usar Realtime subscriptions para actualizar el status de stock sin refresh.

### Micro-interacciones Clave

**1. Card hover (ya existe, adaptar)**
```css
.rack-card {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.rack-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 6px 6px 0px var(--color-accent);
  border-color: var(--color-accent);
}
```

**2. Filtros toggle (nuevo)**
```
Click en filtro -> El tag se llena de indigo (fondo accent, texto blanco)
Los cards que no aplican -> fadeOut 0.2s + scale(0.95)
Los que si -> re-layout con stagger de 50ms por card
Usar CSS view-transition o Framer Motion AnimatePresence
```

**3. Stock badge pulse**
```
Cuando un producto cambia a "AGOTADO" en real-time:
- El badge hace un flash rojo breve (0.3s)
- La card se desatura ligeramente (filter: brightness(0.7))
- No desaparece — muestra que "esto se fue, llega temprano la proxima"
```

**4. Scroll del feed**
```
slideUpHush ya existe. Aplicar con IntersectionObserver:
- Cada card entra con .animate-fade-in al entrar al viewport
- Stagger de 100ms entre cards visibles simultaneamente
- Solo animar la primera vez (flag en state o data-attribute)
```

**5. Ticker de Rack**
```
Reutilizar .ticker-wrap. Nuevo contenido:
"PIEZAS UNICAS * MODA CIRCULAR * HECHO A MANO * CURADURIA BRUUK * RACK *"
Repetir 3x para seamless loop.
```

### Backend / Data

**Opcion A (MVP rapido):** Supabase (ya integrado)
- Tabla `rack_products`, `rack_creators`, `rack_drops`
- Supabase Storage para imagenes de producto
- Supabase Realtime para status de stock
- Row Level Security para que solo admins editen productos

**Opcion B (mas adelante):** Si necesitan checkout real, integrar Stripe con Supabase Edge Functions. Pero para el MVP, "APARTAR" puede ser un form que envia a WhatsApp o genera un registro en Supabase que el equipo gestiona manualmente.

### Performance

- **Imagenes:** Usar `<img loading="lazy">` para todo el grid. Formatos WebP con fallback.
- **Feed:** Paginar a 12 items iniciales, infinite scroll con IntersectionObserver.
- **Filtros:** Client-side filtering (el dataset sera pequeno, < 100 items). No necesita server round-trip.

---

## 5. Resumen Ejecutivo para el Equipo

| Rol | Que hacer primero |
|---|---|
| **Disenador UI** | Disenar ProductCard y CategoryBlock en Figma usando el DS existente. Agregar los 3 colores nuevos (circular, artesanal, pieza-unica). Hacer el hero de Rack. |
| **Desarrollador** | Crear estructura de carpetas `src/rack/`. Configurar rutas. Crear tipos en `rack.ts`. Armar tablas en Supabase. Implementar RackLanding con datos mock. |
| **Producto/UX** | Definir los primeros 10-15 productos para el launch. Escribir el copy de cada seccion del landing. Fotografiar productos. |

### Prioridades de implementacion

```
FASE 1 (Semana 1-2): Landing page + datos mock
FASE 2 (Semana 3):   Feed con filtros + detalle de producto
FASE 3 (Semana 4):   Drops + wrap eventos Bruuk + CreatorChip
FASE 4 (Semana 5+):  Checkout/apartar + real-time stock + Supabase
```

---

*"Rack no es solo donde cuelgas las cosas. Es donde las encuentras."*
