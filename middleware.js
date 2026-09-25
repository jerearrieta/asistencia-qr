import { NextResponse } from "next/server";
import { COOKIE_SESION, verificarSesion, inicioPorRol } from "@/lib/sesion";

// Qué roles pueden entrar a cada sección. Lo que no figura acá es público
// (home, login, registro de asistencia de los alumnos).
const REGLAS = [
  { prefijo: "/admin", roles: ["director"] },
  { prefijo: "/api/admin", roles: ["director"] },
  { prefijo: "/tablero", roles: ["director", "profesor"] },
  { prefijo: "/api/tablero", roles: ["director", "profesor"] },
  { prefijo: "/profesor", roles: ["director", "profesor"] },
  { prefijo: "/api/clases", roles: ["director", "profesor"] },
  { prefijo: "/alumno", roles: ["alumno"] },
  { prefijo: "/cuenta", roles: ["director", "profesor", "alumno"] },
  { prefijo: "/api/auth/password", roles: ["director", "profesor", "alumno"] },
];

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const regla = REGLAS.find(
    (r) => pathname === r.prefijo || pathname.startsWith(`${r.prefijo}/`)
  );
  if (!regla) return NextResponse.next();

  const sesion = await verificarSesion(request.cookies.get(COOKIE_SESION)?.value);
  const esApi = pathname.startsWith("/api/");

  if (!sesion) {
    if (esApi) {
      return NextResponse.json({ error: "Iniciá sesión" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (!regla.roles.includes(sesion.rol)) {
    if (esApi) {
      return NextResponse.json({ error: "No tenés permiso" }, { status: 403 });
    }
    return NextResponse.redirect(new URL(inicioPorRol(sesion.rol), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/tablero/:path*",
    "/api/tablero/:path*",
    "/profesor/:path*",
    "/api/clases/:path*",
    "/alumno/:path*",
    "/cuenta/:path*",
    "/api/auth/password",
  ],
};
