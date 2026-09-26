import { TURNOS, capitalizar } from "@/lib/constantes";

// Filtros sobre comisiones (tablero y panel de clases). Cada campo dice
// cómo leer su valor y su texto de una fila de v_resumen_comision.
export const CAMPOS_FILTRO = {
  carrera: { etiqueta: "Carrera", valor: (c) => c.carrera_id, texto: (c) => c.carrera },
  materia: { etiqueta: "Materia", valor: (c) => c.materia, texto: (c) => c.materia },
  profesor: {
    etiqueta: "Profesor",
    valor: (c) => c.profesor_id || "sin-asignar",
    texto: (c) => c.profesor || "Sin asignar",
  },
  anio: { etiqueta: "Año", valor: (c) => String(c.anio), texto: (c) => `${c.anio}° año` },
  turno: { etiqueta: "Turno", valor: (c) => c.turno, texto: (c) => capitalizar(c.turno) },
  modalidad: { etiqueta: "Modalidad", valor: (c) => c.modalidad, texto: (c) => capitalizar(c.modalidad) },
};

export function filtrosVacios(claves) {
  return Object.fromEntries(claves.map((k) => [k, ""]));
}

// Comisiones que cumplen todos los filtros (salvo `excepto`, si se indica)
export function filtrarComisiones(comisiones, filtros, excepto) {
  return comisiones.filter((c) =>
    Object.entries(filtros).every(
      ([clave, valor]) => clave === excepto || !valor || CAMPOS_FILTRO[clave].valor(c) === valor
    )
  );
}

// Opciones [valor, texto] de un filtro, tomadas solo de las comisiones que
// cumplen los DEMÁS filtros: si elegís un profesor, "Materia" muestra solo
// sus materias. El valor elegido siempre queda en la lista.
export function opcionesFiltro(comisiones, filtros, clave) {
  const campo = CAMPOS_FILTRO[clave];
  const mapa = new Map();
  for (const c of filtrarComisiones(comisiones, filtros, clave)) {
    mapa.set(campo.valor(c), campo.texto(c));
  }
  if (filtros[clave] && !mapa.has(filtros[clave])) {
    const c = comisiones.find((x) => campo.valor(x) === filtros[clave]);
    if (c) mapa.set(filtros[clave], campo.texto(c));
  }
  const orden =
    clave === "turno"
      ? (a, b) => TURNOS.indexOf(a[0]) - TURNOS.indexOf(b[0])
      : clave === "anio"
        ? (a, b) => Number(a[0]) - Number(b[0])
        : (a, b) => a[1].localeCompare(b[1], "es");
  return [...mapa.entries()].sort(orden);
}
