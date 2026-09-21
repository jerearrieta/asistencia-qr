import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ZONA_HORARIA = "America/Argentina/Cordoba";

function formatearFechaLocal(iso) {
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

export async function GET(request, { params }) {
  const claseId = params.id;
  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato");

  const { data: clase, error: errorClase } = await supabaseAdmin
    .from("clases")
    .select("*, cursos(nombre)")
    .eq("id", claseId)
    .single();

  if (errorClase) {
    return NextResponse.json({ error: errorClase.message }, { status: 404 });
  }

  const { data: asistencias, error } = await supabaseAdmin
    .from("asistencias")
    .select("*")
    .eq("clase_id", claseId)
    .order("registrado_en", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (formato === "csv") {
    const encabezado = ["DNI/Legajo", "Nombre", "Método", "Fecha y hora"]
      .map(celdaCsv)
      .join(";");

    const filas = asistencias
      .map((a) =>
        [a.dni_alumno, a.nombre_alumno || "", a.metodo, formatearFechaLocal(a.registrado_en)]
          .map(celdaCsv)
          .join(";")
      )
      .join("\n");

    const csv = `\uFEFFsep=;\n${encabezado}\n${filas}`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="asistencia-${claseId}.csv"`,
      },
    });
  }

  return NextResponse.json({ clase, asistencias });
}
