import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";

// Pedidos de cambio de celular: un alumno escaneó desde un celular distinto
// al que tiene vinculado. POST { alumnoId, accion: "liberar" | "descartar" }
//   liberar   → el DNI pasa al celular nuevo y el alumno queda presente
//   descartar → se borra el pedido y no cambia nada
export async function POST(request, { params }) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const body = await request.json().catch(() => ({}));
  const { alumnoId, accion } = body || {};
  if (!alumnoId || !["liberar", "descartar"].includes(accion)) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const permiso = await claseGestionable(params.id, sesion);
  if (permiso.error) {
    return NextResponse.json({ error: permiso.error }, { status: permiso.status });
  }
  const clase = permiso.clase;

  const { data: pedido } = await supabaseAdmin
    .from("pedidos_cambio_celular")
    .select("dispositivo_id, usuarios(dni, nombre)")
    .eq("clase_id", clase.id)
    .eq("alumno_id", alumnoId)
    .maybeSingle();
  if (!pedido) {
    return NextResponse.json({ error: "El pedido ya no existe" }, { status: 404 });
  }

  if (accion === "liberar") {
    const { error: errorVinculo } = await supabaseAdmin
      .from("usuarios")
      .update({
        dispositivo_id: pedido.dispositivo_id,
        dispositivo_vinculado_en: new Date().toISOString(),
      })
      .eq("id", alumnoId);
    if (errorVinculo) {
      if (errorVinculo.code === "23505") {
        return NextResponse.json(
          { error: "Ese celular ya está vinculado a otro alumno. No se puede usar para este." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: errorVinculo.message }, { status: 500 });
    }

    const { error } = await supabaseAdmin.from("asistencias").insert({
      clase_id: clase.id,
      alumno_id: alumnoId,
      dni_alumno: pedido.usuarios.dni,
      nombre_alumno: pedido.usuarios.nombre,
      metodo: "qr",
      dispositivo_id: pedido.dispositivo_id,
      vinculo_nuevo: true,
    });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { error } = await supabaseAdmin
    .from("pedidos_cambio_celular")
    .delete()
    .eq("clase_id", clase.id)
    .eq("alumno_id", alumnoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
