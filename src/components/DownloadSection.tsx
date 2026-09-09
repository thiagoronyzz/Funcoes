import { motion } from "framer-motion";
import { Check, Gauge, Smartphone, WifiOff } from "lucide-react";
import { BotaoBaixarApp } from "./InstallApp";
import { usePwaInstall } from "../hooks/usePwaInstall";

const beneficios = [
  {
    icone: Smartphone,
    titulo: "Na tela inicial",
    texto: "Acesse a plataforma como um aplicativo, sem abrir o navegador.",
  },
  {
    icone: WifiOff,
    titulo: "Disponível offline",
    texto: "Os aplicativos visitados continuam abrindo sem conexão.",
  },
  {
    icone: Gauge,
    titulo: "Leve e rápido",
    texto: "Poucos KB, sem loja, sem cadastro e sem publicidade invasiva.",
  },
];

export default function DownloadSection() {
  const { instalado } = usePwaInstall();

  if (instalado) return null;

  return (
    <section id="baixar" className="scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="card-sheen grid gap-10 overflow-hidden rounded-3xl border border-line p-8 md:p-12 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:gap-16"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
              Aplicativo instalável
            </p>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
              Leve a Zcode no bolso
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/60">
              Instale direto pelo navegador e consulte guias, jogos e ferramentas
              com um toque — no celular ou no computador.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BotaoBaixarApp variante="primario" rotulo="Instalar aplicativo" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
                Grátis · Sem loja
              </span>
            </div>

            <ul className="mt-9 space-y-5">
              {beneficios.map((beneficio) => (
                <li key={beneficio.titulo} className="flex items-start gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400">
                    <beneficio.icone className="size-4" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{beneficio.titulo}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink/55">
                      {beneficio.texto}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup do app instalado */}
          <div className="mx-auto w-full max-w-[280px]" aria-hidden>
            <div className="rounded-[2rem] border border-line bg-[#070b09] p-2.5 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.9)]">
              <div className="overflow-hidden rounded-[1.6rem] border border-line bg-surface">
                <div className="flex items-center justify-center border-b border-line py-2.5">
                  <span className="h-1.5 w-16 rounded-full bg-surface2" />
                </div>
                <div className="space-y-2.5 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-extrabold text-[#04120c]">
                      Z
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 rounded-full bg-surface2" />
                      <div className="h-2 w-1/2 rounded-full bg-surface2" />
                    </div>
                  </div>
                  {["#38bdf8", "#a78bfa", "#4ade80"].map((cor) => (
                    <div
                      key={cor}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-[#0b100d] p-2.5"
                    >
                      <span
                        className="size-8 rounded-lg"
                        style={{ backgroundColor: `${cor}26`, border: `1px solid ${cor}4d` }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-2/3 rounded-full bg-surface2" />
                        <div className="h-1.5 w-1/2 rounded-full bg-surface2" />
                      </div>
                      <Check className="size-3.5 text-brand-400" />
                    </div>
                  ))}
                  <div className="rounded-xl bg-brand-600 py-2.5 text-center text-xs font-bold text-white">
                    Abrir aplicativo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
