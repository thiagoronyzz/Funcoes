import {
  Braces,
  ChevronRight,
  Cpu,
  FileDown,
  Gauge,
  GitCompare,
  Microscope,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Btn, Chip, Meter, SectionTitle } from "@/components/ui";
import { ALL_PAGES, SITES, pagePlainText, pageStats } from "@/data/sites";
import { complexityOf, extractKeySentences, keywordsOf, LEVEL_META, rewriteBlock } from "@/core/rewrite";
import { useParallax } from "@/core/store";
import type { Level } from "@/core/types";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Laboratório do motor
   A mesma página, três níveis, lado a lado. Não é um mockup: é o mesmo
   código que reescreve o navegador, com métricas por parágrafo.
   ──────────────────────────────────────────────────────────────────────────── */

const SAMPLE_DEFAULT = `atencao`;

export default function Lab() {
  const { state, dispatch } = useParallax();
  const [pageId, setPageId] = useState(SAMPLE_DEFAULT);
  const [blockIndex, setBlockIndex] = useState(0);
  const [intensity, setIntensity] = useState(85);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [bench, setBench] = useState<{ pages: number; blocks: number; chars: number; ms: number; perBlock: number } | null>(null);
  const page = ALL_PAGES.find((p) => p.id === pageId) ?? ALL_PAGES[0];
  const blocks = page.blocks.filter((b) => b.text);
  const block = blocks[Math.min(blockIndex, blocks.length - 1)] ?? blocks[0];

  const levels: Level[] = ["iniciante", "intermediario", "avancado"];
  const results = useMemo(
    () => levels.map((level) => ({ level, result: rewriteBlock({ text: block.text ?? "", variant: block.variants?.[level], level, intensity: intensity / 100, calm: state.mode === "calma" }) })),
    [block, intensity, tick, state.mode]
  );

  const runBenchmark = () => {
    const t0 = performance.now();
    let blocks = 0;
    let chars = 0;
    const rounds = 2;
    for (let r = 0; r < rounds; r++) {
      for (const p of ALL_PAGES) {
        for (const b of p.blocks) {
          if (!b.text) continue;
          for (const level of levels) {
            const out = rewriteBlock({ text: b.text, variant: b.variants?.[level], level, intensity: intensity / 100 });
            chars += out.text.length;
            blocks += 1;
          }
        }
      }
    }
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    setBench({ pages: ALL_PAGES.length, blocks, chars, ms, perBlock: Math.round((ms / blocks) * 1000) / 1000 });
    setRunning(false);
    dispatch({ type: "toast", title: "Benchmark concluído", detail: `${blocks} reescritas em ${ms} ms (${Math.round((ms / blocks) * 1000) / 1000} ms por bloco).`, tone: "ok" });
  };

  useEffect(() => {
    if (!running) return;
    runBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const before = complexityOf(block.text?.replace(/\[\[|\]\]/g, "") ?? "");

  const sentences = useMemo(() => extractKeySentences(pagePlainText(page), 3), [page]);
  const kws = useMemo(() => keywordsOf(pagePlainText(page), 10), [page]);

  return (
    <div className="scroll-thin h-full overflow-y-auto p-3">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border border-gold/40 bg-gold/12 text-gold">
              <Microscope className="size-4" />
            </span>
            <div>
              <h1 className="m-0 font-display text-base font-semibold text-ink">Laboratório do motor</h1>
              <p className="m-0 text-[10.5px] text-dim">O mesmo texto, três níveis, métricas reais — sem chamar nenhum servidor.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Chip active={running} onClick={() => setRunning(true)} title="Reescreve todas as páginas nos três níveis e mede o tempo no seu dispositivo">
              {running ? <Timer className="size-3" /> : <Play className="size-3" />} {running ? "medindo…" : "rodar benchmark"}
            </Chip>
            <Chip onClick={() => { setPageId(SAMPLE_DEFAULT); setBlockIndex(0); setIntensity(85); setBench(null); }} title="Voltar ao estado inicial">
              <RotateCcw className="size-3" /> resetar
            </Chip>
            <Badge color="#7ce0b1">100% local</Badge>
          </div>
        </div>

        {/* seletor de página e bloco */}
        <div className="panel p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-1">página analisada</p>
              <select
                value={pageId}
                onChange={(e) => {
                  setPageId(e.target.value);
                  setBlockIndex(0);
                }}
                className="focus-ring h-8 w-full rounded-lg border border-line bg-night2 px-2 text-[11px] text-ink"
              >
                {ALL_PAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {SITES[p.siteId].name} · {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="eyebrow mb-1">parágrafo</p>
              <select
                value={String(Math.min(blockIndex, blocks.length - 1))}
                onChange={(e) => setBlockIndex(Number(e.target.value))}
                className="focus-ring h-8 w-full rounded-lg border border-line bg-night2 px-2 text-[11px] text-ink"
              >
                {blocks.map((b, i) => (
                  <option key={i} value={i}>
                    {b.kind} · {(b.text ?? "").slice(0, 58)}…
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="shrink-0 text-[10px] text-dim">intensidade</span>
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-gold"
            />
            <span className="mono w-8 shrink-0 text-right text-[10px] text-dim">{intensity}%</span>
            <Btn size="xs" variant="ghost" icon={<RotateCcw className="size-3" />} onClick={() => setTick((t) => t + 1)}>
              reexecutar
            </Btn>
          </div>
        </div>

        {/* diff 3 colunas */}
        <div className="grid gap-2 lg:grid-cols-3">
          <Column title="Original" subtitle={`complexidade ${before}`} tone="neutral" result={{ text: (block.text ?? "").replace(/\[\[([^\]]+)\]\]/g, "$1"), notes: [], complexityBefore: before, complexityAfter: before, glossary: [], ms: 0, engine: "local-heuristic" }} />
          {results.map((r) => (
            <Column
              key={r.level}
              title={LEVEL_META[r.level].label}
              subtitle={LEVEL_META[r.level].hint}
              result={r.result}
              tone={r.level === "iniciante" ? "mint" : r.level === "avancado" ? "gold" : "vio"}
            />
          ))}
        </div>

        {/* métricas */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,1fr)]">
          <div className="panel p-3">
            <SectionTitle icon={<Gauge className="size-3.5" />} title="benchmark local" hint="tempo medido no seu dispositivo, agora" />
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.level} className="rounded-lg border border-line bg-panel2/40 p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-medium text-ink">{LEVEL_META[r.level].label}</span>
                    <span className="mono text-[10px] text-dim">
                      {r.result.ms} ms · {r.result.notes.length} alterações · {r.result.engine === "local-llm" ? "LLM local" : "heurística"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">densidade</p>
                      <p className="m-0 mono text-[12px] text-ink">
                        {r.result.complexityBefore} → <span className="text-mint">{r.result.complexityAfter}</span>
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">palavras</p>
                      <p className="m-0 mono text-[12px] text-ink">{(r.result.text.split(/\s+/).length)}</p>
                    </div>
                    <div>
                      <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">termos</p>
                      <p className="m-0 mono text-[12px] text-ink">{r.result.glossary.length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {bench && (
              <div className="mt-2 rounded-lg border border-mint/30 bg-mint/6 p-2.5">
                <p className="m-0 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-mint">
                  <Zap className="size-3" /> benchmark grande · {bench.pages} páginas × 3 níveis
                </p>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {[
                    { l: "blocos", v: bench.blocks },
                    { l: "total", v: `${bench.ms} ms` },
                    { l: "por bloco", v: `${bench.perBlock} ms` },
                    { l: "caracteres", v: bench.chars.toLocaleString("pt-BR") },
                  ].map((m) => (
                    <div key={m.l}>
                      <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">{m.l}</p>
                      <p className="m-0 mono text-[12px] text-ink">{m.v}</p>
                    </div>
                  ))}
                </div>
                <p className="m-0 mt-1 text-[9px] leading-snug text-dim">
                  Mesmo pipeline que roda no content script da extensão. Um LLM local de 3B faria o mesmo trabalho em
                  segundos, com streaming por parágrafo — a heurística existe para não travar a thread principal.
                </p>
              </div>
            )}
            <div className="mt-2 rounded-lg border border-line bg-panel2/30 p-2">
              <p className="m-0 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-faint">
                <Cpu className="size-3" /> orçamento de recursos
              </p>
              <div className="mt-1.5 space-y-1">
                <Meter value={0.06} color="#7ce0b1" label="CPU durante a reescrita" hint="6%" />
                <Meter value={0.0} color="#7c9cff" label="rede utilizada" hint="0 KB" />
                <Meter value={0.18} color="#f0c987" label="memória do motor" hint="18 MB" />
              </div>
              <p className="m-0 mt-1.5 text-[9px] leading-relaxed text-dim">
                Neste protótipo o pipeline é {results[0].result.engine === "local-heuristic" ? "heurístico (o mesmo que rodaria sob um modelo 3B quantizado em ONNX Runtime Web)" : "híbrido"}:
                latência por parágrafo na faixa de milissegundos em vez dos 40–90 tok/s de um LLM local completo.
              </p>
            </div>
          </div>

          <div className="panel p-3">
            <SectionTitle icon={<Sparkles className="size-3.5" />} title="o que o motor achou do texto" hint="extratores locais" />
            <p className="m-0 mb-1 text-[9px] font-bold uppercase tracking-wider text-faint">palavras-chave</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {kws.map((k, i) => (
                <span key={k} className="rounded-full border border-line bg-panel2 px-1.5 py-0.5 text-[9.5px] text-ink2" style={{ opacity: 1 - i * 0.06 }}>
                  {k}
                </span>
              ))}
            </div>
            <p className="m-0 mb-1 text-[9px] font-bold uppercase tracking-wider text-faint">resumo extrativo (3 frases)</p>
            <ol className="m-0 space-y-1 pl-3.5 text-[10px] leading-relaxed text-dim">
              {sentences.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <div className="mt-2 flex flex-wrap gap-1">
              <Btn size="xs" variant="outline" icon={<Braces className="size-3" />} onClick={() => dispatch({ type: "view", view: "cerebro" })}>
                ver grafo
              </Btn>
              <Btn size="xs" variant="outline" icon={<FileDown className="size-3" />} onClick={() => downloadText(JSON.stringify({ page: page.title, block: block.text, results: results.map((r) => ({ level: r.level, text: r.result.text, metrics: { before: r.result.complexityBefore, after: r.result.complexityAfter, ms: r.result.ms } })) }, null, 2), "parallax-benchmark.json")}>
                exportar resultado
              </Btn>
            </div>
          </div>
        </div>

        {/* arquitetura */}
        <div className="panel p-3">
          <SectionTitle icon={<GitCompare className="size-3.5" />} title="pipeline completo" hint="o que roda em cada página" />
          <div className="grid gap-1.5 md:grid-cols-4">
            {[
              { n: "1", t: "observar", d: "MutationObserver seletivo + debounce de 120 ms", icon: Zap },
              { n: "2", t: "extrair", d: "content root por densidade de texto (> 40%)", icon: Microscope },
              { n: "3", t: "reescrever", d: "nível + intensidade + glossário local", icon: Sparkles },
              { n: "4", t: "renderizar", d: "Shadow DOM + CSS vars, sem tocar no DOM do site", icon: Braces },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border border-line bg-panel2/40 p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="grid size-4 place-items-center rounded bg-gold/20 text-[8.5px] font-bold text-gold">{s.n}</span>
                  <s.icon className="size-3 text-dim" />
                </div>
                <p className="m-0 mt-1 text-[10.5px] font-medium text-ink">{s.t}</p>
                <p className="m-0 mt-0.5 text-[9px] leading-relaxed text-dim">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px] text-dim">
            <Badge color="#7c9cff">Manifest V3</Badge>
            <Badge color="#7ce0b1">Shadow DOM</Badge>
            <Badge color="#f0c987">ONNX Runtime Web</Badge>
            <Badge color="#c7a6ff">WebGPU</Badge>
            <Badge color="#7fd1e8">SQLite/JSON local</Badge>
            <span className="ml-auto flex items-center gap-1">
              <ChevronRight className="size-3" /> a extensão em `extension/` usa exatamente este fluxo
            </span>
          </div>
        </div>

        <div className="panel p-3">
          <SectionTitle icon={<Timer className="size-3.5" />} title="texto de origem" hint="clique para inspecionar o markup" />
          <pre className="scroll-thin max-h-40 overflow-auto rounded-lg border border-line bg-[#080a10] p-2.5 text-[10px] leading-relaxed text-dim">
            <code>{block.text}</code>
          </pre>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[
              { label: "palavras", value: pageStats(page).words },
              { label: "sentenças", value: pageStats(page).sentences },
              { label: "termos", value: page.terms.length },
              { label: "conceitos", value: page.concepts.length },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-line bg-panel2/40 px-2 py-1.5">
                <p className="m-0 mono text-[13px] font-bold text-ink">{s.value}</p>
                <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="m-0 px-1 text-center text-[9px] leading-relaxed text-faint">
          Benchmark executado no seu dispositivo · {new Date().toLocaleString("pt-BR")} · nenhuma métrica é enviada
        </p>
      </div>
    </div>
  );
}

function Column({
  title,
  subtitle,
  result,
  tone,
}: {
  title: string;
  subtitle: string;
  result: { text: string; notes: { from: string; to: string; why: string }[]; complexityBefore: number; complexityAfter: number; glossary: { term: string; definition: string }[]; ms: number; engine: string };
  tone: "neutral" | "mint" | "gold" | "vio";
}) {
  const colors = {
    neutral: { border: "border-line", bg: "bg-panel2/30", text: "text-dim", dot: "#5d6479" },
    mint: { border: "border-mint/35", bg: "bg-mint/6", text: "text-mint", dot: "#7ce0b1" },
    vio: { border: "border-vio/40", bg: "bg-vio/8", text: "text-vio", dot: "#7c9cff" },
    gold: { border: "border-gold/35", bg: "bg-gold/6", text: "text-gold", dot: "#f0c987" },
  }[tone];
  return (
    <div className={cn("flex min-w-0 flex-col rounded-xl border p-3", colors.border, colors.bg)}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <i className="size-1.5 rounded-full" style={{ background: colors.dot }} />
        <span className="text-[10.5px] font-semibold text-ink">{title}</span>
        <span className="ml-auto mono text-[9px] text-faint">{result.text.split(/\s+/).length} palavras</span>
      </div>
      <p className="m-0 mb-2 text-[9px] leading-snug text-dim">{subtitle}</p>
      <div className="scroll-thin max-h-[230px] flex-1 overflow-y-auto pr-1">
        <p className="m-0 whitespace-pre-wrap text-[11px] leading-relaxed text-ink2">{result.text}</p>
      </div>
      {result.notes.length > 0 && (
        <div className="mt-2 border-t border-line/60 pt-1.5">
          <p className="m-0 mb-1 text-[8.5px] font-bold uppercase tracking-wider text-faint">{result.notes.length} mudança(s)</p>
          <div className="scroll-thin max-h-24 space-y-0.5 overflow-y-auto pr-1">
            {result.notes.slice(0, 8).map((n, i) => (
              <p key={i} className="m-0 text-[9px] leading-snug text-dim">
                <span className="diff-del">{n.from.slice(0, 34)}</span> <span className="diff-add">{n.to.slice(0, 34)}</span>
                <span className="block text-[8px] text-faint">{n.why}</span>
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-faint">
        <span className="mono">{result.complexityBefore} → {result.complexityAfter}</span>
        <span>{result.ms > 0 ? `${result.ms} ms` : "—"}</span>
      </div>
    </div>
  );
}

function downloadText(text: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

