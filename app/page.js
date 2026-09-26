import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, GraduationCap, QrCode, ScanLine, ShieldCheck, Users } from "lucide-react";
import { obtenerSesion } from "@/lib/auth";
import { inicioPorRol } from "@/lib/sesion";

export default async function Home() {
  const sesion = await obtenerSesion();
  if (sesion) redirect(inicioPorRol(sesion.rol));

  return (
    <div className="ancho">
      <section className="hero">
        <span className="eyebrow">
          <QrCode size={14} /> Asistencia sin papel
        </span>
        <h1>
          Tomá asistencia en <span>segundos</span>
        </h1>
        <p>
          El profesor abre la clase, los alumnos escanean el QR y todo queda
          registrado al instante, listo para analizar.
        </p>
      </section>

      <div className="roles">
        <div className="card rol interactiva">
          <div className="icono-caja">
            <GraduationCap size={20} />
          </div>
          <h2>Soy profesor o directivo</h2>
          <p>
            Abrí la clase de tus comisiones, mostrá el QR y seguí en vivo quién
            está presente. Consultá el tablero con toda la información.
          </p>
          <a className="btn grande" href="/login">
            Ingresar con mi DNI <ArrowRight size={18} />
          </a>
        </div>

        <div className="card rol interactiva">
          <div className="icono-caja ok">
            <ScanLine size={20} />
          </div>
          <h2>Soy alumno</h2>
          <p>
            Escaneá el QR que muestra el profesor o escribí el código de la
            clase. Con tu DNI también podés ver tu porcentaje de asistencia.
          </p>
          <div className="acciones">
            <Link className="btn grande" href="/asistencia" style={{ flex: 1 }}>
              Registrar asistencia
            </Link>
            <a className="btn grande secondary" href="/login" style={{ flex: 1 }}>
              Ver mi asistencia
            </a>
          </div>
        </div>
      </div>

      <div className="pasos">
        <div className="paso">
          <div className="icono-caja neutro">
            <ShieldCheck size={18} />
          </div>
          <div>
            <strong>Sin trampas</strong>
            El código vence y solo pueden registrarse los alumnos del padrón.
          </div>
        </div>
        <div className="paso">
          <div className="icono-caja neutro">
            <Users size={18} />
          </div>
          <div>
            <strong>Presentes y ausentes</strong>
            El profesor ve la lista en vivo y puede marcar a mano.
          </div>
        </div>
        <div className="paso">
          <div className="icono-caja neutro">
            <BarChart3 size={18} />
          </div>
          <div>
            <strong>Datos listos</strong>
            Tablero con indicadores y exportación a CSV.
          </div>
        </div>
      </div>
    </div>
  );
}
