"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { claseEstaAbierta } from "@/lib/estadoClase";
import { Download, Lock, RotateCcw, Search, Smartphone, UserCheck, UserPlus, UserX } from "lucide-react";
import { ZONA_HORARIA, capitalizar, iniciales } from "@/lib/constantes";

function formatoTiempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ClaseEnVivo({ clase: claseInicial, comision, duracionSeg }) {
  const [clase, setClase] = useState(claseInicial);
  const [padron, setPadron] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [resolviendo, setResolviendo] = useState(null);
  const [errorPedido, setErrorPedido] = useState("");
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [marcando, setMarcando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState(null);
  const [segundosParaCambio, setSegundosParaCambio] = useState(null);
  const cierreDisparado = useRef(false);
  const cambioEn = useRef(null);

  const urlQr = useMemo(() => {
    if (typeof window === "undefined" || !codigo) return "";
    return `${window.location.origin}/asistencia/${clase.id}/${codigo}`;
  }, [clase.id, codigo]);

  // El código rota: el servidor dice cuál mostrar y cuánto falta para el
  // próximo, y se vuelve a pedir justo después de cada cambio.
  const claseAbierta = claseEstaAbierta(clase);
  useEffect(() => {
    if (!claseAbierta) {
      setCodigo(null);
      return;
    }
    let cancelado = false;
    let espera;

    const pedir = async () => {
      let proximo = 5000;
      try {
        const res = await fetch(`/api/clases/${clase.id}/codigo`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (cancelado) return;
          setCodigo(data.codigo);
          if (data.msParaCambio != null) {
            cambioEn.current = Date.now() + data.msParaCambio;
            proximo = data.msParaCambio + 250;
          } else {
            cambioEn.current = null;
            proximo = null;
          }
        }
      } catch {}
      if (!cancelado && proximo != null) espera = setTimeout(pedir, proximo);
    };

    pedir();
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [clase.id, claseAbierta, clase.token_expira_en]);

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
      setSegundosParaCambio(
        cambioEn.current
          ? Math.max(0, Math.ceil((cambioEn.current - Date.now()) / 1000))
          : null
      );

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
      setPedidos(data.pedidos || []);
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

  // Un alumno escaneó desde un celular distinto al vinculado: el profesor
  // pasa su DNI al celular nuevo (y queda presente) o descarta el pedido.
  async function resolverPedido(pedido, accion) {
    setResolviendo(pedido.alumno_id);
    setErrorPedido("");
    const res = await fetch(`/api/clases/${clase.id}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnoId: pedido.alumno_id, accion }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorPedido(data.error || "No se pudo resolver el pedido");
    }
    await cargarPadron();
    setResolviendo(null);
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
                  {urlQr ? (
                    <QRCode value={urlQr} size={240} />
                  ) : (
                    <div style={{ width: 240, height: 240, display: "grid", placeItems: "center" }}>
                      <span className="spinner" />
                    </div>
                  )}
                </div>
              </div>
              {segundosParaCambio != null && (
                <p className="texto-suave" style={{ marginTop: 8 }}>
                  El QR cambia en {segundosParaCambio}s: una foto reenviada deja de servir.
                </p>
              )}
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
                El QR ya no es válido. Si alguien llegó tarde, podés
                reabrirla o marcarlo a mano.
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

          {pedidos.length > 0 && (
            <div className="alerta info" style={{ display: "block", marginBottom: 20 }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Smartphone size={16} /> Cambio de celular
              </strong>
              <p style={{ margin: "4px 0 10px" }}>
                Escanearon con un celular distinto al vinculado. Fijate que el alumno esté en el aula antes de cambiarlo.
              </p>
              {errorPedido && <p style={{ margin: "0 0 10px", fontWeight: 600 }}>{errorPedido}</p>}
              {pedidos.map((p) => (
                <div key={p.alumno_id} className="fila-lista" style={{ padding: "8px 0" }}>
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div className="fila-titulo">{p.alumno}</div>
                    <span className="fila-meta">DNI {p.dni}</span>
                  </div>
                  <div className="acciones">
                    <button
                      className="btn chico"
                      disabled={resolviendo === p.alumno_id}
                      onClick={() => resolverPedido(p, "liberar")}
                    >
                      Liberar y dar presente
                    </button>
                    <button
                      className="btn chico ghost"
                      disabled={resolviendo === p.alumno_id}
                      onClick={() => resolverPedido(p, "descartar")}
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                      {a.celular_nuevo && (
                        <span className="badge warn" title="Vinculó su celular en esta clase">
                          <Smartphone size={13} /> Celular nuevo
                        </span>
                      )}
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
