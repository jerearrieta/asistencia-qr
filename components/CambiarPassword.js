"use client";

import { useState } from "react";

export default function CambiarPassword() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [mensaje, setMensaje] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setMensaje(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMensaje({ ok: false, texto: data.error || "No se pudo cambiar" });
      return;
    }
    setActual("");
    setNueva("");
    setMensaje({ ok: true, texto: "Contraseña actualizada" });
  }

  return (
    <form onSubmit={enviar}>
      <input
        type="password"
        placeholder="Contraseña actual"
        autoComplete="current-password"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Nueva contraseña (mínimo 6 caracteres)"
        autoComplete="new-password"
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        required
      />
      <button className="btn">Guardar</button>
      {mensaje && (
        <p className={mensaje.ok ? "mensaje-ok" : "mensaje-error"}>{mensaje.texto}</p>
      )}
    </form>
  );
}
