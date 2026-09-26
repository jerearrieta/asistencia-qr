# Asistencia QR

Sistema transaccional de toma de asistencia para cursos, pensado para
reemplazar la lista manual. El profesor abre una clase, se genera un QR
(o un código corto para dictar en aulas sin computadora), los alumnos
escanean/tipean y quedan registrados. Al cerrar la clase, el código se
invalida y ya nadie más puede usarlo.

## Roles

La app tiene tres roles. Todos ingresan en `/login` con su **DNI** y una
contraseña (la inicial es el mismo DNI; después se cambia desde "Mi cuenta").

| Rol | Qué puede hacer |
|---|---|
| **Director** | Administra carreras, materias, comisiones, usuarios y padrones (`/admin`). Ve el tablero completo y puede abrir clases de cualquier comisión. |
| **Profesor** | Ve solo **sus** comisiones, abre la clase del día (QR + código), marca presentes a mano y ve el tablero de sus materias. |
| **Alumno** | Registra su asistencia con el QR o el código (sin necesidad de iniciar sesión) y, si inicia sesión, ve su porcentaje por materia (`/alumno`). |

## Cómo funciona (resumen)

1. El director carga la **estructura académica** en `/admin`:
   - **Carreras** (Analista en Sistemas, Marketing, …).
   - **Materias**, indicando en qué carreras se dictan y en qué año. Una
     materia puede estar en varias carreras (ej: Métodos Cuantitativos de
     Gestión).
   - **Comisiones**: una materia de una carrera con su **división, turno**
     (mañana/tarde/noche), **modalidad** (presencial/virtual) y **profesor a
     cargo**.
   - **Padrón** de cada comisión: se pega una lista `DNI;Nombre` (sirve
     copiar dos columnas de Excel).
2. El profesor ingresa con su DNI, ve sus comisiones (puede filtrarlas por
   carrera y materia) y toca **"Abrir clase"**.
3. Se genera un código de 6 caracteres con expiración, y en
   `/profesor/clase/[id]` se muestra el **QR**, el **código en grande**, el
   contador y la lista del padrón con **presentes y ausentes** en vivo. El
   profesor puede marcar presente a mano a quien no tenga celular.
4. El alumno escanea el QR (o entra a `/asistencia` y tipea el código) e
   ingresa **solo su DNI**. El backend valida que la clase esté abierta, que
   el código sea correcto y no haya expirado, que el DNI esté en el **padrón
   de esa comisión** y que no se haya registrado ya.
5. Carrera, materia, año, división, turno, modalidad y profesor **no los
   carga el alumno**: salen de la comisión de la clase. Así no hay errores de
   tipeo y los datos del tablero son confiables.

## CSV exportados

Todos los CSV usan `;` como separador (Excel en español los abre en
columnas) y traen una fila **por alumno del padrón**, incluidos los
ausentes:

`Carrera; Materia; Año; División; Turno; Modalidad; Profesor; Fecha clase; DNI; Alumno; Estado (Presente/Ausente); Método; Hora de registro`

- **CSV de una clase**: desde la pantalla de la clase o "Clases recientes".
- **CSV detallado** del tablero: todas las clases que coinciden con los
  filtros aplicados.
- **CSV por alumno** del tablero: una fila por alumno y materia, con clases,
  presentes, ausentes y % de asistencia (ideal para tablas dinámicas o Power
  BI).

## Tablero (`/tablero`)

Con filtros por carrera, materia, profesor (solo el director), año, turno y
modalidad. Cada filtro muestra solo las opciones compatibles con los demás
(por ejemplo, al elegir un profesor, "Materia" lista solo sus materias):

- Indicadores: asistencia promedio, alumnos inscriptos, clases dictadas y
  alumnos en riesgo (debajo del 75% en alguna materia).
- Inscriptos por carrera y % de asistencia por carrera.
- Evolución semanal de la asistencia.
- % de asistencia por turno, por modalidad y por año de cursado.
- Cómo se registra la asistencia (QR, código o manual).
- Listado de alumnos en riesgo y ranking de comisiones.

El director ve todo; cada profesor ve solo sus comisiones.

## Diseño

La interfaz usa un sistema de diseño propio en `app/globals.css`, basado en
variables CSS (colores, espaciados, radios, sombras y tiempos de animación):

- **Modo claro y oscuro automático**, según la configuración del
  dispositivo. El QR siempre se muestra sobre fondo blanco para que se
  escanee bien.
- **100% responsive**: menú desplegable en celulares, formularios con
  letra de 16px en móvil (evita el zoom de iOS) y tablas con scroll
  horizontal.
- **Microinteracciones sutiles**: botones que responden al toque,
  transiciones de 150–250ms, indicador "en vivo" en las clases abiertas y
  cuenta regresiva del código. Se respeta la preferencia de "reducir
  movimiento" del sistema.
- Tipografía **Inter** (`next/font`) e íconos de **lucide-react**.

## Stack

- **Next.js 14** (App Router) — frontend + backend (API Routes) en el
  mismo proyecto.
- **Supabase (Postgres)** — base de datos.
- **Vercel** — hosting/deploy.
- `react-qr-code` para generar el QR en el navegador.
- `lucide-react` para los íconos.
- `bcryptjs` para las contraseñas; la sesión es una cookie firmada
  (HMAC) que valida el `middleware.js` según el rol.

## Estructura del proyecto

```
asistencia-qr/
├─ app/
│  ├─ page.js                          → Home
│  ├─ login/, cuenta/                  → Ingreso con DNI / cambio de contraseña
│  ├─ admin/page.js                    → Panel del director
│  ├─ tablero/page.js                  → Tablero de datos
│  ├─ profesor/
│  │  ├─ page.js                       → Comisiones del profesor / abrir clases
│  │  └─ clase/[id]/page.js            → QR en vivo + presentes y ausentes
│  ├─ alumno/page.js                   → "Mi asistencia" del alumno
│  ├─ asistencia/
│  │  ├─ page.js                       → Registro con código manual
│  │  └─ [claseId]/[token]/page.js     → Registro al escanear el QR
│  └─ api/
│     ├─ auth/                         → login, logout, cambio de contraseña
│     ├─ admin/                        → carreras, materias, comisiones, usuarios, inscripciones
│     ├─ clases/                       → abrir, cerrar, reabrir, asistencias (+CSV), marcado manual
│     ├─ tablero/exportar/             → CSV del tablero
│     └─ asistencias/registrar/        → Registra una asistencia (transacción)
├─ components/                         → PanelProfesor, ClaseEnVivo, admin/*, tablero/*
├─ lib/                                → sesión, permisos, CSV, consultas
├─ middleware.js                       → Protege cada sección según el rol
├─ supabase/schema.sql                 → Tablas y vistas
├─ supabase/seed.sql                   → Datos de prueba ficticios
└─ .env.local.example
```

## Modelo de datos

- **carreras**: id, nombre
- **materias**: id, nombre
- **carrera_materias**: carrera_id, materia_id, anio (una materia puede
  estar en varias carreras, en distinto año)
- **usuarios**: id, dni (único), nombre, rol (`director`/`profesor`/`alumno`),
  password_hash, carrera_id (alumnos)
- **comisiones**: id, carrera_id, materia_id, division, turno, modalidad,
  profesor_id
- **inscripciones** (padrón): comision_id, alumno_id
- **clases**: id, comision_id, fecha, estado (`abierta`/`cerrada`), token,
  token_expira_en
- **asistencias**: id, clase_id, alumno_id, dni_alumno, nombre_alumno,
  metodo (`qr`/`codigo`/`manual`), dispositivo_id, registrado_en — con
  `UNIQUE(clase_id, dni_alumno)` y `UNIQUE(clase_id, dispositivo_id)`.

Vistas para el tablero y los CSV: `v_detalle_asistencia` (una fila por
alumno del padrón y clase, presente o ausente), `v_resumen_comision`,
`v_resumen_alumno` y `v_resumen_semanal`.

Todas las escrituras y lecturas pasan por las API Routes de Next.js, que
usan la **Service Role Key** de Supabase (nunca se expone al navegador).
Las tablas tienen RLS activado sin políticas y las vistas usan
`security_invoker`, así que las claves públicas no pueden leer nada.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com), creá un proyecto nuevo.
2. En el **SQL Editor**, pegá y ejecutá el contenido de
   `supabase/schema.sql`. ⚠️ Borra las tablas anteriores (arranca de cero).
3. (Opcional, recomendado para la demo) Ejecutá `supabase/seed.sql` para
   cargar datos ficticios: 10 carreras, sus materias, ~110 comisiones,
   20 profesores, ~880 alumnos y 12 semanas de asistencias.
4. En **Settings → API**, copiá:
   - `Project URL`
   - `service_role` key (⚠️ no la `anon` key, esa no la vas a necesitar)

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CLASE_EXPIRA_MINUTOS=15
SESSION_SECRET=un-texto-largo-y-aleatorio
```

### 3. Instalar y correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

### 4. Usuarios de prueba (si cargaste `seed.sql`)

La contraseña inicial de todos es **su propio DNI**.

| Rol | DNI |
|---|---|
| Director | `11111111` |
| Profesor de Métodos Cuantitativos de Gestión | `20000001` |
| Otros profesores | `20000002` a `20000020` |
| Alumnos | `40000001` en adelante |

Para ver qué DNIs están en el padrón de una comisión: `/admin` → Padrón.

### 5. Probar el flujo completo

- Entrá como profesor (`20000001`) y tocá **"Abrir clase"** en una comisión.
- Abrí `/asistencia/<claseId>/<token>` en otra pestaña (o escaneá el QR
  con el celular) y registrate con un DNI del padrón de esa comisión.
- Mirá cómo pasa de "Ausente" a "Presente" en el panel del profesor.
- Entrá como director (`11111111`) y mirá el tablero.

### 6. Deploy a Vercel

1. Subí el proyecto a un repo de GitHub.
2. Importalo en [vercel.com](https://vercel.com).
3. Cargá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CLASE_EXPIRA_MINUTOS`, `SESSION_SECRET`) en
   **Settings → Environment Variables**.
4. Deploy. Listo, ya tenés una URL pública para usar desde el celular en
   el aula.

## Qué hacer si el curso no tiene computadora ni proyector

Ya está resuelto en el diseño: además del QR, la pantalla del profesor
siempre muestra el **código en texto grande**. El profesor puede:

- Mostrar esa pantalla desde **su propio celular** (no hace falta
  proyector), o
- Simplemente **dictarlo o escribirlo en el pizarrón**, y los alumnos lo
  tipean en `/asistencia` desde el suyo.

Ambos caminos escriben en la misma tabla `asistencias`, con el campo
`metodo` (`qr` o `codigo`) para distinguir cómo se registró cada uno.

## Limitaciones actuales / próximos pasos

- **Planes de estudio aproximados**: las materias de `seed.sql` son una
  aproximación armada a partir de información pública del IES; conviene
  revisarlas contra los planes oficiales.
- **Datos de prueba ficticios**: nombres, DNIs y asistencias de `seed.sql`
  son inventados para poder mostrar el tablero.
- **QR rotativo**: para evitar que alguien reenvíe la foto del QR antes de
  que cierre la clase, se puede hacer que el token cambie cada 15-20
  segundos.
- **Geolocalización/red del aula** (opcional): exigir que el registro se
  haga desde una IP o rango de GPS específico.
- **Recuperar contraseña por mail**: hoy la restablece el director (vuelve
  a ser el DNI).
