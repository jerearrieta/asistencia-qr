import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";

export async function POST(request) {
  const { sesion, error: sinPermiso } = await exigirRol();
  if (sinPermiso) return sinPermiso;

  const body = await request.json();
  const actual = body?.actual || "";
  const nueva = body?.nueva || "";

  if (nueva.length < 6) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("password_hash")
    .eq("id", sesion.id)
    .single();

  if (!usuario || !(await bcrypt.compare(actual, usuario.password_hash))) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta" },
      { status: 401 }
    );
  }

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ password_hash: await bcrypt.hash(nueva, 10) })
    .eq("id", sesion.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
