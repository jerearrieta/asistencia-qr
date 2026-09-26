"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, IdCard, Lock } from "lucide-react";

export default function FormularioLogin({ siguiente }) {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
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
      <label className="campo">
        <span>DNI</span>
        <div className="campo-icono">
          <IdCard size={18} />
          <input
            placeholder="Ej: 40123456"
            inputMode="numeric"
            autoComplete="username"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            autoFocus
            required
          />
        </div>
      </label>
      <label className="campo">
        <span>Contraseña</span>
        <div className="campo-icono">
          <Lock size={18} />
          <input
            type={verPassword ? "text" : "password"}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="btn ghost icono"
            onClick={() => setVerPassword(!verPassword)}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>
      {error && (
        <div className="alerta error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      <button className="btn grande bloque" disabled={enviando} style={{ marginTop: 8 }}>
        {enviando ? <span className="spinner" /> : null}
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
