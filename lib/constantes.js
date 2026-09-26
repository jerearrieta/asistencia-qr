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

// "Prof. Joaquín Sosa" → "JS"
export function iniciales(nombre) {
  return (nombre || "?")
    .replace(/^prof\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export const NOMBRE_ROL = {
  director: "Director/a",
  profesor: "Profesor/a",
  alumno: "Alumno/a",
};
