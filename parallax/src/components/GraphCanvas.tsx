import { useMemo, useState } from "react";
import { layoutGraph, neighbors } from "@/core/graph";
import { SITES } from "@/data/sites";
import type { GraphNode, ParallaxState } from "@/core/types";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Grafo de conhecimento — SVG determinístico, sem bibliotecas.
   Arrastar não move nada: o layout é calculado por anéis de centralidade.
   Clicar em um nó mostra as conexões e a fonte onde apareceu.
   ──────────────────────────────────────────────────────────────────────────── */

const KIND_COLOR: Record<GraphNode["kind"], string> = {
  conceito: "#7c9cff",
  fonte: "#f0c987",
  produto: "#7ce0b1",
  tarefa: "#c7a6ff",
  sessao: "#7fd1e8",
};

export function GraphCanvas({
  state,
  height = 260,
  focusId,
  onFocus,
  dark = true,
}: {
  state: ParallaxState;
  height?: number;
  focusId?: string | null;
  onFocus?: (id: string | null) => void;
  dark?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const width = 680;
  const positions = useMemo(() => layoutGraph(state.graph, width, height), [state.graph, height]);
  const selected = focusId ?? hover;
  const conns = useMemo(() => (selected ? neighbors(state.graph, selected) : []), [state.graph, selected]);

  const visibleNodes = state.graph.nodes.filter((n) => positions.has(n.id));
  const visibleEdges = state.graph.edges.filter((e) => positions.has(e.from) && positions.has(e.to));

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-line bg-[#090b11]">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label="Grafo de conhecimento do Parallax">
        <defs>
          <radialGradient id="gvignette" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#12172a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#07090e" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glowNode" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#gvignette)" />
        {[0.32, 0.55, 0.78].map((f, i) => (
          <circle key={i} cx={width / 2} cy={height / 2} r={Math.min(width, height) * f * 0.55} fill="none" stroke="#1c2334" strokeDasharray="2 5" />
        ))}

        {visibleEdges.map((e) => {
          const a = positions.get(e.from)!;
          const b = positions.get(e.to)!;
          const active = selected === e.from || selected === e.to;
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? (e.rel === "contradiz" ? "#f08f8f" : e.rel === "cita" ? "#f0c987" : "#7c9cff") : dark ? "#222a3c" : "#d8d2c4"}
              strokeOpacity={selected ? (active ? 0.9 : 0.12) : 0.5}
              strokeWidth={active ? 1.6 : e.rel === "cita" ? 1.1 : 0.7}
              strokeDasharray={e.rel === "contradiz" ? "4 3" : undefined}
            />
          );
        })}

        {visibleNodes.map((n) => {
          const p = positions.get(n.id)!;
          const color = KIND_COLOR[n.kind];
          const active = selected === n.id;
          const showLabel = n.kind === "conceito" ? n.weight >= 2 || active || hover === n.id : active;
          return (
            <g key={n.id} onClick={() => onFocus?.(active ? null : n.id)} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={p.r + 6} fill="transparent" />
              {(active || n.weight >= 4) && <circle cx={p.x} cy={p.y} r={p.r + 3.5} fill={color} opacity={0.16} />}
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={color}
                fillOpacity={active ? 1 : 0.86}
                stroke={active ? "#f5f7ff" : "transparent"}
                strokeWidth={1.2}
                filter={active ? "url(#glowNode)" : undefined}
              />
              {showLabel && (
                <text
                  x={p.x + p.r + 4}
                  y={p.y + 3}
                  fontSize={n.kind === "fonte" ? 7.5 : 8.5}
                  fill={active ? "#eef2ff" : "#8b93a7"}
                  style={{ pointerEvents: "none" }}
                >
                  {n.label.length > 26 ? `${n.label.slice(0, 26)}…` : n.label}
                </text>
              )}
            </g>
          );
        })}

        {visibleNodes.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={11} fill="#5d6479">
            Navegue por algumas páginas para o grafo se formar
          </text>
        )}
      </svg>

      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
        {Object.entries(KIND_COLOR).map(([kind, color]) => (
          <span key={kind} className="inline-flex items-center gap-1 rounded-full border border-line bg-night/80 px-1.5 py-0.5 text-[8.5px] text-dim">
            <i className="size-1.5 rounded-full" style={{ background: color }} />
            {kind}
          </span>
        ))}
      </div>

      {selected && (
        <div className="absolute inset-x-2 bottom-2 rounded-lg border border-line bg-[#0b0e15]/95 p-2 backdrop-blur">
          <p className="m-0 flex items-center gap-1.5 text-[10px] font-semibold text-ink">
            <i className="size-1.5 rounded-full" style={{ background: KIND_COLOR[state.graph.nodes.find((n) => n.id === selected)?.kind ?? "conceito"] }} />
            {state.graph.nodes.find((n) => n.id === selected)?.label}
            <span className="ml-auto font-normal text-dim">
              {conns.length} conexõe(s) · peso {state.graph.nodes.find((n) => n.id === selected)?.weight}
            </span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {conns.slice(0, 6).map((c) => (
              <span key={c.node.id} className={cn("rounded border px-1.5 py-0.5 text-[9px]", c.rel === "cita" ? "border-gold/40 text-gold" : "border-line text-dim")}>
                {c.rel} · {c.node.label.length > 24 ? `${c.node.label.slice(0, 24)}…` : c.node.label}
              </span>
            ))}
          </div>
          {(() => {
            const node = state.graph.nodes.find((n) => n.id === selected);
            const site = node?.siteId ? SITES[node.siteId] : null;
            return node?.pageTitle ? (
              <p className="mb-0 mt-1 truncate text-[9px] text-faint">
                {site?.name ?? "fonte"} · {node.pageTitle}
              </p>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
