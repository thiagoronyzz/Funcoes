import { motion } from "framer-motion";
import {
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  Wrench,
} from "lucide-react";
import type { Categoria } from "../data/apps";
import AppCard from "./AppCard";

const ICONES = {
  estudos: GraduationCap,
  jogos: Gamepad2,
  uteis: Wrench,
  social: MessagesSquare,
} as const;

interface Props {
  categoria: Categoria;
  indice: number;
}

export default function CategorySection({ categoria, indice }: Props) {
  const Icone = ICONES[categoria.id];
  const numero = String(indice + 1).padStart(2, "0");

  return (
    <section id={categoria.id} className="relative scroll-mt-20 py-20 md:py-28">
      <span
        aria-hidden
        className="text-stroke-ghost pointer-events-none absolute right-6 top-6 hidden select-none font-display text-[12rem] font-bold leading-none xl:block"
      >
        {numero}
      </span>

      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-col gap-7 md:mb-16"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_16px_36px_-12px_rgba(10,61,255,0.55)]">
              <Icone className="size-6" strokeWidth={1.8} />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/50">
              {categoria.rotulo} — {String(categoria.apps.length).padStart(2, "0")}{" "}
              apps
            </span>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
              {categoria.titulo}
              <span className="text-brand-600">.</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55 md:text-right md:text-base">
              {categoria.descricao}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-brand-600/70 via-ink/10 to-transparent" />
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </section>
  );
}
