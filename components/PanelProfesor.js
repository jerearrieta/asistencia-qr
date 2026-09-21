"use client";

import { useState } from "react";

export default function PanelProfesor({ cursosIniciales, clasesIniciales }) {
  const [cursos, setCursos] = useState(cursosIniciales || []);
  const [clases] = useState(clasesIniciales || []);
  const [nombreCurso, setNombreCurso] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function crearCurso(e) {
    e.preventDefault();
    setError("");
    if (!nombreCurso.trim()) return;

    setCargando(true);
    const res = await fetch("/api/cursos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreCurso }),
    });
    const data = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(data.error || "Error al crear el curso");
      return;
    }
    setCursos([data.curso, ...cursos]);
    setNombreCurso("");
  }

  async function abrirClase(cursoId) {
    setError("");
    setCargando(true);
    const res = await fetch("/api/clases/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursoId }),
    });
    const data = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(data.error || "Error al abrir la clase");
      return;
    }
    window.location.href = `/profesor/clase/${data.clase.id}`;
  }

  function empezarEdicion(curso) {
    setEditandoId(curso.id);
    setNombreEditado(curso.nombre);
  }

  async function guardarEdicion(cursoId) {
    if (!nombreEditado.trim()) return;
    setError("");
    setCargando(true);
    const res = await fetch(`/api/cursos/${cursoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreEditado }),
    });
    const data = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(data.error || "Error al editar el curso");
      return;
    }
    setCursos(cursos.map((c) => (c.id === cursoId ? data.curso : c)));
    setEditandoId(null);
  }

  async function eliminarCurso(curso) {
    const confirmado = window.confirm(
      `¿Eliminar "${curso.nombre}"? Esto borra también todas sus clases y asistencias registradas. Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setError("");
    setCargando(true);
    const res = await fetch(`/api/cursos/${curso.id}`, { method: "DELETE" });
    setCargando(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al eliminar el curso");
      return;
    }
    setCursos(cursos.filter((c) => c.id !== curso.id));
  }

  return (
    <div>
      <div className="card">
        <h3>Nuevo curso</h3>
        <form onSubmit={crearCurso}>
          <input
            placeholder="Ej: Métodos Cuantitativos de Gestión"
            value={nombreCurso}
            onChange={(e) => setNombreCurso(e.target.value)}
          />
          <button className="btn" disabled={cargando}>
            Crear curso
          </button>
        </form>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="card">
        <h3>Mis cursos</h3>
        {cursos.length === 0 && <p>Todavía no creaste ningún curso.</p>}
        {cursos.map((curso) => (
          <div
            key={curso.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            {editandoId === curso.id ? (
              <>
                <input
                  style={{ margin: 0 }}
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn"
                    disabled={cargando}
                    onClick={() => guardarEdicion(curso.id)}
                  >
                    Guardar
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setEditandoId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>{curso.nombre}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn"
                    disabled={cargando}
                    onClick={() => abrirClase(curso.id)}
                  >
                    Abrir clase de hoy
                  </button>
                  <button
                    className="btn secondary"
                    disabled={cargando}
                    onClick={() => empezarEdicion(curso)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn danger"
                    disabled={cargando}
                    onClick={() => eliminarCurso(curso)}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Clases recientes</h3>
        {clases.length === 0 && <p>Todavía no abriste ninguna clase.</p>}
        {clases.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>
              {c.cursos?.nombre} —{" "}
              {new Date(c.fecha).toLocaleDateString("es-AR")}{" "}
              <strong style={{ color: c.estado === "abierta" ? "#16a34a" : "#6b7280" }}>
                ({c.estado === "abierta" ? "Abierta" : "Cerrada"})
              </strong>
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <a className="btn secondary" href={`/profesor/clase/${c.id}`}>Ver</a>
              className="btn secondary"
              href={`/api/clases/${c.id}/asistencias?formato=csv`}
              <a>
                CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}