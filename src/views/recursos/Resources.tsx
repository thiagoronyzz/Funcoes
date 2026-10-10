import { BookOpen, CheckCircle2, CircleDot, Compass, Filter, Lightbulb, Search, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { FONTES_PESQUISA, NOVAS_FERRAMENTAS, REFERENCIAS, researchStats, type FeatureStatus } from "@/data/research";
import { Badge, Chip, Section } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUS_META: Record<FeatureStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pronto: { label: "pronto no editzz", color: "#a3e635", icon: CheckCircle2 },
  original: { label: "ferramenta própria", color: "#a855f7", icon: Sparkles },
  roadmap: { label: "roadmap", color: "#fbbf24", icon: CircleDot },
};

export default function Resources() {
  const stats = useMemo(() => researchStats(), []);
  const [query, setQuery] = useState("");
  const [appFilter, setAppFilter] = useState<string>("todas");
  const [status, setStatus] = useState<FeatureStatus | "todos">("todos");
  const [open, setOpen] = useState<string[]>(["capcut"]);

  const q = query.trim().toLowerCase();
  const matches = (name: string, desc: string) => !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);

  const refs = REFERENCIAS.map((ref) => ({
    ...ref,
    groups: ref.groups
      .map((g) => ({ ...g, features: g.features.filter((f) => (status === "todos" || f.status === status) && matches(f.name, f.desc)) }))
      .filter((g) => g.features.length > 0),
  })).filter((ref) => (appFilter === "todas" || ref.id === appFilter) && ref.groups.length > 0);

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto p-3">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-cy" />
            <div>
              <h1 className="font-display text-lg font-semibold text-ink">Pesquisa de mercado e mapa de recursos</h1>
              <p className="text-[11.5px] text-muted">
                Cada recurso dos editores mais usados do mundo — grátis e pagos — foi inventariado e marcado com o que já existe no editzz.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {[
              { label: "Editores estudados", value: stats.apps, color: "#22d3ee" },
              { label: "Recursos mapeados", value: stats.total, color: "#a855f7" },
              { label: "Já implementados", value: stats.pronto, color: "#a3e635" },
              { label: "Ferramentas próprias", value: NOVAS_FERRAMENTAS.length, color: "#f472b6" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-line bg-panel2/40 p-3">
                <p className="font-display text-2xl font-bold" style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className="text-[10.5px] uppercase tracking-wider text-dim">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* filtros */}
        <div className="panel flex flex-wrap items-center gap-1.5 p-2">
          <span className="flex items-center gap-1 text-[11px] text-dim">
            <Filter className="size-3.5" /> filtros
          </span>
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-line bg-bg2/70 px-2">
            <Search className="size-3.5 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar recurso (ex.: legenda, máscara, curva, keyframe)…"
              className="h-7 w-full bg-transparent text-[11.5px] text-ink outline-none placeholder:text-dim"
            />
          </div>
          <Chip active={appFilter === "todas"} onClick={() => setAppFilter("todas")}>
            todos os apps
          </Chip>
          {REFERENCIAS.map((r) => (
            <Chip key={r.id} active={appFilter === r.id} onClick={() => setAppFilter(r.id)} title={r.tagline}>
              {r.app}
            </Chip>
          ))}
          <span className="mx-1 h-5 w-px bg-line" />
          {(["todos", "pronto", "original", "roadmap"] as const).map((st) => (
            <Chip key={st} active={status === st} onClick={() => setStatus(st)}>
              {st === "todos" ? "todos os status" : STATUS_META[st].label}
            </Chip>
          ))}
        </div>

        {/* ferramentas autorais */}
        <Section title={`Ferramentas criadas pelo editzz (${NOVAS_FERRAMENTAS.length})`} icon={<Lightbulb className="size-3.5 text-vio" />} defaultOpen>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NOVAS_FERRAMENTAS.map((tool) => (
              <div key={tool.id} className="rounded-xl border border-vio/30 bg-vio/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-vio" />
                  <p className="font-display text-[12px] font-semibold text-ink">{tool.name}</p>
                </div>
                <p className="text-[10.5px] leading-relaxed text-muted">{tool.desc}</p>
                <p className="mt-1.5 font-mono text-[9.5px] text-dim">{tool.where}</p>
                <Badge color="#a855f7">{tool.kind}</Badge>
              </div>
            ))}
          </div>
        </Section>

        {/* matriz */}
        <div className="space-y-2">
          {refs.map((ref) => {
            const isOpen = open.includes(ref.id);
            const total = ref.groups.reduce((sum, g) => sum + g.features.length, 0);
            return (
              <div key={ref.id} className="panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen((list) => (isOpen ? list.filter((x) => x !== ref.id) : [...list, ref.id]))}
                  className="flex w-full items-center gap-2.5 p-3 text-left transition hover:bg-white/3"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: ref.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-display text-[13px] font-semibold text-ink">
                      {ref.app}
                      <Badge color={ref.tier === "grátis" ? "#a3e635" : ref.tier === "freemium" ? "#22d3ee" : "#fbbf24"}>{ref.tier}</Badge>
                      <span className="text-[10px] font-normal text-dim">{ref.vendor}</span>
                    </p>
                    <p className="truncate text-[11px] text-muted">{ref.tagline}</p>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-dim">{total} recursos</span>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-line/60 p-3">
                    {ref.groups.map((group) => (
                      <div key={group.group}>
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-ink">
                          <BookOpen className="size-3.5 text-cy" /> {group.group}
                        </p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {group.features.map((f) => {
                            const meta = STATUS_META[f.status];
                            const Icon = meta.icon;
                            return (
                              <div key={f.name} className={cn("rounded-lg border p-2", f.status === "pronto" ? "border-line bg-panel2/40" : f.status === "original" ? "border-vio/30 bg-vio/5" : "border-amber/25 bg-amber/5")}>
                                <p className="flex items-start gap-1.5 text-[11.5px] font-medium text-ink">
                                  <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: meta.color }} />
                                  {f.name}
                                </p>
                                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{f.desc}</p>
                                <p className="mt-1 font-mono text-[9.5px] text-dim">{f.where}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {refs.length === 0 && <p className="panel p-4 text-[11.5px] text-muted">Nenhum recurso encontrado com esses filtros.</p>}
        </div>

        {/* fontes */}
        <Section title="Fontes consultadas" icon={<Star className="size-3.5 text-amber" />} defaultOpen={false}>
          <ul className="space-y-1 text-[11px] leading-relaxed text-muted">
            {FONTES_PESQUISA.map((fonte) => (
              <li key={fonte} className="flex gap-1.5">
                <span className="text-cy">•</span>
                {fonte}
              </li>
            ))}
          </ul>
          <p className="text-[10.5px] text-dim">
            Recurso marcado como <span className="text-amber">roadmap</span> depende de limite do navegador (ex.: geração de vídeo por IA,
            upscale por modelo neural) ou está planejado para uma próxima versão do editzz.
          </p>
        </Section>
      </div>
    </div>
  );
}
