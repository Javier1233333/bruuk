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
-- ENMIENDA E1: capacity_remaining para cupo atómico sin sobreventa.
-- ENMIENDA E2: stripe_price_id eliminado del flujo (columna conservada nullable para referencia).

create table if not exists app_events (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (char_length(title) between 1 and 120),
  description         text not null default '' check (char_length(description) <= 800),
  date_iso            timestamptz not null,
  date_label          text not null,
  location_text       text not null check (char_length(location_text) <= 200),
  location_maps_link  text,
  category            text not null,
  category_color      text not null default '#6366f1',
  capacity            integer not null check (capacity > 0),
  capacity_remaining  integer not null,  -- E1: decrementado atómicamente en cada reserva
  price_mxn           integer not null default 0 check (price_mxn >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz default now(),
  constraint capacity_remaining_valid check (capacity_remaining >= 0 and capacity_remaining <= capacity)
);

-- RLS events: lectura pública de eventos activos, escritura solo service key
alter table app_events enable row level security;
drop policy if exists "events_public_read" on app_events;
create policy "events_public_read" on app_events
  for select using (is_active = true);
-- Sin políticas de insert/update/delete — solo la service key puede escribir.

-- ── Funciones de cupo atómico (E1) ──────────────────────────
-- El decremento DEBE ser una sola sentencia SQL (capacity_remaining =
-- capacity_remaining - 1) para que Postgres serialice las reservas
-- concurrentes. Un read-modify-write desde la API pierde decrementos
-- bajo concurrencia y sobrevende.

create or replace function app_reserve_event_spot(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  update app_events
     set capacity_remaining = capacity_remaining - 1
   where id = p_event_id
     and capacity_remaining > 0
     and is_active = true;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

create or replace function app_release_event_spot(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update app_events
     set capacity_remaining = least(capacity_remaining + 1, capacity)
   where id = p_event_id;
end;
$$;

-- Solo el servidor (service_role) puede ejecutarlas — nunca el navegador
revoke execute on function app_reserve_event_spot(uuid) from public, anon, authenticated;
revoke execute on function app_release_event_spot(uuid) from public, anon, authenticated;


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


-- ── 5. APP_EVENT_ORDERS ──────────────────────────────────────
-- Órdenes de boletos de eventos de pago. Mismo patrón que rack_orders.
-- Sin ninguna política — solo service key lee y escribe.

create table if not exists app_event_orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique,
  user_id            uuid,
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
