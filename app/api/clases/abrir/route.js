import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generarToken, minutosDeExpiracion } from "@/lib/generateToken";

const ZONA_HORARIA = "America/Argentina/Cordoba";

function rangoDeHoyUTC() {
  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: ZONA_HORARIA,
  });
  const inicio = new Date(`${fechaHoy}T00:00:00-03:00`).toISOString();
  const fin = new Date(`${fechaHoy}T23:59:59-03:00`).toISOString();
  return { inicio, fin };
}

export async function POST(request) {
  const body = await request.json();
  const cursoId = body?.cursoId;

  if (!cursoId) {
    return NextResponse.json({ error: "Falta cursoId" }, { status: 400 });
  }

  const expiraEn = new Date(
    Date.now() + minutosDeExpiracion() * 60 * 1000
  ).toISOString();
  const { inicio, fin } = rangoDeHoyUTC();

  const { data: existente } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("curso_id", cursoId)
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente) {
    const { data, error } = await supabaseAdmin
      .from("clases")
      .update({ estado: "abierta", token_expira_en: expiraEn })
      .eq("id", existente.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ clase: data });
  }

  const token = generarToken();
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