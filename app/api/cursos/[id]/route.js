import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request, { params }) {
  const body = await request.json();
  const nombre = (body?.nombre || "").trim();

  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre del curso es obligatorio" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("cursos")
    .update({ nombre })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ curso: data });
}

export async function DELETE(request, { params }) {
  const { error } = await supabaseAdmin
    .from("cursos")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
