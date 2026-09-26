import { unstable_noStore as noStore } from "next/cache";
import { AlertTriangle, BookOpen, CheckCircle2, QrCode } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { obtenerSesion } from "@/lib/auth";
import { UMBRAL_REGULARIDAD, capitalizar } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function AlumnoPage() {
  noStore();
  const sesion = await obtenerSesion();

  const { data } = await supabaseAdmin
    .from("v_resumen_alumno")
    .select("*")
    .eq("alumno_id", sesion.id)
    .order("anio")
    .order("materia");
  const materias = data || [];

  const totalClases = materias.reduce((s, m) => s + Number(m.clases), 0);
  const totalPresentes = materias.reduce((s, m) => s + Number(m.presentes), 0);
  const enRiesgo = materias.filter((m) => m.clases && m.presentes / m.clases < UMBRAL_REGULARIDAD);
  const minimo = Math.round(UMBRAL_REGULARIDAD * 100);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mi asistencia</h1>
          <p>Necesitás al menos {minimo}% de asistencia en cada materia para mantener la regularidad.</p>
        </div>
        <a className="btn" href="/asistencia">
          <QrCode size={16} /> Registrar asistencia
        </a>
      </div>

      {materias.length === 0 ? (
        <div className="card">
          <div className="vacio">
            <div className="icono-caja">
              <BookOpen size={22} />
            </div>
            <h3>Todavía no tenés materias</h3>
            <p>Cuando te inscriban en una comisión, vas a ver acá tu asistencia.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="viz-tile">
              <div className="viz-tile-etiqueta">Asistencia general</div>
              <div className="viz-tile-valor">
                {totalClases ? `${Math.round((100 * totalPresentes) / totalClases)}%` : "—"}
              </div>
              <div className="viz-tile-detalle">
                {totalPresentes} de {totalClases} clases en {materias.length} materias
              </div>
            </div>
            <div className="viz-tile">
              <div className="viz-tile-etiqueta">Estado</div>
              <div className="viz-tile-valor" style={{ fontSize: 22, marginTop: 14 }}>
                {enRiesgo.length ? (
                  <span className="badge danger" style={{ height: 30, fontSize: 14 }}>
                    <AlertTriangle size={15} /> {enRiesgo.length} en riesgo
                  </span>
                ) : (
                  <span className="badge ok" style={{ height: 30, fontSize: 14 }}>
                    <CheckCircle2 size={15} /> Todo en regla
                  </span>
                )}
              </div>
              <div className="viz-tile-detalle">
                {enRiesgo.length
                  ? `Por debajo del ${minimo}% en ${enRiesgo.map((m) => m.materia).join(", ")}`
                  : `Estás por encima del ${minimo}% en todas tus materias`}
              </div>
            </div>
          </div>

          <div className="stack">
            {materias.map((m) => {
              const pct = m.clases ? m.presentes / m.clases : null;
              const riesgo = pct !== null && pct < UMBRAL_REGULARIDAD;
              return (
                <div className="card" key={m.comision_id} style={{ margin: 0 }}>
                  <div className="fila-lista" style={{ padding: 0, border: "none", alignItems: "flex-start" }}>
                    <div>
                      <div className="fila-titulo">{m.materia}</div>
                      <span className="fila-meta">
                        {m.anio}° {m.division} · {capitalizar(m.turno)} · {capitalizar(m.modalidad)} ·{" "}
                        {m.profesor || "Sin profesor asignado"}
                      </span>
                    </div>
                    {pct === null ? (
                      <span className="badge">Sin clases</span>
                    ) : riesgo ? (
                      <span className="badge danger">
                        <AlertTriangle size={13} /> En riesgo
                      </span>
                    ) : (
                      <span className="badge ok">
                        <CheckCircle2 size={13} /> Regular
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
                    <div className={`progreso ${riesgo ? "danger" : "ok"}`} style={{ flex: 1 }}>
                      <div style={{ width: `${(pct || 0) * 100}%` }} />
                    </div>
                    <strong style={{ fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "right" }}>
                      {pct === null ? "—" : `${Math.round(pct * 100)}%`}
                    </strong>
                  </div>
                  <p className="texto-suave" style={{ margin: "6px 0 0" }}>
                    Asististe a {m.presentes} de {m.clases} clases
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
