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

  // Alumnos que vincularon el celular en esta clase y pedidos de cambio de
  // celular pendientes: el profesor los ve en la clase en vivo.
  const [{ data: nuevos }, { data: pedidos }] = await Promise.all([
    supabaseAdmin
      .from("asistencias")
      .select("alumno_id")
      .eq("clase_id", claseId)
      .eq("vinculo_nuevo", true),
    supabaseAdmin
      .from("pedidos_cambio_celular")
      .select("alumno_id, creado_en, usuarios(dni, nombre)")
      .eq("clase_id", claseId)
      .order("creado_en"),
  ]);
  const conCelularNuevo = new Set((nuevos || []).map((n) => n.alumno_id));

  return NextResponse.json({
    clase,
    comision,
    padron: padron.map((a) => ({ ...a, celular_nuevo: conCelularNuevo.has(a.alumno_id) })),
    pedidos: (pedidos || []).map((p) => ({
      alumno_id: p.alumno_id,
      dni: p.usuarios?.dni,
      alumno: p.usuarios?.nombre,
      creado_en: p.creado_en,
    })),
  });
}
