import { Keyboard } from "lucide-react";
import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";

export default async function AsistenciaManualPage() {
  // Si el alumno ya inició sesión, le completamos el DNI
  const sesion = await obtenerSesion();
  const dniInicial = sesion?.rol === "alumno" ? sesion.dni : "";

  return (
    <div className="centrado">
      <div className="centrado-head">
        <div className="icono-caja ok">
          <Keyboard size={24} />
        </div>
        <h1>Registrar asistencia</h1>
        <p>Ingresá el código que dictó o escribió el profesor y tu DNI.</p>
      </div>
      <div className="card">
        <FormularioAsistencia
          pedirCodigo dniInicial={dniInicial}
        />
      </div>
    </div>
  );
}
