// Sesión firmada en una cookie (HMAC-SHA256). Usa Web Crypto para poder
// correr tanto en el middleware (Edge) como en las API Routes (Node).

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_SEG = 60 * 60 * 12; // 12 horas

const codificador = new TextEncoder();

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta la variable de entorno SESSION_SECRET");
  return s;
}

function aBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto) {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function clave() {
  return crypto.subtle.importKey(
    "raw",
    codificador.encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function firmarSesion({ id, dni, nombre, rol }) {
  const exp = Math.floor(Date.now() / 1000) + DURACION_SESION_SEG;
  const payload = aBase64Url(
    codificador.encode(JSON.stringify({ id, dni, nombre, rol, exp }))
  );
  const firma = await crypto.subtle.sign("HMAC", await clave(), codificador.encode(payload));
  return `${payload}.${aBase64Url(new Uint8Array(firma))}`;
}

export async function verificarSesion(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, firma] = token.split(".");
  try {
    const valida = await crypto.subtle.verify(
      "HMAC",
      await clave(),
      deBase64Url(firma),
      codificador.encode(payload)
    );
    if (!valida) return null;
    const datos = JSON.parse(new TextDecoder().decode(deBase64Url(payload)));
    if (!datos.exp || datos.exp < Math.floor(Date.now() / 1000)) return null;
    return datos;
  } catch {
    return null;
  }
}

export function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  };
}

// Página a la que va cada rol después de iniciar sesión
export function inicioPorRol(rol) {
  if (rol === "director") return "/tablero";
  if (rol === "profesor") return "/profesor";
  return "/alumno";
}
