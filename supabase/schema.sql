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
    'explorer'::user_role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Crear el disparador (Trigger)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

