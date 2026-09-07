import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, Terminal, X } from "lucide-react";
import { categorias } from "../data/apps";
import { cn } from "../utils/cn";
import { BotaoBaixarApp } from "./InstallApp";
import { usePwaInstall } from "../hooks/usePwaInstall";

export default function Navbar() {
  const [rolado, setRolado] = useState(false);
  const [ativo, setAtivo] = useState("");
  const [aberto, setAberto] = useState(false);
  const { instalado } = usePwaInstall();

  useEffect(() => {
    const aoRolar = () => setRolado(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => e.isIntersecting && setAtivo(e.target.id)),
      { rootMargin: "-25% 0px -65% 0px" }
    );
    categorias.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observador.observe(el);
    });
    return () => observador.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        rolado
          ? "bg-white/80 shadow-[0_1px_0_0_rgba(6,11,36,0.07)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#topo" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-[0_10px_24px_-8px_rgba(10,61,255,0.6)] transition-transform duration-500 group-hover:-rotate-6">
            <Terminal className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            RONY<span className="text-brand-600">CODE</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {categorias.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className={cn(
                  "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300",
                  ativo === c.id ? "text-brand-600" : "text-ink/50 hover:text-ink"
                )}
              >
                {ativo === c.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-brand-50 ring-1 ring-brand-100"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{c.titulo}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#estudos"
            className="group hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-600 md:inline-flex"
          >
            Explorar apps
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <BotaoBaixarApp variante="escuro" className="hidden md:inline-flex" />
          <button
            onClick={() => setAberto(!aberto)}
            className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-ink/10 md:hidden"
            aria-label="Abrir menu"
          >
            {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-ink/5 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <ul className="space-y-1 px-5 py-4">
              {categorias.map((c, i) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    onClick={() => setAberto(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-2xl font-semibold tracking-tight transition-colors hover:bg-brand-50"
                  >
                    {c.titulo}
                    <span className="font-mono text-xs font-medium text-brand-600">
                      0{i + 1}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {!instalado && (
              <div className="px-5 pb-5">
                <BotaoBaixarApp
                  variante="primario"
                  rotulo="Baixar aplicativo"
                  className="w-full justify-center"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
