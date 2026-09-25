import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";

export default async function AsistenciaQrPage({ params }) {
  // Si el alumno ya inició sesión, le completamos el DNI
  const sesion = await obtenerSesion();
  const dniInicial = sesion?.rol === "alumno" ? sesion.dni : "";

  return (
    <div>
      <h1>Registrar asistencia</h1>
      <div className="card">
        <p>Ingresá tu DNI para confirmar tu presencia en la clase.</p>
        <FormularioAsistencia
          claseId={params.claseId}
          tokenInicial={params.token}
          dniInicial={dniInicial}
        />
      </div>
    </div>
  );
}
