# RACK por BRUUK — Plan de Arquitectura

> Basado en el mockup Figma de alta fidelidad y el codebase existente.

---

## 1. Visión General

Bruuk tiene **dos productos** que deben coexistir pero diferenciarse claramente:

| Producto | Qué es | Ruta | Propósito |
|----------|--------|------|-----------|
| **BRUUK** | Comunidad + Eventos | `/` | Conectar personas, eventos presenciales, descubrir la ciudad |
| **RACK** | Tienda curada | `/rack` | Vender piezas pre-owned y artesanales con historia |

**Problema actual:** El landing de Bruuk no deja claro que tiene una tienda. El landing de Rack no explica qué es Rack ni por qué existe.

**Solución:** Cada landing debe ser explícito sobre su propósito y crear puente al otro.

---

## 2. Cambios en el Landing de BRUUK (`/`)

### Lo que cambia:
- Agregar una **sección nueva "RACK"** después de features, antes de "Nosotros"
- Sección tipo banner/card que presente Rack como la tienda de la comunidad
- CTA claro: "ENTRAR AL RACK →" que lleva a `/rack`
- Mantener todo lo existente (hero, features, mar, nosotros, newsletter)

### Nueva sección — "El Rack de Bruuk":
```
+----------------------------------------------------------+
|  bg: rgba(99, 102, 241, 0.06) — sutil, no invasivo       |
|                                                          |
|  / RACK                          (section tag, tracking)  |
|                                                          |
|  "PIEZAS CON HISTORIA."                                  |
|  (display-md, brand-gradient-text)                       |
|                                                          |
|  "Moda pre-owned, artesanías locales y objetos únicos.   |
|   Curados por la comunidad Bruuk. Desde Guadalajara."    |
|  (body text, --fg2)                                      |
|                                                          |
|  [ ENTRAR AL RACK → ]           (btn-primary, indigo)    |
|  [ VENDER TUS COSAS ]           (btn-secondary)          |
|                                                          |
+----------------------------------------------------------+
```

---

## 3. Arquitectura de RACK — Pantallas del Figma

### 3.1 Landing Rack (`/rack`) — Pantalla 1 del Figma

**Estructura visual del Figma:**
```
┌─────────────────────────────┐
│ [bruuk logo]        MENÚ    │  ← Header compartido
├─────────────────────────────┤
│                             │
│  RACK.                      │  ← Logo grande con sparkles
│  (display-xl)               │
│                             │
│  Piezas con historia.       │
│  Hechas a mano o con        │
│  segunda vida.              │
│                             │
│  ─── (línea indigo) ──────  │
│                             │
│  [ ENTRAR ]                 │  ← CTA principal → /rack/explorar
│                             │
├─────────────────────────────┤
│ PRE-OWNED + ARTESANAL  GDL │  ← Barra info
├─────────────────────────────┤
│                             │
│  Somos comunidad            │  ← Sección vender
│  Quieres vender tus cosas   │
│  Dale segunda vida a tus    │
│  cosas con RACK. de bruuk   │
│                             │
│  ─── (línea indigo) ──────  │
│                             │
│  [ VENDER ]                 │  ← CTA secundario
│                             │
└─────────────────────────────┘
```

**Componente:** `src/rack/RackLanding.tsx`

### 3.2 Feed/Explorar (`/rack/explorar`) — Feed del Figma (dentro del detalle)

**Estructura visual del Figma:**
```
┌─────────────────────────────┐
│ ←    CARRITO (0)    RACK.   │  ← Header rack
├─────────────────────────────┤
│ [TODO] [PRE-OWNED] [ARTES.] │  ← FilterBar
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [foto placeholder]      │ │  ← ProductCard
│ │ CHAMARRA BOMBER VINTAGE │ │
│ │ Condición: Bueno        │ │
│ │            $850 PRE-OWN │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [foto placeholder]      │ │  ← ProductCard
│ │ SET TAZONES NEGROS OAX  │ │
│ │ Barro negro · 3 piezas  │ │
│ │            $340 ARTESANL│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ Bruuk Ad ─────────────┐ │  ← BruukEventAd (intercalado)
│ │ [bruuk logo]            │ │
│ │ EXPLORA EL MAR.         │ │
│ │ Mercado Nocturno Vol.3  │ │
│ │ [ VER MÁS → ]          │ │
│ └─────────────────────────┘ │
│                             │
│ ... más productos ...       │
│                             │
│ ┌─ Drops Teaser ─────────┐ │
│ │ DROPS                   │ │
│ │ CADA SEMANA,            │ │
│ │ ALGO NUEVO.             │ │
│ │ [ VER DROPS ]           │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Componente:** `src/rack/RackExplore.tsx`

### 3.3 Detalle de Pieza (`/rack/pieza/:slug`) — Pantalla 2 del Figma

**Estructura visual del Figma:**
```
┌─────────────────────────────┐
│ ←    CARRITO (0)    RACK.   │  ← Header rack
├─────────────────────────────┤
│ [PRE-OWNED]                 │  ← Badge categoría
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │  ← Imagen producto (400px)
│ │   (color placeholder)   │ │
│ │                         │ │
│ └─────────────────────────┘ │
│     ─── ○ ○ ○              │  ← Dots de imágenes
├─────────────────────────────┤
│ CHAMARRA                    │
│ BOMBER VINTAGE              │  ← Título grande
│                             │
│ $850 MXN  [PIEZA ÚNICA]    │  ← Precio + stock badge
│                             │
│ ┌─────────────────────────┐ │
│ │  AGREGAR AL CARRITO     │ │  ← Botón principal (blanco)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │    APARTAR PIEZA        │ │  ← Botón secundario (outline)
│ └─────────────────────────┘ │
│                             │
│ ── (separador) ──────────── │
│                             │
│ CONDICIÓN          Bueno    │  ← Metadata
│                             │
│ Bomber de los 90s con forro │  ← Descripción
│ satinado color mostaza...   │
│                             │
│ HISTORIA                    │
│ Forro satinado original...  │  ← Story
│                             │
│ ── (separador) ──────────── │
│                             │
│ (●) Mercado La Lagunilla    │  ← CreatorChip
│     Piezas curadas de CDMX  │
│                             │
├─────────────────────────────┤
│ SIGUE EXPLORANDO            │  ← Feed de más productos
│ ... ProductCards ...        │
└─────────────────────────────┘
```

**Componente:** `src/rack/RackProductDetail.tsx`

---

## 4. Estructura de Archivos

```
src/
├── rack/
│   ├── RackLanding.tsx          ← Landing /rack (hero + info + vender)
│   ├── RackLanding.css
│   ├── RackExplore.tsx          ← Feed /rack/explorar (productos + filtros)
│   ├── RackExplore.css
│   ├── RackProductDetail.tsx    ← Detalle /rack/pieza/:slug
│   ├── RackProductDetail.css
│   ├── components/
│   │   ├── RackHeader.tsx       ← Header con logo RACK, back, carrito
│   │   ├── ProductCard.tsx      ← Card de producto (foto + nombre + precio + badge)
│   │   ├── FilterBar.tsx        ← Filtros toggle (TODO / PRE-OWNED / ARTESANAL)
│   │   ├── StockBadge.tsx       ← "PIEZA ÚNICA" / "DISPONIBLE" / "AGOTADO"
│   │   ├── CategoryBadge.tsx    ← Badge PRE-OWNED (verde) / ARTESANAL (ámbar)
│   │   ├── CreatorChip.tsx      ← Avatar + nombre del creador
│   │   ├── BruukEventAd.tsx     ← Ad de evento Bruuk intercalado en feed
│   │   └── DropsTeaser.tsx      ← Bloque "Cada semana, algo nuevo"
│   ├── types/
│   │   └── rack.ts              ← Ya existe — interfaces Product, Creator, Drop
│   └── data/
│       └── mockData.ts          ← Ya existe — datos mock
├── App.tsx                      ← Agregar sección RACK al landing de Bruuk
└── main.tsx                     ← Agregar rutas /rack/*
```

---

## 5. Routing — Cambios en `main.tsx`

```tsx
// Nuevas rutas a agregar:
<Route path="/rack" element={<RackLanding />} />
<Route path="/rack/explorar" element={<RackExplore />} />
<Route path="/rack/pieza/:slug" element={<RackProductDetail />} />
```

---

## 6. Componentes — Especificación por Figma

### 6.1 `RackHeader`
- Logo "RACK." a la derecha (img del Figma)
- "← " (back) a la izquierda
- "CARRITO (0)" centrado
- bg: `#0a0a0f`, padding: 20px 24px
- Solo aparece en `/rack/explorar` y `/rack/pieza/:slug`

### 6.2 `ProductCard`
- Foto placeholder (color sólido, h: 340px)
- Info: nombre (Outfit SemiBold 13px, tracking 1px, uppercase), subtítulo (10px)
- Precio (Outfit Bold 16px) + badge categoría (8px, tracking 2px)
- PRE-OWNED → `#52c41a` | ARTESANAL → `#e8a145`
- bg info: `#0d0d0d`, border: 1px `rgba(255,255,255,0.04)`

### 6.3 `BruukEventAd`
Dos variantes en el Figma:
1. **Centrado** (Explora el Mar): bg `rgba(99,102,241,0.08)`, logo bruuk, título grande, fecha, botón indigo
2. **Lateral** (Taller Serigrafía): bg `rgba(232,160,69,0.06)`, logo bruuk, tag "TALLER", título, descripción, botón ámbar
3. **Banner** (Noche Museos): bg `#0a0a0f`, h: 200px, tag "EVENTO" en indigo, logo, título grande, fecha

### 6.4 `DropsTeaser`
- bg: `rgba(255,255,255,0.02)`
- Tag "DROPS" (9px, tracking 4px)
- "CADA SEMANA, ALGO NUEVO." (ExtraBold 24px)
- Botón "VER DROPS" (indigo, tracking 3px)

### 6.5 `StockBadge`
- "PIEZA ÚNICA" → bg `rgba(255,120,120,0.2)`, text `#ff6b6b`, 10px bold tracking 1.5px

### 6.6 `CategoryBadge`
- "PRE-OWNED" → bg `#64d23c`, text `#0a0a0f`
- "ARTESANAL" → bg `#e8a145`, text `#0a0a0f`

---

## 7. Paleta de Colores — Rack

```css
/* Base (heredada de Bruuk) */
--rack-bg:              #0a0a0f;
--rack-bg-card:         #0d0d0d;
--rack-accent:          #6366f1;  /* indigo — heredado */
--rack-text:            #ffffff;
--rack-text-muted:      #b8b8c7;

/* Categorías */
--rack-preowned:        #52c41a;  /* verde */
--rack-preowned-badge:  #64d23c;  /* verde badge */
--rack-artesanal:       #e8a145;  /* ámbar */

/* Estados */
--rack-pieza-unica:     #ff6b6b;  /* coral */
--rack-pieza-unica-bg:  rgba(255, 120, 120, 0.2);

/* Separadores */
--rack-separator:       rgba(255, 255, 255, 0.08);
--rack-border-card:     rgba(255, 255, 255, 0.04);

/* Ads de eventos */
--rack-ad-indigo-bg:    rgba(99, 102, 241, 0.08);
--rack-ad-amber-bg:     rgba(232, 160, 69, 0.06);
--rack-ad-neutral-bg:   rgba(255, 255, 255, 0.02);
```

---

## 8. Tipografía — Tokens del Figma

| Token | Familia | Peso | Tamaño | Tracking | Uso |
|-------|---------|------|--------|----------|-----|
| `rack-display-xl` | Outfit | Black (900) | 36px | -1px | Títulos de evento ads |
| `rack-display-lg` | Outfit | ExtraBold (800) | 26px | 0 | Título de producto detalle |
| `rack-display-md` | Outfit | ExtraBold (800) | 24px | 0 | Drops teaser |
| `rack-title` | Outfit | SemiBold (600) | 13px | 1px | Nombre producto en card |
| `rack-price` | Outfit | Bold (700) | 16-22px | 0 | Precios |
| `rack-body` | Outfit | Regular (400) | 14px | 0 | Descripciones, line-height 23px |
| `rack-label` | Outfit | Medium (500) | 11px | 3px | Labels (CARRITO, APARTAR, etc.) |
| `rack-tag` | Outfit | Medium (500) | 9-10px | 2-4px | Tags, sección headers |
| `rack-badge` | Outfit | Bold (700) | 10px | 1.5-2px | Badges de categoría y stock |
| `rack-subtitle` | Outfit | Regular (400) | 10px | 0 | Subtítulos en cards |

---

## 9. Orden de Implementación

### Fase 1 — Fundación (ahora)
1. CSS variables de Rack (`rack.css`)
2. `RackHeader` component
3. `RackLanding` page — fiel al Figma
4. Nueva sección RACK en el landing de Bruuk (`App.tsx`)
5. Routing en `main.tsx`

### Fase 2 — Feed
6. `CategoryBadge` + `StockBadge` components
7. `ProductCard` component
8. `FilterBar` component
9. `RackExplore` page con datos mock

### Fase 3 — Detalle
10. `CreatorChip` component
11. `RackProductDetail` page
12. `BruukEventAd` component (3 variantes)
13. `DropsTeaser` component

### Fase 4 — Pulido
14. Animaciones (fade-in, hover lift)
15. Scroll infinito en feed
16. Responsive refinements
17. Conexión a Supabase (futuro)

---

## 10. Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Styling | CSS puro (`.css` files) | Consistente con el proyecto existente, no usa Tailwind |
| Routing | React Router DOM v7 | Ya instalado |
| State | useState/useContext | Catálogo pequeño, no necesita state manager |
| Animaciones | CSS + Framer Motion | Ya instalado framer-motion |
| Imágenes | Color placeholder → fotos reales después | Fiel al Figma actual |
| Datos | Mock data → Supabase después | MVP primero |
| Font | Outfit (Google Fonts) | Ya cargada en el proyecto |

---

*"Rack no es solo donde cuelgas las cosas. Es donde las encuentras."*
