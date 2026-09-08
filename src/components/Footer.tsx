import { ArrowUp, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { categorias } from "../data/apps";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-20 md:px-8 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="mb-20 flex flex-col gap-8 border-b border-white/15 pb-20 md:mb-24 md:flex-row md:items-end md:justify-between md:pb-24"
        >
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
              Tem uma ideia?
            </span>
            <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.04em] md:text-7xl">
              Ajude a escolher o próximo aplicativo.
            </h2>
          </div>
          <a
            href="mailto:contato@zcode.dev?subject=Ideia%20de%20aplicativo"
            className="inline-flex w-fit items-center gap-3 border border-white/30 px-5 py-3 font-body text-sm font-semibold text-white hover:border-white hover:bg-white hover:text-ink"
          >
            <Mail className="size-4" />
            Enviar sugestão
          </a>
        </motion.div>

        <div className="flex flex-col gap-10 border-b border-white/15 pb-10 md:flex-row md:items-center md:justify-between">
          <a href="#topo" className="font-display text-3xl tracking-[-0.04em]">
            Zcode
          </a>

          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <a
                  href={`#${categoria.id}`}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white"
                >
                  {categoria.titulo}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#topo"
            aria-label="Voltar ao topo"
            className="grid size-10 place-items-center border border-white/25 hover:border-white hover:bg-white hover:text-ink"
          >
            <ArrowUp className="size-4" />
          </a>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            © {ano} Zcode — Todos os direitos reservados
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            Feito para a web · pt-BR
          </p>
        </div>
      </div>
    </footer>
  );
}
