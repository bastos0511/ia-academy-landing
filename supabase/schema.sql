-- =====================================================================
-- Campuslands AI Academy · Reto 4 · Registro de interesados y seguimiento
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- =====================================================================

-- Estados permitidos del seguimiento
do $$ begin
  create type public.estado_registro as enum ('Nuevo', 'Contactado', 'En seguimiento', 'Cerrado');
exception when duplicate_object then null; end $$;

-- Administradores autorizados del panel (su correo debe existir también en Authentication → Users)
create table if not exists public.admins (
  email  text primary key,
  nombre text not null
);

-- Registros que llegan desde el formulario de la landing (los crea n8n)
create table if not exists public.registros (
  id             bigint generated always as identity primary key,
  creado_en      timestamptz not null default now(),
  nombre         text not null check (char_length(btrim(nombre)) between 3 and 80),
  correo         text not null check (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  telefono       text check (telefono is null or telefono = '' or telefono ~ '^[0-9+() -]{7,20}$'),
  programa       text not null check (programa in (
                   'Ignition (4 h)', 'Booster (8 h)', 'Liftoff (12 h)',
                   'Odyssey (personalizado)', 'Nebula (pregrabado)', 'Aún no sé, quiero asesoría')),
  origen         text not null default 'landing',
  estado         public.estado_registro not null default 'Nuevo',
  actualizado_en timestamptz not null default now(),
  actualizado_por text
);
create index if not exists registros_creado_idx on public.registros (creado_en desc);
create index if not exists registros_estado_idx on public.registros (estado);

-- Historial inmutable: qué cambió, quién lo hizo y cuándo
create table if not exists public.historial (
  id              bigint generated always as identity primary key,
  registro_id     bigint not null references public.registros(id) on delete cascade,
  creado_en       timestamptz not null default now(),
  actor           text not null default 'sistema',
  accion          text not null check (accion in ('creado', 'estado', 'nota')),
  estado_anterior public.estado_registro,
  estado_nuevo    public.estado_registro,
  nota            text check (nota is null or char_length(nota) between 1 and 2000)
);
create index if not exists historial_registro_idx on public.historial (registro_id, creado_en);

-- ¿El usuario autenticado es administrador?
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = auth.email());
$$;

-- Nombre visible del actor: "Nombre <correo>" para admins, o el origen del sistema
create or replace function public.actor_actual(fallback text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select a.nombre || ' <' || a.email || '>' from public.admins a where a.email = auth.email()),
    auth.email(),
    fallback);
$$;

-- Al crear un registro: deja la primera línea del historial
create or replace function public.tg_registro_creado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.historial (registro_id, actor, accion, estado_nuevo)
  values (new.id, public.actor_actual('Formulario web (n8n)'), 'creado', new.estado);
  return new;
end $$;

-- Al cambiar el estado: registra el cambio y quién lo hizo
create or replace function public.tg_registro_actualizado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.actualizado_en := now();
  new.actualizado_por := public.actor_actual('sistema');
  if new.estado is distinct from old.estado then
    insert into public.historial (registro_id, actor, accion, estado_anterior, estado_nuevo)
    values (new.id, new.actualizado_por, 'estado', old.estado, new.estado);
  end if;
  return new;
end $$;

-- Las notas no pueden falsificar autor ni fecha
create or replace function public.tg_historial_sello() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.actor := public.actor_actual('administrador');
    new.creado_en := now();
  end if;
  return new;
end $$;

drop trigger if exists registro_creado on public.registros;
create trigger registro_creado after insert on public.registros
  for each row execute function public.tg_registro_creado();

drop trigger if exists registro_actualizado on public.registros;
create trigger registro_actualizado before update on public.registros
  for each row execute function public.tg_registro_actualizado();

drop trigger if exists historial_sello on public.historial;
create trigger historial_sello before insert on public.historial
  for each row execute function public.tg_historial_sello();

-- ---------------------------------------------------------------------
-- Seguridad (RLS). El público no puede leer ni escribir nada directamente:
-- los registros solo entran por n8n (clave service_role, que se salta RLS).
-- ---------------------------------------------------------------------
alter table public.admins    enable row level security;
alter table public.registros enable row level security;
alter table public.historial enable row level security;

drop policy if exists "admins se ven a sí mismos" on public.admins;
create policy "admins se ven a sí mismos" on public.admins
  for select to authenticated using (public.es_admin());

drop policy if exists "admins leen registros" on public.registros;
create policy "admins leen registros" on public.registros
  for select to authenticated using (public.es_admin());

drop policy if exists "admins cambian estado" on public.registros;
create policy "admins cambian estado" on public.registros
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admins leen historial" on public.historial;
create policy "admins leen historial" on public.historial
  for select to authenticated using (public.es_admin());

drop policy if exists "admins agregan notas" on public.historial;
create policy "admins agregan notas" on public.historial
  for insert to authenticated with check (public.es_admin() and accion = 'nota');

-- Desde el panel solo se puede cambiar la columna estado (no nombre, correo, etc.)
revoke all on public.registros from anon, authenticated;
grant select on public.registros to authenticated;
grant update (estado) on public.registros to authenticated;
revoke all on public.historial from anon, authenticated;
grant select, insert on public.historial to authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------
-- Administradores de prueba (cambia los correos por los que crees en
-- Authentication → Users → Add user, con "Auto Confirm User" activado)
-- ---------------------------------------------------------------------
insert into public.admins (email, nombre) values
  ('admin.demo@aiacademy.test', 'Admin Demo'),
  ('admin2.demo@aiacademy.test', 'Segundo Admin')
on conflict (email) do nothing;
