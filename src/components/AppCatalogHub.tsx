import { useState, useMemo, useEffect } from "react";
import { Search, Star, Play, Sparkles, Filter, Check } from "lucide-react";
import { categorias, type AppItem, type CategoriaId } from "../data/apps";
import AppModal from "./AppModal";

export default function AppCatalogHub() {
  const [activeCategory, setActiveCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("zcode_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(36);

  useEffect(() => {
    try {
      localStorage.setItem("zcode_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (appName: string) => {
    setFavorites((prev) =>
      prev.includes(appName) ? prev.filter((n) => n !== appName) : [...prev, appName]
    );
  };

  // Coletar todos os apps com categoria associada
  const allAppsWithCat = useMemo(() => {
    const list: { app: AppItem; catId: CategoriaId; catLabel: string }[] = [];
    categorias.forEach((cat) => {
      cat.apps.forEach((app) => {
        list.push({ app, catId: cat.id, catLabel: cat.titulo });
      });
    });
    return list;
  }, []);

  // Filtragem ao vivo por busca, categoria e favoritos
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allAppsWithCat.filter(({ app, catId }) => {
      if (activeCategory === "favoritos") {
        if (!favorites.includes(app.nome)) return false;
      } else if (activeCategory !== "todas" && catId !== activeCategory) {
        return false;
      }

      if (query) {
        const matchName = app.nome.toLowerCase().includes(query);
        const matchDesc = app.descricao.toLowerCase().includes(query);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [allAppsWithCat, activeCategory, searchQuery, favorites]);

  // Resetar paginação quando filtros mudarem
  useEffect(() => {
    setDisplayLimit(36);
  }, [activeCategory, searchQuery]);

  const visibleApps = filteredApps.slice(0, displayLimit);

  return (
    <section id="catalogo" className="scroll-mt-16 py-16 md:py-24 bg-paper">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        {/* Header do Catálogo */}
        <div className="mb-10 text-center md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-brand-700">
            <Sparkles className="size-3.5" />
            <span>Ecossistema Zcode · 810+ Aplicativos Únicos</span>
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl text-ink">
            Explore o Catálogo Completo
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/65">
            Ferramentas interativas de estudos, utilitários de alta performance e jogos com mecânicas sofisticadas. Sem anúncios, direto no navegador.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mb-8 flex flex-col gap-4 border border-line bg-surface p-4 rounded-xl shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Tabs de Categoria */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("todas")}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition ${
                activeCategory === "todas"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface2 text-ink/70 hover:bg-line/20 hover:text-ink"
              }`}
            >
              Todas ({allAppsWithCat.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("estudos")}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition ${
                activeCategory === "estudos"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface2 text-ink/70 hover:bg-line/20 hover:text-ink"
              }`}
            >
              Estudos (270)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("uteis")}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition ${
                activeCategory === "uteis"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface2 text-ink/70 hover:bg-line/20 hover:text-ink"
              }`}
            >
              Úteis (270)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("jogos")}
              className={`rounded-lg px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition ${
                activeCategory === "jogos"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface2 text-ink/70 hover:bg-line/20 hover:text-ink"
              }`}
            >
              Jogos (270)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("favoritos")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition ${
                activeCategory === "favoritos"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-surface2 text-ink/70 hover:bg-line/20 hover:text-ink"
              }`}
            >
              <Star className="size-3.5 fill-amber-300 text-amber-300" />
              <span>Favoritos ({favorites.length})</span>
            </button>
          </div>

          {/* Campo de Busca Instantânea */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou objetivo..."
              className="w-full rounded-lg border border-line bg-paper pl-10 pr-4 py-2 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>

        {/* Contador de Resultados */}
        <div className="mb-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink/50">
          <span>Exibindo {visibleApps.length} de {filteredApps.length} aplicativos</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-brand-700 underline hover:text-brand-800"
            >
              Limpar busca
            </button>
          )}
        </div>

        {/* Grid de Aplicativos */}
        {filteredApps.length === 0 ? (
          <div className="my-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-line p-12 text-center bg-surface">
            <Filter className="size-10 text-ink/30 mb-3" />
            <h3 className="font-display text-xl font-bold text-ink">Nenhum aplicativo encontrado</h3>
            <p className="mt-1 text-sm text-ink/60">Tente buscar outro termo ou selecione uma categoria diferente.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleApps.map(({ app, catLabel }) => {
              const isFav = favorites.includes(app.nome);
              return (
                <div
                  key={app.nome}
                  className="group relative flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-600/50 hover:shadow-lg"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {catLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(app.nome)}
                        className="text-ink/30 transition hover:text-amber-500"
                        title="Favoritar"
                      >
                        <Star
                          className={`size-4 ${isFav ? "fill-amber-400 text-amber-500" : ""}`}
                        />
                      </button>
                    </div>

                    <h3 className="font-display text-lg font-bold leading-tight text-ink group-hover:text-brand-700 transition">
                      {app.nome}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/65 line-clamp-3">
                      {app.descricao}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand-700 hover:text-brand-800 transition"
                    >
                      <Play className="size-3.5 fill-brand-700" />
                      <span>Executar App</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão de Carregar Mais */}
        {displayLimit < filteredApps.length && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setDisplayLimit((prev) => prev + 36)}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-600 bg-brand-600 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-white shadow-md transition hover:bg-brand-700 hover:shadow-lg"
            >
              <span>Carregar Mais Aplicativos</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Iframe de Execução */}
      {selectedApp && (
        <AppModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          isFavorite={favorites.includes(selectedApp.nome)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </section>
  );
}
