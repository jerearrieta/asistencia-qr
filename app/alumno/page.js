import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { obtenerSesion } from "@/lib/auth";
import { UMBRAL_REGULARIDAD, describirComision } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function AlumnoPage() {
  noStore();
  const sesion = await obtenerSesion();

  const { data: materias } = await supabaseAdmin
    .from("v_resumen_alumno")
    .select("*")
    .eq("alumno_id", sesion.id)
    .order("anio")
    .order("materia");

  return (
    <div>
      <h1>Mi asistencia</h1>
      <p className="texto-suave">
        Para mantener la regularidad necesitás al menos{" "}
        {Math.round(UMBRAL_REGULARIDAD * 100)}% de asistencia en cada materia.
      </p>

      {(materias || []).length === 0 && (
        <div className="card">
          <p>Todavía no figurás inscripto en ninguna materia.</p>
        </div>
      )}

      {(materias || []).map((m) => {
        const pct = m.clases ? m.presentes / m.clases : null;
        const enRiesgo = pct !== null && pct < UMBRAL_REGULARIDAD;
        return (
          <div className="card" key={m.comision_id}>
            <div className="fila-lista" style={{ borderBottom: "none", padding: 0 }}>
              <div>
                <strong>{describirComision(m)}</strong>
                <br />
                <span className="texto-suave">
                  {m.carrera} · {m.profesor || "Sin profesor asignado"}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: enRiesgo ? "#dc2626" : "#16a34a",
                  }}
                >
                  {pct === null ? "—" : `${Math.round(pct * 100)}%`}
                </div>
                <span className="texto-suave">
                  {m.presentes} de {m.clases} clases
                </span>
              </div>
            </div>
            {enRiesgo && (
              <p className="mensaje-error" style={{ marginBottom: 0 }}>
                Estás por debajo del mínimo de asistencia.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
