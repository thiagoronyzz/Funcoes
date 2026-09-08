import { motion } from "framer-motion";
import { Gauge, Smartphone, WifiOff } from "lucide-react";
import { BotaoBaixarApp } from "./InstallApp";
import { usePwaInstall } from "../hooks/usePwaInstall";

const beneficios = [
  {
    icone: Smartphone,
    titulo: "Na tela inicial",
    texto: "Acesse o catálogo como um aplicativo, sem abrir uma nova aba.",
  },
  {
    icone: WifiOff,
    titulo: "Disponível offline",
    texto: "Os aplicativos que você já acessou continuam disponíveis sem conexão.",
  },
  {
    icone: Gauge,
    titulo: "Sem excesso",
    texto: "Uma instalação leve, sem loja, cadastro ou publicidade invasiva.",
  },
];

export default function DownloadSection() {
  const { instalado } = usePwaInstall();

  if (instalado) return null;

  return (
    <section id="baixar" className="border-t border-line bg-surface py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-700">
            Versão para celular
          </span>
          <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.04em] md:text-7xl">
            Um acesso direto ao catálogo.
          </h2>
          <p className="mt-7 max-w-md text-base leading-relaxed text-ink/60">
            Instale a plataforma na tela inicial e consulte seus aplicativos com
            a mesma simplicidade, no celular ou no computador.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <BotaoBaixarApp variante="primario" rotulo="Instalar aplicativo" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
              Instalação gratuita
            </span>
          </div>

          <ul className="mt-12 grid gap-0 border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line">
            {beneficios.map((beneficio) => (
              <li key={beneficio.titulo} className="border-b border-line py-5 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                <beneficio.icone className="mb-4 size-4 text-brand-700" strokeWidth={1.7} />
                <p className="font-body text-sm font-semibold">{beneficio.titulo}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink/55">{beneficio.texto}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75 }}
          className="border border-ink/20 bg-paper p-3"
        >
          <div className="relative overflow-hidden border border-line">
            <img
              src="/images/editorial/study-night.jpg"
              alt="Mesa de trabalho iluminada por um abajur"
              className="aspect-[4/5] w-full object-cover grayscale-[0.15]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-ink/85 p-5 text-paper">
              <p className="font-display text-2xl">Zcode</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
                Aplicativos no seu ritmo
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
