import { cookies } from "next/headers";
import { AlertCircle, ScanLine } from "lucide-react";
import FormularioAsistencia from "@/components/FormularioAsistencia";
import { obtenerSesion } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { GRACIA_QR, codigoValido, firmarPase } from "@/lib/codigoRotativo";
import { COOKIE_DISPOSITIVO, dispositivoDeCookie } from "@/lib/dispositivo";

export const dynamic = "force-dynamic";

// DNI a precompletar: el del celular ya vinculado o, si no, el de la sesión.
async function dniSugerido(dispositivoId) {
  const { data } = await supabaseAdmin
    .from("usuarios")
    .select("dni")
    .eq("dispositivo_id", dispositivoId)
    .maybeSingle();
  if (data) return data.dni;
  const sesion = await obtenerSesion();
  return sesion?.rol === "alumno" ? sesion.dni : "";
}

export default async function AsistenciaQrPage({ params }) {
  // La cookie la pone el middleware la primera vez que el celular abre un QR
  const dispositivoId = await dispositivoDeCookie(cookies().get(COOKIE_DISPOSITIVO)?.value);

  // El QR rota cada pocos segundos: se valida al abrir la página y, si es
  // vigente, se entrega un pase para que no venza mientras se tipea el DNI.
  const { data: clase } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("id", params.claseId)
    .maybeSingle();

  let problema = null;
  if (!dispositivoId) problema = "Tu navegador bloqueó las cookies. Activalas y volvé a escanear el QR.";
  else if (!clase) problema = "No se encontró la clase de este QR.";
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
            pase={firmarPase(clase.id, dispositivoId)}
            dniInicial={await dniSugerido(dispositivoId)}
          />
        )}
      </div>
    </div>
  );
}
