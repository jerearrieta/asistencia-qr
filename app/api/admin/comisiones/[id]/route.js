import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";
import { validarComision } from "@/lib/comisiones";

export async function PATCH(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { datos, error: invalido } = validarComision(await leerJson(request));
  if (invalido) return faltaDato(invalido);

  const { data, error } = await supabaseAdmin
    .from("comisiones")
    .update(datos)
    .eq("id", params.id)
    .select()
    .single();
  if (error) {
    if (error.code === "23503") {
      return faltaDato("Esa materia no forma parte del plan de esa carrera");
    }
    return errorDb(error);
  }
  return NextResponse.json({ comision: data });
}

export async function DELETE(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { error } = await supabaseAdmin.from("comisiones").delete().eq("id", params.id);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}
