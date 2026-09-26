import { KeyRound } from "lucide-react";
import { obtenerSesion } from "@/lib/auth";
import { NOMBRE_ROL, iniciales } from "@/lib/constantes";
import CambiarPassword from "@/components/CambiarPassword";

export default async function CuentaPage() {
  const sesion = await obtenerSesion();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mi cuenta</h1>
          <p>Tus datos y la seguridad de tu acceso.</p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="avatar grande">{iniciales(sesion.nombre)}</span>
        <div>
          <h2 style={{ fontSize: 18 }}>{sesion.nombre}</h2>
          <div className="chips" style={{ marginTop: 8 }}>
            <span className="badge brand">{NOMBRE_ROL[sesion.rol]}</span>
            <span className="chip">DNI {sesion.dni}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="icono-caja neutro">
              <KeyRound size={18} />
            </div>
            <div>
              <h3>Cambiar contraseña</h3>
              <p>Usá al menos 6 caracteres. No la compartas con nadie.</p>
            </div>
          </div>
        </div>
        <CambiarPassword />
      </div>
    </div>
  );
}
