-- Datos de prueba (ficticios) para la demo. Ejecutar DESPUÉS de schema.sql.
--
-- Genera: 10 carreras, sus materias por año, comisiones, 1 director,
-- 20 profesores, ~1000 alumnos con su padrón, y 12 semanas de clases con
-- asistencias simuladas (incluye ausentes, para que el tablero tenga datos).
--
-- Las fechas se calculan relativas al día en que se ejecuta el script, así
-- que siempre vas a ver "las últimas 12 semanas".
--
-- Usuarios de prueba (la contraseña inicial de todos es su propio DNI):
--   Director:   DNI 11111111
--   Profesores: DNI 20000001 a 20000020 (20000001 dicta Métodos Cuantitativos de Gestión)
--   Alumnos:    DNI 40000001 en adelante

do $$
declare
  semanas constant int := 12;
  -- Lunes de hace 12 semanas: primera semana de clases
  inicio date := (date_trunc('week', now() at time zone 'America/Argentina/Cordoba'))::date - semanas * 7;
  nombres text[] := array['Sofía','Mateo','Valentina','Santiago','Martina','Benjamín','Catalina','Joaquín',
    'Lucía','Tomás','Emilia','Lautaro','Julieta','Thiago','Camila','Felipe','Agustina','Bautista',
    'Milagros','Facundo','Florencia','Nicolás','Micaela','Franco','Abril','Ignacio','Rocío','Gonzalo',
    'Candela','Lucas','Paula','Ramiro','Brenda','Ezequiel','Antonella','Maximiliano','Delfina','Julián'];
  apellidos text[] := array['González','Rodríguez','Gómez','Fernández','López','Díaz','Martínez','Pérez',
    'García','Sánchez','Romero','Sosa','Álvarez','Torres','Ruiz','Ramírez','Flores','Acosta','Benítez',
    'Medina','Suárez','Herrera','Aguirre','Pereyra','Gutiérrez','Giménez','Molina','Silva','Castro',
    'Rojas','Ortiz','Luna','Juárez','Cabrera','Ríos','Ferreyra','Godoy','Morales','Domínguez','Moreno'];
  cfg record;
  com record;
  cla record;
  ins record;
  n_alumno int := 0;
  n_profe int;
  v_carrera uuid;
  v_alumno uuid;
  v_clase uuid;
  v_fecha timestamptz;
  v_hora int;
  v_prob float;
  v_r float;
begin
  perform setseed(0.42);

  -- ---------------------------------------------------------------------
  -- Carreras y plan de estudios (3 años, 3 materias por año)
  -- ---------------------------------------------------------------------
  create temp table plan (carrera text, anio int, materia text, orden int) on commit drop;
  insert into plan values
    ('Administración de Empresas',1,'Principios de Administración',1),('Administración de Empresas',1,'Matemática',2),('Administración de Empresas',1,'Inglés I',3),
    ('Administración de Empresas',2,'Contabilidad',1),('Administración de Empresas',2,'Métodos Cuantitativos de Gestión',2),('Administración de Empresas',2,'Fundamentos de Marketing',3),
    ('Administración de Empresas',3,'Finanzas de Empresas',1),('Administración de Empresas',3,'Planeamiento Estratégico',2),('Administración de Empresas',3,'Práctica Profesionalizante',3),

    ('Diseño Gráfico',1,'Diseño Gráfico I',1),('Diseño Gráfico',1,'Dibujo y Representación',2),('Diseño Gráfico',1,'Historia del Arte',3),
    ('Diseño Gráfico',2,'Diseñomática',1),('Diseño Gráfico',2,'Tipografía',2),('Diseño Gráfico',2,'Producción Gráfica',3),
    ('Diseño Gráfico',3,'Diseño Editorial',1),('Diseño Gráfico',3,'Identidad Corporativa',2),('Diseño Gráfico',3,'Práctica Profesionalizante',3),

    ('Cs. de Datos e Inteligencia Artificial',1,'Matemática',1),('Cs. de Datos e Inteligencia Artificial',1,'Programación I',2),('Cs. de Datos e Inteligencia Artificial',1,'Probabilidad y Estadística',3),
    ('Cs. de Datos e Inteligencia Artificial',2,'Base de Datos',1),('Cs. de Datos e Inteligencia Artificial',2,'Aprendizaje Automático',2),('Cs. de Datos e Inteligencia Artificial',2,'Métodos Cuantitativos de Gestión',3),
    ('Cs. de Datos e Inteligencia Artificial',3,'Aprendizaje Profundo',1),('Cs. de Datos e Inteligencia Artificial',3,'Visualización de Datos',2),('Cs. de Datos e Inteligencia Artificial',3,'Práctica Profesionalizante',3),

    ('Analista en Sistemas',1,'Programación I',1),('Analista en Sistemas',1,'Matemática',2),('Analista en Sistemas',1,'Inglés I',3),
    ('Analista en Sistemas',2,'Base de Datos',1),('Analista en Sistemas',2,'Análisis y Diseño de Sistemas',2),('Analista en Sistemas',2,'Programación II',3),
    ('Analista en Sistemas',3,'Redes y Comunicaciones',1),('Analista en Sistemas',3,'Metodologías Ágiles',2),('Analista en Sistemas',3,'Práctica Profesionalizante',3),

    ('Marketing',1,'Fundamentos de Marketing',1),('Marketing',1,'Principios de Administración',2),('Marketing',1,'Inglés I',3),
    ('Marketing',2,'Investigación de Mercado',1),('Marketing',2,'Comportamiento del Consumidor',2),('Marketing',2,'Publicidad Digital',3),
    ('Marketing',3,'Planeamiento Estratégico',1),('Marketing',3,'Métodos Cuantitativos de Gestión',2),('Marketing',3,'Práctica Profesionalizante',3),

    ('Recursos Humanos',1,'Principios de Administración',1),('Recursos Humanos',1,'Psicología Organizacional',2),('Recursos Humanos',1,'Inglés I',3),
    ('Recursos Humanos',2,'Cultura Organizacional',1),('Recursos Humanos',2,'Derecho Laboral',2),('Recursos Humanos',2,'Liquidación de Sueldos',3),
    ('Recursos Humanos',3,'Capacitación y Desarrollo',1),('Recursos Humanos',3,'Métodos Cuantitativos de Gestión',2),('Recursos Humanos',3,'Práctica Profesionalizante',3),

    ('Publicidad',1,'Fundamentos de Marketing',1),('Publicidad',1,'Historia del Arte',2),('Publicidad',1,'Diseñomática',3),
    ('Publicidad',2,'Creación Publicitaria',1),('Publicidad',2,'Redacción Publicitaria',2),('Publicidad',2,'Publicidad Digital',3),
    ('Publicidad',3,'Planeamiento de la Comunicación',1),('Publicidad',3,'Investigación de Mercado',2),('Publicidad',3,'Práctica Profesionalizante',3),

    ('Comercio Internacional',1,'Introducción al Comercio Exterior',1),('Comercio Internacional',1,'Matemática',2),('Comercio Internacional',1,'Inglés I',3),
    ('Comercio Internacional',2,'Legislación Aduanera',1),('Comercio Internacional',2,'Logística Internacional',2),('Comercio Internacional',2,'Portugués I',3),
    ('Comercio Internacional',3,'Negocios Internacionales',1),('Comercio Internacional',3,'Métodos Cuantitativos de Gestión',2),('Comercio Internacional',3,'Práctica Profesionalizante',3),

    ('Videojuegos',1,'Programación I',1),('Videojuegos',1,'Game Design',2),('Videojuegos',1,'Dibujo y Representación',3),
    ('Videojuegos',2,'Modelado 3D',1),('Videojuegos',2,'Motores de Juego',2),('Videojuegos',2,'Programación II',3),
    ('Videojuegos',3,'Animación Digital',1),('Videojuegos',3,'Producción de Videojuegos',2),('Videojuegos',3,'Práctica Profesionalizante',3),

    ('Logística',1,'Logística y Empresa',1),('Logística',1,'Matemática',2),('Logística',1,'Recursos Informáticos',3),
    ('Logística',2,'Probabilidad y Estadística',1),('Logística',2,'Gestión de Inventarios',2),('Logística',2,'Distribución y Transporte',3),
    ('Logística',3,'Logística Internacional',1),('Logística',3,'Métodos Cuantitativos de Gestión',2),('Logística',3,'Práctica Profesionalizante',3);

  insert into carreras (nombre) select distinct carrera from plan;
  insert into materias (nombre) select distinct materia from plan;
  insert into carrera_materias (carrera_id, materia_id, anio)
    select ca.id, ma.id, p.anio
    from plan p join carreras ca on ca.nombre = p.carrera join materias ma on ma.nombre = p.materia;

  -- ---------------------------------------------------------------------
  -- Cohortes: cuántos alumnos hay por año y en qué comisiones cursan
  -- (división, turno, modalidad). Los alumnos de un año se reparten entre
  -- sus divisiones y cursan las 3 materias de ese año en su división.
  -- ---------------------------------------------------------------------
  create temp table cohorte (carrera text, anio int, alumnos int, divisiones text[], turnos text[], modalidades text[]) on commit drop;
  insert into cohorte values
    ('Administración de Empresas',1,48,'{A,B}','{mañana,noche}','{presencial,presencial}'),
    ('Administración de Empresas',2,34,'{A}','{noche}','{presencial}'),
    ('Administración de Empresas',3,26,'{A}','{noche}','{virtual}'),
    ('Diseño Gráfico',1,40,'{A,B}','{tarde,noche}','{presencial,presencial}'),
    ('Diseño Gráfico',2,30,'{A}','{tarde}','{presencial}'),
    ('Diseño Gráfico',3,22,'{A}','{tarde}','{presencial}'),
    ('Cs. de Datos e Inteligencia Artificial',1,55,'{A,B}','{mañana,noche}','{presencial,virtual}'),
    ('Cs. de Datos e Inteligencia Artificial',2,36,'{A}','{noche}','{presencial}'),
    ('Cs. de Datos e Inteligencia Artificial',3,20,'{A}','{noche}','{virtual}'),
    ('Analista en Sistemas',1,60,'{A,B}','{mañana,noche}','{presencial,presencial}'),
    ('Analista en Sistemas',2,42,'{A,B}','{mañana,noche}','{presencial,virtual}'),
    ('Analista en Sistemas',3,30,'{A}','{noche}','{presencial}'),
    ('Marketing',1,36,'{A}','{tarde}','{presencial}'),
    ('Marketing',2,26,'{A}','{tarde}','{presencial}'),
    ('Marketing',3,18,'{A}','{noche}','{virtual}'),
    ('Recursos Humanos',1,30,'{A}','{noche}','{presencial}'),
    ('Recursos Humanos',2,22,'{A}','{noche}','{presencial}'),
    ('Recursos Humanos',3,16,'{A}','{noche}','{virtual}'),
    ('Publicidad',1,28,'{A}','{tarde}','{presencial}'),
    ('Publicidad',2,20,'{A}','{tarde}','{presencial}'),
    ('Publicidad',3,15,'{A}','{tarde}','{presencial}'),
    ('Comercio Internacional',1,32,'{A}','{mañana}','{presencial}'),
    ('Comercio Internacional',2,24,'{A}','{noche}','{virtual}'),
    ('Comercio Internacional',3,17,'{A}','{noche}','{virtual}'),
    ('Videojuegos',1,45,'{A,B}','{tarde,noche}','{presencial,presencial}'),
    ('Videojuegos',2,28,'{A}','{tarde}','{presencial}'),
    ('Videojuegos',3,18,'{A}','{tarde}','{presencial}'),
    ('Logística',1,26,'{A}','{noche}','{virtual}'),
    ('Logística',2,19,'{A}','{noche}','{virtual}'),
    ('Logística',3,14,'{A}','{noche}','{virtual}');

  -- ---------------------------------------------------------------------
  -- Usuarios: director y profesores (contraseña inicial = DNI)
  -- ---------------------------------------------------------------------
  insert into usuarios (dni, nombre, rol, password_hash)
    values ('11111111', 'Directora Demo', 'director', crypt('11111111', gen_salt('bf', 8)));

  for n_profe in 1..20 loop
    insert into usuarios (dni, nombre, rol, password_hash)
    values (
      (20000000 + n_profe)::text,
      'Prof. ' || nombres[1 + (n_profe * 7) % array_length(nombres, 1)] || ' ' ||
        apellidos[1 + (n_profe * 11) % array_length(apellidos, 1)],
      'profesor',
      crypt((20000000 + n_profe)::text, gen_salt('bf', 8))
    );
  end loop;

  -- ---------------------------------------------------------------------
  -- Comisiones: una por (carrera, materia del año, división)
  -- ---------------------------------------------------------------------
  for cfg in select c.*, ca.id as carrera_id from cohorte c join carreras ca on ca.nombre = c.carrera loop
    for i in 1..array_length(cfg.divisiones, 1) loop
      insert into comisiones (carrera_id, materia_id, division, turno, modalidad, profesor_id)
      select cfg.carrera_id, ma.id, cfg.divisiones[i], cfg.turnos[i], cfg.modalidades[i],
        case
          -- Todas las comisiones de Métodos Cuantitativos de Gestión son del profesor 20000001
          when p.materia = 'Métodos Cuantitativos de Gestión' then (select id from usuarios where dni = '20000001')
          else (select id from usuarios where dni = (20000002 + abs(hashtext(cfg.carrera || p.materia || cfg.divisiones[i])) % 19)::text)
        end
      from plan p join materias ma on ma.nombre = p.materia
      where p.carrera = cfg.carrera and p.anio = cfg.anio;
    end loop;
  end loop;

  -- ---------------------------------------------------------------------
  -- Alumnos y padrón
  -- ---------------------------------------------------------------------
  create temp table alumno_perfil (alumno_id uuid primary key, base float) on commit drop;

  for cfg in select c.*, ca.id as carrera_id from cohorte c join carreras ca on ca.nombre = c.carrera loop
    for i in 1..cfg.alumnos loop
      n_alumno := n_alumno + 1;
      insert into usuarios (dni, nombre, rol, password_hash, carrera_id)
      values (
        (40000000 + n_alumno)::text,
        nombres[1 + floor(random() * array_length(nombres, 1))::int] || ' ' ||
          apellidos[1 + floor(random() * array_length(apellidos, 1))::int],
        'alumno',
        -- bcrypt con costo bajo solo para que el seed corra rápido
        crypt((40000000 + n_alumno)::text, gen_salt('bf', 4)),
        cfg.carrera_id
      )
      returning id into v_alumno;

      -- Propensión individual a asistir: la mayoría viene casi siempre,
      -- una minoría falta mucho (son los "alumnos en riesgo").
      insert into alumno_perfil values (
        v_alumno,
        case when random() < 0.10 then 0.55 + random() * 0.25 else 0.90 + random() * 0.10 end
      );

      insert into inscripciones (comision_id, alumno_id)
      select co.id, v_alumno
      from comisiones co
      join carrera_materias cm on cm.carrera_id = co.carrera_id and cm.materia_id = co.materia_id
      where co.carrera_id = cfg.carrera_id
        and cm.anio = cfg.anio
        and co.division = cfg.divisiones[1 + (i - 1) % array_length(cfg.divisiones, 1)];
    end loop;
  end loop;

  -- ---------------------------------------------------------------------
  -- Clases (una por semana por comisión) y asistencias simuladas
  -- ---------------------------------------------------------------------
  for com in
    select co.*, row_number() over (partition by co.carrera_id, co.division order by co.materia_id) as orden
    from comisiones co
  loop
    v_hora := case com.turno when 'mañana' then 8 when 'tarde' then 14 else 19 end;

    for semana in 0..semanas - 1 loop
      -- Día fijo de la semana según la materia (lunes a viernes)
      v_fecha := ((inicio + semana * 7 + ((com.orden - 1 + ascii(com.division) - 65) % 5)::int)::timestamp
        + make_interval(hours => v_hora)) at time zone 'America/Argentina/Cordoba';

      -- Algunas semanas no hubo clase (feriados, paros)
      continue when random() < 0.06;

      insert into clases (comision_id, fecha, estado, token, token_expira_en)
      values (com.id, v_fecha, 'cerrada', upper(substr(md5(random()::text), 1, 6)), v_fecha + interval '15 minutes')
      returning id into v_clase;

      for ins in
        select al.id, al.dni, al.nombre, ap.base
        from inscripciones i
        join usuarios al on al.id = i.alumno_id
        join alumno_perfil ap on ap.alumno_id = al.id
        where i.comision_id = com.id
      loop
        v_prob := ins.base
          - case com.turno when 'noche' then 0.03 when 'tarde' then 0.01 else 0 end
          - case com.modalidad when 'virtual' then 0.05 else 0 end
          - semana * 0.005; -- la asistencia cae a medida que avanza el cuatrimestre
        continue when random() > v_prob;

        v_r := random();
        insert into asistencias (clase_id, alumno_id, dni_alumno, nombre_alumno, metodo, registrado_en)
        values (
          v_clase, ins.id, ins.dni, ins.nombre,
          case when v_r < 0.68 then 'qr' when v_r < 0.95 then 'codigo' else 'manual' end,
          v_fecha + make_interval(secs => floor(random() * 600)::int)
        );
      end loop;
    end loop;
  end loop;
end $$;
