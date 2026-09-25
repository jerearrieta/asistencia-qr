import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { COOKIE_SESION, firmarSesion, opcionesCookie, inicioPorRol } from "@/lib/sesion";

export async function POST(request) {
  const body = await request.json();
  const dni = (body?.dni || "").trim();
  const password = body?.password || "";

  if (!dni || !password) {
    return NextResponse.json(
      { error: "Ingresá tu DNI y contraseña" },
      { status: 400 }
    );
  }

  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni, nombre, rol, password_hash")
    .eq("dni", dni)
    .maybeSingle();

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return NextResponse.json(
      { error: "DNI o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const respuesta = NextResponse.json({
    usuario: { nombre: usuario.nombre, rol: usuario.rol },
    destino: inicioPorRol(usuario.rol),
  });
  respuesta.cookies.set(COOKIE_SESION, await firmarSesion(usuario), opcionesCookie());
  return respuesta;
}
