import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";

export default async function AsistenciaManualPage() {
  // Si el alumno ya inició sesión, le completamos el DNI
  const sesion = await obtenerSesion();
  const dniInicial = sesion?.rol === "alumno" ? sesion.dni : "";

  return (
    <div>
      <h1>Registrar asistencia</h1>
      <div className="card">
        <p>Ingresá el código que dictó o escribió el profesor.</p>
        <FormularioAsistencia pedirCodigo dniInicial={dniInicial} />
      </div>
    </div>
  );
}
