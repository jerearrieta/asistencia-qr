import FormularioAsistencia from "@/components/FormularioAsistencia";

export default function AsistenciaManualPage() {
  return (
    <div>
      <h1>Registrar asistencia</h1>
      <div className="card">
        <p>Ingresá el código que dictó o escribió el profesor.</p>
        <FormularioAsistencia pedirCodigo />
      </div>
    </div>
  );
}
