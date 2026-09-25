import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";
import { COLUMNAS_DETALLE, respuestaCsv } from "@/lib/csv";

// Devuelve el padrón de la comisión marcando quién está presente en esta
// clase. Con ?formato=csv lo exporta, con carrera, materia, turno, etc.
export async function GET(request, { params }) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const claseId = params.id;
  const formato = new URL(request.url).searchParams.get("formato");

  const permiso = await claseGestionable(claseId, sesion);
  if (permiso.error) {
    return NextResponse.json({ error: permiso.error }, { status: permiso.status });
  }
  const { clase, comision } = permiso;

  const { data: padron, error } = await supabaseAdmin
    .from("v_detalle_asistencia")
    .select("*")
    .eq("clase_id", claseId)
    .order("alumno", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (formato === "csv") {
    const fecha = new Date(clase.fecha).toISOString().slice(0, 10);
    const nombre = `asistencia-${comision.materia}-${comision.anio}${comision.division}-${fecha}.csv`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w.-]+/g, "_");
    return respuestaCsv(padron, COLUMNAS_DETALLE, nombre);
  }

  return NextResponse.json({ clase, comision, padron });
}
