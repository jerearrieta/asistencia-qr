import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { paseValido } from "@/lib/codigoRotativo";
import { COOKIE_DISPOSITIVO, dispositivoDeCookie } from "@/lib/dispositivo";

const OTRO_ALUMNO =
  "Este celular ya está vinculado a otro alumno. Cada uno registra la asistencia desde su propio celular.";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { claseId, pase, dni } = body || {};

  const dniLimpio = (dni || "").trim();
  if (!dniLimpio) {
    return NextResponse.json(
      { error: "El DNI/legajo es obligatorio" },
      { status: 400 }
    );
  }
  if (!claseId || !pase) {
    return NextResponse.json(
      { error: "Escaneá el QR que muestra el profesor para registrarte." },
      { status: 400 }
    );
  }

  // El celular se identifica con la cookie firmada que le dio el servidor al
  // abrir el QR: sin ella (o inventada) no se puede registrar.
  const dispositivoId = await dispositivoDeCookie(cookies().get(COOKIE_DISPOSITIVO)?.value);
  if (!dispositivoId) {
    return NextResponse.json(
      { error: "No pudimos reconocer tu celular. Volvé a escanear el QR." },
      { status: 400 }
    );
  }

  const { data: clase } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("id", claseId)
    .maybeSingle();

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
      { error: "La toma de asistencia ya terminó" },
      { status: 410 }
    );
  }
  // El pase lo entrega la página del QR, vale poco tiempo y solo para el
  // celular que escaneó.
  if (!paseValido(pase, clase.id, dispositivoId)) {
    return NextResponse.json(
      { error: "Se te pasó el tiempo. Escaneá el QR que está en pantalla ahora." },
      { status: 401 }
    );
  }

  // El DNI tiene que estar en el padrón de la comisión: así el nombre sale
  // del padrón (sin errores de tipeo) y podemos calcular quién faltó.
  const { data: alumno } = await supabaseAdmin
    .from("usuarios")
    .select("id, dni, nombre, dispositivo_id, inscripciones!inner(comision_id)")
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

  // Cada DNI queda atado al primer celular con el que registra. Desde otro
  // celular no se puede: queda un pedido para que el profesor lo libere.
  if (alumno.dispositivo_id && alumno.dispositivo_id !== dispositivoId) {
    const { error } = await supabaseAdmin.from("pedidos_cambio_celular").upsert(
      { clase_id: clase.id, alumno_id: alumno.id, dispositivo_id: dispositivoId },
      { onConflict: "clase_id,alumno_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      {
        error:
          "Tu DNI está vinculado a otro celular. Avisale al profesor para que lo cambie a este.",
        pedidoCambio: true,
      },
      { status: 409 }
    );
  }

  const vinculoNuevo = !alumno.dispositivo_id;
  if (vinculoNuevo) {
    const { data: vinculado, error } = await supabaseAdmin
      .from("usuarios")
      .update({ dispositivo_id: dispositivoId, dispositivo_vinculado_en: new Date().toISOString() })
      .eq("id", alumno.id)
      .is("dispositivo_id", null)
      .select("id");
    if (error) {
      // Índice único: un celular solo puede estar vinculado a un alumno
      if (error.code === "23505") {
        return NextResponse.json({ error: OTRO_ALUMNO }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!vinculado?.length) {
      // Otro celular lo vinculó en el mismo instante
      return NextResponse.json(
        { error: "Tu DNI está vinculado a otro celular. Avisale al profesor." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("asistencias")
    .insert({
      clase_id: clase.id,
      alumno_id: alumno.id,
      dni_alumno: alumno.dni,
      nombre_alumno: alumno.nombre,
      metodo: "qr",
      dispositivo_id: dispositivoId,
      vinculo_nuevo: vinculoNuevo,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya estás presente en esta clase." },
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
