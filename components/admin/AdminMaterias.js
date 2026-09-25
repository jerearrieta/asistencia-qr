"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { llamarApi } from "./api";

const VACIA = { id: null, nombre: "", plan: {} }; // plan: { carreraId: anio }

export default function AdminMaterias({ carreras, materias }) {
  const router = useRouter();
  const [form, setForm] = useState(VACIA);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");

  const nombreCarrera = Object.fromEntries(carreras.map((c) => [c.id, c.nombre]));
  const visibles = materias.filter(
    (m) => !filtro || m.carrera_materias.some((cm) => cm.carrera_id === filtro)
  );

  function editar(m) {
    setError("");
    setForm({
      id: m.id,
      nombre: m.nombre,
      plan: Object.fromEntries(m.carrera_materias.map((cm) => [cm.carrera_id, cm.anio])),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternarCarrera(id) {
    const plan = { ...form.plan };
    if (plan[id]) delete plan[id];
    else plan[id] = 1;
    setForm({ ...form, plan });
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    const body = {
      nombre: form.nombre,
      carreras: Object.entries(form.plan).map(([carreraId, anio]) => ({ carreraId, anio })),
    };
    const { ok, data } = form.id
      ? await llamarApi(`/api/admin/materias/${form.id}`, "PATCH", body)
      : await llamarApi("/api/admin/materias", "POST", body);
    if (!ok) {
      setError(data.error || "Ocurrió un error");
      return;
    }
    setForm(VACIA);
    router.refresh();
  }

  async function eliminar(m) {
    if (!window.confirm(`¿Eliminar "${m.nombre}" y todas sus comisiones?`)) return;
    const { ok, data } = await llamarApi(`/api/admin/materias/${m.id}`, "DELETE");
    if (!ok) setError(data.error || "Ocurrió un error");
    router.refresh();
  }

  return (
    <div>
      <div className="card">
        <h3>{form.id ? "Editar materia" : "Nueva materia"}</h3>
        <form onSubmit={guardar}>
          <input
            placeholder="Nombre de la materia"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <p className="texto-suave">
            Marcá en qué carreras se dicta y en qué año (una materia puede
            estar en varias carreras). Si quitás una carrera se borran sus
            comisiones de esta materia.
          </p>
          <div className="grilla-checks">
            {carreras.map((c) => (
              <label key={c.id} className="check">
                <input
                  type="checkbox"
                  checked={!!form.plan[c.id]}
                  onChange={() => alternarCarrera(c.id)}
                />
                <span>{c.nombre}</span>
                {form.plan[c.id] && (
                  <select
                    value={form.plan[c.id]}
                    onChange={(e) =>
                      setForm({ ...form, plan: { ...form.plan, [c.id]: e.target.value } })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((a) => (
                      <option key={a} value={a}>
                        {a}° año
                      </option>
                    ))}
                  </select>
                )}
              </label>
            ))}
          </div>
          <div className="acciones">
            <button className="btn">{form.id ? "Guardar cambios" : "Agregar materia"}</button>
            {form.id && (
              <button type="button" className="btn secondary" onClick={() => setForm(VACIA)}>
                Cancelar
              </button>
            )}
          </div>
          {error && <p className="mensaje-error">{error}</p>}
        </form>
      </div>

      <div className="card">
        <div className="fila-lista" style={{ borderBottom: "none" }}>
          <h3 style={{ margin: 0 }}>Materias ({visibles.length})</h3>
          <select style={{ width: "auto", margin: 0 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        {visibles.map((m) => (
          <div key={m.id} className="fila-lista">
            <span>
              {m.nombre}
              <br />
              <span className="texto-suave">
                {m.carrera_materias
                  .map((cm) => `${nombreCarrera[cm.carrera_id]} (${cm.anio}°)`)
                  .join(" · ")}
              </span>
            </span>
            <div className="acciones">
              <button className="btn secondary chico" onClick={() => editar(m)}>
                Editar
              </button>
              <button className="btn danger chico" onClick={() => eliminar(m)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
