"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { Check, Copy, Download, Lock, RotateCcw, Search, UserCheck, UserPlus, UserX } from "lucide-react";
import { ZONA_HORARIA, capitalizar, iniciales } from "@/lib/constantes";

function formatoTiempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ClaseEnVivo({ clase: claseInicial, comision, duracionSeg }) {
  const [clase, setClase] = useState(claseInicial);
  const [padron, setPadron] = useState([]);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [marcando, setMarcando] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const cierreDisparado = useRef(false);

  const urlQr = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/asistencia/${clase.id}/${clase.token}`;
  }, [clase.id, clase.token]);

  // Un solo efecto que, en cada tick, calcula el tiempo restante DIRECTO
  // desde clase.token_expira_en (nunca desde el segundosRestantes viejo).
  // Esto evita la condición de carrera de tener dos efectos separados:
  // si dependiéramos del estado anterior, justo después de reabrir la
  // clase el contador podía seguir en 0 por una fracción de segundo y
  // disparar un auto-cierre inmediato.
  useEffect(() => {
    let cancelado = false;

    const tick = () => {
      const restante = Math.max(
        0,
        Math.floor(
          (new Date(clase.token_expira_en).getTime() - Date.now()) / 1000
        )
      );
      setSegundosRestantes(restante);

      if (
        restante === 0 &&
        clase.estado === "abierta" &&
        !cierreDisparado.current
      ) {
        cierreDisparado.current = true;
        fetch("/api/clases/cerrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claseId: clase.id }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!cancelado && data?.clase) setClase(data.clase);
          })
          .catch(() => {});
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [clase.token_expira_en, clase.estado, clase.id]);

  const cargarPadron = useCallback(async () => {
    const res = await fetch(`/api/clases/${clase.id}/asistencias`);
    if (res.ok) {
      const data = await res.json();
      setPadron(data.padron || []);
    }
  }, [clase.id]);

  useEffect(() => {
    cargarPadron();
    const id = setInterval(cargarPadron, 4000);
    return () => clearInterval(id);
  }, [cargarPadron]);

  async function cerrarClase() {
    setCargando(true);
    const res = await fetch("/api/clases/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: clase.id }),
    });
    const data = await res.json();
    setCargando(false);
    if (res.ok) setClase(data.clase);
  }

  async function reabrirClase() {
    setCargando(true);
    cierreDisparado.current = false;
    const res = await fetch("/api/clases/reabrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: clase.id }),
    });
    const data = await res.json();
    setCargando(false);
    if (res.ok) setClase(data.clase);
  }

  async function marcarManual(alumno, presente) {
    setMarcando(alumno.alumno_id);
    await fetch(`/api/clases/${clase.id}/manual`, {
      method: presente ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnoId: alumno.alumno_id }),
    });
    await cargarPadron();
    setMarcando(null);
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(clase.token);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {}
  }

  const estaAbierta = claseEstaAbierta(clase) && segundosRestantes > 0;
  const presentes = padron
    .filter((a) => a.presente)
    .sort((a, b) => new Date(a.registrado_en) - new Date(b.registrado_en));
  const ausentes = padron.filter((a) => !a.presente);

  const texto = busqueda.trim().toLowerCase();
  const lista = [...presentes, ...ausentes].filter(
    (a) => !texto || a.alumno.toLowerCase().includes(texto) || a.dni.includes(texto)
  );
  const porcentaje = padron.length ? presentes.length / padron.length : 0;
  const progresoTiempo = duracionSeg ? Math.min(1, segundosRestantes / duracionSeg) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">{comision.carrera}</div>
          <h1>{comision.materia}</h1>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className="chip">
              {comision.anio}° {comision.division}
            </span>
            <span className="chip">{capitalizar(comision.turno)}</span>
            <span className="chip">{capitalizar(comision.modalidad)}</span>
            <span className="chip">
              {new Date(clase.fecha).toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: ZONA_HORARIA,
              })}
            </span>
            <span className="chip">{comision.profesor || "Sin profesor asignado"}</span>
          </div>
        </div>
      </div>

      <div className="clase-grid">
        <div className="card qr-panel">
          {estaAbierta ? (
            <>
              <div className="estado-clase abierta">
                <span className="punto-vivo" /> Toma de asistencia abierta
              </div>
              <div>
                <div className="qr-wrap">
                  <QRCode value={urlQr} size={240} />
                </div>
              </div>
              <p className="texto-suave" style={{ marginBottom: 8 }}>
                Sin cámara, entran a <strong>/asistencia</strong> con el código:
              </p>
              <div className="codigo-caja">
                <span className="token-grande">{clase.token}</span>
                <button
                  className="btn ghost icono"
                  onClick={copiarCodigo}
                  title="Copiar código"
                  aria-label="Copiar código"
                >
                  {copiado ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="cuenta-regresiva">
                <div className="fila">
                  <span>Se cierra sola en</span>
                  <strong>{formatoTiempo(segundosRestantes)}</strong>
                </div>
                <div className={`progreso ${progresoTiempo < 0.2 ? "danger" : ""}`}>
                  <div style={{ width: `${progresoTiempo * 100}%`, transition: "width 1s linear" }} />
                </div>
              </div>
              <button
                className="btn secondary bloque"
                style={{ marginTop: 20 }}
                onClick={cerrarClase}
                disabled={cargando}
              >
                <Lock size={16} /> Cerrar toma de asistencia
              </button>
            </>
          ) : (
            <div className="vacio" style={{ padding: "16px 0" }}>
              <div className="icono-caja">
                <Lock size={22} />
              </div>
              <h3>Toma de asistencia cerrada</h3>
              <p>
                El código <strong>{clase.token}</strong> ya no es válido. Si
                alguien llegó tarde, podés reabrirla o marcarlo a mano.
              </p>
              <button className="btn" style={{ marginTop: 16 }} onClick={reabrirClase} disabled={cargando}>
                <RotateCcw size={16} /> Reabrir clase
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="resumen-presentes">
                <strong>{presentes.length}</strong>
                <span className="texto-suave">de {padron.length} presentes</span>
              </div>
            </div>
            <a
              className="btn secondary chico"
              href={`/api/clases/${clase.id}/asistencias?formato=csv`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={14} /> Exportar CSV
            </a>
          </div>
          <div className="progreso ok" style={{ marginBottom: 20 }}>
            <div style={{ width: `${porcentaje * 100}%` }} />
          </div>

          {padron.length === 0 ? (
            <div className="vacio">
              <div className="icono-caja">
                <UserPlus size={22} />
              </div>
              <h3>Esta comisión no tiene padrón</h3>
              <p>El director puede cargar los alumnos desde Administración → Padrón.</p>
            </div>
          ) : (
            <>
              <div className="campo-icono">
                <Search size={17} />
                <input
                  placeholder="Buscar alumno por nombre o DNI"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="lista-filas">
                {lista.map((a) => (
                  <div key={a.alumno_id} className="fila-lista">
                    <div className="celda-persona" style={{ flex: "1 1 200px" }}>
                      <span className="avatar" style={a.presente ? undefined : { background: "var(--surface-hover)", color: "var(--text-3)" }}>
                        {iniciales(a.alumno)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="fila-titulo">{a.alumno}</div>
                        <span className="fila-meta">
                          DNI {a.dni}
                          {a.presente &&
                            ` · ${a.metodo === "qr" ? "QR" : a.metodo === "codigo" ? "Código" : "Manual"} · ${new Date(
                              a.registrado_en
                            ).toLocaleTimeString("es-AR", {
                              timeZone: ZONA_HORARIA,
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </span>
                      </div>
                    </div>
                    <div className="acciones">
                      {a.presente ? (
                        <span className="badge ok">
                          <UserCheck size={13} /> Presente
                        </span>
                      ) : (
                        <span className="badge danger">
                          <UserX size={13} /> Ausente
                        </span>
                      )}
                      <button
                        className={`btn chico ${a.presente ? "ghost" : "secondary"}`}
                        disabled={marcando === a.alumno_id}
                        onClick={() => marcarManual(a, !a.presente)}
                        style={{ minWidth: 92 }}
                      >
                        {marcando === a.alumno_id ? (
                          <span className="spinner" />
                        ) : a.presente ? (
                          "Quitar"
                        ) : (
                          "Marcar"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {lista.length === 0 && (
                  <p className="texto-suave" style={{ padding: "12px 24px" }}>
                    Nadie coincide con “{busqueda}”.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
