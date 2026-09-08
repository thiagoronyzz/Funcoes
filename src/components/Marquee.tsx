import { categorias } from "../data/apps";

export default function Marquee() {
  const itens = categorias.map((categoria) => categoria.titulo.toUpperCase());
  const faixa = [...itens, ...itens];

  return (
    <div className="overflow-hidden border-b border-line bg-ink py-3 text-paper" aria-hidden>
      <div className="flex w-max animate-marquee items-center">
        {[0, 1].map((duplicata) => (
          <div key={duplicata} className="flex items-center">
            {faixa.map((item, index) => (
              <span
                key={`${duplicata}-${index}`}
                className="flex items-center font-mono text-[10px] uppercase tracking-[0.24em]"
              >
                <span className="px-7">{item}</span>
                <span className="h-3 w-px bg-paper/30" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
