import { ArrowUpRight } from "lucide-react";
import type { AppItem, CategoriaId } from "../data/apps";
import { cn } from "../utils/cn";

export const CORES: Record<CategoriaId, string> = {
  estudos: "#38bdf8",
  jogos: "#a78bfa",
  uteis: "#4ade80",
  social: "#fbbf24",
};

const PREFIXOS = /^(Flashcards|Quiz|Jogo|Campo|Sequências|Tabuada|Conversor de|Calculadora de|Gerador de|Validador de|Sorteador de)\s*:?\s*/i;

interface Props {
  app: AppItem;
  categoria: CategoriaId;
}

export default function AppCard({ app, categoria }: Props) {
  const externo = app.link.startsWith("http");
  const cor = CORES[categoria];
  const letra = (app.nome.replace(PREFIXOS, "").trim().charAt(0) || "Z").toUpperCase();

  return (
    <a
      href={app.link}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noreferrer" : undefined}
      className={cn(
        "group flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4",
        "hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.9)]"
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold"
        style={{ color: cor, backgroundColor: `${cor}1a`, border: `1px solid ${cor}40` }}
        aria-hidden
      >
        {letra}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
          {app.nome}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-ink/55">
          {app.descricao}
        </span>
      </span>
      <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink/25 transition-all group-hover:translate-x-0.5 group-hover:text-brand-400" />
    </a>
  );
}
