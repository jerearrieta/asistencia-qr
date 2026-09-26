"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

export const formatoPct = (v) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);
export const formatoNum = (v) => Number(v || 0).toLocaleString("es-AR");

// ---------------------------------------------------------------------------
// Tooltip compartido: sigue al mouse y se muestra encima de todo
// ---------------------------------------------------------------------------
export function useTooltip() {
  const [tip, setTip] = useState(null);
  return {
    mostrar: (e, contenido) => setTip({ x: e.clientX, y: e.clientY, contenido }),
    ocultar: () => setTip(null),
    nodo: tip && (
      <div className="viz-tip" style={{ left: tip.x + 14, top: tip.y + 14 }} role="tooltip">
        {tip.contenido}
      </div>
    ),
  };
}

// Mide el ancho disponible de un contenedor (para los SVG)
function useAncho() {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([e]) => setAncho(Math.max(280, e.contentRect.width)));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, ancho];
}

// ---------------------------------------------------------------------------
// Tarjeta de indicador (KPI)
// ---------------------------------------------------------------------------
export function Indicador({ etiqueta, valor, detalle, alerta, icono: Icono, tono = "" }) {
  return (
    <div className="viz-tile">
      <div className="viz-tile-cabecera">
        <div className="viz-tile-etiqueta">{etiqueta}</div>
        {Icono && (
          <div className={`icono-caja ${tono}`}>
            <Icono size={17} />
          </div>
        )}
      </div>
      <div className="viz-tile-valor">{valor}</div>
      {detalle && (
        <div className={`viz-tile-detalle ${alerta ? "critico" : ""}`}>
          {alerta && <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />}
          {detalle}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras horizontales (una serie). `referencia` dibuja una línea fina, por
// ejemplo el 75% de asistencia mínima.
// filas: [{ clave, etiqueta, valor, texto, tooltip }]
// ---------------------------------------------------------------------------
export function BarrasHorizontales({ filas, max, referencia, etiquetaReferencia, vacio }) {
  const { mostrar, ocultar, nodo } = useTooltip();
  const tope = max ?? Math.max(1, ...filas.map((f) => f.valor || 0));

  if (!filas.length) return <p className="texto-suave">{vacio || "Sin datos"}</p>;

  return (
    <div className="viz-barras">
      {referencia !== undefined && (
        <div className="viz-fila viz-fila-ref" aria-hidden="true">
          <span />
          <div className="viz-pista">
            <span className="viz-ref-texto" style={{ left: `${(referencia / tope) * 100}%` }}>
              {etiquetaReferencia}
            </span>
          </div>
          <span />
        </div>
      )}
      {filas.map((f) => (
        <div
          key={f.clave}
          className="viz-fila"
          onMouseMove={(e) => f.tooltip && mostrar(e, f.tooltip)}
          onMouseLeave={ocultar}
        >
          <span className="viz-etiqueta" title={f.etiqueta}>
            {f.etiqueta}
          </span>
          <div className="viz-pista">
            <div
              className="viz-barra"
              style={{ width: `${Math.max(0, Math.min(1, (f.valor || 0) / tope)) * 100}%` }}
            />
            {referencia !== undefined && (
              <div className="viz-ref" style={{ left: `${(referencia / tope) * 100}%` }} />
            )}
          </div>
          <span className="viz-valor">{f.texto}</span>
        </div>
      ))}
      {nodo}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Línea temporal de % de asistencia por semana, con cursor y tooltip
// puntos: [{ semana: "2026-07-06", valor: 0.78, presentes, esperados }]
// ---------------------------------------------------------------------------
export function LineaSemanal({ puntos, referencia }) {
  const [ref, ancho] = useAncho();
  const [activo, setActivo] = useState(null);
  const alto = 240;
  const m = { arriba: 16, derecha: 44, abajo: 28, izquierda: 40 };

  if (!puntos.length) {
    return (
      <div ref={ref}>
        <p className="texto-suave">Todavía no hay clases en este período.</p>
      </div>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const minY = Math.min(0.5, Math.floor(Math.min(...valores) * 10) / 10);
  const maxY = 1;
  const w = ancho - m.izquierda - m.derecha;
  const h = alto - m.arriba - m.abajo;
  const x = (i) => m.izquierda + (puntos.length === 1 ? w / 2 : (i / (puntos.length - 1)) * w);
  const y = (v) => m.arriba + (1 - (v - minY) / (maxY - minY)) * h;
  const ticks = [];
  for (let t = minY; t <= maxY + 1e-9; t += 0.1) ticks.push(Math.round(t * 10) / 10);
  const cadaCuantas = Math.ceil(puntos.length / Math.max(2, Math.floor(w / 70)));
  const fecha = (s) => s.slice(8, 10) + "/" + s.slice(5, 7);
  const ultimo = puntos[puntos.length - 1];

  function mover(e) {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left;
    let mejor = 0;
    puntos.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(mejor) - px)) mejor = i;
    });
    setActivo(mejor);
  }

  const p = activo !== null ? puntos[activo] : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <svg
        width={ancho}
        height={alto}
        role="img"
        aria-label="Porcentaje de asistencia por semana"
        onMouseMove={mover}
        onMouseLeave={() => setActivo(null)}
        style={{ display: "block" }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.izquierda} x2={ancho - m.derecha} y1={y(t)} y2={y(t)} className="viz-grilla" />
            <text x={m.izquierda - 6} y={y(t)} className="viz-eje" textAnchor="end" dominantBaseline="middle">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {referencia !== undefined && (
          <g>
            <line
              x1={m.izquierda}
              x2={ancho - m.derecha}
              y1={y(referencia)}
              y2={y(referencia)}
              className="viz-ref-linea"
            />
            <text x={m.izquierda + 6} y={y(referencia) - 5} className="viz-eje">
              mín. {formatoPct(referencia)}
            </text>
          </g>
        )}
        {puntos.map((pt, i) =>
          i % cadaCuantas === 0 ? (
            <text key={pt.semana} x={x(i)} y={alto - 8} className="viz-eje" textAnchor="middle">
              {fecha(pt.semana)}
            </text>
          ) : null
        )}
        <path
          d={`${puntos.map((pt, i) => `${i ? "L" : "M"}${x(i)},${y(pt.valor)}`).join(" ")} L${x(
            puntos.length - 1
          )},${alto - m.abajo} L${x(0)},${alto - m.abajo} Z`}
          className="viz-area"
        />
        <path
          d={puntos.map((pt, i) => `${i ? "L" : "M"}${x(i)},${y(pt.valor)}`).join(" ")}
          className="viz-linea"
        />
        <circle cx={x(puntos.length - 1)} cy={y(ultimo.valor)} r={4} className="viz-punto" />
        <text
          x={x(puntos.length - 1) + 8}
          y={y(ultimo.valor)}
          className="viz-eje-fuerte"
          dominantBaseline="middle"
        >
          {formatoPct(ultimo.valor)}
        </text>
        {p && (
          <g>
            <line x1={x(activo)} x2={x(activo)} y1={m.arriba} y2={alto - m.abajo} className="viz-cursor" />
            <circle cx={x(activo)} cy={y(p.valor)} r={5} className="viz-punto" />
          </g>
        )}
      </svg>
      {p && (
        <div
          className="viz-tip viz-tip-abs"
          style={{
            left: Math.min(x(activo) + 12, ancho - 200),
            top: Math.max(0, y(p.valor) - 60),
          }}
        >
          <strong>Semana del {fecha(p.semana)}</strong>
          <br />
          Asistencia {formatoPct(p.valor)}
          <br />
          {formatoNum(p.presentes)} de {formatoNum(p.esperados)} presentes
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra 100% apilada (parte de un todo) con leyenda
// segmentos: [{ etiqueta, valor, color }]
// ---------------------------------------------------------------------------
export function BarraApilada({ segmentos }) {
  const { mostrar, ocultar, nodo } = useTooltip();
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  if (!total) return <p className="texto-suave">Sin registros</p>;

  return (
    <div>
      <div className="viz-apilada">
        {segmentos
          .filter((s) => s.valor > 0)
          .map((s) => (
            <div
              key={s.etiqueta}
              style={{ flexGrow: s.valor, background: s.color }}
              onMouseMove={(e) =>
                mostrar(
                  e,
                  <>
                    <strong>{s.etiqueta}</strong>
                    <br />
                    {formatoNum(s.valor)} registros ({formatoPct(s.valor / total)})
                  </>
                )
              }
              onMouseLeave={ocultar}
            />
          ))}
      </div>
      <div className="viz-leyenda">
        {segmentos.map((s) => (
          <span key={s.etiqueta}>
            <i style={{ background: s.color }} aria-hidden="true" />
            {s.etiqueta} <strong>{formatoPct(s.valor / total)}</strong>
          </span>
        ))}
      </div>
      {nodo}
    </div>
  );
}
