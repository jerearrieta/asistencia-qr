-- Migración: asistencia solo por QR y vínculo DNI-celular.
--
-- Ejecutar UNA vez en el SQL Editor de Supabase sobre una base que ya tiene
-- schema.sql. No borra datos: solo agrega columnas, un índice y una tabla.

-- Celular vinculado a cada alumno (se completa solo la primera vez que
-- registra asistencia). Un celular solo puede estar vinculado a un alumno.
alter table usuarios
  add column if not exists dispositivo_id text,
  add column if not exists dispositivo_vinculado_en timestamptz;
create unique index if not exists usuarios_dispositivo_id_key on usuarios(dispositivo_id);

-- Marca los registros en los que el alumno vinculó su celular en esa clase
alter table asistencias
  add column if not exists vinculo_nuevo boolean not null default false;

-- Pedidos de cambio de celular que el profesor resuelve en la clase en vivo
create table if not exists pedidos_cambio_celular (
  clase_id uuid not null references clases(id) on delete cascade,
  alumno_id uuid not null references usuarios(id) on delete cascade,
  dispositivo_id text not null,
  creado_en timestamptz not null default now(),
  primary key (clase_id, alumno_id)
);
alter table pedidos_cambio_celular enable row level security;
