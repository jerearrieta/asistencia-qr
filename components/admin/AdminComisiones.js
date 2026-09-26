"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { llamarApi } from "./api";
import { TURNOS, MODALIDADES, capitalizar } from "@/lib/constantes";

const VACIA = {
  id: null,
  carreraId: "",
  materiaId: "",
  division: "A",
  turno: "mañana",
  modalidad: "presencial",
  profesorId: "",
};

export default function AdminComisiones({ carreras, materias, comisiones, profesores }) {
  const router = useRouter();
  const [form, setForm] = useState(VACIA);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");

  // Materias del plan de la carrera elegida en el formulario
  const materiasDeCarrera = materias
    .map((m) => ({ ...m, cm: m.carrera_materias.find((cm) => cm.carrera_id === form.carreraId) }))
    .filter((m) => m.cm)
    .sort((a, b) => a.cm.anio - b.cm.anio || a.nombre.localeCompare(b.nombre, "es"));

  const visibles = comisiones.filter((c) => !filtro || c.carrera_id === filtro);

  function editar(c) {
    setError("");
    setForm({
      id: c.comision_id,
      carreraId: c.carrera_id,
      materiaId: c.materia_id,
      division: c.division,
      turno: c.turno,
      modalidad: c.modalidad,
      profesorId: c.profesor_id || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    const { ok, data } = form.id
      ? await llamarApi(`/api/admin/comisiones/${form.id}`, "PATCH", form)
      : await llamarApi("/api/admin/comisiones", "POST", form);
    if (!ok) {
      setError(data.error || "Ocurrió un error");
      return;
    }
    setForm({ ...VACIA, carreraId: form.carreraId });
    router.refresh();
  }

  async function eliminar(c) {
    if (
      !window.confirm(
        `¿Eliminar la comisión de ${c.materia} ${c.anio}° ${c.division}? Se borran su padrón, clases y asistencias.`
      )
    ) {
      return;
    }
    const { ok, data } = await llamarApi(`/api/admin/comisiones/${c.comision_id}`, "DELETE");
    if (!ok) setError(data.error || "Ocurrió un error");
    router.refresh();
  }

  const campo = (clave) => ({
    value: form[clave],
    onChange: (e) => setForm({ ...form, [clave]: e.target.value }),
  });

  return (
    <div>
      <div className="card">
        <h3>{form.id ? "Editar comisión" : "Nueva comisión"}</h3>
        <form onSubmit={guardar}>
          <div className="grilla-form">
            <label>
              Carrera
              <select
                value={form.carreraId}
                onChange={(e) => setForm({ ...form, carreraId: e.target.value, materiaId: "" })}
                required
              >
                <option value="">Elegí…</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Materia
              <select {...campo("materiaId")} required disabled={!form.carreraId}>
                <option value="">Elegí…</option>
                {materiasDeCarrera.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.cm.anio}° · {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              División
              <input {...campo("division")} placeholder="A" required />
            </label>
            <label>
              Turno
              <select {...campo("turno")}>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>
                    {capitalizar(t)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modalidad
              <select {...campo("modalidad")}>
                {MODALIDADES.map((m) => (
                  <option key={m} value={m}>
                    {capitalizar(m)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Profesor a cargo
              <select {...campo("profesorId")}>
                <option value="">Sin asignar</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.dni})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="acciones">
            <button className="btn">{form.id ? "Guardar cambios" : "Crear comisión"}</button>
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
          <h3 style={{ margin: 0 }}>Comisiones ({visibles.length})</h3>
          <select style={{ width: "auto", margin: 0 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Materia</th>
                <th>Año / Div.</th>
                <th>Turno</th>
                <th>Modalidad</th>
                <th>Profesor</th>
                <th>Inscriptos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr key={c.comision_id}>
                  <td>{c.carrera}</td>
                  <td>{c.materia}</td>
                  <td>
                    {c.anio}° {c.division}
                  </td>
                  <td>{capitalizar(c.turno)}</td>
                  <td>{capitalizar(c.modalidad)}</td>
                  <td>{c.profesor || <span className="texto-suave">Sin asignar</span>}</td>
                  <td>{c.inscriptos}</td>
                  <td>
                    <div className="acciones" style={{ flexWrap: "nowrap" }}>
                      <button className="btn secondary chico" onClick={() => editar(c)}>
                        Editar
                      </button>
                      <button className="btn danger chico" onClick={() => eliminar(c)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
