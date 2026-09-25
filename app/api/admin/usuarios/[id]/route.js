import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { ROLES } from "@/lib/constantes";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";

// PATCH { nombre, rol, carreraId } o { restablecerPassword: true }
// (la contraseña vuelve a ser el DNI)
export async function PATCH(request, { params }) {
  const { sesion, error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const body = await leerJson(request);
  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni")
    .eq("id", params.id)
    .maybeSingle();
  if (!usuario) {
    return NextResponse.json({ error: "No se encontró el usuario" }, { status: 404 });
  }

  let cambios;
  if (body.restablecerPassword) {
    cambios = { password_hash: await bcrypt.hash(usuario.dni, 10) };
  } else {
    const nombre = (body.nombre || "").trim();
    if (!nombre) return faltaDato("El nombre es obligatorio");
    if (!ROLES.includes(body.rol)) return faltaDato("Rol inválido");
    if (usuario.id === sesion.id && body.rol !== "director") {
      return faltaDato("No podés quitarte el rol de director a vos mismo");
    }
    cambios = {
      nombre,
      rol: body.rol,
      carrera_id: body.rol === "alumno" ? body.carreraId || null : null,
    };
  }

  const { error } = await supabaseAdmin.from("usuarios").update(cambios).eq("id", params.id);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { sesion, error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  if (params.id === sesion.id) return faltaDato("No podés eliminar tu propio usuario");

  const { error } = await supabaseAdmin.from("usuarios").delete().eq("id", params.id);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}
