import { ScanLine } from "lucide-react";
import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";

export default async function AsistenciaQrPage({ params }) {
  // Si el alumno ya inició sesión, le completamos el DNI
  const sesion = await obtenerSesion();
  const dniInicial = sesion?.rol === "alumno" ? sesion.dni : "";

  return (
    <div className="centrado">
      <div className="centrado-head">
        <div className="icono-caja ok">
          <ScanLine size={24} />
        </div>
        <h1>Confirmá tu presencia</h1>
        <p>Ingresá tu DNI para registrar tu asistencia en esta clase.</p>
      </div>
      <div className="card">
        <FormularioAsistencia
          claseId={params.claseId}
          tokenInicial={params.token}
          dniInicial={dniInicial}
        />
      </div>
    </div>
  );
}
