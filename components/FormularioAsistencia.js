"use client";

import { useState } from "react";
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
    const data = await res.json();

    if (!res.ok) {
      setEstado("error");
      setMensaje(data.error || "No se pudo registrar la asistencia");
      return;
    }

    setEstado("ok");
    setMensaje(`¡Listo, ${data.nombre}! Tu asistencia quedó registrada.`);
  }

  if (estado === "ok") {
    return <p className="mensaje-ok">{mensaje}</p>;
  }

  return (
    <form onSubmit={enviar}>
      {pedirCodigo && (
        <input
          placeholder="Código dictado por el profesor"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          style={{ textTransform: "uppercase" }}
          required
        />
      )}
      <input
        placeholder="DNI"
        inputMode="numeric"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        required
      />
      <button className="btn" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando..." : "Registrar asistencia"}
      </button>
      {estado === "error" && <p className="mensaje-error">{mensaje}</p>}
    </form>
  );
}