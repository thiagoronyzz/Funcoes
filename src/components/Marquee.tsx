const itens = [
  "300+ aplicativos",
  "Estudos",
  "Jogos",
  "Úteis",
  "Sem cadastro",
  "100% no navegador",
  "Grátis",
  "Recursos",
];

export default function Marquee() {
  const faixa = [...itens, ...itens];
  return (
    <div className="overflow-hidden border-y border-line bg-[#0b100d] py-3.5" aria-hidden>
      <div className="flex w-max animate-marquee items-center">
        {[0, 1].map((duplicata) => (
          <div key={duplicata} className="flex items-center">
            {faixa.map((item, index) => (
              <span
                key={`${duplicata}-${index}`}
                className="flex items-center font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50"
              >
                <span className="px-7">{item}</span>
                <span className="size-1.5 rounded-full bg-brand-500/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
