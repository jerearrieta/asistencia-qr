"use client";

import { useMemo, useState } from "react";
import { TURNOS, UMBRAL_REGULARIDAD, capitalizar, iniciales } from "@/lib/constantes";
import { filtrarComisiones, filtrosVacios } from "@/lib/filtros";
import { AlertTriangle, BookOpenCheck, Download, Percent, SlidersHorizontal, Users, X } from "lucide-react";
import SelectorFiltro from "@/components/SelectorFiltro";
import {
  BarraApilada,
  BarrasHorizontales,
  Indicador,
  LineaSemanal,
  formatoNum,
  formatoPct,
} from "./Graficos";

const pct = (presentes, esperados) => (esperados ? presentes / esperados : null);

// Suma presentes/esperados agrupando comisiones por una clave
function agrupar(comisiones, clave) {
  const grupos = new Map();
  for (const c of comisiones) {
    const k = clave(c);
    const g = grupos.get(k) || { clave: k, presentes: 0, esperados: 0 };
    g.presentes += Number(c.presentes);
    g.esperados += Number(c.esperados);
    grupos.set(k, g);
  }
  return [...grupos.values()];
}

function filasPorcentaje(grupos, etiqueta = (g) => g.clave) {
  return grupos
    .filter((g) => g.esperados > 0)
    .map((g) => {
      const valor = pct(g.presentes, g.esperados);
      return {
        clave: g.clave,
        etiqueta: etiqueta(g),
        valor,
        texto: formatoPct(valor),
        tooltip: (
          <>
            <strong>{etiqueta(g)}</strong>
            <br />
            Asistencia {formatoPct(valor)}
            <br />
            {formatoNum(g.presentes)} presentes de {formatoNum(g.esperados)}
          </>
        ),
      };
    });
}

export default function Tablero({ comisiones, alumnos, semanal, esDirector }) {
  // El profesor ya ve solo sus comisiones: no necesita filtrar por profesor
  const clavesFiltro = esDirector
    ? ["carrera", "materia", "profesor", "anio", "turno", "modalidad"]
    : ["carrera", "materia", "anio", "turno", "modalidad"];
  const vacios = filtrosVacios(clavesFiltro);
  const [filtros, setFiltros] = useState(vacios);
  const [verTodosRiesgo, setVerTodosRiesgo] = useState(false);
  const [verTodasComisiones, setVerTodasComisiones] = useState(false);

  // Comisiones que pasan los filtros; todo lo demás se deriva de ellas
  const filtradas = useMemo(
    () => filtrarComisiones(comisiones, filtros),
    [comisiones, filtros]
  );

  const datos = useMemo(() => {
    const ids = new Set(filtradas.map((c) => c.comision_id));
    const alumnosF = alumnos.filter((a) => ids.has(a.comision_id));

    const presentes = filtradas.reduce((s, c) => s + Number(c.presentes), 0);
    const esperados = filtradas.reduce((s, c) => s + Number(c.esperados), 0);
    const clases = filtradas.reduce((s, c) => s + Number(c.clases), 0);

    // Inscriptos únicos por carrera (un alumno cursa varias materias)
    const porCarrera = new Map();
    for (const a of alumnosF) {
      if (!porCarrera.has(a.carrera)) porCarrera.set(a.carrera, new Set());
      porCarrera.get(a.carrera).add(a.alumno_id);
    }
    const inscriptosTotal = new Set(alumnosF.map((a) => a.alumno_id)).size;

    // Alumnos por debajo del mínimo en al menos una materia
    const enRiesgo = alumnosF
      .filter((a) => a.clases > 0 && a.presentes / a.clases < UMBRAL_REGULARIDAD)
      .map((a) => ({ ...a, porcentaje: a.presentes / a.clases }))
      .sort((a, b) => a.porcentaje - b.porcentaje || a.alumno.localeCompare(b.alumno, "es"));
    const alumnosEnRiesgo = new Set(enRiesgo.map((a) => a.alumno_id)).size;

    // Evolución semanal
    const semanas = new Map();
    for (const s of semanal) {
      if (!ids.has(s.comision_id)) continue;
      const g = semanas.get(s.semana) || { semana: s.semana, presentes: 0, esperados: 0 };
      g.presentes += Number(s.presentes);
      g.esperados += Number(s.esperados);
      semanas.set(s.semana, g);
    }
    const evolucion = [...semanas.values()]
      .filter((g) => g.esperados > 0)
      .sort((a, b) => a.semana.localeCompare(b.semana))
      .map((g) => ({ ...g, valor: g.presentes / g.esperados }));

    const ranking = filtradas
      .filter((c) => Number(c.esperados) > 0)
      .map((c) => ({ ...c, porcentaje: pct(Number(c.presentes), Number(c.esperados)) }))
      .sort((a, b) => a.porcentaje - b.porcentaje);

    return {
      presentes,
      esperados,
      clases,
      inscriptosTotal,
      alumnosEnRiesgo,
      enRiesgo,
      evolucion,
      ranking,
      inscriptosPorCarrera: [...porCarrera.entries()]
        .map(([carrera, set]) => ({
          clave: carrera,
          etiqueta: carrera,
          valor: set.size,
          texto: formatoNum(set.size),
          tooltip: (
            <>
              <strong>{carrera}</strong>
              <br />
              {formatoNum(set.size)} alumnos inscriptos
            </>
          ),
        }))
        .sort((a, b) => b.valor - a.valor),
      porCarrera: filasPorcentaje(agrupar(filtradas, (c) => c.carrera)).sort(
        (a, b) => b.valor - a.valor
      ),
      porTurno: filasPorcentaje(
        agrupar(filtradas, (c) => c.turno).sort(
          (a, b) => TURNOS.indexOf(a.clave) - TURNOS.indexOf(b.clave)
        ),
        (g) => capitalizar(g.clave)
      ),
      porModalidad: filasPorcentaje(agrupar(filtradas, (c) => c.modalidad), (g) =>
        capitalizar(g.clave)
      ),
      porAnio: filasPorcentaje(
        agrupar(filtradas, (c) => c.anio).sort((a, b) => a.clave - b.clave),
        (g) => `${g.clave}° año`
      ),
      metodos: [
        ["QR", "presentes_qr", "var(--series-1)"],
        ["Código", "presentes_codigo", "var(--series-2)"],
        ["Manual (profesor)", "presentes_manual", "var(--series-3)"],
      ].map(([etiqueta, campo, color]) => ({
        etiqueta,
        color,
        valor: filtradas.reduce((s, c) => s + Number(c[campo]), 0),
      })),
    };
  }, [filtradas, alumnos, semanal]);

  const hayFiltros = Object.values(filtros).some(Boolean);
  const consultaExport = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v)
  ).toString();

  if (!comisiones.length) {
    return (
      <div className="card">
        <p>Todavía no hay comisiones para mostrar.</p>
      </div>
    );
  }

  const riesgoVisible = verTodosRiesgo ? datos.enRiesgo : datos.enRiesgo.slice(0, 15);

  return (
    <div className="viz">
      <div className="card">
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={16} />
            <h3>Filtros</h3>
            {hayFiltros && (
              <span className="badge brand">
                {Object.values(filtros).filter(Boolean).length} activos
              </span>
            )}
          </div>
          {hayFiltros && (
            <button className="btn ghost chico" onClick={() => setFiltros(vacios)}>
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
        <div className="viz-filtros">
        {clavesFiltro.map((clave) => (
          <SelectorFiltro
            key={clave}
            clave={clave}
            comisiones={comisiones}
            filtros={filtros}
            setFiltros={setFiltros}
          />
        ))}
        </div>
      </div>

      <div className="viz-tiles">
        <Indicador
          etiqueta="Asistencia promedio"
          valor={formatoPct(pct(datos.presentes, datos.esperados))}
          detalle={`${formatoNum(datos.presentes)} presentes de ${formatoNum(datos.esperados)}`}
          icono={Percent}
        />
        <Indicador
          etiqueta="Alumnos inscriptos"
          valor={formatoNum(datos.inscriptosTotal)}
          detalle={`en ${formatoNum(filtradas.length)} comisiones`}
          icono={Users}
        />
        <Indicador
          etiqueta="Clases dictadas"
          valor={formatoNum(datos.clases)}
          detalle="con toma de asistencia"
          icono={BookOpenCheck}
        />
        <Indicador
          etiqueta="Alumnos en riesgo"
          valor={formatoNum(datos.alumnosEnRiesgo)}
          detalle={`bajo ${formatoPct(UMBRAL_REGULARIDAD)} en alguna materia`}
          alerta={datos.alumnosEnRiesgo > 0}
          icono={AlertTriangle}
          tono="danger"
        />
      </div>

      <div className="viz-grilla-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Inscriptos por carrera</h3>
              <p>Alumnos únicos en las comisiones filtradas</p>
            </div>
          </div>
          <BarrasHorizontales filas={datos.inscriptosPorCarrera} />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Asistencia por carrera</h3>
              <p>Porcentaje de presentes sobre lo esperado</p>
            </div>
          </div>
          <BarrasHorizontales
            filas={datos.porCarrera}
            max={1}
            referencia={UMBRAL_REGULARIDAD}
            etiquetaReferencia={`mín. ${formatoPct(UMBRAL_REGULARIDAD)}`}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
            <div>
              <h3>Evolución semanal</h3>
              <p>Porcentaje de asistencia de cada semana del cuatrimestre</p>
            </div>
          </div>
        <LineaSemanal puntos={datos.evolucion} referencia={UMBRAL_REGULARIDAD} />
      </div>

      <div className="viz-grilla-3">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Por turno</h3>
              <p>% de asistencia</p>
            </div>
          </div>
          <BarrasHorizontales filas={datos.porTurno} max={1} referencia={UMBRAL_REGULARIDAD} />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Por modalidad</h3>
              <p>% de asistencia</p>
            </div>
          </div>
          <BarrasHorizontales filas={datos.porModalidad} max={1} referencia={UMBRAL_REGULARIDAD} />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Por año de cursado</h3>
              <p>% de asistencia</p>
            </div>
          </div>
          <BarrasHorizontales filas={datos.porAnio} max={1} referencia={UMBRAL_REGULARIDAD} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
            <div>
              <h3>Cómo registran la asistencia</h3>
              <p>Proporción de registros por método</p>
            </div>
          </div>
        <BarraApilada segmentos={datos.metodos} />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>
              Alumnos en riesgo{" "}
              <span className="badge danger" style={{ marginLeft: 4 }}>
                {formatoNum(datos.enRiesgo.length)}
              </span>
            </h3>
            <p>
              Menos del {formatoPct(UMBRAL_REGULARIDAD)} de asistencia en una materia, de menor a mayor
            </p>
          </div>
          <a className="btn secondary chico" href={`/api/tablero/exportar?tipo=alumnos&${consultaExport}`}>
            <Download size={14} /> CSV por alumno
          </a>
        </div>
        {datos.enRiesgo.length === 0 ? (
          <div className="vacio">
            <h3>Nadie está por debajo del mínimo</h3>
            <p>Todos los alumnos de las comisiones filtradas mantienen la regularidad.</p>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Carrera</th>
                  <th>Materia</th>
                  <th className="num">Asistió</th>
                  <th className="num">%</th>
                </tr>
              </thead>
              <tbody>
                {riesgoVisible.map((a) => (
                  <tr key={`${a.alumno_id}-${a.comision_id}`}>
                    <td>
                      <div className="celda-persona">
                        <span className="avatar">{iniciales(a.alumno)}</span>
                        {a.alumno}
                      </div>
                    </td>
                    <td>{a.dni}</td>
                    <td>{a.carrera}</td>
                    <td>
                      {a.materia} <span className="texto-suave">{a.anio}° {a.division}</span>
                    </td>
                    <td className="num">
                      {a.presentes}/{a.clases}
                    </td>
                    <td className="num">
                      <span className="badge danger">{formatoPct(a.porcentaje)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {datos.enRiesgo.length > 15 && (
          <button className="btn secondary bloque" style={{ marginTop: 16 }} onClick={() => setVerTodosRiesgo(!verTodosRiesgo)}>
            {verTodosRiesgo ? "Ver menos" : `Ver los ${formatoNum(datos.enRiesgo.length)}`}
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Comisiones</h3>
            <p>Ordenadas de menor a mayor asistencia</p>
          </div>
          <a className="btn secondary chico" href={`/api/tablero/exportar?tipo=detalle&${consultaExport}`}>
            <Download size={14} /> CSV detallado
          </a>
        </div>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Materia</th>
                <th>Año / Div.</th>
                <th>Turno</th>
                <th>Modalidad</th>
                {esDirector && <th>Profesor</th>}
                <th className="num">Inscriptos</th>
                <th className="num">Clases</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {(verTodasComisiones ? datos.ranking : datos.ranking.slice(0, 15)).map((c) => (
                <tr key={c.comision_id}>
                  <td>{c.carrera}</td>
                  <td>{c.materia}</td>
                  <td>
                    {c.anio}° {c.division}
                  </td>
                  <td>{capitalizar(c.turno)}</td>
                  <td>{capitalizar(c.modalidad)}</td>
                  {esDirector && <td>{c.profesor || "-"}</td>}
                  <td className="num">{c.inscriptos}</td>
                  <td className="num">{c.clases}</td>
                  <td>
                    <div className="viz-celda-barra">
                      <div className="viz-mini">
                        <div style={{ width: `${c.porcentaje * 100}%` }} />
                      </div>
                      {c.porcentaje < UMBRAL_REGULARIDAD ? (
                        <span className="badge danger">
                          <AlertTriangle size={12} /> {formatoPct(c.porcentaje)}
                        </span>
                      ) : (
                        <span>{formatoPct(c.porcentaje)}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {datos.ranking.length > 15 && (
          <button
            className="btn secondary bloque"
            style={{ marginTop: 16 }}
            onClick={() => setVerTodasComisiones(!verTodasComisiones)}
          >
            {verTodasComisiones ? "Ver menos" : `Ver las ${formatoNum(datos.ranking.length)}`}
          </button>
        )}
      </div>
    </div>
  );
}
