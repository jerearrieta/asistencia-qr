import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { minutosDeExpiracion } from "@/lib/generateToken";

export async function POST(request) {
  const body = await request.json();
  const claseId = body?.claseId;

  if (!claseId) {
    return NextResponse.json({ error: "Falta claseId" }, { status: 400 });
  }

  const expiraEn = new Date(
    Date.now() + minutosDeExpiracion() * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("clases")
    .update({ estado: "abierta", token_expira_en: expiraEn })
    .eq("id", claseId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ clase: data });
}