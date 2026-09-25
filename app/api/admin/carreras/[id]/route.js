import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";

export async function PATCH(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const nombre = ((await leerJson(request)).nombre || "").trim();
  if (!nombre) return faltaDato("El nombre de la carrera es obligatorio");

  const { data, error } = await supabaseAdmin
    .from("carreras")
    .update({ nombre })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return errorDb(error);
  return NextResponse.json({ carrera: data });
}

export async function DELETE(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { error } = await supabaseAdmin.from("carreras").delete().eq("id", params.id);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}
