export function obtenerDispositivoId() {
  if (typeof window === "undefined") return null;
  try {
    const clave = "asistencia_dispositivo_id";
    let id = localStorage.getItem(clave);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(clave, id);
    }
    return id;
  } catch {
    return null;
  }
}