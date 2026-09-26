import { unstable_noStore as noStore } from "next/cache";
import { obtenerSesion } from "@/lib/auth";
import { datosTablero } from "@/lib/tablero";
import Tablero from "@/components/tablero/Tablero";

export const dynamic = "force-dynamic";

export default async function TableroPage() {
  noStore();
  const sesion = await obtenerSesion();
  const datos = await datosTablero(sesion);

  return (
    <div className="ancho">
      <div className="page-head">
        <div>
          <h1>Tablero de asistencia</h1>
          <p>
            {sesion.rol === "director"
              ? "Todas las carreras y comisiones. Usá los filtros para profundizar."
              : "Tus comisiones. Usá los filtros para ver una materia o carrera."}
          </p>
        </div>
      </div>
      <Tablero {...datos} esDirector={sesion.rol === "director"} />
    </div>
  );
}
