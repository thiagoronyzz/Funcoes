import { motion } from "framer-motion";
import type { Categoria } from "../data/apps";
import AppCard from "./AppCard";

interface Props {
  categoria: Categoria;
  indice: number;
}

export default function CategorySection({ categoria, indice }: Props) {
  const numero = String(indice + 1).padStart(2, "0");

  return (
    <section id={categoria.id} className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="mb-10 md:mb-14"
        >
          <div className="mb-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink/50">
            <span className="text-brand-700">{categoria.rotulo}</span>
            <span className="h-px flex-1 bg-line" />
            <span>{String(categoria.apps.length).padStart(2, "0")} aplicativos</span>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
            <h2 className="font-display text-6xl leading-[0.9] tracking-[-0.04em] md:text-8xl">
              {categoria.titulo}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink/60 md:pb-1 md:text-right md:text-base">
              {categoria.descricao}
            </p>
          </div>

          <div className="mt-8 h-px bg-ink/25" />
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categoria.apps.map((app, i) => (
            <AppCard
              key={app.nome}
              app={app}
              categoria={categoria.id}
              indice={i}
              destaque={i === 0}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
          <span>{numero}</span>
          <span className="h-px w-10 bg-line" />
          <span>Fim da seleção</span>
        </div>
      </div>
    </section>
  );
}
