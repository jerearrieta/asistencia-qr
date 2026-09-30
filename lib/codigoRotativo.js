import { createHmac, timingSafeEqual } from "crypto";
import { ALFABETO } from "@/lib/generateToken";

// Código rotativo de la clase: cambia cada QR_ROTACION_SEGUNDOS, así una
// foto del QR reenviada por WhatsApp deja de servir enseguida.
//
// No se guarda nada nuevo en la base: el código de cada ventana de tiempo
// se deriva con HMAC(SESSION_SECRET, clase.id + clase.token + ventana).
// clase.token es aleatorio por clase y SESSION_SECRET nunca sale del
// servidor, así que nadie puede adivinar el próximo código.
//
// Con QR_ROTACION_SEGUNDOS=0 se desactiva y se usa clase.token fijo, como
// antes (útil si el profesor escribe el código en el pizarrón).

const LONGITUD = 6;

// Ventanas anteriores que se siguen aceptando, para quien escaneó o tipeó
// justo antes del cambio (con la rotación de 1 minuto, cada código vale
// entre 1 y 2 minutos).
export const GRACIA_QR = 1;
export const GRACIA_CODIGO = 1;

// Tiempo que tiene el alumno para completar el DNI después de abrir un QR
// válido (el código del QR ya pudo haber rotado para entonces).
const DURACION_PASE_SEG = 3 * 60;

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta la variable de entorno SESSION_SECRET");
  return s;
}

export function segundosDeRotacion() {
  const seg = Number(process.env.QR_ROTACION_SEGUNDOS ?? 60);
  return Number.isFinite(seg) && seg >= 0 ? seg : 60;
}

function hmac(texto) {
  return createHmac("sha256", secreto()).update(texto).digest();
}

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function codigoDeVentana(clase, ventana) {
  const bytes = hmac(`codigo:${clase.id}:${clase.token}:${ventana}`);
  let codigo = "";
  // 256 es múltiplo de 32 (largo del alfabeto): el módulo no introduce sesgo.
  for (let i = 0; i < LONGITUD; i++) codigo += ALFABETO[bytes[i] % ALFABETO.length];
  return codigo;
}

// Código que se muestra ahora y cuántos ms faltan para que cambie.
export function codigoVigente(clase, ahora = Date.now()) {
  const rotacion = segundosDeRotacion();
  if (!rotacion) return { codigo: clase.token, msParaCambio: null, rotacionSeg: 0 };

  const periodo = rotacion * 1000;
  const ventana = Math.floor(ahora / periodo);
  return {
    codigo: codigoDeVentana(clase, ventana),
    msParaCambio: (ventana + 1) * periodo - ahora,
    rotacionSeg: rotacion,
  };
}

export function codigoValido(clase, codigo, gracia, ahora = Date.now()) {
  if (!codigo) return false;
  const rotacion = segundosDeRotacion();
  if (!rotacion) return iguales(clase.token, codigo);

  const ventana = Math.floor(ahora / (rotacion * 1000));
  for (let v = ventana; v >= ventana - gracia; v--) {
    if (iguales(codigoDeVentana(clase, v), codigo)) return true;
  }
  return false;
}

// Pase firmado que recibe quien abrió un QR válido, para que el código no
// le venza mientras escribe el DNI. Solo vive en la página, no en la URL.
export function firmarPase(claseId, ahora = Date.now()) {
  const exp = Math.floor(ahora / 1000) + DURACION_PASE_SEG;
  const firma = hmac(`pase:${claseId}:${exp}`).toString("base64url");
  return `${exp}.${firma}`;
}

export function paseValido(pase, claseId, ahora = Date.now()) {
  if (typeof pase !== "string" || !pase.includes(".")) return false;
  const [exp, firma] = pase.split(".");
  if (!/^\d+$/.test(exp) || Number(exp) < Math.floor(ahora / 1000)) return false;
  return iguales(hmac(`pase:${claseId}:${exp}`).toString("base64url"), firma);
}
