import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const body = await request.json();
  const { claseId, token, dni, nombre, metodo } = body || {};

  const dniLimpio = (dni || "").trim();
  if (!dniLimpio) {
    return NextResponse.json(
      { error: "El DNI/legajo es obligatorio" },
      { status: 400 }
    );
  }
  if (!token) {
    return NextResponse.json({ error: "Falta el código" }, { status: 400 });
  }

  // Buscamos la clase por id (flujo QR) o por token (flujo código manual)
  let query = supabaseAdmin.from("clases").select("*");
  query = claseId ? query.eq("id", claseId) : query.eq("token", token);

  const { data: clase, error: errorClase } = await query.single();

  if (errorClase || !clase) {
    return NextResponse.json(
      { error: "No se encontró la clase indicada" },
      { status: 404 }
    );
  }

  // Validaciones de la "transacción": estado, token y expiración
  if (clase.estado !== "abierta") {
    return NextResponse.json(
      { error: "La toma de asistencia ya fue cerrada" },
      { status: 409 }
    );
  }
  if (clase.token !== token) {
    return NextResponse.json({ error: "Código inválido" }, { status: 401 });
  }
  if (new Date(clase.token_expira_en).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "El código expiró, pedile al profesor uno nuevo" },
      { status: 410 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("asistencias")
    .insert({
      clase_id: clase.id,
      dni_alumno: dniLimpio,
      nombre_alumno: (nombre || "").trim() || null,
      metodo: metodo === "codigo" ? "codigo" : "qr",
    })
    .select()
    .single();

  if (error) {
    // Código 23505 = violación de UNIQUE(clase_id, dni_alumno) en Postgres
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya registraste tu asistencia en esta clase" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asistencia: data }, { status: 201 });
}
