import { NextResponse } from "next/server";
import { ZONA_HORARIA } from "@/lib/constantes";

export function formatearFechaLocal(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function celdaCsv(valor) {
  return `"${String(valor ?? "").replace(/"/g, '""')}"`;
}

// Columnas del CSV de asistencia (una fila por alumno inscripto y clase)
export const COLUMNAS_DETALLE = [
  ["Carrera", (f) => f.carrera],
  ["Materia", (f) => f.materia],
  ["Año", (f) => f.anio],
  ["División", (f) => f.division],
  ["Turno", (f) => f.turno],
  ["Modalidad", (f) => f.modalidad],
  ["Profesor", (f) => f.profesor],
  ["Fecha clase", (f) => formatearFechaLocal(f.fecha).slice(0, 10)],
  ["DNI", (f) => f.dni],
  ["Alumno", (f) => f.alumno],
  ["Estado", (f) => (f.presente ? "Presente" : "Ausente")],
  ["Método", (f) => f.metodo || ""],
  ["Hora de registro", (f) => formatearFechaLocal(f.registrado_en)],
];

// Separador ";" para que Excel en español lo abra en columnas.
export function respuestaCsv(filas, columnas, nombreArchivo) {
  const encabezado = columnas.map(([titulo]) => celdaCsv(titulo)).join(";");
  const cuerpo = filas
    .map((f) => columnas.map(([, valor]) => celdaCsv(valor(f))).join(";"))
    .join("\n");

  return new NextResponse(`﻿${encabezado}\n${cuerpo}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
