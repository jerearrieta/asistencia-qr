"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelProfesor({ cursosIniciales }) {
  const [cursos, setCursos] = useState(cursosIniciales || []);
  const [nombreCurso, setNombreCurso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
    router.push(`/profesor/clase/${data.clase.id}`);
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
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>{curso.nombre}</span>
            <button
              className="btn"
              disabled={cargando}
              onClick={() => abrirClase(curso.id)}
            >
              Abrir clase de hoy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
