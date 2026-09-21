# Asistencia QR

Sistema transaccional de toma de asistencia para cursos, pensado para
reemplazar la lista manual. El profesor abre una clase, se genera un QR
(o un código corto para dictar en aulas sin computadora), los alumnos
escanean/tipean y quedan registrados. Al cerrar la clase, el código se
invalida y ya nadie más puede usarlo.

## Cómo funciona (resumen)

1. El profesor entra a `/profesor`, crea sus cursos y toca **"Abrir clase
   de hoy"**.
2. Se genera un código aleatorio de 6 caracteres (ej: `K3F9QZ`) con una
   expiración (15 minutos por defecto).
3. En `/profesor/clase/[id]` se muestra:
   - Un **QR** que codifica un link único (`/asistencia/<claseId>/<token>`).
   - El **mismo código en texto grande**, por si el curso no tiene
     computadora/proyector y el profesor solo puede dictarlo o escribirlo
     en el pizarrón.
   - Un contador con el tiempo restante y un botón **"Cerrar toma de
     asistencia ahora"**.
   - La lista de presentes en vivo (se actualiza sola) y un botón para
     **exportar a CSV**.
4. El alumno escanea el QR (o entra a `/asistencia` y tipea el código a
   mano) y carga su DNI/legajo y nombre.
5. El backend valida, en una sola operación:
   - que la clase siga **abierta**,
   - que el **código coincida**,
   - que **no haya expirado**,
   - y que ese alumno **no se haya registrado ya** (constraint UNIQUE en
     la base de datos, no una validación "de mentira" en el frontend).
6. Cuando el profesor cierra la clase (a mano o porque se cumplió el
   tiempo), cualquier intento posterior de registrarse —aunque alguien
   tenga la foto del QR— es rechazado.

## Stack

- **Next.js 14** (App Router) — frontend + backend (API Routes) en el
  mismo proyecto.
- **Supabase (Postgres)** — base de datos.
- **Vercel** — hosting/deploy.
- `react-qr-code` para generar el QR en el navegador.

## Estructura del proyecto

```
asistencia-qr/
├─ app/
│  ├─ page.js                          → Home (elegís profesor o alumno)
│  ├─ profesor/
│  │  ├─ page.js                       → Crear cursos / abrir clases
│  │  └─ clase/[id]/page.js            → QR en vivo de una clase
│  ├─ asistencia/
│  │  ├─ page.js                       → Registro con código manual
│  │  └─ [claseId]/[token]/page.js     → Registro al escanear el QR
│  └─ api/
│     ├─ cursos/route.js               → GET/POST cursos
│     ├─ clases/abrir/route.js         → Abre una clase (genera token)
│     ├─ clases/cerrar/route.js        → Cierra/invalida una clase
│     ├─ clases/[id]/asistencias/route.js → Lista + export CSV
│     └─ asistencias/registrar/route.js  → Registra una asistencia (transacción)
├─ components/
│  ├─ PanelProfesor.js
│  ├─ ClaseEnVivo.js
│  └─ FormularioAsistencia.js
├─ lib/
│  ├─ supabaseAdmin.js                 → Cliente Supabase (Service Role, solo server)
│  └─ generateToken.js
├─ supabase/schema.sql                 → Script para crear las tablas
└─ .env.local.example
```

## Modelo de datos

- **cursos**: id, nombre
- **clases**: id, curso_id, fecha, estado (`abierta`/`cerrada`), token,
  token_expira_en
- **asistencias**: id, clase_id, dni_alumno, nombre_alumno, metodo
  (`qr`/`codigo`), registrado_en — con `UNIQUE(clase_id, dni_alumno)`
  para que un alumno no pueda marcarse dos veces en la misma clase.

Todas las escrituras y lecturas pasan por las API Routes de Next.js, que
usan la **Service Role Key** de Supabase (nunca se expone al navegador).
Por eso el cliente nunca habla directo con la base de datos.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com), creá un proyecto nuevo.
2. En el **SQL Editor**, pegá y ejecutá el contenido de
   `supabase/schema.sql`.
3. En **Settings → API**, copiá:
   - `Project URL`
   - `service_role` key (⚠️ no la `anon` key, esa no la vas a necesitar)

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local` con los datos de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CLASE_EXPIRA_MINUTOS=15
```

### 3. Instalar y correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

### 4. Probar el flujo completo

- Entrá a `/profesor`, creá un curso y abrí una clase.
- Abrí `/asistencia/<claseId>/<token>` en otra pestaña (o escaneá el QR
  con el celular, apuntando a la IP de tu compu en la red local en vez
  de `localhost`) y registrate.
- Mirá cómo aparece en la lista de presentes del panel del profesor.
- Probá cerrar la clase y verificá que un nuevo intento de registro dé
  error.

### 5. Deploy a Vercel

1. Subí el proyecto a un repo de GitHub.
2. Importalo en [vercel.com](https://vercel.com).
3. Cargá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CLASE_EXPIRA_MINUTOS`) en
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

Esto es un MVP funcional, pensado para un curso o unos pocos cursos.
Cosas para sumar si lo llevás a producción real:

- **Autenticación del profesor**: hoy `/profesor` es público. Sumar
  Supabase Auth (magic link) para que solo el docente pueda abrir/cerrar
  clases.
- **Validar contra una lista de alumnos inscriptos**: hoy cualquier
  DNI/nombre se acepta. Se puede agregar una tabla `alumnos` con el
  padrón del curso y rechazar DNIs que no estén anotados.
- **QR rotativo**: para blindar aún más contra el caso de que alguien
  reenvíe la foto del QR a un compañero ausente *antes* de que se cierre
  la clase, se puede hacer que el token cambie cada 15-20 segundos
  (mismo mecanismo que el check-in de Google Meet). Con el diseño actual
  es un cambio acotado: alcanza con regenerar el `token` periódicamente
  desde el frontend del profesor y actualizarlo en la base.
- **Row Level Security**: las tablas ya tienen RLS activado sin
  políticas para el rol `anon`, como capa extra de seguridad, ya que hoy
  todo pasa por el backend con la Service Role Key.
- **Geolocalización/red del aula** (opcional, más avanzado): exigir que
  el registro se haga desde una IP o rango de GPS específico, para
  reducir aún más el registro remoto.
# asistencia-qr
