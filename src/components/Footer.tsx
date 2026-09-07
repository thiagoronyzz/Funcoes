import { ArrowUp, ArrowUpRight, Mail, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { categorias } from "../data/apps";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="bg-dots-light absolute inset-0 opacity-20" />
      <div className="absolute -top-40 left-1/3 size-[30rem] rounded-full bg-brand-600/30 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-20 md:px-8 md:pt-28">
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 flex flex-col gap-8 md:mb-28 md:flex-row md:items-end md:justify-between"
        >
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
              {"// Tem uma ideia?"}
            </span>
            <h2 className="max-w-xl font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.03em] md:text-6xl">
              Sugira o próximo <span className="text-brand-400">app</span>.
            </h2>
          </div>
          <a
            href="mailto:contato@ronycode.dev?subject=Ideia%20de%20app%20para%20a%20RONYCODE"
            className="group inline-flex w-fit items-center gap-3 rounded-full bg-brand-600 px-7 py-4 font-display text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-ink"
          >
            <Mail className="size-4" />
            Mandar sugestão
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        {/* meio */}
        <div className="flex flex-col gap-10 border-t border-white/10 pt-10 md:flex-row md:items-center md:justify-between">
          <a href="#topo" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Terminal className="size-4" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              RONY<span className="text-brand-400">CODE</span>
            </span>
          </a>

          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {categorias.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50 transition-colors hover:text-white"
                >
                  {c.titulo}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#topo"
            aria-label="Voltar ao topo"
            className="group grid size-12 place-items-center rounded-full ring-1 ring-white/15 transition-all duration-300 hover:bg-brand-600 hover:ring-brand-600"
          >
            <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* marca gigante */}
        <div
          aria-hidden
          className="text-stroke-white pointer-events-none mt-16 select-none whitespace-nowrap text-center font-display text-[13.5vw] font-bold uppercase leading-[0.82] tracking-[-0.02em] md:mt-20"
        >
          RONYCODE
        </div>

        {/* barra final */}
        <div className="mt-2 flex flex-col items-center justify-between gap-3 border-t border-white/10 pb-2 pt-6 md:flex-row">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            © {ano} RonyCode — Todos os direitos reservados
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            React + Tailwind — pt-BR
          </p>
        </div>
      </div>
    </footer>
  );
}
