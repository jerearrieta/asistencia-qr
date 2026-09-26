import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";

export async function POST(request) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const body = await request.json();
  const claseId = body?.claseId;

  if (!claseId) {
    return NextResponse.json({ error: "Falta claseId" }, { status: 400 });
  }

  const permiso = await claseGestionable(claseId, sesion);
  if (permiso.error) {
    return NextResponse.json({ error: permiso.error }, { status: permiso.status });
  }

  const { data, error } = await supabaseAdmin
    .from("clases")
    .update({ estado: "cerrada" })
    .eq("id", claseId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clase: data });
}
