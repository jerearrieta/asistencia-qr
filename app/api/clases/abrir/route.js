import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generarToken, minutosDeExpiracion } from "@/lib/generateToken";

export async function POST(request) {
  const body = await request.json();
  const cursoId = body?.cursoId;

  if (!cursoId) {
    return NextResponse.json(
      { error: "Falta cursoId" },
      { status: 400 }
    );
  }

  const token = generarToken();
  const expiraEn = new Date(
    Date.now() + minutosDeExpiracion() * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("clases")
    .insert({
      curso_id: cursoId,
      estado: "abierta",
      token,
      token_expira_en: expiraEn,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clase: data }, { status: 201 });
}
