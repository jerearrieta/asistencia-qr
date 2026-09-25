import { traerTodo } from "@/lib/consultas";

// Filtros que acepta el tablero (y la exportación). El profesor siempre
// queda limitado a sus propias comisiones.
export function aplicarFiltros(consulta, filtros, sesion) {
  let q = consulta;
  if (sesion.rol !== "director") q = q.eq("profesor_id", sesion.id);
  else if (filtros.profesor) q = q.eq("profesor_id", filtros.profesor);
  if (filtros.carrera) q = q.eq("carrera_id", filtros.carrera);
  if (filtros.anio) q = q.eq("anio", Number(filtros.anio));
  if (filtros.turno) q = q.eq("turno", filtros.turno);
  if (filtros.modalidad) q = q.eq("modalidad", filtros.modalidad);
  return q;
}

export async function datosTablero(sesion) {
  const sinFiltros = {};
  const comisiones = await traerTodo((db) =>
    aplicarFiltros(db.from("v_resumen_comision").select("*"), sinFiltros, sesion).order("comision_id")
  );
  const alumnos = await traerTodo((db) =>
    aplicarFiltros(
      db
        .from("v_resumen_alumno")
        .select("alumno_id, dni, alumno, comision_id, carrera, materia, anio, division, clases, presentes"),
      sinFiltros,
      sesion
    )
      .order("comision_id")
      .order("alumno_id")
  );

  const ids = new Set(comisiones.map((c) => c.comision_id));
  const semanal = (
    await traerTodo((db) =>
      db.from("v_resumen_semanal").select("*").order("comision_id").order("semana")
    )
  ).filter((s) => ids.has(s.comision_id));

  return { comisiones, alumnos, semanal };
}
