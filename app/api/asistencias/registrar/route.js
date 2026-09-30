import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  GRACIA_CODIGO,
  GRACIA_QR,
  codigoValido,
  paseValido,
} from "@/lib/codigoRotativo";

export async function POST(request) {
  const body = await request.json();
  const { claseId, token, pase, dni, metodo, dispositivoId } = body || {};

  const dniLimpio = (dni || "").trim();
  if (!dniLimpio) {
    return NextResponse.json(
      { error: "El DNI/legajo es obligatorio" },
      { status: 400 }
    );
  }
  if (!token && !pase) {
    return NextResponse.json({ error: "Falta el código" }, { status: 400 });
  }

  let clase;
  if (claseId) {
    const { data } = await supabaseAdmin
      .from("clases")
      .select("*")
      .eq("id", claseId)
      .maybeSingle();
    clase = data;
  } else {
    // Con código manual buscamos entre las clases abiertas y vigentes cuál
    // tiene hoy ese código (el código rota y no se guarda en la base).
    const { data } = await supabaseAdmin
      .from("clases")
      .select("*")
      .eq("estado", "abierta")
      .gt("token_expira_en", new Date().toISOString());
    clase = (data || []).find((c) => codigoValido(c, token, GRACIA_CODIGO));
    if (!clase) {
      return NextResponse.json(
        { error: "Código inválido o vencido. Fijate el que muestra el profesor ahora." },
        { status: 401 }
      );
    }
  }

  if (!clase) {
    return NextResponse.json(
      { error: "No se encontró la clase indicada" },
      { status: 404 }
    );
  }

  if (clase.estado !== "abierta") {
    return NextResponse.json(
      { error: "La toma de asistencia ya fue cerrada" },
      { status: 409 }
    );
  }
  if (new Date(clase.token_expira_en).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "El código expiró, pedile al profesor uno nuevo" },
      { status: 410 }
    );
  }
  // Desde el QR llega un pase firmado al abrir la página; si no, el código
  // tiene que ser uno de los últimos que mostró la pantalla del profesor.
  const autorizado = pase
    ? paseValido(pase, clase.id)
    : codigoValido(clase, token, claseId ? GRACIA_QR : GRACIA_CODIGO);
  if (!autorizado) {
    return NextResponse.json(
      { error: "El código ya cambió. Escaneá el QR que está en pantalla ahora." },
      { status: 401 }
    );
  }

  // El DNI tiene que estar en el padrón de la comisión: así el nombre sale
  // del padrón (sin errores de tipeo) y podemos calcular quién faltó.
  const { data: alumno } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni, nombre, inscripciones!inner(comision_id)")
    .eq("dni", dniLimpio)
    .eq("rol", "alumno")
    .eq("inscripciones.comision_id", clase.comision_id)
    .maybeSingle();

  if (!alumno) {
    return NextResponse.json(
      {
        error:
          "Tu DNI no figura en el padrón de esta materia. Consultá con el profesor.",
      },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("asistencias")
    .insert({
      clase_id: clase.id,
      alumno_id: alumno.id,
      dni_alumno: alumno.dni,
      nombre_alumno: alumno.nombre,
      metodo: metodo === "codigo" ? "codigo" : "qr",
      dispositivo_id: dispositivoId || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Ya se registró una asistencia en esta clase con ese DNI o desde este dispositivo",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { asistencia: data, nombre: alumno.nombre },
    { status: 201 }
  );
}
