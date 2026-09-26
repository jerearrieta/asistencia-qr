import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { inicioPorRol } from "@/lib/sesion";

export default async function Home() {
  const sesion = await obtenerSesion();
  if (sesion) redirect(inicioPorRol(sesion.rol));

  return (
    <div>
      <h1>Sistema de Asistencia</h1>
      <p>Elegí qué querés hacer:</p>

      <div className="card">
        <h3>Soy profesor o directivo</h3>
        <p>
          Ingresá con tu DNI para abrir clases de tus comisiones, generar el
          QR y ver el tablero de asistencia.
        </p>
        <a className="btn" href="/login">
          Ingresar
        </a>
      </div>

      <div className="card">
        <h3>Soy alumno</h3>
        <p>
          Registrá tu asistencia escribiendo el código que dictó el profesor,
          o ingresá con tu DNI para ver tu porcentaje de asistencia.
        </p>
        <div className="acciones">
          <Link className="btn" href="/asistencia">
            Registrar con código
          </Link>
          <a className="btn secondary" href="/login">
            Ver mi asistencia
          </a>
        </div>
      </div>
    </div>
  );
}
