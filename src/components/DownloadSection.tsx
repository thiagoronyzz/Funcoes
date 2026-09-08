import { motion } from "framer-motion";
import { CloudOff, Rocket, Smartphone, Zap } from "lucide-react";
import { BotaoBaixarApp } from "./InstallApp";
import { usePwaInstall } from "../hooks/usePwaInstall";

const beneficios = [
  {
    icone: Rocket,
    titulo: "Ícone na tela inicial",
    texto: "Abre em tela cheia, sem barra de navegador — igual app de loja.",
  },
  {
    icone: CloudOff,
    titulo: "Funciona offline",
    texto: "Os apps que você já abriu continuam disponíveis sem internet.",
  },
  {
    icone: Zap,
    titulo: "Leve e instantâneo",
    texto: "Poucos KB, sem Play Store, sem App Store, sem cadastro.",
  },
];

export default function DownloadSection() {
  const { instalado } = usePwaInstall();

  if (instalado) return null;

  return (
    <section id="baixar" className="relative overflow-hidden bg-paper py-20 md:py-28">
      <div className="absolute -left-24 top-10 size-[26rem] rounded-full bg-brand-200/40 blur-[130px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-brand-400">
              {"// Versão para celular"}
            </span>
            <h2 className="max-w-xl font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.03em] md:text-6xl">
              Baixe o <span className="text-brand-400">app</span> Zcode
            </h2>
            <p className="max-w-md text-base leading-relaxed text-ink/60">
              Todos os aplicativos num só ícone no seu celular. Instalação em um
              toque, direto pelo navegador — Android, iPhone ou computador.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <BotaoBaixarApp variante="primario" rotulo="Baixar aplicativo" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">
                Grátis · sem loja
              </span>
            </div>

            <ul className="mt-2 grid gap-3 sm:grid-cols-3">
              {beneficios.map((b) => (
                <li
                  key={b.titulo}
                  className="rounded-2xl bg-surface p-4 ring-1 ring-line"
                >
                  <b.icone className="mb-2 size-5 text-brand-300" />
                  <p className="font-display text-sm font-semibold">{b.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/55">
                    {b.texto}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* mockup de celular */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[280px]"
          >
            <div className="animate-float rounded-[2.6rem] bg-surface p-3 ring-1 ring-line shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-gradient-to-b from-brand-600 to-brand-800">
                <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black/60" />
                <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                  <span className="grid size-20 place-items-center rounded-3xl bg-white/95 font-display text-4xl font-bold text-brand-600 shadow-lg">
                    Z
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-white">
                      ZCODE
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                      Todos os apps
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/25">
                    <Smartphone className="size-3.5" />
                    Instalado
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
