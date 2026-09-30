import { randomInt } from "crypto";

// Genera un código corto (6 caracteres) fácil de leer/tipear a mano,
// evitando caracteres ambiguos como O/0, I/1, etc. Usa el generador
// criptográfico de Node: Math.random es predecible y no sirve para secretos.
export const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarToken(longitud = 6) {
  let token = "";
  for (let i = 0; i < longitud; i++) {
    token += ALFABETO[randomInt(ALFABETO.length)];
  }
  return token;
}

export function minutosDeExpiracion() {
  const min = Number(process.env.CLASE_EXPIRA_MINUTOS || 15);
  return Number.isFinite(min) && min > 0 ? min : 15;
}
