"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { llamarApi } from "./api";
import { describirComision } from "@/lib/constantes";

export default function AdminPadron({ carreras, comisiones }) {
  const router = useRouter();
  const [carreraId, setCarreraId] = useState("");
  const [comisionId, setComisionId] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);

  const opciones = comisiones.filter((c) => c.carrera_id === carreraId);

  const cargar = useCallback(async () => {
    if (!comisionId) {
      setAlumnos([]);
      return;
    }
    const { ok, data } = await llamarApi(`/api/admin/inscripciones?comisionId=${comisionId}`);
    if (ok) setAlumnos(data.alumnos);
  }, [comisionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function importar(e) {
    e.preventDefault();
    setResultado(null);
    const { ok, data } = await llamarApi("/api/admin/inscripciones", "POST", { comisionId, texto });
    if (!ok) {
      setResultado({ errores: [data.error || "Ocurrió un error"] });
      return;
    }
    setResultado(data);
    if (!data.errores.length) setTexto("");
    cargar();
    router.refresh();
  }

  async function quitar(alumno) {
    if (!window.confirm(`¿Quitar a ${alumno.nombre} del padrón de esta comisión?`)) return;
    await llamarApi("/api/admin/inscripciones", "DELETE", { comisionId, alumnoId: alumno.id });
    cargar();
    router.refresh();
  }

  return (
    <div>
      <div className="card">
        <h3>Padrón de una comisión</h3>
        <p className="texto-suave">
          El padrón es la lista de alumnos inscriptos. Con él la app sabe quién
          faltó, y solo esos DNIs pueden registrar asistencia en la comisión.
        </p>
        <div className="grilla-form">
          <label>
            Carrera
            <select
              value={carreraId}
              onChange={(e) => {
                setCarreraId(e.target.value);
                setComisionId("");
                setResultado(null);
              }}
            >
              <option value="">Elegí…</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: "span 2" }}>
            Comisión
            <select
              value={comisionId}
              onChange={(e) => {
                setComisionId(e.target.value);
                setResultado(null);
              }}
              disabled={!carreraId}
            >
              <option value="">Elegí…</option>
              {opciones.map((c) => (
                <option key={c.comision_id} value={c.comision_id}>
                  {describirComision(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {comisionId && (
        <>
          <div className="card">
            <h3>Importar alumnos</h3>
            <p className="texto-suave">
              Pegá una línea por alumno con <code>DNI;Nombre y apellido</code>{" "}
              (sirve copiar dos columnas de Excel). Si el alumno ya existe alcanza
              con el DNI. Los nuevos se crean con contraseña = DNI.
            </p>
            <form onSubmit={importar}>
              <textarea
                rows={6}
                placeholder={"40123456;Juan Pérez\n40123457;María Gómez"}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
              />
              <button className="btn">Importar al padrón</button>
            </form>
            {resultado && (
              <div style={{ marginTop: 10 }}>
                {resultado.inscriptos !== undefined && (
                  <p className="mensaje-ok">
                    {resultado.inscriptos} alumnos en el padrón ({resultado.creados} nuevos).
                  </p>
                )}
                {resultado.errores?.map((e) => (
                  <p key={e} className="mensaje-error" style={{ margin: "4px 0" }}>
                    {e}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Inscriptos ({alumnos.length})</h3>
            {alumnos.map((a) => (
              <div key={a.id} className="fila-lista">
                <span>
                  {a.nombre} <span className="texto-suave">· DNI {a.dni}</span>
                </span>
                <button className="btn secondary chico" onClick={() => quitar(a)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
