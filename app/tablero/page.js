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
      <h1 style={{ marginBottom: 4 }}>Tablero de asistencia</h1>
      <p className="texto-suave" style={{ marginTop: 0 }}>
        {sesion.rol === "director"
          ? "Todas las carreras y comisiones."
          : "Solo tus comisiones."}
      </p>
      <Tablero {...datos} esDirector={sesion.rol === "director"} />
    </div>
  );
}
