import { exigirRol } from "@/lib/auth";
import { traerTodo } from "@/lib/consultas";
import { aplicarFiltros } from "@/lib/tablero";
import { COLUMNAS_DETALLE, respuestaCsv } from "@/lib/csv";
import { NextResponse } from "next/server";

const COLUMNAS_ALUMNOS = [
  ["Carrera", (f) => f.carrera],
  ["Materia", (f) => f.materia],
  ["Año", (f) => f.anio],
  ["División", (f) => f.division],
  ["Turno", (f) => f.turno],
  ["Modalidad", (f) => f.modalidad],
  ["Profesor", (f) => f.profesor],
  ["DNI", (f) => f.dni],
  ["Alumno", (f) => f.alumno],
  ["Clases", (f) => f.clases],
  ["Presentes", (f) => f.presentes],
  ["Ausentes", (f) => f.clases - f.presentes],
  ["% Asistencia", (f) => (f.clases ? Math.round((100 * f.presentes) / f.clases) : "")],
];

// GET ?tipo=detalle|alumnos&carrera=&anio=&turno=&modalidad=&profesor=
//   detalle → una fila por alumno y clase (Presente/Ausente)
//   alumnos → una fila por alumno y materia con su porcentaje
export async function GET(request) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const params = new URL(request.url).searchParams;
  const filtros = Object.fromEntries(params);
  const tipo = params.get("tipo") === "alumnos" ? "alumnos" : "detalle";
  const fecha = new Date().toISOString().slice(0, 10);

  try {
    if (tipo === "alumnos") {
      const filas = await traerTodo((db) =>
        aplicarFiltros(db.from("v_resumen_alumno").select("*"), filtros, sesion)
          .order("carrera")
          .order("materia")
          .order("comision_id")
          .order("alumno")
          .order("alumno_id")
      );
      return respuestaCsv(filas, COLUMNAS_ALUMNOS, `asistencia-por-alumno-${fecha}.csv`);
    }

    const filas = await traerTodo((db) =>
      aplicarFiltros(db.from("v_detalle_asistencia").select("*"), filtros, sesion)
        .order("fecha")
        .order("clase_id")
        .order("alumno")
        .order("alumno_id")
    );
    return respuestaCsv(filas, COLUMNAS_DETALLE, `asistencia-detalle-${fecha}.csv`);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
