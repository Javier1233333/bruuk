-- =========================================================================
-- MÓDULO 1: BASE DE DATOS Y AUTENTICACIÓN
-- =========================================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- Tabla de Invitaciones
create table if not exists public.invite_codes (
    id uuid default gen_random_uuid() primary key,
    code text unique not null,
    used boolean default false,
    used_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en invite_codes sin políticas públicas (totalmente interna/oculta)
alter table public.invite_codes enable row level security;

-- Función RPC para verificar e invalidar código de invitación de manera atómica
create or replace function public.verify_and_use_invite_code(user_code text)
returns boolean
language plpgsql
security definer -- ejecuta con privilegios del sistema para poder modificar auth.users e invite_codes
as $$
declare
    code_row record;
    user_email text;
begin
    -- Obtener email del usuario logueado
    user_email := auth.jwt() ->> 'email';
    
    if user_email is null then
        raise exception 'No autenticado';
    end if;

    -- Buscar código libre (case-insensitive)
    select * into code_row
    from public.invite_codes
    where upper(code) = upper(user_code) and used = false;

    if not found then
        return false;
    end if;

    -- Marcar código como usado
    update public.invite_codes
    set used = true, used_by = user_email
    where id = code_row.id;

    -- Actualizar metadata del usuario autenticado
    update auth.users
    set raw_user_meta_data = 
        coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('invite_verified', true)
    where id = auth.uid();

    return true;
end;
$$;

-- =========================================================================
-- MÓDULO 2: CREACIÓN Y CONFIGURACIÓN DEL PERFIL (PROFILES)
-- =========================================================================

-- Enum para Roles de Usuario (si no existe)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('explorer', 'host', 'admin');
  end if;
end
$$;

-- Tabla de Perfiles
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    instagram text,
    avatar_id text default 'avatar1',
    city text,
    interests text[],
    favorite_plan text,
    role user_role default 'explorer'::user_role not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en profiles
alter table public.profiles enable row level security;

-- Políticas de RLS para profiles
create policy "Allow select for verified users or owner" on public.profiles
    for select to authenticated
    using (auth.uid() = id or coalesce(((auth.jwt() -> 'user_metadata'::text) ->> 'invite_verified'::text)::boolean, false) = true);

create policy "Allow update for owners" on public.profiles
    for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Función Trigger para auto-crear perfil
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  suffix int := 1;
begin
  base_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));
  final_username := base_username;
  
  -- Resolver colisiones de username únicas
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.profiles (id, username, avatar_id, role)
  values (
    new.id,
    final_username,
    'avatar1',
    'explorer'::public.user_role
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Crear el disparador (Trigger)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- MÓDULO 3: BASE DE DATOS DE SPOTS CURADOS
-- =========================================================================

-- Tabla de Spots
create table if not exists public.spots (
    id text primary key, -- ej. 'spot_003'
    name text not null,
    type text,
    description text,
    image_url text,
    color_accent text,
    rating numeric,
    price text,
    lat numeric,
    lng numeric,
    maps_link text,
    city text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Spots Guardados (Saves)
create table if not exists public.spot_saves (
    user_id uuid references public.profiles(id) on delete cascade not null,
    spot_id text references public.spots(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, spot_id)
);

-- Tabla de Opiniones de Spots (Reviews)
create table if not exists public.spot_reviews (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    spot_id text references public.spots(id) on delete cascade not null,
    rating int check (rating >= 1 and rating <= 5) not null,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en las 3 tablas
alter table public.spots enable row level security;
alter table public.spot_saves enable row level security;
alter table public.spot_reviews enable row level security;

-- Políticas de RLS
create policy "Allow public read on spots" on public.spots
    for select using (true);

create policy "Allow save operations for owner" on public.spot_saves
    for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Allow read reviews" on public.spot_reviews
    for select using (true);

create policy "Allow write reviews for authenticated owners" on public.spot_reviews
    for insert to authenticated
    with check (auth.uid() = user_id);

-- =========================================================================
-- MÓDULO 4: EXPERIENCIAS, RESERVAS Y REFERIDOS
-- =========================================================================

-- Catálogo de Experiencias
create table if not exists public.experiences (
    id text primary key, -- ej. 'exp_001'
    host_id uuid references public.profiles(id) on delete set null,
    name text not null,
    host_name text not null,
    host_avatar text,
    category text not null,
    image_url text,
    rating numeric default 5.0,
    reviews_count int default 0,
    price text not null,
    duration text not null,
    location text not null,
    city text not null,
    description text,
    long_description text,
    images text[],
    reservation_info text,
    whatsapp_link text,
    status text default 'pending' not null, -- 'pending', 'approved'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Instancias de Evento (Fechas y Cupos)
create table if not exists public.events (
    id text primary key, -- ej. 'event_001'
    experience_id text references public.experiences(id) on delete cascade not null,
    date timestamp with time zone not null,
    location text not null,
    capacity int not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reservas / Asistencias (Stripe Ready)
do $$ begin
    create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.bookings (
    id uuid default gen_random_uuid() primary key,
    event_id text references public.events(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    status booking_status default 'confirmed'::booking_status not null, -- default 'confirmed' de momento
    stripe_session_id text,
    referrer_id uuid references public.profiles(id) on delete set null, -- tracking de quién lo invitó
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (event_id, user_id)
);

-- Tabla de Clicks de Links Compartidos (Referidos)
create table if not exists public.share_clicks (
    id uuid default gen_random_uuid() primary key,
    experience_id text references public.experiences(id) on delete cascade,
    referrer_id uuid references public.profiles(id) on delete cascade,
    source text default 'whatsapp', -- 'whatsapp', 'instagram', etc.
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en las 4 tablas
alter table public.experiences enable row level security;
alter table public.events enable row level security;
alter table public.bookings enable row level security;
alter table public.share_clicks enable row level security;

-- Políticas de RLS
create policy "Read approved experiences" on public.experiences 
    for select using (status = 'approved' or auth.uid() = host_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Read public events" on public.events 
    for select using (true);

create policy "Manage bookings for self" on public.bookings 
    for all to authenticated 
    using (auth.uid() = user_id) 
    with check (auth.uid() = user_id);

create policy "Insert click logs publicly" on public.share_clicks 
    for insert with check (true);

-- =========================================================================
-- MÓDULO 5: SEGURIDAD DE LA CUENTA
-- =========================================================================

-- Función RPC para que un usuario pueda eliminar su propia cuenta de forma segura
create or replace function public.delete_own_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Función RPC para verificar disponibilidad de correo (Case-Insensitive)
create or replace function public.is_email_available(email_to_check text)
returns boolean
language plpgsql
security definer -- permite consultar la tabla auth.users
as $$
begin
  return not exists (
    select 1 from auth.users where lower(email) = lower(email_to_check)
  );
end;
$$;
