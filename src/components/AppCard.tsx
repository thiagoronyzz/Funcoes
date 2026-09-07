import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  Wrench,
} from "lucide-react";
import type { AppItem, CategoriaId } from "../data/apps";
import { cn } from "../utils/cn";

const ICONES = {
  estudos: GraduationCap,
  jogos: Gamepad2,
  uteis: Wrench,
  social: MessagesSquare,
} as const;

const ROTULOS: Record<CategoriaId, string> = {
  estudos: "Estudos",
  jogos: "Jogos",
  uteis: "Úteis",
  social: "Social",
};

interface Props {
  app: AppItem;
  categoria: CategoriaId;
  indice: number;
  destaque?: boolean;
}

export default function AppCard({ app, categoria, indice, destaque }: Props) {
  const Icone = ICONES[categoria];
  const externo = app.link.startsWith("http");

  return (
    <motion.a
      href={app.link}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noreferrer" : undefined}
      data-hover
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
        delay: (indice % 3) * 0.09,
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06] transition-all duration-500",
        "hover:-translate-y-2 hover:shadow-[0_38px_70px_-28px_rgba(10,61,255,0.38)] hover:ring-brand-600/25",
        destaque && "md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[1.15fr_1fr]"
      )}
    >
      {/* imagem / placeholder */}
      <div
        className={cn(
          "relative overflow-hidden",
          destaque ? "aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]" : "aspect-[16/10]"
        )}
      >
        {app.imagem ? (
          <img
            src={app.imagem}
            alt={`Capa do aplicativo ${app.nome}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
            <div className="bg-dots-light absolute inset-0 opacity-60" />
            <Icone
              strokeWidth={1}
              className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-white/25 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6"
            />
            <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70">
              ronycode — app
            </span>
          </div>
        )}
        {destaque && (
          <span className="absolute left-5 top-5 rounded-full bg-brand-600 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_-8px_rgba(10,61,255,0.7)]">
            Destaque
          </span>
        )}
      </div>

      {/* conteúdo */}
      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-6",
          destaque && "lg:justify-center lg:gap-4 lg:p-11"
        )}
      >
        <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-brand-600">
          <Icone className="size-3.5" strokeWidth={2.2} />
          {ROTULOS[categoria]}
        </div>
        <h3
          className={cn(
            "font-display font-bold tracking-tight",
            destaque ? "text-3xl md:text-4xl" : "text-2xl"
          )}
        >
          {app.nome}
        </h3>
        <p className="text-sm leading-relaxed text-ink/55 md:text-[15px]">
          {app.descricao}
        </p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40 transition-colors duration-300 group-hover:text-brand-600">
            Abrir app
          </span>
          <span className="grid size-11 place-items-center rounded-full ring-1 ring-ink/10 transition-all duration-500 group-hover:rotate-45 group-hover:bg-brand-600 group-hover:ring-brand-600">
            <ArrowUpRight className="size-4 transition-colors duration-500 group-hover:text-white" />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
