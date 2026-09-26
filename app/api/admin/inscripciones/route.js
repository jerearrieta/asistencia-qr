import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";

// GET ?comisionId=... → padrón de la comisión
export async function GET(request) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const comisionId = new URL(request.url).searchParams.get("comisionId");
  if (!comisionId) return faltaDato("Falta comisionId");

  const { data, error } = await supabaseAdmin
    .from("inscripciones")
    .select("alumno_id, usuarios(dni, nombre)")
    .eq("comision_id", comisionId);
  if (error) return errorDb(error);

  const alumnos = data
    .map((i) => ({ id: i.alumno_id, ...i.usuarios }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return NextResponse.json({ alumnos });
}

// POST { comisionId, texto } → importa el padrón. Una línea por alumno:
//   40123456;Juan Pérez     (o separado por coma o tabulación)
//   40123456                (si el alumno ya existe)
// Los alumnos que no existen se crean con contraseña = DNI.
export async function POST(request) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const body = await leerJson(request);
  const comisionId = body.comisionId;
  if (!comisionId) return faltaDato("Elegí una comisión");

  const { data: comision } = await supabaseAdmin
    .from("comisiones")
    .select("id, carrera_id")
    .eq("id", comisionId)
    .maybeSingle();
  if (!comision) return faltaDato("No se encontró la comisión");

  const lineas = String(body.texto || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errores = [];
  const filas = [];
  for (const linea of lineas) {
    const [dniCrudo, ...resto] = linea.split(/[;,\t]/);
    const dni = (dniCrudo || "").replace(/\D/g, "");
    const nombre = resto.join(" ").trim();
    if (!/^\d{6,10}$/.test(dni)) {
      // Se ignora en silencio una fila de encabezado tipo "DNI;Nombre"
      if (!/dni/i.test(linea)) errores.push(`"${linea}": DNI inválido`);
      continue;
    }
    filas.push({ dni, nombre });
  }
  if (!filas.length) {
    return faltaDato(errores[0] || "Pegá al menos un DNI");
  }

  const { data: existentes, error: errorLectura } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni, rol")
    .in("dni", filas.map((f) => f.dni));
  if (errorLectura) return errorDb(errorLectura);
  const porDni = Object.fromEntries(existentes.map((u) => [u.dni, u]));

  let creados = 0;
  const ids = [];
  for (const { dni, nombre } of filas) {
    let usuario = porDni[dni];
    if (usuario && usuario.rol !== "alumno") {
      errores.push(`${dni}: es un usuario ${usuario.rol}, no un alumno`);
      continue;
    }
    if (!usuario) {
      if (!nombre) {
        errores.push(`${dni}: no existe, agregá el nombre para crearlo`);
        continue;
      }
      const { data, error } = await supabaseAdmin
        .from("usuarios")
        .insert({
          dni,
          nombre,
          rol: "alumno",
          carrera_id: comision.carrera_id,
          password_hash: await bcrypt.hash(dni, 10),
        })
        .select("id, dni, rol")
        .single();
      if (error) {
        errores.push(`${dni}: ${error.message}`);
        continue;
      }
      usuario = porDni[dni] = data;
      creados++;
    }
    ids.push(usuario.id);
  }

  if (ids.length) {
    const { error } = await supabaseAdmin
      .from("inscripciones")
      .upsert(
        [...new Set(ids)].map((alumno_id) => ({ comision_id: comisionId, alumno_id })),
        { ignoreDuplicates: true }
      );
    if (error) return errorDb(error);
  }

  return NextResponse.json({ inscriptos: new Set(ids).size, creados, errores });
}

// DELETE { comisionId, alumnoId } → saca al alumno del padrón
export async function DELETE(request) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { comisionId, alumnoId } = await leerJson(request);
  if (!comisionId || !alumnoId) return faltaDato("Faltan datos");

  const { error } = await supabaseAdmin
    .from("inscripciones")
    .delete()
    .eq("comision_id", comisionId)
    .eq("alumno_id", alumnoId);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}
