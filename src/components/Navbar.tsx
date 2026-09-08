import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) setAtivo(entrada.target.id);
        }),
      { rootMargin: "-25% 0px -65% 0px" }
    );
    categorias.forEach((categoria) => {
      const elemento = document.getElementById(categoria.id);
      if (elemento) observador.observe(elemento);
    });
    return () => observador.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        rolado
          ? "border-line bg-paper/95 backdrop-blur-sm"
          : "border-transparent bg-paper/90"
      )}
    >
      <nav className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#topo" className="group flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-[-0.04em]">Zcode</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-ink/45 sm:inline">
            catálogo de aplicativos
          </span>
        </a>

        <ul className="hidden items-center gap-6 md:flex">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <a
                href={`#${categoria.id}`}
                className={cn(
                  "border-b pb-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                  ativo === categoria.id
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-ink/55 hover:border-ink/35 hover:text-ink"
                )}
              >
                {categoria.titulo}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <BotaoBaixarApp
            variante="escuro"
            rotulo="Instalar"
            className="hidden md:inline-flex"
          />
          <button
            onClick={() => setAberto(!aberto)}
            className="grid size-10 place-items-center border border-line bg-surface md:hidden"
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
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <ul className="divide-y divide-line px-5">
              {categorias.map((categoria, index) => (
                <li key={categoria.id}>
                  <a
                    href={`#${categoria.id}`}
                    onClick={() => setAberto(false)}
                    className="flex items-center justify-between py-4 font-display text-2xl"
                  >
                    {categoria.titulo}
                    <span className="font-mono text-[10px] tracking-[0.2em] text-ink/45">
                      0{index + 1}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {!instalado && (
              <div className="px-5 pb-5 pt-4">
                <BotaoBaixarApp
                  variante="primario"
                  rotulo="Instalar aplicativo"
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
