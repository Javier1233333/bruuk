-- ============================================================
-- BRUUK APP — Migración de Supabase Auth a Firebase Auth
-- Ejecutar UNA vez en SQL Editor, después de supabase-app-setup.sql.
--
-- Los usuarios ahora viven en Firebase: su uid es texto (28 chars),
-- no un uuid de auth.users. Toda lectura/escritura pasa por las APIs
-- con la service key, así que RLS queda activado y sin políticas.
-- ============================================================

begin;

-- ── 1. Ya no se crean perfiles desde auth.users ─────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists create_profile_on_signup();

-- ── 2. Políticas basadas en auth.uid() (impiden cambiar el tipo)
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "plans_select_own" on app_plans;
drop policy if exists "plans_insert_own" on app_plans;
drop policy if exists "plans_delete_own" on app_plans;
drop policy if exists "rsvps_select_own" on app_rsvps;
drop policy if exists "rsvps_insert_own" on app_rsvps;
drop policy if exists "rsvps_delete_own" on app_rsvps;

-- ── 3. Llaves foráneas ──────────────────────────────────────
alter table app_plans drop constraint if exists app_plans_user_id_fkey;
alter table app_rsvps drop constraint if exists app_rsvps_user_id_fkey;
alter table profiles  drop constraint if exists profiles_id_fkey;

-- ── 4. uuid → text (uid de Firebase) ────────────────────────
alter table profiles         alter column id      type text using id::text;
alter table app_plans        alter column user_id type text using user_id::text;
alter table app_rsvps        alter column user_id type text using user_id::text;
alter table app_event_orders alter column user_id type text using user_id::text;

alter table app_plans add constraint app_plans_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
alter table app_rsvps add constraint app_rsvps_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- RLS sigue activado en las tres tablas: sin políticas, solo la service key accede.

commit;

