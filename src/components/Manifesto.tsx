import { motion } from "framer-motion";
import { Gauge, RefreshCw } from "lucide-react";

const pilares = [
  {
    Icone: Gauge,
    titulo: "Leve e rápido",
    texto: "Tudo roda direto no navegador: abriu, funcionou. Sem instalação.",
  },
  {
    Icone: RefreshCw,
    titulo: "Sempre vivo",
    texto: "Novos aplicativos e melhorias entram na plataforma o tempo todo.",
  },
];

const linhas = [
  { texto: "Tudo o que eu", azul: false },
  { texto: "construo, mora", azul: false },
  { texto: "aqui.", azul: true },
];

export default function Manifesto() {
  return (
    <section id="sobre" className="relative scroll-mt-20 overflow-hidden py-24 md:py-36">
      <div className="absolute -left-40 top-1/3 size-[28rem] rounded-full bg-brand-200/40 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-10 flex items-center gap-3"
        >
          <span className="size-2 rounded-full bg-brand-600" />
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-ink/50">
            Sobre a plataforma
          </span>
        </motion.div>

        <h2 className="font-display font-bold uppercase leading-[0.95] tracking-[-0.035em]">
          {linhas.map((linha, i) => (
            <span key={linha.texto} className="block overflow-hidden pb-1">
              <motion.span
                initial={{ y: "110%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.95,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.12,
                }}
                className={`block text-[clamp(2.6rem,7.5vw,6.5rem)] ${
                  linha.azul ? "text-brand-400" : ""
                }`}
              >
                {linha.texto}
              </motion.span>
            </span>
          ))}
        </h2>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[1.75rem] bg-ink/10 ring-1 ring-ink/10 md:mt-20 md:grid-cols-2">
          {pilares.map((p, i) => (
            <motion.div
              key={p.titulo}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              data-hover
              className="group flex flex-col gap-4 bg-surface p-8 transition-colors duration-500 hover:bg-brand-600 md:p-10"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-surface2 text-brand-300 ring-1 ring-line transition-colors duration-500 group-hover:bg-white/10 group-hover:text-white group-hover:ring-white/20">
                <p.Icone className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className="font-display text-xl font-bold tracking-tight transition-colors duration-500 group-hover:text-white">
                {p.titulo}
              </h3>
              <p className="text-sm leading-relaxed text-ink/55 transition-colors duration-500 group-hover:text-white/75">
                {p.texto}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
