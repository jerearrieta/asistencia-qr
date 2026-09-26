"use client";

import { useMemo, useState } from "react";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { AlertCircle, ArrowRight, BookOpen, CalendarClock, Download, Eye, Play, Trash2, Users } from "lucide-react";
import { ZONA_HORARIA, capitalizar, describirComision } from "@/lib/constantes";
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
  const [abriendo, setAbriendo] = useState(null);
  const [verTodasClases, setVerTodasClases] = useState(false);
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
    setAbriendo(comisionId);
    const res = await fetch("/api/clases/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comisionId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setCargando(false);
      setAbriendo(null);
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
      {error && (
        <div className="alerta error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <h3>{mostrarProfesor ? "Comisiones" : "Mis comisiones"}</h3>
            <p>
              {hayFiltros
                ? `Mostrando ${visibles.length} de ${comisiones.length}`
                : `${comisiones.length} ${comisiones.length === 1 ? "comisión" : "comisiones"}`}
              {hayFiltros && (
                <>
                  {" · "}
                  <button className="enlace-azul" onClick={() => setFiltros(vacios)}>
                    Limpiar filtros
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

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

        {comisiones.length === 0 && (
          <div className="vacio">
            <div className="icono-caja">
              <BookOpen size={22} />
            </div>
            <h3>Todavía no tenés comisiones</h3>
            <p>Pedile al director que te asigne tus materias desde Administración.</p>
          </div>
        )}
        {hayFiltros && visibles.length === 0 && (
          <div className="vacio">
            <h3>Sin resultados</h3>
            <p>Ninguna comisión coincide con esos filtros.</p>
          </div>
        )}

        <div className="lista-filas">
          {visibles.map((comision) => {
            const claseDeHoy = clases.find(
              (c) => c.comision_id === comision.comision_id && esDeHoy(c.fecha)
            );
            const enCurso = claseDeHoy && claseEstaAbierta(claseDeHoy);

            return (
              <div key={comision.comision_id} className="fila-lista">
                <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                  <div className="fila-titulo">
                    {comision.materia}{" "}
                    {enCurso && (
                      <span className="badge ok" style={{ marginLeft: 6 }}>
                        <span className="punto-vivo" /> En curso
                      </span>
                    )}
                  </div>
                  <span className="fila-meta">{comision.carrera}</span>
                  <div className="chips" style={{ marginTop: 8 }}>
                    <span className="chip">
                      {comision.anio}° {comision.division}
                    </span>
                    <span className="chip">{capitalizar(comision.turno)}</span>
                    <span className="chip">{capitalizar(comision.modalidad)}</span>
                    <span className="chip">
                      <Users size={12} /> {comision.inscriptos}
                    </span>
                    {mostrarProfesor && (
                      <span className="chip">{comision.profesor || "Sin profesor"}</span>
                    )}
                  </div>
                </div>
                {claseDeHoy ? (
                  <a className="btn secondary" href={`/profesor/clase/${claseDeHoy.id}`}>
                    Ver clase de hoy <ArrowRight size={16} />
                  </a>
                ) : (
                  <button
                    className="btn"
                    disabled={cargando}
                    onClick={() => abrirClase(comision.comision_id)}
                  >
                    {abriendo === comision.comision_id ? (
                      <span className="spinner" />
                    ) : (
                      <Play size={15} fill="currentColor" />
                    )}
                    Abrir clase
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Clases recientes</h3>
            <p>Las últimas 30 clases de tus comisiones.</p>
          </div>
        </div>
        {clases.length === 0 && (
          <div className="vacio">
            <div className="icono-caja">
              <CalendarClock size={22} />
            </div>
            <h3>Sin clases todavía</h3>
            <p>Cuando abras una clase va a aparecer acá, con su CSV de asistencia.</p>
          </div>
        )}
        <div className="lista-filas">
          {(verTodasClases ? clases : clases.slice(0, 8)).map((c) => {
            const comision = porId[c.comision_id];
            const abierta = claseEstaAbierta(c);
            return (
              <div key={c.id} className="fila-lista">
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <div className="fila-titulo">
                    {comision ? comision.materia : "Clase"}{" "}
                    <span className={`badge ${abierta ? "ok" : ""}`} style={{ marginLeft: 6 }}>
                      {abierta && <span className="punto-vivo" />}
                      {abierta ? "Abierta" : "Cerrada"}
                    </span>
                  </div>
                  <span className="fila-meta">
                    {new Date(c.fecha).toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      timeZone: ZONA_HORARIA,
                    })}
                    {comision && ` · ${comision.anio}° ${comision.division} · ${comision.carrera}`}
                  </span>
                </div>
                <div className="acciones">
                  <a className="btn secondary chico" href={`/profesor/clase/${c.id}`}>
                    <Eye size={14} /> Ver
                  </a>
                  <a
                    className="btn secondary chico"
                    href={`/api/clases/${c.id}/asistencias?formato=csv`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={14} /> CSV
                  </a>
                  <button
                    className="btn danger-suave chico icono"
                    disabled={cargando}
                    onClick={() => eliminarClase(c)}
                    title="Eliminar esta clase"
                    aria-label="Eliminar esta clase"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {clases.length > 8 && (
          <button
            className="btn secondary bloque"
            style={{ marginTop: 16 }}
            onClick={() => setVerTodasClases(!verTodasClases)}
          >
            {verTodasClases ? "Ver menos" : `Ver las ${clases.length} clases`}
          </button>
        )}
      </div>
    </div>
  );
}
