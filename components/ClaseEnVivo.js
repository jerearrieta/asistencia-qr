"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { claseEstaAbierta } from "@/lib/estadoClase";

export default function ClaseEnVivo({ clase: claseInicial }) {
  const [clase, setClase] = useState(claseInicial);
  const [asistencias, setAsistencias] = useState([]);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloEditado, setTituloEditado] = useState(clase.cursos?.nombre || "");
  const cierreDisparado = useRef(false);

  const urlQr = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/asistencia/${clase.id}/${clase.token}`;
  }, [clase.id, clase.token]);

  // Un solo efecto que, en cada tick, calcula el tiempo restante DIRECTO
  // desde clase.token_expira_en (nunca desde el segundosRestantes viejo).
  // Esto evita la condición de carrera de tener dos efectos separados:
  // si dependiéramos del estado anterior, justo después de reabrir la
  // clase el contador podía seguir en 0 por una fracción de segundo y
  // disparar un auto-cierre inmediato.
  useEffect(() => {
    let cancelado = false;

    const tick = () => {
      const restante = Math.max(
        0,
        Math.floor(
          (new Date(clase.token_expira_en).getTime() - Date.now()) / 1000
        )
      );
      setSegundosRestantes(restante);

      if (
        restante === 0 &&
        clase.estado === "abierta" &&
        !cierreDisparado.current
      ) {
        cierreDisparado.current = true;
        fetch("/api/clases/cerrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claseId: clase.id }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!cancelado && data?.clase) setClase(data.clase);
          })
          .catch(() => {});
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [clase.token_expira_en, clase.estado, clase.id]);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const res = await fetch(`/api/clases/${clase.id}/asistencias`);
      if (!activo) return;
      if (res.ok) {
        const data = await res.json();
        setAsistencias(data.asistencias || []);
      }
    }
    cargar();
    const id = setInterval(cargar, 4000);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [clase.id]);

  async function cerrarClase() {
    setCargando(true);
    const res = await fetch("/api/clases/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: clase.id }),
    });
    const data = await res.json();
    setCargando(false);
    if (res.ok) setClase(data.clase);
  }

  async function reabrirClase() {
    setCargando(true);
    cierreDisparado.current = false;
    const res = await fetch("/api/clases/reabrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: clase.id }),
    });
    const data = await res.json();
    setCargando(false);
    if (res.ok) setClase(data.clase);
  }

  async function guardarTitulo() {
    if (!tituloEditado.trim()) return;
    setCargando(true);
    const res = await fetch(`/api/cursos/${clase.curso_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: tituloEditado }),
    });
    const data = await res.json();
    setCargando(false);
    if (res.ok) {
      setClase({ ...clase, cursos: { ...clase.cursos, nombre: data.curso.nombre } });
      setEditandoTitulo(false);
    }
  }

  const estaAbierta = claseEstaAbierta(clase) && segundosRestantes > 0;

  return (
    <div>
      {editandoTitulo ? (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input
            style={{ margin: 0 }}
            value={tituloEditado}
            onChange={(e) => setTituloEditado(e.target.value)}
            autoFocus
          />
          <button className="btn" disabled={cargando} onClick={guardarTitulo}>
            Guardar
          </button>
          <button
            className="btn secondary"
            onClick={() => setEditandoTitulo(false)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>{clase.cursos?.nombre}</h2>
          <button
            className="btn secondary"
            onClick={() => {
              setTituloEditado(clase.cursos?.nombre || "");
              setEditandoTitulo(true);
            }}
          >
            Editar título
          </button>
        </div>
      )}

      <div className="card">
        {estaAbierta ? (
          <>
            <div className="qr-wrap">
              <QRCode value={urlQr} size={220} />
            </div>
            <p style={{ textAlign: "center" }}>
              O escribí este código en <code>/asistencia</code>:
            </p>
            <div className="token-grande">{clase.token}</div>
            <p style={{ textAlign: "center", color: "#666" }}>
              Se cierra solo en {segundosRestantes}s
            </p>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                className="btn danger"
                onClick={cerrarClase}
                disabled={cargando}
              >
                Cerrar toma de asistencia ahora
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mensaje-error" style={{ textAlign: "center" }}>
              Esta clase está cerrada. El código {clase.token} no es válido
              hasta que la reabras.
            </p>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                className="btn"
                onClick={reabrirClase}
                disabled={cargando}
              >
                Reabrir clase
              </button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>Presentes ({asistencias.length})</h3>
          <a className="btn secondary" href={`/api/clases/${clase.id}/asistencias?formato=csv`} target="_blank" rel="noopener noreferrer">
            Exportar CSV
          </a>
        </div>
        <table>
          <thead>
            <tr>
              <th>DNI/Legajo</th>
              <th>Nombre</th>
              <th>Método</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map((a) => (
              <tr key={a.id}>
                <td>{a.dni_alumno}</td>
                <td>{a.nombre_alumno || "-"}</td>
                <td>{a.metodo}</td>
                <td>{new Date(a.registrado_en).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}