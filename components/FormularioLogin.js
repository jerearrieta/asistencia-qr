"use client";

import { useState } from "react";

export default function FormularioLogin({ siguiente }) {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEnviando(false);
      setError(data.error || `No se pudo iniciar sesión (error ${res.status})`);
      return;
    }
    // Solo seguimos a rutas internas, para evitar redirecciones a otros sitios
    const destino = siguiente?.startsWith("/") && !siguiente.startsWith("//")
      ? siguiente
      : data.destino;
    window.location.href = destino;
  }

  return (
    <form onSubmit={enviar}>
      <input
        placeholder="DNI"
        inputMode="numeric"
        autoComplete="username"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="btn" disabled={enviando}>
        {enviando ? "Ingresando..." : "Ingresar"}
      </button>
      {error && <p className="mensaje-error">{error}</p>}
    </form>
  );
}
