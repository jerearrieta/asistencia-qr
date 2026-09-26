"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { llamarApi } from "./api";

export default function AdminCarreras({ carreras, materias }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");

  const materiasPorCarrera = (id) =>
    materias.filter((m) => m.carrera_materias.some((cm) => cm.carrera_id === id)).length;

  async function ejecutar(url, method, body) {
    setError("");
    const { ok, data } = await llamarApi(url, method, body);
    if (!ok) {
      setError(data.error || "Ocurrió un error");
      return false;
    }
    router.refresh();
    return true;
  }

  async function crear(e) {
    e.preventDefault();
    if (await ejecutar("/api/admin/carreras", "POST", { nombre })) setNombre("");
  }

  async function guardar() {
    if (await ejecutar(`/api/admin/carreras/${editando.id}`, "PATCH", { nombre: editando.nombre })) {
      setEditando(null);
    }
  }

  function eliminar(carrera) {
    if (
      window.confirm(
        `¿Eliminar "${carrera.nombre}"? Se borran también sus comisiones, clases y asistencias.`
      )
    ) {
      ejecutar(`/api/admin/carreras/${carrera.id}`, "DELETE");
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Nueva carrera</h3>
        <form onSubmit={crear} className="acciones">
          <input
            style={{ flex: 1, margin: 0 }}
            placeholder="Ej: Analista en Sistemas"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <button className="btn">Agregar</button>
        </form>
        {error && <p className="mensaje-error" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      <div className="card">
        <h3>Carreras ({carreras.length})</h3>
        {carreras.map((c) => (
          <div key={c.id} className="fila-lista">
            {editando?.id === c.id ? (
              <>
                <input
                  style={{ flex: 1, margin: 0 }}
                  value={editando.nombre}
                  onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  autoFocus
                />
                <div className="acciones">
                  <button className="btn chico" onClick={guardar}>
                    Guardar
                  </button>
                  <button className="btn secondary chico" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>
                  {c.nombre}{" "}
                  <span className="texto-suave">· {materiasPorCarrera(c.id)} materias</span>
                </span>
                <div className="acciones">
                  <button className="btn secondary chico" onClick={() => setEditando(c)}>
                        <Pencil size={14} /> Editar
                      </button>
                  <button className="btn danger-suave chico icono" onClick={() => eliminar(c)} title="Eliminar" aria-label="Eliminar">
                        <Trash2 size={15} />
                      </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
