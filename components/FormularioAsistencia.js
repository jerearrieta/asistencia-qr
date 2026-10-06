"use client";

import { useState } from "react";
import { AlertCircle, Check, IdCard, Smartphone } from "lucide-react";

export default function FormularioAsistencia({ claseId, pase, dniInicial }) {
  const [dni, setDni] = useState(dniInicial || "");
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    setMensaje("");

    // El celular se identifica con su cookie, que el navegador manda solo
    const res = await fetch("/api/asistencias/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId, pase, dni }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setEstado(data.pedidoCambio ? "pedido" : "error");
      setMensaje(data.error || "No se pudo registrar la asistencia");
      return;
    }

    setNombre(data.nombre);
    setEstado("ok");
  }

  if (estado === "ok") {
    return (
      <div className="exito" role="status">
        <div className="exito-icono">
          <Check size={32} strokeWidth={2.6} />
        </div>
        <h2>¡Listo, {nombre}!</h2>
        <p>Tu asistencia quedó registrada. Ya podés cerrar esta página.</p>
      </div>
    );
  }

  if (estado === "pedido") {
    return (
      <div className="alerta info" role="status">
        <Smartphone size={18} />
        {mensaje}
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <label className="campo">
        <span>Tu DNI</span>
        <div className="campo-icono">
          <IdCard size={18} />
          <input
            placeholder="Ej: 40123456"
            inputMode="numeric"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            autoFocus={!dniInicial}
            required
          />
        </div>
      </label>
      {estado === "error" && (
        <div className="alerta error" role="alert">
          <AlertCircle size={18} />
          {mensaje}
        </div>
      )}
      <button className="btn grande bloque" disabled={estado === "enviando"} style={{ marginTop: 8 }}>
        {estado === "enviando" ? <span className="spinner" /> : null}
        {estado === "enviando" ? "Registrando…" : "Registrar asistencia"}
      </button>
    </form>
  );
}
