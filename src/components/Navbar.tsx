import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { categorias } from "../data/apps";
import { cn } from "../utils/cn";

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-extrabold text-[#04120c]">
        Z
      </span>
      <span
        className={cn(
          "font-display text-xl font-extrabold tracking-tight",
          claro ? "text-white" : "text-neutral-900"
        )}
      >
        Zcode
      </span>
    </span>
  );
}

export default function Navbar() {
  const [rolado, setRolado] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolado(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-white/92 backdrop-blur-md transition-shadow duration-300",
        rolado ? "border-neutral-200 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.4)]" : "border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:h-[4.25rem] md:px-8">
        <a href="#topo" aria-label="Zcode — início">
          <Logo />
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <a
                href={`#${categoria.id}`}
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
              >
                {categoria.titulo}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#estudos"
            className="group hidden items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 md:inline-flex"
          >
            Começar grátis
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <button
            onClick={() => setAberto(!aberto)}
            className="grid size-10 place-items-center rounded-lg border border-neutral-200 text-neutral-800 md:hidden"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
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
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-neutral-200 bg-white md:hidden"
          >
            <ul className="divide-y divide-neutral-100 px-5">
              {categorias.map((categoria) => (
                <li key={categoria.id}>
                  <a
                    href={`#${categoria.id}`}
                    onClick={() => setAberto(false)}
                    className="flex items-center justify-between py-4 text-base font-semibold text-neutral-900"
                  >
                    {categoria.titulo}
                    <span className="font-mono text-[11px] text-neutral-400">
                      {categoria.apps.length} apps
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="px-5 pb-5 pt-2">
              <a
                href="#estudos"
                onClick={() => setAberto(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Começar grátis
                <ArrowRight className="size-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
