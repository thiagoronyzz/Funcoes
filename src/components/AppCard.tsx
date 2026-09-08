import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { AppItem, CategoriaId } from "../data/apps";
import { cn } from "../utils/cn";

const ROTULOS: Record<CategoriaId, string> = {
  estudos: "Estudos",
  jogos: "Jogos",
  uteis: "Úteis",
  social: "Social",
};

const IMAGENS_EDITORIAIS: Record<CategoriaId, string[]> = {
  estudos: [
    "/images/editorial/study-desk.jpg",
    "/images/editorial/study-notes.jpg",
    "/images/editorial/library.jpg",
  ],
  jogos: [
    "/images/editorial/chess-board.jpg",
    "/images/editorial/chess-pieces.jpg",
  ],
  uteis: [
    "/images/editorial/study-notes.jpg",
    "/images/editorial/study-night.jpg",
    "/images/editorial/study-desk.jpg",
  ],
  social: [
    "/images/editorial/meeting.jpg",
    "/images/editorial/community.jpg",
  ],
};

interface Props {
  app: AppItem;
  categoria: CategoriaId;
  indice: number;
  destaque?: boolean;
}

export default function AppCard({ app, categoria, indice, destaque }: Props) {
  const externo = app.link.startsWith("http");
  const imagem = IMAGENS_EDITORIAIS[categoria][indice % IMAGENS_EDITORIAIS[categoria].length];

  return (
    <motion.a
      href={app.link}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noreferrer" : undefined}
      data-hover
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: (indice % 3) * 0.06 }}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-line bg-surface",
        "hover:-translate-y-1 hover:border-ink/45 hover:shadow-[0_18px_36px_-24px_rgba(37,36,34,0.65)]",
        destaque && "md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[1.15fr_1fr]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface2",
          destaque ? "aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]" : "aspect-[16/10]"
        )}
      >
        <img
          src={imagem}
          alt=""
          loading="lazy"
          className="editorial-image absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {destaque && (
          <span className="absolute left-4 top-4 border border-white/60 bg-black/65 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
            Seleção editorial
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-5 md:p-6",
          destaque && "lg:justify-center lg:gap-4 lg:p-10"
        )}
      >
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-700">
          <span>{ROTULOS[categoria]}</span>
          <span className="text-ink/40">{String(indice + 1).padStart(2, "0")}</span>
        </div>
        <h3
          className={cn(
            "font-display tracking-tight",
            destaque ? "text-3xl md:text-4xl" : "text-2xl"
          )}
        >
          {app.nome}
        </h3>
        <p className="text-sm leading-relaxed text-ink/60 md:text-[15px]">{app.descricao}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45 transition-colors group-hover:text-brand-700">
            Abrir aplicativo
          </span>
          <span className="grid size-9 place-items-center border border-line transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
