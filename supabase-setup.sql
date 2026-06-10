-- ============================================================
-- RACK por BRUUK — Setup de tablas en Supabase
-- Copia y pega esto en el SQL Editor de Supabase Dashboard
-- (https://supabase.com/dashboard → tu proyecto → SQL Editor)
-- ============================================================

-- 1. CREATORS
create table if not exists rack_creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  avatar text,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- 2. PRODUCTS
create table if not exists rack_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  price integer not null,
  currency text not null default 'MXN',
  category text not null check (category in ('pre-owned', 'artesanal')),
  status text not null default 'disponible' check (status in ('disponible', 'apartado', 'agotado')),
  images text[] default '{}',
  color_placeholder text not null default '#0a0a0f',
  creator_id uuid references rack_creators(id),
  tags text[] default '{}',
  condition text,
  story text,
  created_at timestamptz default now()
);

-- 3. DROPS
create table if not exists rack_drops (
  id uuid primary key default gen_random_uuid(),
  date_label text not null,
  date_iso date not null,
  title text not null,
  category text not null check (category in ('pre-owned', 'artesanal')),
  piece_count integer not null default 1,
  teaser text,
  created_at timestamptz default now()
);

-- 4. EVENTS
create table if not exists rack_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_label text not null,
  location text not null default 'Guadalajara',
  link text not null default '/',
  created_at timestamptz default now()
);

-- 5. ORDERS — órdenes de compra (Stripe Checkout)
create table if not exists rack_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'cancelled')),
  items jsonb not null default '[]',
  amount_total integer not null default 0,
  currency text not null default 'MXN',
  customer_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
--
-- Catálogo: lectura pública, SIN políticas de escritura.
-- Las escrituras solo pasan por la API del servidor con la
-- SERVICE KEY (que ignora RLS). Nunca crear políticas de
-- escritura con `true` — eso deja escribir a cualquier anónimo.
--
-- Órdenes: sin NINGUNA política. Contienen emails de clientes;
-- solo el servidor (service key) puede leerlas o escribirlas.
-- ============================================================

alter table rack_creators enable row level security;
alter table rack_products enable row level security;
alter table rack_drops enable row level security;
alter table rack_events enable row level security;
alter table rack_orders enable row level security;

-- Limpieza: si ya corriste una versión anterior de este script,
-- estas políticas permitían escritura anónima. Se eliminan.
drop policy if exists "Auth insert creators" on rack_creators;
drop policy if exists "Auth update creators" on rack_creators;
drop policy if exists "Auth delete creators" on rack_creators;
drop policy if exists "Auth insert products" on rack_products;
drop policy if exists "Auth update products" on rack_products;
drop policy if exists "Auth delete products" on rack_products;
drop policy if exists "Auth insert drops" on rack_drops;
drop policy if exists "Auth update drops" on rack_drops;
drop policy if exists "Auth delete drops" on rack_drops;
drop policy if exists "Auth insert events" on rack_events;
drop policy if exists "Auth update events" on rack_events;
drop policy if exists "Auth delete events" on rack_events;

-- Lectura pública del catálogo (anon puede leer)
drop policy if exists "Public read creators" on rack_creators;
drop policy if exists "Public read products" on rack_products;
drop policy if exists "Public read drops" on rack_drops;
drop policy if exists "Public read events" on rack_events;
create policy "Public read creators" on rack_creators for select using (true);
create policy "Public read products" on rack_products for select using (true);
create policy "Public read drops" on rack_drops for select using (true);
create policy "Public read events" on rack_events for select using (true);

-- ============================================================
-- Datos iniciales (los mismos del mock)
-- ============================================================

-- Creators
insert into rack_creators (id, name, bio, color) values
  ('00000000-0000-0000-0000-000000000001', 'Mercado La Lagunilla', 'Piezas curadas de mercados de segunda mano en CDMX.', '#52c41a'),
  ('00000000-0000-0000-0000-000000000002', 'Carmen Mendoza', 'Ceramista de San Bartolo Coyotepec, Oaxaca. Cuarta generación en barro negro.', '#e8a045'),
  ('00000000-0000-0000-0000-000000000003', 'Archivo Denim', 'Coleccionistas de denim vintage auténtico.', '#52c41a'),
  ('00000000-0000-0000-0000-000000000004', 'Colectivo Ayuujk', 'Grupo de tejedoras de la Sierra Mixe, Oaxaca.', '#e8a045'),
  ('00000000-0000-0000-0000-000000000005', 'Apicultores Huasteca', 'Productores de miel y derivados de abeja melipona.', '#e8a045');

-- Products
insert into rack_products (slug, title, description, price, category, status, color_placeholder, creator_id, tags, condition, story) values
  ('chamarra-bomber-vintage', 'Chamarra bomber vintage', 'Bomber de los 90s con forro satinado color mostaza. Encontrada en una feria de pulgas en Tepito, usada por alguien que viajaba mucho.', 850, 'pre-owned', 'disponible', '#2a2a1a', '00000000-0000-0000-0000-000000000001', '{"bomber","años90","mostaza"}', 'Bueno', 'Forro satinado original intacto. Pequeño desgaste en el cuello que le da carácter.'),
  ('ceramica-oaxaquena-tazones', 'Set de tazones negros Oaxaca', 'Tres tazones hechos a mano en barro negro. Cada uno es diferente — así es como salen del torno de Doña Carmen.', 340, 'artesanal', 'disponible', '#1a1008', '00000000-0000-0000-0000-000000000002', '{"ceramica","barro-negro","oaxaca","cocina"}', null, 'Piezas únicas — no salen dos iguales del torno. El negro viene del pulido con cuarzo, no de pintura.'),
  ('jeans-levis-501-92', 'Levi''s 501 edición 1992', 'Vaquero 501 original de 1992 con la etiqueta roja de dos líneas. Talla 32x30. Lavados naturales y desgaste en las rodillas.', 620, 'pre-owned', 'disponible', '#0d1a2e', '00000000-0000-0000-0000-000000000003', '{"denim","levis","501","vintage"}', 'Con carácter', 'Etiqueta roja de dos líneas, pre-1999. El desgaste es del uso real, no fabricado.'),
  ('bolsa-tejida-mixe', 'Bolsa de mano tejida Mixe', 'Tejida en telar de cintura por artesanas de la Sierra Mixe, Oaxaca. Lana natural teñida con cochinilla y añil.', 480, 'artesanal', 'disponible', '#1a0a1a', '00000000-0000-0000-0000-000000000004', '{"tejido","mixe","lana","telar"}', null, 'Cada pieza tarda dos semanas en tejerse. Los colores vienen de tintes naturales: cochinilla para el rojo, añil para el azul.'),
  ('camiseta-band-tee-the-cure', 'Camiseta band tee The Cure', 'Tour tee de The Cure, gira Disintegration 1989. Algodón original con cracking natural en la serigrafía.', 1200, 'pre-owned', 'apartado', '#0a0a14', '00000000-0000-0000-0000-000000000001', '{"band-tee","the-cure","rock","1989"}', 'Con carácter', 'Tour original Disintegration. La serigrafía tiene cracking natural — señal de que es auténtica.'),
  ('vela-cera-abeja-vainilla', 'Vela de cera de abeja con vainilla', 'Elaborada con cera pura de abeja melipona de la Huasteca Potosina. Fragancia de vainilla papantla 100% natural.', 220, 'artesanal', 'disponible', '#1a1508', '00000000-0000-0000-0000-000000000005', '{"vela","cera-abeja","vainilla","huasteca"}', null, 'La abeja melipona es endémica de México y no tiene aguijón. Su cera es más pura que la de abeja europea.');

-- Drops
insert into rack_drops (date_label, date_iso, title, category, piece_count, teaser) values
  ('18 JUN', '2026-06-18', 'Camisas vintage seleccionadas', 'pre-owned', 5, 'Oxford, hawaianas y flannel. Años 80 y 90.'),
  ('22 JUN', '2026-06-22', 'Colección cerámica Oaxaca', 'artesanal', 3, 'Barro negro y verde de Atzompa.'),
  ('28 JUN', '2026-06-28', 'Denim selección 90s', 'pre-owned', 4, 'Levi''s, Lee y Wrangler vintage. Piezas verificadas.'),
  ('02 JUL', '2026-07-02', 'Bolsas tejidas a mano', 'artesanal', 2, 'Telar de cintura y macramé. Colores naturales.');

-- Events
insert into rack_events (title, date_label, location, link) values
  ('Mercado Nocturno Vol. 3', '15 JUN', 'Guadalajara', '/'),
  ('Taller de Serigrafía', '22 JUN', 'Guadalajara', '/'),
  ('Noche de Museos Indie', '29 JUN', 'Guadalajara', '/');
