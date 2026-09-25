import { obtenerSesion } from "@/lib/auth";
import { capitalizar } from "@/lib/constantes";
import CambiarPassword from "@/components/CambiarPassword";

export default async function CuentaPage() {
  const sesion = await obtenerSesion();

  return (
    <div>
      <h1>Mi cuenta</h1>
      <div className="card">
        <p>
          <strong>{sesion.nombre}</strong>
          <br />
          DNI {sesion.dni} · {capitalizar(sesion.rol)}
        </p>
      </div>
      <div className="card">
        <h3>Cambiar contraseña</h3>
        <CambiarPassword />
      </div>
    </div>
  );
}
