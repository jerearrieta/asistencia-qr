"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";

export default function ClaseEnVivo({ clase: claseInicial }) {
  const [clase, setClase] = useState(claseInicial);
  const [asistencias, setAsistencias] = useState([]);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cerrando, setCerrando] = useState(false);

  const urlQr = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/asistencia/${clase.id}/${clase.token}`;
  }, [clase.id, clase.token]);

  // Countdown de expiración
  useEffect(() => {
    const actualizar = () => {
      const restante = Math.max(
        0,
        Math.floor(
          (new Date(clase.token_expira_en).getTime() - Date.now()) / 1000
        )
      );
      setSegundosRestantes(restante);
    };
    actualizar();
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, [clase.token_expira_en]);

  // Polling de asistencias registradas (para verlas en vivo)
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
    setCerrando(true);
    const res = await fetch("/api/clases/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: clase.id }),
    });
    const data = await res.json();
    setCerrando(false);
    if (res.ok) setClase(data.clase);
  }

  const estaAbierta = clase.estado === "abierta" && segundosRestantes > 0;

  return (
    <div>
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
                disabled={cerrando}
              >
                Cerrar toma de asistencia ahora
              </button>
            </div>
          </>
        ) : (
          <p className="mensaje-error" style={{ textAlign: "center" }}>
            Esta clase ya está cerrada. El código {clase.token} ya no es
            válido.
          </p>
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
          <a
            className="btn secondary"
            href={`/api/clases/${clase.id}/asistencias?formato=csv`}
          >
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
