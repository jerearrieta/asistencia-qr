import "./globals.css";
import { obtenerSesion } from "@/lib/auth";

export const metadata = {
  title: "Asistencia QR",
  description: "Sistema de toma de asistencia por QR / código",
};

const ENLACES = {
  director: [
    ["/tablero", "Tablero"],
    ["/profesor", "Clases"],
    ["/admin", "Administración"],
  ],
  profesor: [
    ["/profesor", "Mis clases"],
    ["/tablero", "Tablero"],
  ],
  alumno: [
    ["/alumno", "Mi asistencia"],
    ["/asistencia", "Registrar asistencia"],
  ],
};

export default async function RootLayout({ children }) {
  const sesion = await obtenerSesion();

  return (
    <html lang="es">
      <body>
        <header className="barra">
          <div className="barra-interior">
            <a className="marca" href="/">
              Asistencia QR
            </a>
            {sesion ? (
              <nav>
                {ENLACES[sesion.rol].map(([href, texto]) => (
                  <a key={href} href={href}>
                    {texto}
                  </a>
                ))}
                <a href="/cuenta" title="Mi cuenta">
                  {sesion.nombre}
                </a>
                <form action="/api/auth/logout" method="post">
                  <button className="enlace">Salir</button>
                </form>
              </nav>
            ) : (
              <nav>
                <a href="/login">Ingresar</a>
              </nav>
            )}
          </div>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
