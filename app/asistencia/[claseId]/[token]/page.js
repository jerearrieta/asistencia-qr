import { AlertCircle, ScanLine } from "lucide-react";
import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { GRACIA_QR, codigoValido, firmarPase } from "@/lib/codigoRotativo";

export const dynamic = "force-dynamic";

export default async function AsistenciaQrPage({ params }) {
  // Si el alumno ya inició sesión, le completamos el DNI
  const sesion = await obtenerSesion();
  const dniInicial = sesion?.rol === "alumno" ? sesion.dni : "";

  // El QR rota cada pocos segundos: se valida al abrir la página y, si es
  // vigente, se entrega un pase para que no venza mientras se tipea el DNI.
  const { data: clase } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("id", params.claseId)
    .maybeSingle();

  let problema = null;
  if (!clase) problema = "No se encontró la clase de este QR.";
  else if (!claseEstaAbierta(clase)) problema = "La toma de asistencia de esta clase ya está cerrada.";
  else if (!codigoValido(clase, params.token, GRACIA_QR))
    problema = "Este QR ya cambió. Escaneá el que está en la pantalla del profesor ahora.";

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
        {problema ? (
          <div className="alerta error" role="alert">
            <AlertCircle size={18} />
            {problema}
          </div>
        ) : (
          <FormularioAsistencia
            claseId={clase.id}
            pase={firmarPase(clase.id)}
            dniInicial={dniInicial}
          />
        )}
      </div>
    </div>
  );
}
