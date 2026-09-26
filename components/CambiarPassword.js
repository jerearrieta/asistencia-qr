"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function CambiarPassword() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva }),
    });
    const data = await res.json().catch(() => ({}));
    setEnviando(false);
    if (!res.ok) {
      setMensaje({ ok: false, texto: data.error || "No se pudo cambiar" });
      return;
    }
    setActual("");
    setNueva("");
    setMensaje({ ok: true, texto: "Contraseña actualizada" });
  }

  return (
    <form onSubmit={enviar} style={{ maxWidth: 420 }}>
      <label className="campo">
        <span>Contraseña actual</span>
        <input
          type="password"
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          required
        />
      </label>
      <label className="campo">
        <span>Nueva contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
        />
      </label>
      {mensaje && (
        <div className={`alerta ${mensaje.ok ? "ok" : "error"}`} role="status">
          {mensaje.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {mensaje.texto}
        </div>
      )}
      <button className="btn" disabled={enviando}>
        {enviando && <span className="spinner" />}
        Guardar contraseña
      </button>
    </form>
  );
}
