import { Asterisk } from "lucide-react";
import { categorias } from "../data/apps";

export default function Marquee() {
  const itens = categorias.map((c) => c.titulo.toUpperCase());
  const faixa = [...itens, ...itens];

  return (
    <div className="relative z-10 -my-2 overflow-hidden py-6" aria-hidden>
      <div className="-rotate-[1.3deg] scale-[1.03] bg-brand-600 shadow-[0_24px_60px_-24px_rgba(10,61,255,0.55)]">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-10 py-4 pr-10 md:py-5">
              {faixa.map((t, i) => (
                <span
                  key={`${dup}-${i}`}
                  className="flex items-center gap-10 font-display text-xl font-bold uppercase tracking-tight text-white md:text-2xl"
                >
                  {t}
                  <Asterisk className="size-6 text-white/50" strokeWidth={2.5} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
