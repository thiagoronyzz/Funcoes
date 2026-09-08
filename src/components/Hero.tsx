import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { categorias } from "../data/apps";

const appsPrincipais = categorias
  .filter((categoria) => categoria.id !== "social")
  .reduce((total, categoria) => total + categoria.apps.length, 0);

const stats = [
  { valor: String(appsPrincipais).padStart(2, "0"), rotulo: "aplicativos" },
  { valor: "04", rotulo: "categorias" },
  { valor: "100%", rotulo: "no navegador" },
  { valor: "24/7", rotulo: "disponível" },
];

export default function Hero() {
  return (
    <section id="topo" className="relative scroll-mt-20 overflow-hidden pt-28 md:pt-36">
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-14 md:px-8 md:pb-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-end lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col"
        >
          <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-ink/55">
            <span className="h-px w-8 bg-brand-600" />
            Catálogo digital · 2026
          </div>

          <h1 className="max-w-xl font-display text-[clamp(3.8rem,8vw,7.8rem)] leading-[0.88] tracking-[-0.045em]">
            Ferramentas para o dia a dia.
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-ink/65 md:text-lg">
            Uma seleção de aplicativos diretos, úteis e acessíveis para estudar,
            jogar e resolver pequenas tarefas sem sair do navegador.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href="#estudos"
              className="group inline-flex items-center gap-3 border-b border-brand-600 pb-2 font-body text-sm font-semibold text-brand-700"
            >
              Explorar o catálogo
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-1" />
            </a>
            <a
              href="#sobre"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-ink/55 hover:text-ink"
            >
              Sobre a plataforma
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12 }}
          className="relative border border-ink/20 bg-surface p-2"
        >
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/10]">
            <img
              src="/images/editorial/study-desk.jpg"
              alt="Mesa de trabalho com caderno, lápis e computador"
              className="editorial-image absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-black/65 px-5 pb-5 pt-5 text-white">
              <figcaption className="font-body text-sm">Um lugar para começar.</figcaption>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                Arquivo 01
              </span>
            </div>
          </div>
        </motion.figure>
      </div>

      <div className="border-y border-line bg-surface/60">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-5 md:grid-cols-4 md:px-8">
          {stats.map((stat, index) => (
            <div
              key={stat.rotulo}
              className={`flex flex-col gap-1 py-5 md:py-6 ${
                index > 0 ? "border-l border-line pl-4 md:pl-8" : ""
              } ${index < 2 ? "pr-4" : ""}`}
            >
              <span className="font-display text-3xl leading-none tracking-tight md:text-4xl">
                {stat.valor}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                {stat.rotulo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
