import { motion } from "framer-motion";
import { Lock, MonitorSmartphone, ShieldCheck, WifiOff } from "lucide-react";

const recursos = [
  {
    icone: ShieldCheck,
    titulo: "Sem cadastro",
    texto: "Abra qualquer aplicativo direto. Sem conta, sem login, sem burocracia.",
  },
  {
    icone: MonitorSmartphone,
    titulo: "Tudo no navegador",
    texto: "Funciona no celular, no tablet e no computador. Nada para baixar.",
  },
  {
    icone: WifiOff,
    titulo: "Funciona offline",
    texto: "Instale na tela inicial e os apps visitados abrem mesmo sem internet.",
  },
  {
    icone: Lock,
    titulo: "Privacidade local",
    texto: "Anotações, metas e recordes ficam no seu navegador. Nada sai do aparelho.",
  },
];

export default function Features() {
  return (
    <section id="sobre" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
            Por que a Zcode
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
            Feita para usar todos os dias
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/60">
            Uma plataforma direta: cada aplicativo resolve uma necessidade real,
            com a mesma qualidade no celular e no computador.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map((recurso, index) => (
            <motion.div
              key={recurso.titulo}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.07 }}
              className="card-sheen rounded-2xl border border-line p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400">
                <recurso.icone className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{recurso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{recurso.texto}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
