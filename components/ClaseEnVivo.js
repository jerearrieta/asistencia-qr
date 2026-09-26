"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { ZONA_HORARIA, describirComision } from "@/lib/constantes";

export default function ClaseEnVivo({ clase: claseInicial, comision }) {
  const [clase, setClase] = useState(claseInicial);
  const [padron, setPadron] = useState([]);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(false);
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

  const cargarPadron = useCallback(async () => {
    const res = await fetch(`/api/clases/${clase.id}/asistencias`);
    if (res.ok) {
      const data = await res.json();
      setPadron(data.padron || []);
    }
  }, [clase.id]);

  useEffect(() => {
    cargarPadron();
    const id = setInterval(cargarPadron, 4000);
    return () => clearInterval(id);
  }, [cargarPadron]);

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

  async function marcarManual(alumno, presente) {
    setCargando(true);
    await fetch(`/api/clases/${clase.id}/manual`, {
      method: presente ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnoId: alumno.alumno_id }),
    });
    await cargarPadron();
    setCargando(false);
  }

  const estaAbierta = claseEstaAbierta(clase) && segundosRestantes > 0;
  const presentes = padron
    .filter((a) => a.presente)
    .sort((a, b) => new Date(a.registrado_en) - new Date(b.registrado_en));
  const ausentes = padron.filter((a) => !a.presente);

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>{describirComision(comision)}</h2>
      <p className="texto-suave" style={{ marginTop: 0 }}>
        {comision.carrera} · {comision.profesor || "Sin profesor asignado"} ·{" "}
        {new Date(clase.fecha).toLocaleDateString("es-AR")}
      </p>

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
        <div className="fila-lista" style={{ borderBottom: "none" }}>
          <h3 style={{ margin: 0 }}>
            Presentes {presentes.length} de {padron.length}
          </h3>
          <a
            className="btn secondary"
            href={`/api/clases/${clase.id}/asistencias?formato=csv`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Exportar CSV
          </a>
        </div>
        {padron.length === 0 && (
          <p className="texto-suave">
            Esta comisión no tiene alumnos en el padrón. El director puede
            cargarlos desde Administración → Padrón.
          </p>
        )}
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Alumno</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Hora</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...presentes, ...ausentes].map((a) => (
                <tr key={a.alumno_id}>
                  <td>{a.dni}</td>
                  <td>{a.alumno}</td>
                  <td
                    style={{
                      color: a.presente ? "#16a34a" : "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    {a.presente ? "Presente" : "Ausente"}
                  </td>
                  <td>{a.metodo || "-"}</td>
                  <td>
                    {a.registrado_en
                      ? new Date(a.registrado_en).toLocaleTimeString("es-AR", {
                          timeZone: ZONA_HORARIA,
                          hour12: false,
                        })
                      : "-"}
                  </td>
                  <td>
                    <button
                      className={`btn chico ${a.presente ? "secondary" : ""}`}
                      disabled={cargando}
                      onClick={() => marcarManual(a, !a.presente)}
                    >
                      {a.presente ? "Quitar" : "Marcar presente"}
                    </button>
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
