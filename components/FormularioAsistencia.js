"use client";

import { useState } from "react";

export default function FormularioAsistencia({
  claseId,
  tokenInicial,
  pedirCodigo,
}) {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState(tokenInicial || "");
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error
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
        nombre,
        metodo: pedirCodigo ? "codigo" : "qr",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setEstado("error");
      setMensaje(data.error || "No se pudo registrar la asistencia");
      return;
    }

    setEstado("ok");
    setMensaje("¡Asistencia registrada correctamente!");
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
        placeholder="DNI o legajo"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        required
      />
      <input
        placeholder="Nombre y apellido"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <button className="btn" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando..." : "Registrar asistencia"}
      </button>
      {estado === "error" && <p className="mensaje-error">{mensaje}</p>}
    </form>
  );
}
