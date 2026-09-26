import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/sesion";

// Solo servidor: devuelve la sesión actual o null.
export async function obtenerSesion() {
  return verificarSesion(cookies().get(COOKIE_SESION)?.value);
}

// Para API Routes: devuelve { sesion } o { error } (una respuesta lista).
export async function exigirRol(...roles) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return { error: NextResponse.json({ error: "Iniciá sesión" }, { status: 401 }) };
  }
  if (roles.length && !roles.includes(sesion.rol)) {
    return { error: NextResponse.json({ error: "No tenés permiso" }, { status: 403 }) };
  }
  return { sesion };
}
