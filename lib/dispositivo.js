import { firmar, firmaValida } from "@/lib/sesion";

// Identificador del celular del alumno. Lo genera y firma el servidor y vive
// en una cookie httpOnly: el navegador no lo puede leer ni inventar, y un
// pedido sin cookie válida no puede registrar asistencia.
//
// Corre en el middleware (Edge) y en las rutas (Node): usa Web Crypto.

export const COOKIE_DISPOSITIVO = "dispositivo";
const DURACION_SEG = 60 * 60 * 24 * 400; // el máximo que aceptan los navegadores

export async function crearCookieDispositivo() {
  const id = crypto.randomUUID();
  return `${id}.${await firmar(`dispositivo:${id}`)}`;
}

// Devuelve el id del dispositivo si la cookie es válida, o null.
export async function dispositivoDeCookie(valor) {
  if (typeof valor !== "string") return null;
  const [id, firma, ...resto] = valor.split(".");
  if (!id || !firma || resto.length) return null;
  return (await firmaValida(`dispositivo:${id}`, firma)) ? id : null;
}

export function opcionesCookieDispositivo() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEG,
  };
}
