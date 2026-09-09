import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const perguntas = [
  {
    q: "Preciso pagar ou criar conta?",
    a: "Não. Todo o catálogo é gratuito, sem cadastro e sem limite de uso. Abra e use.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A plataforma se adapta a qualquer tela, e os jogos têm controles por toque. Você ainda pode instalar na tela inicial.",
  },
  {
    q: "Posso usar sem internet?",
    a: "Depois de instalar, os aplicativos que você já visitou continuam abrindo offline.",
  },
  {
    q: "Onde ficam meus dados?",
    a: "No seu próprio navegador: anotações, metas, recordes e preferências nunca saem do aparelho.",
  },
  {
    q: "Como sugiro um aplicativo ou aviso um erro?",
    a: "Pela página Fale Conosco, em Recursos. Descreva a ideia ou o problema com detalhes — prints ajudam.",
  },
  {
    q: "A Zcode serve para empresas e escolas?",
    a: "Sim. Por rodar no navegador sem cadastro, funciona bem em salas de aula, treinamentos e totens. Fale conosco para casos de uso maiores.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto w-full max-w-4xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
            Dúvidas frequentes
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
            Perguntas e respostas
          </h2>
        </motion.div>

        <div className="space-y-3">
          {perguntas.map((item, i) => (
            <motion.details
              key={item.q}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="group rounded-2xl border border-line bg-surface open:border-brand-500/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-ink/60 transition-transform group-open:rotate-45 group-open:border-brand-500/50 group-open:text-brand-400">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink/60">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
