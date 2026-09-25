import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirRol } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";

// El profesor marca (POST) o desmarca (DELETE) a mano a un alumno del
// padrón, por ejemplo si no tiene celular o se quedó sin batería.
async function preparar(request, params) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return { respuesta: sinPermiso };

  const body = await request.json();
  const alumnoId = body?.alumnoId;
  if (!alumnoId) {
    return { respuesta: NextResponse.json({ error: "Falta alumnoId" }, { status: 400 }) };
  }

  const permiso = await claseGestionable(params.id, sesion);
  if (permiso.error) {
    return {
      respuesta: NextResponse.json({ error: permiso.error }, { status: permiso.status }),
    };
  }

  const { data: inscripcion } = await supabaseAdmin
    .from("inscripciones")
    .select("alumno_id, usuarios(dni, nombre)")
    .eq("comision_id", permiso.clase.comision_id)
    .eq("alumno_id", alumnoId)
    .maybeSingle();

  if (!inscripcion) {
    return {
      respuesta: NextResponse.json(
        { error: "El alumno no está inscripto en esta comisión" },
        { status: 404 }
      ),
    };
  }
  return { clase: permiso.clase, alumno: { id: alumnoId, ...inscripcion.usuarios } };
}

export async function POST(request, { params }) {
  const { respuesta, clase, alumno } = await preparar(request, params);
  if (respuesta) return respuesta;

  const { error } = await supabaseAdmin.from("asistencias").insert({
    clase_id: clase.id,
    alumno_id: alumno.id,
    dni_alumno: alumno.dni,
    nombre_alumno: alumno.nombre,
    metodo: "manual",
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { respuesta, clase, alumno } = await preparar(request, params);
  if (respuesta) return respuesta;

  const { error } = await supabaseAdmin
    .from("asistencias")
    .delete()
    .eq("clase_id", clase.id)
    .eq("dni_alumno", alumno.dni);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
