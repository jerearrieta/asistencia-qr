import { TURNOS, MODALIDADES } from "@/lib/constantes";

// Devuelve { datos } listos para insertar/actualizar, o { error }
export function validarComision(body) {
  const datos = {
    carrera_id: body.carreraId,
    materia_id: body.materiaId,
    division: (body.division || "").trim().toUpperCase(),
    turno: body.turno,
    modalidad: body.modalidad,
    profesor_id: body.profesorId || null,
  };
  if (!datos.carrera_id || !datos.materia_id) return { error: "Elegí la carrera y la materia" };
  if (!datos.division) return { error: "La división es obligatoria" };
  if (!TURNOS.includes(datos.turno)) return { error: "Turno inválido" };
  if (!MODALIDADES.includes(datos.modalidad)) return { error: "Modalidad inválida" };
  return { datos };
}
