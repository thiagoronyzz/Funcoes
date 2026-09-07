import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  Wrench,
} from "lucide-react";
import { totalApps } from "../data/apps";

const chips = [
  { Icone: GraduationCap, rotulo: "estudos", posicao: "right-[7%] top-[24%]", atraso: "0s" },
  { Icone: Gamepad2, rotulo: "jogos", posicao: "right-[22%] top-[46%]", atraso: "1.4s" },
  { Icone: Wrench, rotulo: "úteis", posicao: "right-[5%] top-[64%]", atraso: "0.7s" },
];

const stats = [
  { valor: String(totalApps).padStart(2, "0"), rotulo: "aplicativos" },
  { valor: "04", rotulo: "categorias" },
  { valor: "100%", rotulo: "no navegador" },
  { valor: "24/7", rotulo: "sempre no ar" },
];

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 42, damping: 18 });
  const sy = useSpring(my, { stiffness: 42, damping: 18 });

  const blobX = useTransform(sx, [-1, 1], [-55, 55]);
  const blobY = useTransform(sy, [-1, 1], [-35, 35]);
  const blob2X = useTransform(sx, [-1, 1], [40, -40]);
  const blob2Y = useTransform(sy, [-1, 1], [30, -30]);
  const chipX = useTransform(sx, [-1, 1], [18, -18]);
  const chipY = useTransform(sy, [-1, 1], [14, -14]);

  return (
    <section
      id="topo"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      className="relative flex min-h-screen flex-col overflow-hidden"
    >
      {/* fundo: grade de pontos + manchas azuis com parallax */}
      <div className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_75%_65%_at_50%_38%,black,transparent)]" />
      <motion.div
        style={{ x: blobX, y: blobY }}
        className="absolute -top-36 right-[6%] size-[36rem] rounded-full bg-brand-500/20 blur-[120px]"
      />
      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="absolute -bottom-24 left-[-12%] size-[30rem] rounded-full bg-brand-300/30 blur-[110px]"
      />
      <div className="absolute right-[16%] top-[18%] hidden lg:block">
        <div className="size-72 animate-spin-slow rounded-full border border-dashed border-brand-600/25" />
      </div>

      {/* chips flutuantes de categoria */}
      {chips.map(({ Icone, rotulo, posicao, atraso }) => (
        <motion.div
          key={rotulo}
          style={{ x: chipX, y: chipY }}
          className={`absolute z-20 hidden xl:block ${posicao}`}
        >
          <div
            className="flex animate-float items-center gap-3 rounded-2xl bg-white/90 p-3 pr-5 shadow-[0_20px_50px_-20px_rgba(6,11,36,0.25)] ring-1 ring-ink/5 backdrop-blur"
            style={{ animationDelay: atraso }}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
              <Icone className="size-5" strokeWidth={1.8} />
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink/70">
              {rotulo}
            </span>
          </div>
        </motion.div>
      ))}

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pt-32 md:px-8 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-7 flex items-center gap-3"
        >
          <span className="size-2 animate-pulse-dot rounded-full bg-brand-600" />
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-ink/60">
            Plataforma pessoal de aplicativos
          </span>
        </motion.div>

        <h1 className="font-display font-bold uppercase leading-[0.84] tracking-[-0.04em]">
          <span className="block overflow-hidden pb-1">
            <motion.span
              initial={{ y: "112%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="block text-[clamp(4.2rem,14.5vw,12.5rem)]"
            >
              RONY
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2 pl-[9vw]">
            <motion.span
              initial={{ y: "112%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
              className="text-stroke block text-[clamp(4.2rem,14.5vw,12.5rem)]"
            >
              CODE
              <span className="text-brand-600" style={{ WebkitTextStrokeWidth: 0 }}>
                .
              </span>
            </motion.span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="max-w-md font-display text-3xl font-bold tracking-tight text-ink md:text-5xl"
          >
            <span className="text-brand-600">RONYCODE</span> — 2026
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.68 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href="#estudos"
              className="group inline-flex items-center gap-3 rounded-full bg-brand-600 px-7 py-4 font-display text-sm font-semibold text-white shadow-[0_20px_44px_-14px_rgba(10,61,255,0.6)] transition-all duration-300 hover:bg-ink hover:shadow-[0_20px_44px_-14px_rgba(6,11,36,0.5)]"
            >
              Explorar aplicativos
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-1" />
            </a>
            <a
              href="#sobre"
              className="inline-flex items-center gap-2 rounded-full px-6 py-4 font-display text-sm font-semibold text-ink ring-1 ring-ink/15 transition-all duration-300 hover:bg-white hover:ring-brand-600/40"
            >
              <MessagesSquare className="size-4 text-brand-600" />
              Sobre a plataforma
            </a>
          </motion.div>
        </div>
      </div>

      {/* barra de estatísticas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.9 }}
        className="relative border-t border-ink/10 bg-white/60 backdrop-blur-sm"
      >
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-x divide-ink/10 px-5 md:grid-cols-4 md:px-8">
          {stats.map((s) => (
            <div key={s.rotulo} className="flex flex-col gap-1 px-4 py-5 md:px-8 md:py-6">
              <span className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {s.valor}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/50">
                {s.rotulo}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
