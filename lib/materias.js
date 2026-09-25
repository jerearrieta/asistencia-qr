import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Valida la lista [{ carreraId, anio }] que llega del formulario
export function normalizarPlan(carreras) {
  if (!Array.isArray(carreras)) return [];
  const vistos = new Set();
  return carreras
    .map((c) => ({ carrera_id: c?.carreraId, anio: Number(c?.anio) }))
    .filter((c) => {
      if (!c.carrera_id || !(c.anio >= 1 && c.anio <= 6) || vistos.has(c.carrera_id)) {
        return false;
      }
      vistos.add(c.carrera_id);
      return true;
    });
}

// Deja la materia asociada exactamente a esas carreras (y años)
export async function guardarPlan(materiaId, plan) {
  const { data: actuales, error: errorLectura } = await supabaseAdmin
    .from("carrera_materias")
    .select("carrera_id")
    .eq("materia_id", materiaId);
  if (errorLectura) return errorLectura;

  const quitar = actuales
    .map((a) => a.carrera_id)
    .filter((id) => !plan.some((p) => p.carrera_id === id));

  if (quitar.length) {
    const { error } = await supabaseAdmin
      .from("carrera_materias")
      .delete()
      .eq("materia_id", materiaId)
      .in("carrera_id", quitar);
    if (error) return error;
  }

  if (plan.length) {
    const { error } = await supabaseAdmin
      .from("carrera_materias")
      .upsert(plan.map((p) => ({ ...p, materia_id: materiaId })));
    if (error) return error;
  }
  return null;
}
