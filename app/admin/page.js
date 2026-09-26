import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PanelAdmin from "@/components/admin/PanelAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  noStore();

  const [carreras, materias, comisiones, profesores] = await Promise.all([
    supabaseAdmin.from("carreras").select("*").order("nombre"),
    supabaseAdmin
      .from("materias")
      .select("id, nombre, carrera_materias(carrera_id, anio)")
      .order("nombre"),
    supabaseAdmin
      .from("v_resumen_comision")
      .select("comision_id, carrera_id, carrera, materia, anio, division, turno, modalidad, profesor_id, profesor, inscriptos, clases")
      .order("carrera")
      .order("anio")
      .order("materia")
      .order("division"),
    supabaseAdmin
      .from("usuarios")
      .select("id, nombre, dni, rol")
      .in("rol", ["profesor", "director"])
      .order("nombre"),
  ]);

  // Agregamos el materia_id a cada comisión (la vista no lo trae)
  const { data: idsMateria } = await supabaseAdmin
    .from("comisiones")
    .select("id, materia_id");
  const materiaDe = Object.fromEntries((idsMateria || []).map((c) => [c.id, c.materia_id]));

  return (
    <div className="ancho">
      <div className="page-head">
        <div>
          <h1>Administración</h1>
          <p>Carreras, materias, comisiones, usuarios y padrones de la institución.</p>
        </div>
      </div>
      <PanelAdmin
        carreras={carreras.data || []}
        materias={materias.data || []}
        comisiones={(comisiones.data || []).map((c) => ({
          ...c,
          materia_id: materiaDe[c.comision_id],
        }))}
        profesores={profesores.data || []}
      />
    </div>
  );
}
