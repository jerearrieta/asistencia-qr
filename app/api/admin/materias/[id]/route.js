import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { errorDb, faltaDato, leerJson } from "@/lib/respuestas";
import { guardarPlan, normalizarPlan } from "@/lib/materias";

export async function PATCH(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const body = await leerJson(request);
  const nombre = (body.nombre || "").trim();
  const plan = normalizarPlan(body.carreras);
  if (!nombre) return faltaDato("El nombre de la materia es obligatorio");
  if (!plan.length) return faltaDato("Elegí al menos una carrera y el año");

  const { data, error } = await supabaseAdmin
    .from("materias")
    .update({ nombre })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return errorDb(error);

  const errorPlan = await guardarPlan(params.id, plan);
  if (errorPlan) return errorDb(errorPlan);
  return NextResponse.json({ materia: data });
}

export async function DELETE(request, { params }) {
  const { error: sinPermiso } = await exigirRol("director");
  if (sinPermiso) return sinPermiso;

  const { error } = await supabaseAdmin.from("materias").delete().eq("id", params.id);
  if (error) return errorDb(error);
  return NextResponse.json({ ok: true });
}
