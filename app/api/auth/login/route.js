import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { COOKIE_SESION, firmarSesion, opcionesCookie, inicioPorRol } from "@/lib/sesion";

export async function POST(request) {
  try {
    return await iniciarSesion(request);
  } catch (e) {
    // Error de configuración (ej: falta SESSION_SECRET o las claves de
    // Supabase): lo mostramos para que se pueda diagnosticar.
    console.error("Error en login:", e);
    return NextResponse.json(
      { error: `Error del servidor: ${e.message}` },
      { status: 500 }
    );
  }
}

async function iniciarSesion(request) {
  const body = await request.json();
  const dni = (body?.dni || "").trim();
  const password = body?.password || "";

  if (!dni || !password) {
    return NextResponse.json(
      { error: "Ingresá tu DNI y contraseña" },
      { status: 400 }
    );
  }

  const { data: usuario, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni, nombre, rol, password_hash")
    .eq("dni", dni)
    .maybeSingle();
  if (error) throw new Error(`No se pudo consultar la base de datos (${error.message})`);

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
