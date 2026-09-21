-- Ejecutar este script en el SQL Editor de Supabase (una sola vez)

create extension if not exists "pgcrypto";

-- Cursos (materias) sobre los que se toma asistencia
create table if not exists cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

-- Cada "clase" es una sesión puntual (una fecha) de un curso
create table if not exists clases (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete cascade,
  fecha timestamptz not null default now(),
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  token text not null,
  token_expira_en timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_clases_curso on clases(curso_id);
create index if not exists idx_clases_token on clases(token);

-- Registro transaccional de asistencia. Un alumno no puede registrarse
-- dos veces en la misma clase gracias al UNIQUE de abajo.
create table if not exists asistencias (
  id uuid primary key default gen_random_uuid(),
  clase_id uuid not null references clases(id) on delete cascade,
  dni_alumno text not null,
  nombre_alumno text,
  metodo text not null default 'qr' check (metodo in ('qr', 'codigo', 'manual')),
  registrado_en timestamptz not null default now(),
  unique (clase_id, dni_alumno)
);

create index if not exists idx_asistencias_clase on asistencias(clase_id);

-- Nota sobre seguridad (RLS):
-- En este proyecto, TODAS las escrituras y lecturas pasan por las API Routes
-- de Next.js, que usan la Service Role Key (solo del lado del servidor).
-- El cliente (navegador) nunca habla directo con Supabase, así que no es
-- estrictamente necesario RLS para que el sistema funcione. Aun así, como
-- buena práctica en producción, se recomienda activar RLS y dejar estas
-- tablas sin políticas para el rol "anon" (bloqueadas por defecto).
alter table cursos enable row level security;
alter table clases enable row level security;
alter table asistencias enable row level security;
-- No se crean políticas para "anon": queda todo bloqueado excepto vía
-- la Service Role Key que usa el backend.
