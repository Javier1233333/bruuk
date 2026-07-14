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
