# BRUUK — Diseño Completo de la App `/app`

**Fecha:** Junio 2026
**Autor:** Bruuk Designer Agent
**Rama:** `mar`
**Entregable:** Documento de diseño para agente implementador. No implementar nada sin leer este documento completo primero.

---

## ⚠️ ENMIENDAS (prevalecen sobre el resto del documento)

**E1 — Cupo atómico (sin sobreventa).** Contar solo órdenes `paid` permite sobrevender: dos compradores simultáneos del último lugar pasan el conteo y ambos pagan. En su lugar:
- Agregar columna `capacity_remaining integer not null` a `app_events` (inicializada = `capacity` al crear el evento).
- Checkout de pago: reservar con `UPDATE app_events SET capacity_remaining = capacity_remaining - 1 WHERE id = $1 AND capacity_remaining > 0 RETURNING id` ANTES de crear la sesión de Stripe. Sin fila retornada → 409 `{ code: "full" }`. Si la creación de sesión falla → incrementar de vuelta.
- Webhook `checkout.session.expired` (o pago fallido) → incrementar `capacity_remaining` de vuelta (idempotente: solo si la orden estaba `pending`).
- RSVP gratuito: mismo decremento atómico al insertar el RSVP; incrementar al cancelarlo.
- El frontend muestra "QUEDAN N LUGARES" con `capacity_remaining` y "AGOTADO" cuando llega a 0.

**E2 — Sin `stripe_price_id`.** Eliminar esa columna y todo flujo de crear precios en Stripe al crear eventos. El checkout usa `price_data: { currency: 'mxn', unit_amount: price_mxn * 100, product_data: { name: title } }` leyendo `price_mxn` de la DB — exactamente como `api/rack/checkout.ts`. Así crear eventos no requiere Stripe configurado y el precio sigue siendo server-side.

---

## Fuentes de verdad leídas antes de este documento

- `src/main.tsx` — routing real, confirma que `/app` ya está registrado con `ProtectedRoute`
- `src/pages/DashboardPage.tsx` — mockup existente: contenido, tabs, estructura JSX
- `src/pages/LoginPage.tsx` — flujo auth real con invite codes en Supabase
- `src/contexts/AuthContext.tsx` — session, user, loading, signOut
- `src/components/ProtectedRoute.tsx` — guarda comentada, confirma el TODO pendiente
- `src/lib/supabase.ts` — cliente Supabase con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- `src/rack/rack.css` — tokens visuales de Rack: `--rack-bg`, `--rack-accent`, botones, badges
- `src/rack/components/RackHeader.css` — header real: `padding: 20px 24px`, `border-bottom: 1px solid rgba(255,255,255,0.06)`, `position: sticky; top: 0; z-index: 100`
- `src/rack/components/CategoryBadge.css` — badge: `font-size: 10px; font-weight: 700; letter-spacing: 2px; border-radius: 0; padding: 3px 8px`
- `src/rack/components/StockBadge.css` — badge disponible, apartado, agotado
- `src/rack/RackLanding.css` — layout header, hero, fondo `#0a0a0f`
- `src/rack/RackExplore.css` — feed continuo sin gap, `border-bottom: 1px solid var(--rack-separator)`
- `src/rack/RackCart.tsx` — patrón checkout: `startCheckout(ids)` → `POST /api/rack/checkout` → redirect a Stripe URL
- `src/rack/cart/checkout.ts` — función `startCheckout`, manejo de errores 409/503
- `api/rack/checkout.ts` — flujo completo: validar IDs, leer precio desde DB, reserva atómica, crear orden pending, crear sesión Stripe, devolver `{url, sessionId}`
- `api/rack/webhook.ts` — `checkout.session.completed` → orden paid + productos agotados; `expired` → volver a disponible
- `api/rack/orders.ts` — `GET /api/rack/orders?session_id=cs_...` — solo campos no sensibles
- `api/rack/products.ts` — patrón admin con `timingSafeEqual`, `x-admin-key`
- `api/rack/supabase.ts` — `supabaseAdmin` (service key) y `supabase` (anon key)
- `api/rack/stripe.ts` — cliente Stripe lazy, retorna null si no hay `STRIPE_SECRET_KEY`
- `api/spots.ts` — `GET /api/spots` sirve `src/data/spots.json` con cache 1h
- `src/data/spots.json` — 52 spots reales de Guadalajara: `{id, name, type, description, imageUrl, colorAccent, rating, price, coordinates: {lat, lng}, mapsLink}`
- `supabase-setup.sql` — schema Rack existente: `rack_creators`, `rack_products`, `rack_drops`, `rack_events`, `rack_orders`
- `docs/ARCHITECTURE_PLAN.md` — decisión de consolidar en Supabase, tabla `profiles`, tabla `events`, tabla `attendances`
- `src/App.tsx` — navegación real, confirma que `/descubrir` es la ruta de OceanLanding

---

## 1. Mapa de pantallas y wireframes ASCII

### 1.1 Shell general de `/app` — mobile-first, max-width 560px

```
┌─────────────────────────────┐  ← max-width: 560px, centrado en desktop
│  BRUUK.      [avatar] [out] │  ← AppHeader: sticky, z-index 100
│  ─────────────────────────  │  ← border-bottom: 1px solid rgba(255,255,255,0.06)
│                             │
│  [ contenido del tab activo ]│  ← scroll area, padding-bottom: 80px (para tab bar)
│                             │
│                             │
├─────────────────────────────┤
│  [PLANES]  [EVENTOS]  [MAR] │  ← TabBar: posición fixed, bottom 0, z-index 200
└─────────────────────────────┘
```

El header muestra el logo "BRUUK." a la izquierda (BruukLogo existente en `src/components/BruukLogo.tsx`), y a la derecha un avatar circular de color (iniciales del email, usando `profiles.avatar_color`) + botón de cerrar sesión como icono.

La tab bar inferior tiene tres botones. El activo muestra el label en blanco puro con un indicador indigo arriba (`border-top: 2px solid var(--rack-accent)`). Los inactivos en `var(--rack-text-muted)` que es `#b8b8c7`.

---

### 1.2 Tab PLANES

```
┌─────────────────────────────┐
│  / PLANES                   │  ← rack-section-tag
│  IDEAS PARA SALIR HOY.      │  ← h2, Outfit 700, uppercase
│  ─────────────────────────  │  ← rack-separator--indigo
│                             │
│  ┌───────────────────────┐  │  ← PlanBuilder: constructor interactivo
│  │  CONSTRUIR PLAN        │  │
│  │  ─────────────────     │  │
│  │  Nombre del plan       │  │  ← input text, max 60 chars
│  │  Hora de inicio  [18:00]│  ← input time
│  │                        │  │
│  │  SPOTS DEL PLAN (0/6)  │  │  ← máximo 6 paradas
│  │  [+ AGREGAR SPOT]      │  │  ← abre SpotPicker
│  │                        │  │
│  │  [GUARDAR PLAN]        │  │  ← rack-btn-primary
│  └───────────────────────┘  │
│                             │
│  ─────────────────────────  │
│  / MIS PLANES               │  ← sección planes guardados
│                             │
│  [plan card] [plan card]    │
│  [plan card] [plan card]    │
│                             │
│  ─────────────────────────  │
│  / PARA RECONECTAR          │  ← plantillas curadas
│                             │
│  [template] [template]      │
│  [template] [template]      │
└─────────────────────────────┘
```

**SpotPicker (bottom sheet / modal):**

```
┌─────────────────────────────┐
│  AGREGAR SPOT          [x]  │
│  ─────────────────────────  │
│  [Buscar por nombre...]     │  ← input de búsqueda
│  Filtrar: [Todos] [Café]    │  ← filtros de tipo
│           [Bar] [Rest]      │
│  ─────────────────────────  │
│  ○ NOT COLLECTIVE           │  ← spot row: colorAccent dot + nombre + tipo
│    Cafetería · $100-200     │
│  ○ Dorla                    │
│    Cafetería · $1-100       │
│  ○ Paralelo Café            │
│    Cafetería · $200-300     │
│  ...                        │
│                             │
│  [AGREGAR SELECCIONADOS]    │
└─────────────────────────────┘
```

**Vista de itinerario (dentro del PlanBuilder, una vez hay spots):**

```
┌─────────────────────────────┐
│  [≡] NOT COLLECTIVE    [x]  │  ← drag handle (≡), nombre, eliminar
│       18:00 → 19:00         │  ← hora calculada
│       60 min  [$100-200]    │  ← input duración (min) + precio del spot
│                             │
│  ↓ TRASLADO: 12 min a pie   │  ← calculado con haversine, editable
│    (0.9 km)                 │
│                             │
│  [≡] Dorla              [x] │
│       19:12 → 20:12         │
│       60 min  [$1-100]      │
│                             │
│  ↓ TRASLADO: 8 min a pie    │
│    (0.6 km)                 │
│                             │
│  [≡] Paralelo Café      [x] │
│       20:20 → 21:20         │
│       60 min  [$200-300]    │
└─────────────────────────────┘
```

**Plan Card (mis planes):**

```
┌────────────────────────────────┐
│  CENA + CAFÉ + BAR       [x]  │  ← nombre del plan + eliminar
│  Hoy · 18:00 · 3 paradas      │  ← resumen
│  NOT COLLECTIVE → Dorla →     │  ← spots en línea, truncados
│  Paralelo Café                │
│  [VER ITINERARIO →]           │
└────────────────────────────────┘
```

**Template Card (para reconectar):**

```
┌─────────────────────────────┐
│ [chip color]  Gastronomía   │
│                             │
│ Cena ciega                  │  ← título
│ Aparece sin saber el menú.  │  ← descripción
│ 2-3 hrs · Espontáneo        │  ← meta
│                             │
│ [USAR COMO PLANTILLA →]     │
└─────────────────────────────┘
```

---

### 1.3 Tab EVENTOS

```
┌─────────────────────────────┐
│  / EVENTOS                  │
│  PASA EN TU CIUDAD.         │
│  ─────────────────────────  │
│                             │
│  ┌─────────────────────┐    │  ← EventCard (gratis)
│  │ [chip ARTE]   15 JUN│    │
│  │ Noche de Museos     │    │
│  │ Indie               │    │
│  │ ─────────────────── │    │
│  │ Parque Rojo · 19:00 │    │
│  │ Cupo: 28/50         │    │
│  │                     │    │
│  │ [ASISTIR] GRATIS    │    │  ← botón RSVP
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │  ← EventCard (de pago)
│  │ [chip TALLER] 22 JUN│    │
│  │ Taller Serigrafía   │    │
│  │ Azotea Roma Norte   │    │
│  │ ─────────────────── │    │
│  │ Col. Roma · 11:00   │    │
│  │ Cupo: 12/20         │    │
│  │                     │    │
│  │ [COMPRAR BOLETO]    │    │  ← abre Stripe Checkout
│  │  $350               │    │
│  └─────────────────────┘    │
│                             │
│  (más eventos...)           │
└─────────────────────────────┘
```

**Estado "Ya asistí":**

```
│  [ASISTIENDO ✓]  CANCELAR   │  ← botón toggleado + link cancelar
│  Cupo: 29/50                │
```

---

### 1.4 Tab MAR

El componente `OceanLanding` existente (`src/components/OceanLanding.tsx`) se integra directamente, sin modificación de su lógica interna. El shell de la app oculta el AppHeader y la TabBar cuando el tab MAR está activo, permitiendo que OceanLanding ocupe pantalla completa. OceanLanding ya tiene su propio cierre y manejo de navegación a través de sus SpotCards.

Cuando el usuario sale del tab MAR (toca otro tab), el AppHeader y TabBar reaparecen.

---

## 2. Estructura de archivos exacta

```
src/
  app/
    AppShell.tsx           ← Wrapper principal: header + tab bar + outlet
    AppShell.css           ← Estilos del shell
    hooks/
      useSpots.ts          ← Fetch /api/spots con cache en memoria (no re-fetcha si ya cargó)
      usePlans.ts          ← CRUD planes en Supabase (tabla app_plans)
      useEvents.ts         ← Fetch /api/app/events
      useRsvp.ts           ← RSVP a eventos en Supabase (tabla app_rsvps)
    tabs/
      PlanesTab.tsx        ← Tab completo de planes
      PlanesTab.css
      EventosTab.tsx       ← Tab completo de eventos
      EventosTab.css
      MarTab.tsx           ← Wrapper delgado que monta OceanLanding en fullscreen
    components/
      PlanBuilder.tsx      ← Constructor interactivo del plan
      PlanBuilder.css
      SpotPicker.tsx       ← Bottom sheet selector de spots
      SpotPicker.css
      PlanTimeline.tsx     ← Vista del itinerario con horas calculadas
      PlanTimeline.css
      PlanCard.tsx         ← Card de plan guardado
      PlanCard.css
      TemplateCard.tsx     ← Card de plantilla curada
      TemplateCard.css
      EventCard.tsx        ← Card de evento (gratis y de pago)
      EventCard.css
      TabBar.tsx           ← Tab bar inferior fija
      TabBar.css
      AppHeader.tsx        ← Header sticky de la app
      AppHeader.css

api/
  app/
    events.ts              ← GET /api/app/events · POST /api/app/events (admin)
    rsvp.ts                ← POST /api/app/rsvp · DELETE /api/app/rsvp
    plans.ts               ← GET · POST · DELETE /api/app/plans (user-scoped via JWT)
    event-checkout.ts      ← POST /api/app/event-checkout (boletos de pago via Stripe)
    event-webhook.ts       ← POST /api/app/event-webhook (Stripe webhook)
    event-orders.ts        ← GET /api/app/event-orders?session_id=cs_... (confirmación)
    supabase.ts            ← Re-exportar o duplicar patrón de api/rack/supabase.ts

supabase-app-setup.sql     ← Script SQL con todo el schema de la app
```

---

## 3. Modelo de datos completo — SQL con RLS

```sql
-- ============================================================
-- BRUUK APP — Schema Supabase
-- Ejecutar en SQL Editor del dashboard de Supabase
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Creada automáticamente por trigger en auth.users.
-- La tabla ya puede existir del plan de arquitectura (ARCHITECTURE_PLAN.md).
-- Si existe, solo agregar las columnas faltantes.

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',        -- nunca exponer email
  avatar_color text not null default '#6366f1', -- color de fondo del avatar circular
  created_at   timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function create_profile_on_signup()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, avatar_color)
  values (
    new.id,
    split_part(new.email, '@', 1), -- usar parte antes del @ como display_name inicial
    '#6366f1'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_profile_on_signup();

-- RLS profiles
alter table profiles enable row level security;
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
-- NOTA: sin política de select público — los perfiles no son visibles entre usuarios
-- en esta fase del producto.


-- ── 2. APP_PLANS ────────────────────────────────────────────
-- Un plan es un itinerario armado por el usuario.

create table if not exists app_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  start_time  text not null,  -- "HH:MM" en formato 24h, ej: "18:00"
  stops       jsonb not null default '[]',
  -- stops es un array de objetos:
  -- [{
  --   spot_id: string,       -- id del spot en spots.json
  --   spot_name: string,     -- snapshot del nombre al guardar
  --   duration_min: integer, -- minutos de estancia (mín 5, máx 480)
  --   travel_min: integer,   -- minutos de traslado HASTA este spot (0 para el primero)
  --   travel_mode: "walk" | "drive",
  --   maps_link: string      -- snapshot de mapsLink al guardar
  -- }]
  created_at  timestamptz default now()
);

-- RLS plans: usuario solo ve y modifica los suyos
alter table app_plans enable row level security;
drop policy if exists "plans_select_own" on app_plans;
drop policy if exists "plans_insert_own" on app_plans;
drop policy if exists "plans_delete_own" on app_plans;

create policy "plans_select_own" on app_plans
  for select using (auth.uid() = user_id);

create policy "plans_insert_own" on app_plans
  for insert with check (auth.uid() = user_id);

create policy "plans_delete_own" on app_plans
  for delete using (auth.uid() = user_id);

-- Sin update policy: los planes se reemplazan (delete + insert), no se editan inline.
-- Esto simplifica el control de integridad.


-- ── 3. APP_EVENTS ────────────────────────────────────────────
-- Eventos creados por el equipo Bruuk (solo via API con x-admin-key).

create table if not exists app_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 120),
  description  text not null default '' check (char_length(description) <= 800),
  date_iso     timestamptz not null,        -- fecha y hora exacta del evento
  date_label   text not null,              -- "Sáb 22 Jun · 19:00" — para mostrar
  location_text text not null check (char_length(location_text) <= 200),
  location_maps_link text,
  category     text not null,              -- "Arte", "Música", "Taller", "Bar Hopping", etc.
  category_color text not null default '#6366f1', -- color del chip de categoría
  capacity     integer not null check (capacity > 0),
  price_mxn    integer not null default 0 check (price_mxn >= 0),
  -- 0 = gratis, >0 = de pago (en pesos enteros, igual que rack_products.price)
  stripe_price_id text,   -- null si gratis; precio creado server-side en Stripe
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);

-- RLS events: lectura pública, escritura solo service key (sin políticas de write)
alter table app_events enable row level security;
drop policy if exists "events_public_read" on app_events;
create policy "events_public_read" on app_events
  for select using (is_active = true);
-- Sin políticas de insert/update/delete — solo la service key puede escribir.


-- ── 4. APP_RSVPS ─────────────────────────────────────────────
-- RSVP a eventos gratuitos. Máx un registro por usuario por evento.

create table if not exists app_rsvps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  event_id   uuid not null references app_events(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, event_id)
);

-- RLS rsvps: usuario solo ve y modifica los suyos
alter table app_rsvps enable row level security;
drop policy if exists "rsvps_select_own" on app_rsvps;
drop policy if exists "rsvps_insert_own" on app_rsvps;
drop policy if exists "rsvps_delete_own" on app_rsvps;

create policy "rsvps_select_own" on app_rsvps
  for select using (auth.uid() = user_id);

create policy "rsvps_insert_own" on app_rsvps
  for insert with check (auth.uid() = user_id);

create policy "rsvps_delete_own" on app_rsvps
  for delete using (auth.uid() = user_id);

-- Contador de asistentes: función que cuenta rsvps por evento (lectura pública)
-- El conteo se hace en la API, no con una política pública directa sobre rsvps,
-- para no exponer qué usuario está inscrito a qué evento.


-- ── 5. APP_EVENT_ORDERS ──────────────────────────────────────
-- Órdenes de boletos de eventos de pago. Mismo patrón que rack_orders.
-- Sin ninguna política — solo service key lee y escribe.

create table if not exists app_event_orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique,
  user_id            uuid,        -- null si el usuario no estaba autenticado (no debería ocurrir)
  event_id           uuid not null references app_events(id),
  status             text not null default 'pending'
                       check (status in ('pending', 'paid', 'expired', 'cancelled')),
  amount_total       integer not null,
  currency           text not null default 'MXN',
  customer_email     text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table app_event_orders enable row level security;
-- Sin políticas: solo service key accede.
```

---

## 4. Especificación de la API REST

Todos los endpoints en `api/app/` son Vercel Serverless Functions (TypeScript, `VercelRequest/VercelResponse`).

### Convención de autenticación (user-scoped)

```
Header: Authorization: Bearer <supabase_access_token>
Verificación en cada endpoint user-scoped:
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) → 401
  Usar user.id como user_id — NUNCA el user_id del body.
```

El token se obtiene en el cliente con `supabase.auth.getSession()` → `session.access_token`.

---

### 4.1 GET /api/spots

```
Ya existe en api/spots.ts. No crear otro.
Cache: s-maxage=3600, stale-while-revalidate
Respuesta: array de spots del JSON (52 spots de Guadalajara)
Auth: ninguna (pública)
```

---

### 4.2 GET /api/app/events

```
Auth: ninguna (pública)
Query params:
  ninguno (devolver todos los activos, ordenados por date_iso asc)

Respuesta 200:
[
  {
    id: string,
    title: string,
    description: string,
    date_label: string,
    location_text: string,
    location_maps_link: string | null,
    category: string,
    category_color: string,
    capacity: number,
    price_mxn: number,       ← 0 si gratis
    is_free: boolean,        ← price_mxn === 0
    rsvp_count: number,      ← COUNT de app_rsvps para este evento_id (via service key)
    is_full: boolean         ← rsvp_count >= capacity
  },
  ...
]

Cache: s-maxage=60, stale-while-revalidate=300
Nota: no incluir stripe_price_id en la respuesta.
```

---

### 4.3 POST /api/app/events (admin)

```
Auth: header x-admin-key = APP_ADMIN_KEY (env var)
      Comparar con timingSafeEqual (igual que api/rack/products.ts)

Body:
{
  title: string,              max 120 chars
  description: string,        max 800 chars
  date_iso: string,           ISO 8601, ej: "2026-07-05T19:00:00-06:00"
  date_label: string,         max 60 chars
  location_text: string,      max 200 chars
  location_maps_link: string | null,
  category: string,
  category_color: string,     formato hex "#rrggbb"
  capacity: number,           entero positivo
  price_mxn: number,          entero >= 0
}

Si price_mxn > 0:
  El endpoint crea un price en Stripe con `stripe.prices.create({
    unit_amount: price_mxn * 100,
    currency: 'mxn',
    product_data: { name: title }
  })` y guarda el price.id en stripe_price_id.

Respuesta 201: { id, title, date_label, price_mxn }
Respuesta 400: { error: "Campos requeridos: ..." }
Respuesta 401: { error: "No autorizado" }
```

---

### 4.4 GET /api/app/plans

```
Auth: requerida (JWT Supabase)

Respuesta 200:
[
  {
    id: string,
    name: string,
    start_time: string,
    stops: Stop[],   ← array de paradas, mismo shape que en la DB
    created_at: string
  },
  ...
]
Ordenados por created_at desc.
Respuesta 401: si no hay token válido.
```

---

### 4.5 POST /api/app/plans

```
Auth: requerida (JWT Supabase)

Body:
{
  name: string,               1-60 chars
  start_time: string,         "HH:MM" (validar con regex /^\d{2}:\d{2}$/)
  stops: [
    {
      spot_id: string,        id del spot (validar que existe en spots.json)
      spot_name: string,      max 120 chars
      duration_min: number,   5-480
      travel_min: number,     0-120
      travel_mode: "walk" | "drive",
      maps_link: string       max 500 chars, debe comenzar con "http"
    },
    ...
  ]                           1-6 paradas
}

Validaciones server-side:
  - name: 1-60 chars
  - stops.length: 1-6
  - duration_min: 5-480
  - travel_min: 0-120
  - travel_mode: solo "walk" o "drive"
  - El user_id se toma del JWT, no del body.

Respuesta 201: { id, name, start_time, stops, created_at }
Respuesta 400: { error: "..." }
Respuesta 401: sin token válido
```

---

### 4.6 DELETE /api/app/plans

```
Auth: requerida (JWT Supabase)

Query params: ?id=<uuid>

Validar que el plan pertenece al usuario autenticado antes de eliminar.
No eliminar planes de otros usuarios aunque tengan el id.

Respuesta 200: { deleted: true }
Respuesta 404: plan no encontrado o no pertenece al usuario
Respuesta 401: sin token válido
```

---

### 4.7 POST /api/app/rsvp

```
Auth: requerida (JWT Supabase)

Body: { event_id: string }

Validaciones:
  1. Validar UUID del event_id.
  2. Leer el evento (is_active, capacity, price_mxn).
  3. Si price_mxn > 0 → responder 400 { error: "Este evento requiere boleto" }
  4. COUNT de rsvps actuales para el evento.
  5. Si count >= capacity → 409 { error: "El evento está lleno", code: "full" }
  6. INSERT en app_rsvps (user_id del JWT, event_id).
     Si unique constraint falla → 409 { error: "Ya tienes RSVP para este evento" }

Respuesta 201: { rsvp_id, event_id, rsvp_count: count + 1 }
Respuesta 400, 401, 409: según caso
```

---

### 4.8 DELETE /api/app/rsvp

```
Auth: requerida (JWT Supabase)

Query params: ?event_id=<uuid>

DELETE de la fila donde user_id = JWT user y event_id = param.
Devolver 200 aunque no existiera (idempotente).

Respuesta 200: { cancelled: true }
Respuesta 401: sin token válido
```

---

### 4.9 POST /api/app/event-checkout

```
Auth: requerida (JWT Supabase)
      El user_id se graba en la orden desde el JWT.

Body: { event_id: string }

Flujo (reciclado de api/rack/checkout.ts):
  1. Validar UUID del event_id.
  2. Leer evento desde DB: is_active, price_mxn, stripe_price_id, capacity, title.
  3. Si price_mxn === 0 → 400 { error: "Usa RSVP para eventos gratuitos" }
  4. COUNT atómico de cupo:
     a. Contar rsvps pagados (órdenes con status='paid' para este evento).
     b. Si count >= capacity → 409 { error: "Sin cupo", code: "full" }
  5. Crear sesión de Stripe Checkout:
     stripe.checkout.sessions.create({
       mode: 'payment',
       currency: 'mxn',
       line_items: [{ price: stripe_price_id, quantity: 1 }],
       metadata: { app_event_order_id: <orden_id>, event_id, user_id },
       success_url: `${siteUrl}/app?tab=eventos&session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${siteUrl}/app?tab=eventos&cancelled=1`,
       expires_at: Math.floor(Date.now() / 1000) + 31 * 60
     })
  6. INSERT en app_event_orders con status='pending', guardar stripe_session_id.

Respuesta 200: { url, session_id }
Respuesta 400, 401, 409, 503: según caso
```

---

### 4.10 POST /api/app/event-webhook

```
Config: export const config = { api: { bodyParser: false } }

Eventos manejados:
  checkout.session.completed:
    - Leer app_event_order_id desde session.metadata
    - UPDATE app_event_orders SET status='paid', customer_email=..., updated_at=now()
    - Idempotencia: si status ya no es 'pending', ignorar.

  checkout.session.expired:
    - UPDATE app_event_orders SET status='expired', updated_at=now()
    - No hay "reserva de cupo" a liberar — el cupo se cuenta por órdenes paid,
      no por estados intermedios como en Rack (que reserva piezas únicas).

Firma: verificar con stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET_APP)
  Nota: usar una variable de entorno DISTINTA a la de Rack (STRIPE_WEBHOOK_SECRET)
  para tener secrets separados por webhook endpoint en Stripe Dashboard.

Respuesta 200: { received: true }
```

---

### 4.11 GET /api/app/event-orders

```
Auth: ninguna (el session_id actúa como token opaco)

Query params: ?session_id=cs_...

Validar formato con /^cs_(test|live)_[A-Za-z0-9]+$/

SELECT status, event_id, amount_total, currency, created_at
FROM app_event_orders
WHERE stripe_session_id = session_id

Respuesta 200:
{
  status: "paid" | "pending" | "expired",
  event_id: string,
  amount_total: number,
  currency: "MXN",
  created_at: string
}

No incluir customer_email ni user_id en la respuesta.
Respuesta 404: { error: "Orden no encontrada" }
```

---

## 5. Componentes con especificación visual

Todos los componentes usan tokens de `src/rack/rack.css`. El implementador debe importar `rack.css` en el componente raíz de la app (`AppShell.tsx`) o asegurarse de que esté disponible globalmente.

---

### 5.1 AppShell.tsx / AppShell.css

```css
/* Layout */
.app-shell {
  background-color: var(--rack-bg);            /* #0a0a0f */
  color: var(--rack-text);                     /* #ffffff */
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  margin: 0 auto;
}

/* Estado fullscreen para el tab MAR */
.app-shell--mar-fullscreen {
  max-width: 100%;
}

/* Área de contenido — scrollable */
.app-shell__content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;  /* clearance para tab bar */
}

/* Ocultar header y tab bar en fullscreen */
.app-shell--mar-fullscreen .app-shell__header,
.app-shell--mar-fullscreen .app-shell__tabbar {
  display: none;
}
```

---

### 5.2 AppHeader.tsx / AppHeader.css

```
Layout: igual que RackHeader existente.
- background: #0a0a0f
- padding: 20px 24px
- border-bottom: 1px solid rgba(255,255,255,0.06)
- position: sticky; top: 0; z-index: 100

Izquierda: BruukLogo (importar de src/components/BruukLogo.tsx)
Derecha: avatar circular + botón cerrar sesión

Avatar circular:
  width: 32px; height: 32px; border-radius: 50%
  background: profiles.avatar_color (desde AuthContext → llamar a profiles en mount)
  Contiene las iniciales del display_name en mayúsculas:
    font-size: 0.6875rem; font-weight: 700; color: #0a0a0f;
  No tiene border-radius: 0 porque es un avatar circular (excepción funcional,
  igual que el welcome-modal tiene 24px — no introducir border-radius en
  ningún otro lugar).
```

---

### 5.3 TabBar.tsx / TabBar.css

```css
.app-tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 560px;
  background: #0a0a0f;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  z-index: 200;
}

.app-tabbar__btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 0 14px;
  background: none;
  border: none;
  border-top: 2px solid transparent;
  font-family: 'Outfit', sans-serif;
  font-size: 0.5625rem;    /* --rack-font-tag */
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--rack-text-muted);   /* #b8b8c7 */
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease;
}

.app-tabbar__btn.active {
  color: var(--rack-text);          /* #ffffff */
  border-top-color: var(--rack-accent); /* #6366f1 */
}
```

Los tres tabs son: PLANES | EVENTOS | MAR.
Los iconos son Lucide React: `Sparkles` para PLANES, `Calendar` para EVENTOS, `Waves` para MAR. Tamaño 18px en todos.

---

### 5.4 PlanBuilder.tsx — especificación de comportamiento

El builder tiene cuatro secciones:

**Sección A — Cabecera:**
- Input `name`: tipo text, placeholder "Nombre de tu plan", max 60 chars
  - `font-size: var(--rack-font-display-md)` (1.5rem), `font-weight: 700`, `color: white`
  - `background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.15)`
- Input `start_time`: tipo time, valor default "18:00"
  - Label: "HORA DE INICIO" (`font-size: var(--rack-font-label)`, `letter-spacing: 4px`, `color: var(--rack-text-muted)`)

**Sección B — Lista de paradas (itinerario):**
- Cada parada es un `PlanStop` con:
  - Drag handle (icono `GripVertical` de Lucide, `color: var(--rack-text-muted)`)
  - Nombre del spot en blanco
  - Dot de color `spot.colorAccent`
  - Input de duración en minutos (`default: 60`, min 5, max 480)
  - Botón eliminar (icono `X`, color muted)
- Entre paradas: bloque de traslado
  - Fondo: `background: rgba(99,102,241,0.06)` — sutil
  - Texto: "TRASLADO: X min a pie (Y.Y km)" o "X min en auto"
  - Iconos: `Footprints` para walk, `Car` para drive (ambos en Lucide)
  - Botón toggle walk/drive: afecta el tiempo estimado
  - El tiempo estimado se recalcula automáticamente al cambiar modo
  - El usuario puede editar el número de minutos directamente (input)

**Cálculo haversine (solo en el cliente, no en la API):**

```
Distancia en km entre dos coordenadas:
  R = 6371
  dLat = (lat2 - lat1) * Math.PI / 180
  dLng = (lng2 - lng1) * Math.PI / 180
  a = sin(dLat/2)² + cos(lat1) * cos(lat2) * sin(dLng/2)²
  c = 2 * atan2(√a, √(1-a))
  d = R * c

Tiempo estimado:
  walk:  Math.ceil((d / 4.5) * 60)   ← 4.5 km/h
  drive: Math.ceil((d / 25) * 60)    ← 25 km/h urbano

Si alguno de los spots no tiene coordenadas (algunos en spots.json no tienen
el campo coordinates), mostrar "Traslado manual" y dejar input editable
sin valor precalculado.
```

**Sección C — Botón "AGREGAR SPOT":**
- Clase `rack-btn-secondary` (de `rack.css`)
- Ancho completo
- Deshabilitado si ya hay 6 paradas (mostrar "Máximo 6 paradas")

**Sección D — Botón "GUARDAR PLAN":**
- Clase `rack-btn-primary` (de `rack.css`)
- Ancho completo
- Deshabilitado si: name vacío O stops.length === 0 O loading
- Al guardar: `POST /api/app/plans` con el token del usuario
- En éxito: limpiar el builder (nombre vacío, stops vacíos, hora a "18:00")

---

### 5.5 SpotPicker.tsx — especificación visual

Es un bottom sheet con overlay oscuro.

```css
/* Overlay */
.spot-picker-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 300;
}

/* Sheet */
.spot-picker-sheet {
  position: fixed;
  bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 560px;
  max-height: 80vh;
  background: #0d0d0d;   /* --rack-bg-card */
  border-top: 2px solid var(--rack-accent);
  display: flex; flex-direction: column;
  z-index: 301;
  overflow: hidden;
}

/* Handle visual */
.spot-picker-handle {
  width: 40px; height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;   ← excepción funcional (handle de arrastre)
  margin: 12px auto 0;
}
```

**Filtros de tipo:**
Los tipos únicos se extraen del array de spots en runtime.
Se muestran como botones de filtro horizontales con scroll:
- Inactivo: `background: transparent; border: 1px solid rgba(255,255,255,0.12); color: var(--rack-text-muted)`
- Activo: `background: var(--rack-accent); color: white; border-color: var(--rack-accent)`
- `font-size: var(--rack-font-label)` (0.6875rem), `letter-spacing: 2px`, `uppercase`
- `border-radius: 0` (sin excepciones aquí)

**Spot row:**
- Fila completa clicable
- Lado izquierdo: dot de color (`spot.colorAccent`, 8px, circular — excepción funcional)
- Centro: nombre (blanco, 0.875rem), tipo (muted, 0.6875rem)
- Lado derecho: precio en muted
- Al seleccionar: checkmark en `var(--rack-accent)` + fondo `rgba(99,102,241,0.08)`
- Separador: `border-bottom: 1px solid var(--rack-separator)`

---

### 5.6 PlanCard.tsx — especificación visual

```
┌──────────────────────────────────────────────┐
│ border-left: 3px solid var(--rack-accent)    │ ← borde izquierdo indigo (no top)
│ background: var(--rack-bg-card)   (#0d0d0d)  │
│ padding: 16px                                │
│ box-shadow: 3px 3px 0px rgba(99,102,241,0.25)│
│                                              │
│  CENA + CAFÉ + BAR                           │ ← name, Outfit 700, 0.875rem
│  3 paradas · 18:00                           │ ← meta, muted, 0.6875rem, uppercase
│                                              │
│  [dot] NOT COLLECTIVE → [dot] Dorla →        │ ← stops preview, scroll horizontal
│  [dot] Paralelo Café                         │    si no caben
│                                              │
│  [VER ITINERARIO →]          [ELIMINAR]      │ ← botones
│                                              │
└──────────────────────────────────────────────┘

Hover:
  transform: translate(-3px, -3px);
  box-shadow: 6px 6px 0px rgba(99,102,241,0.4);
```

---

### 5.7 TemplateCard.tsx — especificación visual

Mismas 4 plantillas del DashboardPage.tsx actual, pero ahora el botón "USAR COMO PLANTILLA" pre-carga el PlanBuilder con el nombre y los stops recomendados (sin spots específicos — solo nombre y duración sugerida).

```
background: var(--rack-bg-card)
border-top: 3px solid <plan.color>  ← igual que evento-card en el mockup actual
padding: 20px 16px
```

---

### 5.8 EventCard.tsx — especificación visual

```
┌──────────────────────────────────────────────┐
│ border-top: 3px solid <category_color>       │
│ background: var(--rack-bg-card)              │
│ padding: 16px                                │
│                                              │
│ [chip ARTE] [fecha label]                    │ ← CategoryBadge estilo + fecha muted
│                                              │
│ NOCHE DE MUSEOS INDIE                        │ ← title, Outfit 700, uppercase, 0.8125rem
│ Descripción corta...                         │ ← 2 líneas max, muted, 0.75rem
│                                              │
│ [MapPin] Parque Rojo · 19:00                 │ ← location + hora, muted, 0.6875rem
│ [Users] 28/50 — CUPO DISPONIBLE             │ ← conteo, color verde si hay cupo
│         (o LLENO en coral si is_full)        │
│                                              │
│ Si gratis:                                   │
│   [ASISTIR]          GRATIS                  │
│   o [ASISTIENDO ✓]   CANCELAR               │
│                                              │
│ Si de pago:                                  │
│   [COMPRAR BOLETO]   $350                    │
│   o [BOLETO ADQUIRIDO ✓]                     │
│                                              │
└──────────────────────────────────────────────┘
```

El chip de categoría usa el mismo patrón visual que `CategoryBadge` de Rack:
```css
font-size: 10px; font-weight: 700; letter-spacing: 2px;
text-transform: uppercase; padding: 3px 8px; border-radius: 0;
background: <category_color>; color: #0a0a0f;
```

El botón de acción (ASISTIR / COMPRAR BOLETO) usa clase `rack-btn-primary` si el evento tiene cupo y el usuario no está inscrito. Si está inscrito o boleto adquirido, usar `rack-btn-secondary` con icono de check.

---

### 5.9 MarTab.tsx

```tsx
// src/app/tabs/MarTab.tsx
// Este componente es un wrapper que monta OceanLanding en modo
// fullscreen dentro del shell de la app.

import { OceanLanding } from '../../components/OceanLanding';

export function MarTab() {
  // OceanLanding se monta como está — sin modificar su lógica.
  // El AppShell detecta tab === 'mar' y agrega la clase
  // app-shell--mar-fullscreen que oculta header y tabbar.
  return <OceanLanding />;
}
```

El agente implementador NO debe modificar `OceanLanding.tsx`. Solo montar el componente.

---

## 6. Flujos clave paso a paso

### 6.1 Flujo: Armar un plan

```
1. Usuario abre tab PLANES.
2. PlanesTab carga spots vía useSpots.ts → GET /api/spots (cache en memoria).
3. Usuario escribe el nombre del plan en el input de cabecera.
4. Usuario define hora de inicio (input time).
5. Usuario toca [AGREGAR SPOT] → SpotPicker se abre como bottom sheet.
6. Usuario filtra por tipo o busca por nombre.
7. Usuario selecciona un spot → toca [AGREGAR SELECCIONADOS].
8. SpotPicker se cierra. El spot aparece como primera parada en el itinerario.
   duration_min default: 60.
9. Usuario agrega segundo spot.
10. Entre las dos paradas aparece el bloque de traslado:
    - Si ambos spots tienen coordinates → calcular haversine → mostrar tiempo y distancia.
    - Si alguno no tiene coordinates → mostrar "Traslado manual" con input editable.
11. Usuario puede cambiar modo (walk/drive) → tiempo se recalcula.
12. Usuario puede editar directamente los minutos de traslado.
13. Hora de llegada a cada spot se recalcula en tiempo real:
    stop[0].arrival = start_time
    stop[0].departure = arrival + duration_min
    stop[1].arrival = stop[0].departure + travel_min
    ...
14. Usuario repite hasta 6 paradas.
15. Toca [GUARDAR PLAN].
16. POST /api/app/plans → 201 → plan aparece en "Mis Planes".
```

---

### 6.2 Flujo: Guardar plan (detalle de llamada a API)

```
Cliente → POST /api/app/plans
Headers:
  Authorization: Bearer <supabase_access_token>
  Content-Type: application/json

Body:
{
  "name": "Tarde de cafés",
  "start_time": "15:30",
  "stops": [
    {
      "spot_id": "spot_006",
      "spot_name": "NOT COLLECTIVE",
      "duration_min": 60,
      "travel_min": 0,
      "travel_mode": "walk",
      "maps_link": "https://maps.google.com/?q=NOT+COLLECTIVE+coffee+Guadalajara"
    },
    {
      "spot_id": "spot_008",
      "spot_name": "Dorla",
      "duration_min": 45,
      "travel_min": 12,
      "travel_mode": "walk",
      "maps_link": "https://maps.google.com/?q=Dorla+Café+Guadalajara"
    }
  ]
}

Servidor:
  1. Verificar JWT → obtener user.id.
  2. Validar name: 1-60 chars.
  3. Validar stops: 1-6 items, cada campo en rango.
  4. INSERT en app_plans con user_id = JWT user.id.
  5. Responder 201 con el plan creado.

Cliente:
  1. Recibe 201.
  2. Agrega el plan al estado local de usePlans (optimistic o refetch).
  3. Limpia el builder.
```

---

### 6.3 Flujo: RSVP a evento gratuito

```
1. Usuario ve EventCard con precio = 0 y botón [ASISTIR].
2. useRsvp.ts llama POST /api/app/rsvp con { event_id }.
3. Servidor:
   a. Verifica JWT.
   b. Carga el evento: is_active, capacity, price_mxn.
   c. Si price_mxn > 0 → 400 (no debería ocurrir si la UI es correcta).
   d. COUNT rsvps donde event_id = param.
   e. Si count >= capacity → 409 "Sin cupo".
   f. INSERT en app_rsvps. Si duplicate → 409 "Ya inscrito".
   g. Responde 201.
4. Cliente:
   a. Actualiza el EventCard: botón cambia a [ASISTIENDO ✓] + CANCELAR.
   b. rsvp_count + 1 en la UI.
```

---

### 6.4 Flujo: Compra de boleto con Stripe

```
1. Usuario ve EventCard con price_mxn > 0 y botón [COMPRAR BOLETO $350].
2. Usuario toca el botón.
3. Cliente llama POST /api/app/event-checkout con { event_id }.
   Header: Authorization: Bearer <token>
4. Servidor:
   a. Verifica JWT.
   b. Carga evento: stripe_price_id, capacity, title, price_mxn.
   c. COUNT de app_event_orders donde event_id = id AND status = 'paid'.
   d. Si count >= capacity → 409 "Sin cupo".
   e. Crea sesión Stripe Checkout con stripe_price_id (precio server-side).
   f. INSERT en app_event_orders con status='pending'.
   g. Devuelve { url, session_id }.
5. Cliente: window.location.assign(url) → redirige a Stripe Checkout.
6. Stripe procesa el pago.
7. Stripe llama POST /api/app/event-webhook.
8. Webhook verifica firma, actualiza orden a status='paid'.
9. Usuario regresa a /app?tab=eventos&session_id=cs_...
10. Cliente detecta session_id en la URL → GET /api/app/event-orders?session_id=cs_...
11. Si status='paid': mostrar mensaje de confirmación en el tab EVENTOS.
    EventCard del evento correspondiente muestra [BOLETO ADQUIRIDO ✓].
```

---

## 7. Orden de implementación por fases

### Fase 1 — Fundación y Auth (implementar primero)

1. **Restaurar ProtectedRoute** (`src/components/ProtectedRoute.tsx`):
   - Descomentar la línea `if (!session) return <Navigate to="/login" replace />;`
   - Importar `Navigate` desde `react-router-dom` (no está importado actualmente).
   - El componente ya recibe `session` del contexto — solo quitar el comentario.

2. **Crear tabla `profiles` con trigger** en Supabase (SQL de la sección 3 de este documento).

3. **Crear `supabase-app-setup.sql`** en la raíz del repo con todo el SQL de la sección 3.

4. **Crear `api/app/supabase.ts`** copiando el patrón de `api/rack/supabase.ts`:
   ```ts
   // Mismos imports y exports. Puede reusar las mismas env vars.
   import { createClient } from '@supabase/supabase-js';
   const url = process.env.SUPABASE_URL ?? '';
   const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';
   const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
   export const supabaseAdmin = createClient(url, serviceKey);
   export const supabase = createClient(url, anonKey);
   ```

---

### Fase 2 — Shell visual

5. **Crear `src/app/AppShell.tsx`** con el layout descrito en sección 5.1.
   - Importar `BruukLogo` de `src/components/BruukLogo.tsx`.
   - Importar `useAuth` de `src/contexts/AuthContext.tsx`.
   - Estado: `activeTab: 'planes' | 'eventos' | 'mar'`, default `'planes'`.
   - Detectar tab `mar` → agregar clase `app-shell--mar-fullscreen`.
   - Leer `profiles` de Supabase al montar para obtener `avatar_color` y `display_name`.
     Llamada: `supabase.from('profiles').select('display_name, avatar_color').eq('id', user.id).single()`

6. **Crear `src/app/components/TabBar.tsx`** con spec de sección 5.3.

7. **Crear `src/app/components/AppHeader.tsx`** con spec de sección 5.2.

8. **Reemplazar `DashboardPage`** en `src/main.tsx`:
   - Cambiar `import { DashboardPage }` por `import { AppShell }` desde `src/app/AppShell`.
   - La ruta `/app` pasa a renderizar `<AppShell />` en lugar de `<DashboardPage />`.
   - `DashboardPage.tsx` y `DashboardPage.css` quedan como archivos legacy; no eliminar aún.

---

### Fase 3 — Tab MAR

9. **Crear `src/app/tabs/MarTab.tsx`** (es solo el wrapper descrito en sección 5.9).
   - No modificar `OceanLanding.tsx`.

---

### Fase 4 — Tab EVENTOS (read-only primero)

10. **Crear `api/app/events.ts`** con `GET /api/app/events`.

11. **Crear `src/app/hooks/useEvents.ts`**:
    - Fetch a `/api/app/events`.
    - Estado: `events`, `loading`, `error`.

12. **Crear `src/app/components/EventCard.tsx`** con spec de sección 5.8.
    - Sin lógica de RSVP/checkout todavía — solo renderizar con botón deshabilitado.

13. **Crear `src/app/tabs/EventosTab.tsx`** que mapea eventos con `EventCard`.

14. **Poblar `app_events`** con datos reales usando `POST /api/app/events` con `x-admin-key`.
    Variable de entorno: `APP_ADMIN_KEY` en Vercel.

---

### Fase 5 — RSVP para eventos gratuitos

15. **Crear `api/app/rsvp.ts`** con `POST` y `DELETE`.

16. **Crear `src/app/hooks/useRsvp.ts`**:
    - `rsvp(eventId)`: POST con token → devuelve ok/error.
    - `cancelRsvp(eventId)`: DELETE.
    - Estado: `rsvpedEventIds: Set<string>` — cargado al montar desde `GET /api/app/rsvp` (si se implementa) o inferido de la respuesta del POST.

17. Conectar `EventCard` con `useRsvp` para el botón [ASISTIR].

---

### Fase 6 — Tab PLANES (constructor)

18. **Crear `src/app/hooks/useSpots.ts`**:
    - Fetch `/api/spots` una sola vez, cache en módulo (variable fuera del hook).

19. **Crear `src/app/hooks/usePlans.ts`**:
    - `loadPlans()`: GET /api/app/plans con token.
    - `savePlan(plan)`: POST /api/app/plans con token.
    - `deletePlan(id)`: DELETE /api/app/plans?id=... con token.

20. **Crear `api/app/plans.ts`** con GET, POST, DELETE.

21. **Crear `src/app/components/SpotPicker.tsx`** con spec de sección 5.5.

22. **Crear `src/app/components/PlanTimeline.tsx`** — solo renderiza el itinerario calculado.

23. **Crear `src/app/components/PlanBuilder.tsx`** con spec de sección 5.4.

24. **Crear `src/app/components/PlanCard.tsx`** con spec de sección 5.6.

25. **Crear `src/app/components/TemplateCard.tsx`** con spec de sección 5.7.

26. **Crear `src/app/tabs/PlanesTab.tsx`** que integra todo.

---

### Fase 7 — Boletos con Stripe

27. **Crear `api/app/event-checkout.ts`**.

28. **Crear `api/app/event-webhook.ts`**.
    - Registrar nuevo endpoint en Stripe Dashboard: `https://<dominio>/api/app/event-webhook`
    - Guardar el webhook secret como `STRIPE_WEBHOOK_SECRET_APP` (variable distinta a `STRIPE_WEBHOOK_SECRET`).

29. **Crear `api/app/event-orders.ts`** con GET por `session_id`.

30. Conectar `EventCard` con checkout para eventos de pago.

31. Detectar `?session_id=cs_...` en la URL al retornar de Stripe → mostrar confirmación.

---

## 8. Registro de Errores, Desviaciones y Lecciones Aprendidas

### 8.1 Decisión: OceanLanding sin modificar

La arquitectura decide montar `OceanLanding` directamente en el tab MAR sin modificar el componente. Esto implica que OceanLanding sigue siendo responsable de su propio comportamiento de navegación interno (navegar fuera al tocar el botón de cierre). La consecuencia es que el botón de cierre de OceanLanding debe navegar de vuelta a `/app` (no a `/`). Este es un ajuste mínimo que el implementador debe verificar en `OceanLanding.tsx`. Si el botón de cierre usa `navigate(-1)` o `navigate('/')`, deberá cambiarse a `navigate('/app')` solamente si se determina que el comportamiento actual rompe el flujo.

El diseño deliberadamente no prescribe modificar OceanLanding porque:
a) El componente tiene lógica compleja de video/canvas/animaciones.
b) El tab MAR en fullscreen oculta el shell — OceanLanding ya tiene su propia UI completa.

### 8.2 Cupo atómico en eventos vs. piezas únicas en Rack

Rack usa una columna `status` en `rack_products` para la reserva atómica: `disponible → apartado → agotado`. Esto funciona porque cada pieza es una entidad con estado propio.

Para eventos, el cupo no funciona igual: no se "aparta" un boleto. El cupo se controla contando las órdenes con `status='paid'`. No hay estado intermedio porque si la sesión de Stripe expira, simplemente la orden queda en `expired` y el cupo vuelve a estar disponible sin necesidad de revertir nada.

Esta diferencia es intencional. Implicación para el implementador: el endpoint `POST /api/app/event-checkout` debe hacer el COUNT de órdenes paid en el momento de crear la sesión, pero no puede garantizar que el cupo sigue disponible al momento de pagar (race condition). Para el volumen de eventos de Bruuk (decenas de personas, no miles), esta inconsistencia es aceptable. No implementar un sistema de reserva de cupo con TTL para esta fase.

### 8.3 Validación de invite codes en el cliente (problema heredado)

`src/pages/LoginPage.tsx` valida el invite code llamando directamente desde el cliente a `supabase.from('invite_codes').select(...)`. Esto es un problema de seguridad conocido documentado en `docs/ARCHITECTURE_PLAN.md`. Este diseño NO lo propaga: la tabla `app_plans`, `app_rsvps` y `app_event_orders` no dependen de validaciones client-side. Sin embargo, el implementador no debe modificar `LoginPage.tsx` en el scope de este documento — es deuda técnica existente, no nueva.

### 8.4 Campo `used_by` en invite_codes guarda email, no UUID

En `LoginPage.tsx` línea 65: `update({ used: true, used_by: email.toLowerCase().trim() })`. La columna `used_by` guarda el email en texto plano en lugar de un UUID de perfil. Esto es deuda técnica preexistente. No se replica en el schema nuevo — las tablas de la app (`app_plans`, `app_rsvps`, `app_event_orders`) usan `user_id uuid` referenciando `profiles(id)`.

### 8.5 Falta de endpoint GET /api/app/rsvp

El diseño no incluye `GET /api/app/rsvp` para saber qué eventos tiene el usuario inscrito al cargar la app. El implementador deberá elegir entre:
a) Incluirlo en la respuesta de `GET /api/app/events` (campo `user_has_rsvp: boolean`), requiriendo auth en ese endpoint.
b) Crear `GET /api/app/rsvp` separado.

La opción recomendada es (b): mantener `/api/app/events` público (sin auth) y agregar `GET /api/app/rsvp` que devuelve solo los `event_id` del usuario autenticado. El tab EVENTOS llama ambos endpoints en paralelo al montar.

Esta omisión se registra aquí para que el implementador tome la decisión de arquitectura antes de escribir código.

### 8.6 Spots sin coordenadas en spots.json

Al leer `src/data/spots.json`, los spots con ids `spot_105`, `spot_106`, `spot_107`, `spot_108`, `spot_109`, `spot_110`, `spot_111`, `spot_112`, `spot_113`, `spot_114`, `spot_115`, `spot_116`, `spot_117`, `spot_118`, `spot_119`, `spot_120`, `spot_121` a `spot_133` no tienen el campo `coordinates`. El cálculo haversine solo funciona entre dos spots que ambos tengan coordenadas. El diseño maneja esto mostrando "Traslado manual" — el implementador debe verificar la presencia de `spot.coordinates` antes de calcular.

### 8.7 Stripe price_id vs. precio on-the-fly

Para Rack, el precio se define como `unit_amount` directo en la sesión de Stripe (sin crear un Price object previo). Para eventos, el diseño usa un `stripe_price_id` pre-creado al crear el evento via `POST /api/app/events`. Esta diferencia es intencional: los eventos tienen un precio fijo conocido de antemano y los Stripe Price objects facilitan reportes y reembolsos. El implementador debe notar que si se usa `stripe_price_id`, Stripe ya tiene el precio almacenado — no se pasa `price_data` en la sesión.

### 8.8 No hay `app_plans` endpoint GET colectivo sin auth

`GET /api/app/plans` requiere token. Si el token expira mientras el usuario está en la app, la llamada fallará con 401. El hook `usePlans.ts` debe manejar este caso redirigiendo a `/login`. Usar `useAuth` del contexto para detectar si `session` es null antes de hacer la llamada.

### 8.9 Max-width 560px y desktop centrado

El shell usa `max-width: 560px; margin: 0 auto`. Esto significa que en desktop hay espacio vacío a los lados. El fondo de la página (`body`) debe ser `#0a0a0f` (mismo que el shell) para que no se vea un borde blanco. Verificar que `src/index.css` o el CSS global tenga `body { background-color: #0a0a0f; }`.

---

*Documento generado: Junio 2026 · Bruuk Designer Agent · Para implementación en rama `mar`*
