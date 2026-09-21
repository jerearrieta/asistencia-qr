import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("cursos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cursos: data });
}

export async function POST(request) {
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
    .insert({ nombre })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ curso: data }, { status: 201 });
}
