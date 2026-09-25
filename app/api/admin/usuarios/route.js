import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { ROLES } from "@/lib/constantes";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";

const CAMPOS = "id, dni, nombre, rol, carrera_id, carreras(nombre)";

// GET ?rol=alumno&q=texto → hasta 50 usuarios que coinciden por DNI o nombre
export async function GET(request) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { searchParams } = new URL(request.url);
  const rol = searchParams.get("rol");
  const q = (searchParams.get("q") || "").trim().replace(/[,()%]/g, " ");

  let consulta = supabaseAdmin
    .from("usuarios")
    .select(CAMPOS, { count: "exact" })
    .order("nombre")
    .limit(50);
  if (ROLES.includes(rol)) consulta = consulta.eq("rol", rol);
  if (q) consulta = consulta.or(`dni.ilike.%${q}%,nombre.ilike.%${q}%`);

  const { data, count, error } = await consulta;
  if (error) return errorDb(error);
  return NextResponse.json({ usuarios: data, total: count });
}

// La contraseña inicial es el DNI; el usuario la cambia desde "Mi cuenta".
export async function POST(request) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const body = await leerJson(request);
  const dni = (body.dni || "").trim();
  const nombre = (body.nombre || "").trim();
  const rol = body.rol;

  if (!/^\d{6,10}$/.test(dni)) return faltaDato("El DNI debe tener solo números (6 a 10)");
  if (!nombre) return faltaDato("El nombre es obligatorio");
  if (!ROLES.includes(rol)) return faltaDato("Rol inválido");

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .insert({
      dni,
      nombre,
      rol,
      carrera_id: rol === "alumno" ? body.carreraId || null : null,
      password_hash: await bcrypt.hash(dni, 10),
    })
    .select(CAMPOS)
    .single();
  if (error) return errorDb(error);
  return NextResponse.json({ usuario: data }, { status: 201 });
}
