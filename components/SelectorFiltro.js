"use client";

import { CAMPOS_FILTRO, opcionesFiltro } from "@/lib/filtros";

export default function SelectorFiltro({ clave, comisiones, filtros, setFiltros }) {
  return (
    <label>
      {CAMPOS_FILTRO[clave].etiqueta}
      <select
        value={filtros[clave]}
        onChange={(e) => setFiltros({ ...filtros, [clave]: e.target.value })}
      >
        <option value="">Todos</option>
        {opcionesFiltro(comisiones, filtros, clave).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
    </label>
  );
}
