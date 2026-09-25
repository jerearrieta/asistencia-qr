import FormularioLogin from "@/components/FormularioLogin";

export default function LoginPage({ searchParams }) {
  return (
    <div>
      <h1>Ingresar</h1>
      <div className="card">
        <p>
          Ingresá con tu DNI. Si es la primera vez, tu contraseña es tu mismo
          DNI (después podés cambiarla desde tu cuenta).
        </p>
        <FormularioLogin siguiente={searchParams?.next} />
      </div>
    </div>
  );
}
