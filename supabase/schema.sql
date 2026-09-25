-- Ejecutar este script en el SQL Editor de Supabase.
--
-- ⚠️ ARRANCA DE CERO: borra las tablas de la versión anterior (cursos,
-- clases, asistencias) y todas las de esta versión. Después de correrlo,
-- ejecutá supabase/seed.sql si querés datos de prueba.

create extension if not exists "pgcrypto";

drop view if exists v_resumen_semanal, v_resumen_alumno, v_resumen_comision, v_detalle_asistencia cascade;
drop table if exists asistencias, clases, inscripciones, comisiones,
  carrera_materias, materias, usuarios, carreras, cursos cascade;

-- ---------------------------------------------------------------------------
-- Estructura académica (la carga el director desde /admin)
-- ---------------------------------------------------------------------------

create table carreras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

-- Una materia puede dictarse en varias carreras (ej: Métodos Cuantitativos
-- de Gestión), y no siempre en el mismo año. Por eso el año vive en
-- carrera_materias y no en materias.
create table materias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

create table carrera_materias (
  carrera_id uuid not null references carreras(id) on delete cascade,
  materia_id uuid not null references materias(id) on delete cascade,
  anio smallint not null check (anio between 1 and 6),
  primary key (carrera_id, materia_id)
);

-- Usuarios del sistema. Se identifican por DNI.
--   director → administra todo y ve el tablero completo
--   profesor → abre clases de sus comisiones y ve su tablero
--   alumno   → registra asistencia y consulta la suya
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  dni text not null unique,
  nombre text not null,
  rol text not null check (rol in ('director', 'profesor', 'alumno')),
  password_hash text not null,
  carrera_id uuid references carreras(id) on delete set null, -- solo alumnos
  created_at timestamptz not null default now()
);

-- Una comisión es una materia dictada en una carrera, año, turno, división
-- y modalidad, a cargo de un profesor. Es lo que antes era un "curso".
create table comisiones (
  id uuid primary key default gen_random_uuid(),
  carrera_id uuid not null,
  materia_id uuid not null,
  division text not null default 'A',
  turno text not null check (turno in ('mañana', 'tarde', 'noche')),
  modalidad text not null check (modalidad in ('presencial', 'virtual')),
  profesor_id uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (carrera_id, materia_id)
    references carrera_materias(carrera_id, materia_id) on delete cascade,
  unique (carrera_id, materia_id, division, turno, modalidad)
);

create index idx_comisiones_profesor on comisiones(profesor_id);

-- Padrón: qué alumnos están inscriptos en cada comisión. Es lo que permite
-- saber quién FALTÓ y no solo quién vino.
create table inscripciones (
  comision_id uuid not null references comisiones(id) on delete cascade,
  alumno_id uuid not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comision_id, alumno_id)
);

create index idx_inscripciones_alumno on inscripciones(alumno_id);

-- ---------------------------------------------------------------------------
-- Toma de asistencia
-- ---------------------------------------------------------------------------

-- Cada "clase" es una sesión puntual (una fecha) de una comisión
create table clases (
  id uuid primary key default gen_random_uuid(),
  comision_id uuid not null references comisiones(id) on delete cascade,
  fecha timestamptz not null default now(),
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  token text not null,
  token_expira_en timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_clases_comision on clases(comision_id);
create index idx_clases_token on clases(token);

-- Registro transaccional de asistencia. Un alumno no puede registrarse
-- dos veces en la misma clase, ni dos alumnos desde el mismo dispositivo.
create table asistencias (
  id uuid primary key default gen_random_uuid(),
  clase_id uuid not null references clases(id) on delete cascade,
  alumno_id uuid references usuarios(id) on delete set null,
  dni_alumno text not null,
  nombre_alumno text,
  metodo text not null default 'qr' check (metodo in ('qr', 'codigo', 'manual')),
  dispositivo_id text,
  registrado_en timestamptz not null default now(),
  unique (clase_id, dni_alumno),
  unique (clase_id, dispositivo_id)
);

create index idx_asistencias_clase on asistencias(clase_id);

-- ---------------------------------------------------------------------------
-- Vistas para el tablero y los CSV
-- ---------------------------------------------------------------------------

-- Una fila por (clase, alumno inscripto): presente o ausente.
create view v_detalle_asistencia with (security_invoker = true) as
select
  cl.id as clase_id,
  cl.fecha,
  co.id as comision_id,
  ca.id as carrera_id,
  ca.nombre as carrera,
  ma.nombre as materia,
  cm.anio,
  co.division,
  co.turno,
  co.modalidad,
  co.profesor_id,
  pr.nombre as profesor,
  al.id as alumno_id,
  al.dni,
  al.nombre as alumno,
  (a.id is not null) as presente,
  a.metodo,
  a.registrado_en
from clases cl
join comisiones co on co.id = cl.comision_id
join carreras ca on ca.id = co.carrera_id
join materias ma on ma.id = co.materia_id
join carrera_materias cm on cm.carrera_id = co.carrera_id and cm.materia_id = co.materia_id
left join usuarios pr on pr.id = co.profesor_id
join inscripciones i on i.comision_id = co.id
join usuarios al on al.id = i.alumno_id
left join asistencias a on a.clase_id = cl.id and a.dni_alumno = al.dni;

-- Resumen por comisión
create view v_resumen_comision with (security_invoker = true) as
select
  co.id as comision_id,
  ca.id as carrera_id,
  ca.nombre as carrera,
  ma.nombre as materia,
  cm.anio,
  co.division,
  co.turno,
  co.modalidad,
  co.profesor_id,
  pr.nombre as profesor,
  (select count(*) from inscripciones i where i.comision_id = co.id) as inscriptos,
  (select count(*) from clases c where c.comision_id = co.id) as clases,
  coalesce(d.esperados, 0) as esperados,
  coalesce(d.presentes, 0) as presentes,
  coalesce(d.presentes_qr, 0) as presentes_qr,
  coalesce(d.presentes_codigo, 0) as presentes_codigo,
  coalesce(d.presentes_manual, 0) as presentes_manual
from comisiones co
join carreras ca on ca.id = co.carrera_id
join materias ma on ma.id = co.materia_id
join carrera_materias cm on cm.carrera_id = co.carrera_id and cm.materia_id = co.materia_id
left join usuarios pr on pr.id = co.profesor_id
left join (
  select
    comision_id,
    count(*) as esperados,
    count(*) filter (where presente) as presentes,
    count(*) filter (where metodo = 'qr') as presentes_qr,
    count(*) filter (where metodo = 'codigo') as presentes_codigo,
    count(*) filter (where metodo = 'manual') as presentes_manual
  from v_detalle_asistencia
  group by comision_id
) d on d.comision_id = co.id;

-- Resumen por alumno y comisión (para "alumnos en riesgo" y el portal del alumno)
create view v_resumen_alumno with (security_invoker = true) as
select
  i.alumno_id,
  al.dni,
  al.nombre as alumno,
  al.carrera_id as carrera_alumno_id,
  co.id as comision_id,
  ca.id as carrera_id,
  ca.nombre as carrera,
  ma.nombre as materia,
  cm.anio,
  co.division,
  co.turno,
  co.modalidad,
  co.profesor_id,
  pr.nombre as profesor,
  (select count(*) from clases c where c.comision_id = co.id) as clases,
  (
    select count(*) from asistencias a
    join clases c on c.id = a.clase_id
    where c.comision_id = co.id and a.dni_alumno = al.dni
  ) as presentes
from inscripciones i
join usuarios al on al.id = i.alumno_id
join comisiones co on co.id = i.comision_id
join carreras ca on ca.id = co.carrera_id
join materias ma on ma.id = co.materia_id
join carrera_materias cm on cm.carrera_id = co.carrera_id and cm.materia_id = co.materia_id
left join usuarios pr on pr.id = co.profesor_id;

-- Evolución semanal por comisión
create view v_resumen_semanal with (security_invoker = true) as
select
  comision_id,
  (date_trunc('week', fecha at time zone 'America/Argentina/Cordoba'))::date as semana,
  count(*) as esperados,
  count(*) filter (where presente) as presentes
from v_detalle_asistencia
group by comision_id, semana;

-- ---------------------------------------------------------------------------
-- Seguridad (RLS)
-- ---------------------------------------------------------------------------
-- TODAS las lecturas y escrituras pasan por las API Routes de Next.js, que
-- usan la Service Role Key (solo del lado del servidor). Activamos RLS sin
-- políticas para que las claves públicas (anon/authenticated) no puedan
-- leer nada, y las vistas usan security_invoker para respetar ese bloqueo.
alter table carreras enable row level security;
alter table materias enable row level security;
alter table carrera_materias enable row level security;
alter table usuarios enable row level security;
alter table comisiones enable row level security;
alter table inscripciones enable row level security;
alter table clases enable row level security;
alter table asistencias enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on v_detalle_asistencia, v_resumen_comision, v_resumen_alumno,
      v_resumen_semanal from anon, authenticated;
  end if;
end $$;
