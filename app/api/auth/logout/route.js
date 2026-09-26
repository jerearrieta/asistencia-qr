import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion";

export async function POST(request) {
  const respuesta = NextResponse.redirect(new URL("/", request.url), 303);
  respuesta.cookies.delete(COOKIE_SESION);
  return respuesta;
}
