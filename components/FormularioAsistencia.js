"use client";

import { useState } from "react";
import { AlertCircle, Check, IdCard } from "lucide-react";
import { obtenerDispositivoId } from "@/lib/dispositivo";

export default function FormularioAsistencia({
  claseId,
  tokenInicial,
  pedirCodigo,
  dniInicial,
}) {
  const [dni, setDni] = useState(dniInicial || "");
  const [codigo, setCodigo] = useState(tokenInicial || "");
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    setMensaje("");

    const res = await fetch("/api/asistencias/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claseId: claseId || undefined,
        token: codigo.trim().toUpperCase(),
        dni,
        metodo: pedirCodigo ? "codigo" : "qr",
        dispositivoId: obtenerDispositivoId(),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setEstado("error");
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

  return (
    <form onSubmit={enviar}>
      {pedirCodigo && (
        <label className="campo">
          <span>Código de la clase</span>
          <input
            className="input-codigo"
            placeholder="ABC123"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            required
          />
        </label>
      )}
      <label className="campo">
        <span>Tu DNI</span>
        <div className="campo-icono">
          <IdCard size={18} />
          <input
            placeholder="Ej: 40123456"
            inputMode="numeric"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            autoFocus={!pedirCodigo}
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
