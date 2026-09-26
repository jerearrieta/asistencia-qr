import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { generarToken, minutosDeExpiracion } from "@/lib/generateToken";
import { ZONA_HORARIA } from "@/lib/constantes";

function rangoDeHoyUTC() {
  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: ZONA_HORARIA,
  });
  const inicio = new Date(`${fechaHoy}T00:00:00-03:00`).toISOString();
  const fin = new Date(`${fechaHoy}T23:59:59-03:00`).toISOString();
  return { inicio, fin };
}

export async function POST(request) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const body = await request.json();
  const comisionId = body?.comisionId;

  if (!comisionId) {
    return NextResponse.json({ error: "Falta comisionId" }, { status: 400 });
  }

  const { data: comision } = await supabaseAdmin
    .from("comisiones")
    .select("id, profesor_id")
    .eq("id", comisionId)
    .maybeSingle();

  if (!comision) {
    return NextResponse.json({ error: "No se encontró la comisión" }, { status: 404 });
  }
  if (sesion.rol !== "director" && comision.profesor_id !== sesion.id) {
    return NextResponse.json(
      { error: "Esta comisión no está a tu cargo" },
      { status: 403 }
    );
  }

  const expiraEn = new Date(
    Date.now() + minutosDeExpiracion() * 60 * 1000
  ).toISOString();
  const { inicio, fin } = rangoDeHoyUTC();

  const { data: existente } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("comision_id", comisionId)
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
      comision_id: comisionId,
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
