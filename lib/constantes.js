export const ZONA_HORARIA = "America/Argentina/Cordoba";
export const TURNOS = ["mañana", "tarde", "noche"];
export const MODALIDADES = ["presencial", "virtual"];
export const ROLES = ["director", "profesor", "alumno"];
export const UMBRAL_REGULARIDAD = 0.75;

export function capitalizar(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : "";
}

// "Métodos Cuantitativos de Gestión — 2° A · Noche · Presencial"
export function describirComision(c) {
  if (!c) return "";
  return `${c.materia} — ${c.anio}° ${c.division} · ${capitalizar(c.turno)} · ${capitalizar(c.modalidad)}`;
}
