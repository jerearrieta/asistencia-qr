"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  LogIn,
  LogOut,
  Menu,
  QrCode,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { NOMBRE_ROL, iniciales } from "@/lib/constantes";

const ENLACES = {
  director: [
    ["/tablero", "Tablero", BarChart3],
    ["/profesor", "Clases", CalendarCheck],
    ["/admin", "Administración", Settings2],
  ],
  profesor: [
    ["/profesor", "Mis clases", CalendarCheck],
    ["/tablero", "Tablero", BarChart3],
  ],
  alumno: [
    ["/alumno", "Mi asistencia", BarChart3],
    ["/asistencia", "Registrar asistencia", QrCode],
  ],
};

export default function Encabezado({ sesion }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const enlaces = sesion ? ENLACES[sesion.rol] : [];

  // Cerrar el menú móvil al navegar o al tocar Escape
  useEffect(() => setAbierto(false), [ruta]);
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const activo = (href) => (ruta === href || ruta.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="barra">
      <div className="barra-interior">
        <a className="marca" href="/">
          <span className="marca-logo" aria-hidden="true">
            <QrCode size={17} strokeWidth={2.4} />
          </span>
          Asistencia QR
        </a>

        {sesion ? (
          <>
            <nav className="nav" aria-label="Principal">
              {enlaces.map(([href, texto, Icono]) => (
                <a key={href} href={href} aria-current={activo(href)}>
                  <Icono size={16} />
                  {texto}
                </a>
              ))}
            </nav>
            <div className="usuario">
              <a className="usuario-link" href="/cuenta" aria-current={activo("/cuenta")} title="Mi cuenta">
                <span className="avatar">{iniciales(sesion.nombre)}</span>
                <span className="usuario-texto">
                  {sesion.nombre}
                  <small>{NOMBRE_ROL[sesion.rol]}</small>
                </span>
              </a>
              <form action="/api/auth/logout" method="post">
                <button className="btn ghost icono" title="Cerrar sesión" aria-label="Cerrar sesión">
                  <LogOut size={16} />
                </button>
              </form>
            </div>
            <button
              className="btn ghost icono menu-toggle"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={abierto}
              onClick={() => setAbierto(!abierto)}
            >
              {abierto ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="velo" data-abierto={abierto} onClick={() => setAbierto(false)} />
            <div className="nav-movil" data-abierto={abierto} aria-hidden={!abierto}>
              {enlaces.map(([href, texto, Icono]) => (
                <a key={href} href={href} aria-current={activo(href)} tabIndex={abierto ? 0 : -1}>
                  <Icono size={18} />
                  {texto}
                </a>
              ))}
              <hr />
              <a href="/cuenta" aria-current={activo("/cuenta")} tabIndex={abierto ? 0 : -1}>
                <UserRound size={18} />
                Mi cuenta · {sesion.nombre}
              </a>
              <form action="/api/auth/logout" method="post">
                <button tabIndex={abierto ? 0 : -1} style={{ color: "var(--danger)" }}>
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </>
        ) : (
          ruta !== "/login" && (
            <a className="btn secondary chico" href="/login">
              <LogIn size={15} />
              Ingresar
            </a>
          )
        )}
      </div>
    </header>
  );
}
