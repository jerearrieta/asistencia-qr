import { NextResponse } from "next/server";

export function errorDb(error) {
  if (error.code === "23505") {
    return NextResponse.json({ error: "Ya existe un registro con esos datos" }, { status: 409 });
  }
  if (error.code === "23503") {
    return NextResponse.json({ error: "Hay datos relacionados que lo impiden" }, { status: 409 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

export function faltaDato(mensaje) {
  return NextResponse.json({ error: mensaje }, { status: 400 });
}

export async function leerJson(request) {
  try {
    return (await request.json()) || {};
  } catch {
    return {};
  }
}
