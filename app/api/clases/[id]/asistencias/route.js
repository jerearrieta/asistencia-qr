import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const encabezado = "dni_alumno,nombre_alumno,metodo,registrado_en\n";
    const filas = asistencias
      .map(
        (a) =>
          `${a.dni_alumno},${(a.nombre_alumno || "").replace(/,/g, " ")},${
            a.metodo
          },${a.registrado_en}`
      )
      .join("\n");
    const csv = encabezado + filas;

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
