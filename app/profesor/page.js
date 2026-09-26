import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { obtenerSesion } from "@/lib/auth";
import PanelProfesor from "@/components/PanelProfesor";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ProfesorPage() {
  noStore();
  const sesion = await obtenerSesion();
  const esDirector = sesion.rol === "director";

  let consultaComisiones = supabaseAdmin
    .from("v_resumen_comision")
    .select("comision_id, carrera_id, carrera, materia, anio, division, turno, modalidad, profesor_id, profesor, inscriptos")
    .order("carrera")
    .order("anio")
    .order("materia");
  if (!esDirector) consultaComisiones = consultaComisiones.eq("profesor_id", sesion.id);
  const { data: comisiones } = await consultaComisiones;

  const ids = (comisiones || []).map((c) => c.comision_id);
  const { data: clases } = ids.length
    ? await supabaseAdmin
        .from("clases")
        .select("*")
        .in("comision_id", ids)
        .order("fecha", { ascending: false })
        .limit(30)
    : { data: [] };

  return (
    <div className="ancho">
      <div className="page-head">
        <div>
          <h1>{esDirector ? "Clases" : "Mis clases"}</h1>
          <p>
            {esDirector
              ? "Abrí la clase de cualquier comisión y consultá las clases recientes."
              : "Abrí la clase del día para mostrar el QR y tomar asistencia."}
          </p>
        </div>
      </div>
      <PanelProfesor
        comisiones={comisiones || []}
        clasesIniciales={clases || []}
        mostrarProfesor={esDirector}
      />
    </div>
  );
}
