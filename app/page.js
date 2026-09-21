import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Sistema de Asistencia</h1>
      <p>Elegí qué querés hacer:</p>

      <div className="card">
        <h3>Soy profesor</h3>
        <p>Crear cursos, abrir clases y generar el QR / código de asistencia.</p>
        <Link className="btn" href="/profesor">
          Ir al panel del profesor
        </Link>
      </div>

      <div className="card">
        <h3>Soy alumno (sin cámara o sin QR a mano)</h3>
        <p>Registrá tu asistencia escribiendo el código que dictó el profesor.</p>
        <Link className="btn secondary" href="/asistencia">
          Registrar con código
        </Link>
      </div>
    </div>
  );
}
