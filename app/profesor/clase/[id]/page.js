import { unstable_noStore as noStore } from "next/cache";
import { obtenerSesion } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";
import ClaseEnVivo from "@/components/ClaseEnVivo";

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
        <p className="mensaje-error">{error}</p>
        <a href="/profesor">Volver</a>
      </div>
    );
  }

  return (
    <div>
      <p>
        <a href="/profesor">&larr; Volver al panel</a>
      </p>
      <p>Mostrale esta pantalla o tu celular a los alumnos.</p>
      <ClaseEnVivo clase={clase} comision={comision} />
    </div>
  );
}
