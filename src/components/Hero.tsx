import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Gamepad2, Search, Wrench } from "lucide-react";
import { categorias } from "../data/apps";

const total = categorias
  .filter((categoria) => categoria.id !== "social")
  .reduce((acc, categoria) => acc + categoria.apps.length, 0);

const stats = [
  { valor: `${total}+`, rotulo: "Aplicativos" },
  { valor: "100%", rotulo: "No navegador" },
  { valor: "0", rotulo: "Cadastro exigido" },
  { valor: "24/7", rotulo: "Disponível" },
];

const miniApps = [
  { letra: "T", cor: "#38bdf8", nome: "Tetris Clássico", cat: "Jogos" },
  { letra: "R", cor: "#38bdf8", nome: "Redação ENEM", cat: "Estudos" },
  { letra: "A", cor: "#4ade80", nome: "Amortização Price", cat: "Úteis" },
  { letra: "P", cor: "#a78bfa", nome: "Pac-Labirinto", cat: "Jogos" },
  { letra: "G", cor: "#38bdf8", nome: "Gramática Completa", cat: "Estudos" },
  { letra: "K", cor: "#4ade80", nome: "Kanban Pessoal", cat: "Úteis" },
];

export default function Hero() {
  return (
    <section id="topo" className="relative scroll-mt-20 overflow-hidden pt-32 md:pt-40">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/12 blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <a
            href="#estudos"
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-300 hover:border-brand-400/50"
          >
            <span className="size-1.5 rounded-full bg-brand-400" />
            300+ aplicativos · Grátis · Sem cadastro
          </a>

          <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] md:text-7xl">
            Estude, jogue e resolva. <span className="text-brand-400">Tudo no navegador.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/60 md:text-lg">
            Guias de estudo completos, jogos de verdade e ferramentas profissionais —
            direto no navegador, sem instalar nada e sem criar conta.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#estudos"
              className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_-16px_rgba(16,185,129,0.7)] hover:bg-brand-500"
            >
              Explorar aplicativos
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#sobre"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-7 py-3.5 text-sm font-semibold text-ink/85 hover:border-brand-500/50 hover:text-ink"
            >
              Por que a Zcode
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 border-t border-line pt-8 md:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.rotulo}
              className={`flex flex-col items-center gap-1 py-2 ${i > 0 ? "border-l border-line" : ""}`}
            >
              <span className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                {stat.valor}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
                {stat.rotulo}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Mockup do produto */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-line bg-[#0b100d] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-md bg-surface2 px-3 py-1.5 font-mono text-[11px] text-ink/50">
              <Search className="size-3" />
              zcode · explorar aplicativos
            </div>
            <div className="w-10" aria-hidden />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 md:p-6">
            <div className="col-span-full flex flex-wrap items-center gap-2">
              {[
                { icone: BookOpen, texto: "Estudos" },
                { icone: Gamepad2, texto: "Jogos" },
                { icone: Wrench, texto: "Úteis" },
              ].map((chip) => (
                <span
                  key={chip.texto}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink/70"
                >
                  <chip.icone className="size-3.5 text-brand-400" />
                  {chip.texto}
                </span>
              ))}
            </div>
            {miniApps.map((app) => (
              <div
                key={app.nome}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-lg font-display text-lg font-extrabold"
                  style={{ color: app.cor, backgroundColor: `${app.cor}1f`, border: `1px solid ${app.cor}4d` }}
                >
                  {app.letra}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{app.nome}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    {app.cat}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="h-20 md:h-28" />
      </div>
    </section>
  );
}
