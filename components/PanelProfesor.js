"use client";

import { useMemo, useState } from "react";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { ZONA_HORARIA, describirComision } from "@/lib/constantes";
import { filtrarComisiones, filtrosVacios } from "@/lib/filtros";
import SelectorFiltro from "@/components/SelectorFiltro";

function esDeHoy(fechaIso) {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
  const fecha = new Date(fechaIso).toLocaleDateString("en-CA", {
    timeZone: ZONA_HORARIA,
  });
  return hoy === fecha;
}

export default function PanelProfesor({ comisiones, clasesIniciales, mostrarProfesor }) {
  const [clases, setClases] = useState(clasesIniciales || []);
  // El director filtra también por profesor; el profesor solo ve lo suyo
  const clavesFiltro = mostrarProfesor
    ? ["carrera", "materia", "profesor"]
    : ["carrera", "materia"];
  const vacios = filtrosVacios(clavesFiltro);
  const [filtros, setFiltros] = useState(vacios);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const porId = useMemo(
    () => Object.fromEntries(comisiones.map((c) => [c.comision_id, c])),
    [comisiones]
  );
  const visibles = filtrarComisiones(comisiones, filtros);
  const hayFiltros = Object.values(filtros).some(Boolean);

  async function abrirClase(comisionId) {
    setError("");
    setCargando(true);
    const res = await fetch("/api/clases/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comisionId }),
    });
    const data = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(data.error || "Error al abrir la clase");
      return;
    }
    window.location.href = `/profesor/clase/${data.clase.id}`;
  }

  async function eliminarClase(clase) {
    const comision = porId[clase.comision_id];
    const confirmado = window.confirm(
      `¿Eliminar este registro de clase (${comision?.materia} — ${new Date(
        clase.fecha
      ).toLocaleDateString("es-AR")})? Esto borra también las asistencias de esa clase.`
    );
    if (!confirmado) return;

    setError("");
    setCargando(true);
    const res = await fetch(`/api/clases/${clase.id}`, { method: "DELETE" });
    setCargando(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al eliminar la clase");
      return;
    }
    setClases(clases.filter((c) => c.id !== clase.id));
  }

  return (
    <div>
      {error && <p className="mensaje-error">{error}</p>}

      <div className="card">
        <h3>{mostrarProfesor ? "Comisiones" : "Mis comisiones"}</h3>
        {comisiones.length === 0 && (
          <p>
            Todavía no tenés comisiones asignadas. Pedile al director que te
            asigne tus materias.
          </p>
        )}
        {comisiones.length > 1 && (
          <div className="grilla-form">
            {clavesFiltro.map((clave) => (
              <SelectorFiltro
                key={clave}
                clave={clave}
                comisiones={comisiones}
                filtros={filtros}
                setFiltros={setFiltros}
              />
            ))}
          </div>
        )}
        {hayFiltros && (
          <p className="texto-suave">
            Mostrando {visibles.length} de {comisiones.length} comisiones ·{" "}
            <button className="enlace-azul" onClick={() => setFiltros(vacios)}>
              Limpiar filtros
            </button>
          </p>
        )}
        {hayFiltros && visibles.length === 0 && (
          <p>Ninguna comisión coincide con esos filtros.</p>
        )}
        {visibles.map((comision) => {
          const claseDeHoy = clases.find(
            (c) => c.comision_id === comision.comision_id && esDeHoy(c.fecha)
          );

          return (
            <div key={comision.comision_id} className="fila-lista">
              <span>
                {describirComision(comision)}
                <br />
                <span className="texto-suave">
                  {comision.carrera} · {comision.inscriptos} inscriptos
                  {mostrarProfesor && ` · ${comision.profesor || "Sin profesor"}`}
                </span>
              </span>
              {claseDeHoy ? (
                <a className="btn secondary" href={`/profesor/clase/${claseDeHoy.id}`}>
                  Ver clase de hoy
                </a>
              ) : (
                <button
                  className="btn"
                  disabled={cargando}
                  onClick={() => abrirClase(comision.comision_id)}
                >
                  Abrir clase
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>Clases recientes</h3>
        {clases.length === 0 && <p>Todavía no abriste ninguna clase.</p>}
        {clases.map((c) => (
          <div key={c.id} className="fila-lista">
            <span>
              {porId[c.comision_id] && describirComision(porId[c.comision_id])} —{" "}
              {new Date(c.fecha).toLocaleDateString("es-AR")}{" "}
              <strong
                style={{ color: claseEstaAbierta(c) ? "#16a34a" : "#6b7280" }}
              >
                ({claseEstaAbierta(c) ? "Abierta" : "Cerrada"})
              </strong>
            </span>
            <div className="acciones">
              <a className="btn secondary chico" href={`/profesor/clase/${c.id}`}>
                Ver
              </a>
              <a
                className="btn secondary chico"
                href={`/api/clases/${c.id}/asistencias?formato=csv`}
                target="_blank"
                rel="noopener noreferrer"
              >
                CSV
              </a>
              <button
                className="btn danger chico"
                disabled={cargando}
                onClick={() => eliminarClase(c)}
                title="Eliminar esta clase"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
