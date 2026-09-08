import { motion } from "framer-motion";

const pilares = [
  {
    numero: "01",
    titulo: "Clareza",
    texto: "Cada aplicativo resolve uma tarefa específica sem excesso de etapas.",
  },
  {
    numero: "02",
    titulo: "Acesso",
    texto: "Tudo funciona no navegador, sem cadastro obrigatório ou instalação.",
  },
  {
    numero: "03",
    titulo: "Continuidade",
    texto: "A coleção cresce de forma gradual, com espaço para novas ideias.",
  },
];

export default function Manifesto() {
  return (
    <section id="sobre" className="relative scroll-mt-20 py-24 md:py-36">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50"
        >
          <span className="text-brand-700">Nota de abertura</span>
          <span className="h-px w-12 bg-brand-600" />
          Sobre a plataforma
        </motion.div>

        <h2 className="max-w-5xl font-display text-[clamp(3rem,7vw,6.8rem)] leading-[0.92] tracking-[-0.045em]">
          Ferramentas bem pensadas deixam mais espaço para o que importa.
        </h2>

        <div className="mt-16 grid border-y border-ink/25 md:mt-20 md:grid-cols-3 md:divide-x md:divide-line">
          {pilares.map((pilar, index) => (
            <motion.div
              key={pilar.numero}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="flex flex-col gap-5 border-b border-line py-7 last:border-b-0 md:border-b-0 md:px-8 md:py-9 md:first:pl-0 md:last:pr-0"
            >
              <span className="font-mono text-[10px] tracking-[0.2em] text-brand-700">{pilar.numero}</span>
              <h3 className="font-display text-3xl tracking-tight">{pilar.titulo}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-ink/60">{pilar.texto}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
