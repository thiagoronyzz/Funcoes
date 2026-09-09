import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid, Search } from "lucide-react";
import type { Categoria } from "../data/apps";
import AppCard, { CORES } from "./AppCard";

const LANDINGS: Record<string, string> = {
  estudos: "/ZCODE/Estudos/",
  jogos: "/ZCODE/Jogos/",
  uteis: "/ZCODE/Úteis/",
};

const DESTAQUES = 8;

interface Props {
  categoria: Categoria;
}

export default function CategorySection({ categoria }: Props) {
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(false);
  const cor = CORES[categoria.id];
  const landing = LANDINGS[categoria.id];
  const comBusca = categoria.apps.length > DESTAQUES;

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return categoria.apps;
    return categoria.apps.filter((app) =>
      `${app.nome} ${app.descricao}`.toLowerCase().includes(t)
    );
  }, [busca, categoria.apps]);

  const visiveis = busca.trim() || expandido || !comBusca ? filtrados : filtrados.slice(0, DESTAQUES);
  const ocultos = filtrados.length - visiveis.length;

  return (
    <section id={categoria.id} className="relative scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: cor, borderColor: `${cor}4d`, backgroundColor: `${cor}12` }}
              >
                <LayoutGrid className="size-3" />
                {categoria.apps.length} aplicativos
              </p>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
                {categoria.titulo}
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">
                {categoria.descricao}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              {comBusca && (
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder={`Buscar em ${categoria.titulo.toLowerCase()}…`}
                    className="w-full rounded-xl border border-line bg-[#0b100d] py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brand-500/60 focus:outline-none sm:w-64"
                  />
                </label>
              )}
              {landing && (
                <a
                  href={landing}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink/85 hover:border-brand-500/50 hover:text-ink"
                >
                  Diretório completo
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {busca.trim() && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/45">
            {filtrados.length} resultado{filtrados.length === 1 ? "" : "s"} para “{busca.trim()}”
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visiveis.map((app) => (
            <AppCard key={app.nome} app={app} categoria={categoria.id} />
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-lg font-bold">Nenhum aplicativo encontrado</p>
            <p className="mt-1 text-sm text-ink/55">Tente outro termo ou abra o diretório completo.</p>
          </div>
        )}

        {!busca.trim() && ocultos > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setExpandido(!expandido)}
              className="rounded-xl border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink/80 hover:border-brand-500/50 hover:text-ink"
            >
              {expandido ? "Mostrar menos" : `Mostrar todos os ${filtrados.length}`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
