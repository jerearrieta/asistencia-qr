import { NextResponse } from "next/server";

export function middleware(request) {
  const encabezado = request.headers.get("authorization");

  if (encabezado) {
    const [, credencialesB64] = encabezado.split(" ");
    const [usuario, clave] = Buffer.from(credencialesB64, "base64")
      .toString()
      .split(":");

    if (
      usuario === process.env.ADMIN_USER &&
      clave === process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Panel del profesor"',
    },
  });
}

export const config = {
  matcher: ["/profesor/:path*", "/api/cursos/:path*", "/api/clases/:path*"],
};
