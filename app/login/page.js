import { LogIn } from "lucide-react";
import FormularioLogin from "@/components/FormularioLogin";

export default function LoginPage({ searchParams }) {
  return (
    <div className="centrado">
      <div className="centrado-head">
        <div className="icono-caja">
          <LogIn size={24} />
        </div>
        <h1>Ingresar</h1>
        <p>Usá tu DNI. La primera vez, tu contraseña es tu mismo DNI.</p>
      </div>
      <div className="card">
        <FormularioLogin siguiente={searchParams?.next} />
      </div>
    </div>
  );
}
