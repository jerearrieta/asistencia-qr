import { NextResponse } from "next/server";
import { exigirRol } from "@/lib/auth";
import { claseGestionable } from "@/lib/consultas";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { codigoVigente } from "@/lib/codigoRotativo";

export const dynamic = "force-dynamic";

// Código que la pantalla del profesor tiene que mostrar ahora (QR y texto).
export async function GET(request, { params }) {
  const { sesion, error: sinPermiso } = await exigirRol("director", "profesor");
  if (sinPermiso) return sinPermiso;

  const permiso = await claseGestionable(params.id, sesion);
  if (permiso.error) {
    return NextResponse.json({ error: permiso.error }, { status: permiso.status });
  }
  if (!claseEstaAbierta(permiso.clase)) {
    return NextResponse.json({ error: "La clase está cerrada" }, { status: 409 });
  }

  return NextResponse.json(codigoVigente(permiso.clase), {
    headers: { "Cache-Control": "no-store" },
  });
}
