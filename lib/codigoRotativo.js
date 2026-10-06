import { createHmac, timingSafeEqual } from "crypto";
import { ALFABETO, minutosDeExpiracion } from "@/lib/generateToken";

// Código rotativo del QR de la clase: cambia cada QR_ROTACION_SEGUNDOS, así
// una foto del QR reenviada por WhatsApp deja de servir enseguida.
//
// No se guarda nada nuevo en la base: el código de cada ventana de tiempo
// se deriva con HMAC(SESSION_SECRET, clase.id + clase.token + ventana).
// clase.token es aleatorio por clase y SESSION_SECRET nunca sale del
// servidor, así que nadie puede adivinar el próximo código.

const LONGITUD = 6;

// Ventanas anteriores que se siguen aceptando, para quien escaneó justo
// antes del cambio (con la rotación de 30s, cada QR vale entre 30 y 60s).
export const GRACIA_QR = 1;

// Tiempo que tiene el alumno para completar el DNI después de abrir un QR
// válido (el código del QR ya pudo haber rotado para entonces).
const DURACION_PASE_SEG = 60;
const ROTACION_POR_DEFECTO = 30;
const ROTACION_MINIMA = 10;

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta la variable de entorno SESSION_SECRET");
  return s;
}

export function segundosDeRotacion() {
  const seg = Number(process.env.QR_ROTACION_SEGUNDOS ?? ROTACION_POR_DEFECTO);
  return Number.isFinite(seg) && seg >= ROTACION_MINIMA ? seg : ROTACION_POR_DEFECTO;
}

function hmac(texto) {
  return createHmac("sha256", secreto()).update(texto).digest();
}

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Las ventanas se cuentan desde que se abrió (o reabrió) la clase, no desde
// el reloj global: así el primer código dura la rotación completa. Abrir y
// reabrir fijan token_expira_en = ahora + CLASE_EXPIRA_MINUTOS.
function inicioDeRotacion(clase) {
  return new Date(clase.token_expira_en).getTime() - minutosDeExpiracion() * 60 * 1000;
}

function codigoDeVentana(clase, inicio, ventana) {
  // El inicio entra en el HMAC para que, al reabrir, no vuelvan a valer los
  // códigos (ni las fotos) de la apertura anterior.
  const bytes = hmac(`codigo:${clase.id}:${clase.token}:${inicio}:${ventana}`);
  let codigo = "";
  // 256 es múltiplo de 32 (largo del alfabeto): el módulo no introduce sesgo.
  for (let i = 0; i < LONGITUD; i++) codigo += ALFABETO[bytes[i] % ALFABETO.length];
  return codigo;
}

// Código que se muestra ahora y cuántos ms faltan para que cambie.
export function codigoVigente(clase, ahora = Date.now()) {
  const rotacion = segundosDeRotacion();
  const periodo = rotacion * 1000;
  const inicio = inicioDeRotacion(clase);
  const ventana = Math.max(0, Math.floor((ahora - inicio) / periodo));
  return {
    codigo: codigoDeVentana(clase, inicio, ventana),
    msParaCambio: inicio + (ventana + 1) * periodo - ahora,
    rotacionSeg: rotacion,
  };
}

export function codigoValido(clase, codigo, gracia, ahora = Date.now()) {
  if (!codigo) return false;
  const rotacion = segundosDeRotacion();
  const inicio = inicioDeRotacion(clase);
  const ventana = Math.max(0, Math.floor((ahora - inicio) / (rotacion * 1000)));
  for (let v = ventana; v >= Math.max(0, ventana - gracia); v--) {
    if (iguales(codigoDeVentana(clase, inicio, v), codigo)) return true;
  }
  return false;
}

// Pase firmado que recibe quien abrió un QR válido, para que el código no
// le venza mientras escribe el DNI. Solo vive en la página, no en la URL, y
// está atado al celular que escaneó: copiarlo a otro navegador no sirve.
function firmaPase(claseId, dispositivoId, exp) {
  return hmac(`pase:${claseId}:${dispositivoId}:${exp}`).toString("base64url");
}

export function firmarPase(claseId, dispositivoId, ahora = Date.now()) {
  const exp = Math.floor(ahora / 1000) + DURACION_PASE_SEG;
  return `${exp}.${firmaPase(claseId, dispositivoId, exp)}`;
}

export function paseValido(pase, claseId, dispositivoId, ahora = Date.now()) {
  if (typeof pase !== "string" || !pase.includes(".") || !dispositivoId) return false;
  const [exp, firma] = pase.split(".");
  if (!/^\d+$/.test(exp) || Number(exp) < Math.floor(ahora / 1000)) return false;
  return iguales(firmaPase(claseId, dispositivoId, exp), firma);
}
