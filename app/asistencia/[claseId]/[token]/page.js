import FormularioAsistencia from "@/components/FormularioAsistencia";

export default function AsistenciaQrPage({ params }) {
  return (
    <div>
      <h1>Registrar asistencia</h1>
      <div className="card">
        <p>Completá tus datos para confirmar tu presencia en la clase.</p>
        <FormularioAsistencia
          claseId={params.claseId}
          tokenInicial={params.token}
        />
      </div>
    </div>
  );
}
