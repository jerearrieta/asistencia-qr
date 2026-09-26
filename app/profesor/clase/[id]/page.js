import { unstable_noStore as noStore } from "next/cache";
import { obtenerSesion } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";
import { AlertCircle, ArrowLeft } from "lucide-react";
import ClaseEnVivo from "@/components/ClaseEnVivo";
import { minutosDeExpiracion } from "@/lib/generateToken";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ClasePage({ params }) {
  noStore();
  const sesion = await obtenerSesion();
  const { clase, comision, error } = await claseGestionable(params.id, sesion);

  if (error) {
    return (
      <div>
        <a className="volver" href="/profesor">
          <ArrowLeft size={16} /> Volver a mis clases
        </a>
        <div className="alerta error">
          <AlertCircle size={18} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="ancho">
      <a className="volver" href="/profesor">
        <ArrowLeft size={16} /> Volver a mis clases
      </a>
      <ClaseEnVivo clase={clase} comision={comision} duracionSeg={minutosDeExpiracion() * 60} />
    </div>
  );
}
