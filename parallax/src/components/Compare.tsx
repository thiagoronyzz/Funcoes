import { ArrowUpRight, Check, GitCompare, ShieldAlert, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Btn, IconBtn, Meter, ScoreBar, SectionTitle } from "@/components/ui";
import { detectDarkPatterns } from "@/core/darkpatterns";
import { useParallax } from "@/core/store";
import { PRODUCTS, priceHistory } from "@/data/sites";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Comparação cross-loja
   Você abre 3 lojas; o Parallax normaliza specs, cruza o histórico de preço,
   filtra reviews e marca os dark patterns de cada oferta.
   ──────────────────────────────────────────────────────────────────────────── */

export function CompareDock() {
  const { state, dispatch } = useParallax();
  const [open, setOpen] = useState(false);
  const items = state.cart
    .map((line) => PRODUCTS.find((p) => p.id === line.productId))
    .filter((p): p is (typeof PRODUCTS)[number] => Boolean(p));

  if (items.length === 0) return null;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-t border-gold/30 bg-gradient-to-r from-gold/12 to-vio/10 px-3 py-1.5">
        <GitCompare className="size-3.5 text-gold" />
        <span className="text-[10.5px] font-medium text-ink">
          comparação cross-loja · <span className="mono">{items.length}</span> produto(s)
        </span>
        <span className="hidden items-center gap-1 text-[9.5px] text-dim sm:flex">
          {items.map((p) => (
            <span key={p.id} className="rounded-full border border-line bg-night2/70 px-1.5 py-0.5">
              {p.store}
            </span>
          ))}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Btn size="xs" variant="gold" onClick={() => setOpen(true)}>
            comparar lado a lado
          </Btn>
          <IconBtn size="sm" title="Limpar comparação" onClick={() => items.forEach((p) => dispatch({ type: "cartRemove", productId: p.id }))}>
            <X className="size-3" />
          </IconBtn>
        </div>
      </div>
      <CompareModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CompareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useParallax();
  const items = state.cart
    .map((line) => PRODUCTS.find((p) => p.id === line.productId))
    .filter((p): p is (typeof PRODUCTS)[number] => Boolean(p));

  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    items.forEach((p) => Object.keys(p.specs).forEach((k) => keys.add(k)));
    return [...keys];
  }, [items]);

  const histories = useMemo(() => new Map(items.map((p) => [p.id, priceHistory(p)])), [items]);
  const best = items.slice().sort((a, b) => a.price - b.price)[0];
  const bestValue = items.slice().sort((a, b) => b.longTermScore - a.longTermScore)[0];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[92] grid place-items-center bg-black/75 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-2.5">
          <div>
            <p className="m-0 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <GitCompare className="size-4 text-gold" /> Comparação normalizada
            </p>
            <p className="m-0 text-[10px] text-dim">
              specs alinhadas · histórico de 90 dias · reviews filtradas · dark patterns por loja
            </p>
          </div>
          <IconBtn size="sm" onClick={onClose} title="Fechar">
            <X className="size-3.5" />
          </IconBtn>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-auto p-3">
          {items.length === 0 ? (
            <p className="m-0 p-6 text-center text-[11px] text-dim">
              Adicione produtos de lojas diferentes (aba Compra) para o comparador montar a tabela.
            </p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(120px,150px) repeat(${items.length}, minmax(190px,1fr))` }}>
              <div />
              {items.map((p) => {
                const patterns = detectDarkPatterns({
                  text: p.name,
                  oldPrice: p.oldPrice,
                  price: p.price,
                  fakeReviewShare: p.fakeShare,
                  store: p.store,
                });
                const hist = histories.get(p.id) ?? [];
                const min = Math.min(...hist.map((h) => h.price));
                const max = Math.max(...hist.map((h) => h.price));
                return (
                  <div key={p.id} className={cn("rounded-xl border p-2.5", p.id === best?.id ? "border-mint/40 bg-mint/6" : "border-line bg-panel2/50")}>
                    <div className="flex items-start gap-1.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md text-[15px]" style={{ background: `${p.accent}18`, color: p.accent }}>
                        {p.glyph}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[9px] uppercase tracking-wider" style={{ color: p.accent }}>
                          {p.store}
                        </p>
                        <p className="m-0 line-clamp-2 text-[10.5px] font-medium leading-snug text-ink">{p.name}</p>
                      </div>
                      <button type="button" onClick={() => dispatch({ type: "cartRemove", productId: p.id })} className="shrink-0 text-faint hover:text-rose" title="Remover da comparação">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    <p className="m-0 mt-1.5 font-display text-[17px] font-bold text-ink">
                      R$ {p.price.toLocaleString("pt-BR")}
                      {p.id === best?.id && <span className="ml-1 rounded bg-mint/20 px-1 py-0.5 text-[8px] font-semibold uppercase text-mint">menor preço</span>}
                    </p>
                    {p.oldPrice && (
                      <p className="m-0 text-[9px] text-dim">
                        “de” R$ {p.oldPrice.toLocaleString("pt-BR")} ·{" "}
                        <span className="text-gold">histórico 90d: R$ {min.toLocaleString("pt-BR")}–{max.toLocaleString("pt-BR")}</span>
                      </p>
                    )}
                    <PriceSpark data={hist} accent={p.accent} />
                    <div className="mt-1 space-y-1">
                      <ScoreBar value={p.longTermScore} color={p.longTermScore > 8 ? "#7ce0b1" : p.longTermScore > 7 ? "#f0c987" : "#f08f8f"} />
                      <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">nota de longo prazo (reviews &gt; 6 meses)</p>
                      <div className="flex items-center justify-between gap-1 text-[9px] text-dim">
                        <span>{p.rating} ★ · {p.reviews.toLocaleString("pt-BR")} reviews</span>
                        <span className={p.fakeShare > 0.15 ? "text-rose" : "text-mint"}>
                          {Math.round(p.fakeShare * 100)}% suspeitas
                        </span>
                      </div>
                      {patterns.length > 0 && (
                        <div className="rounded border border-rose/25 bg-rose/8 px-1.5 py-1">
                          <p className="m-0 flex items-center gap-1 text-[9px] font-semibold text-rose">
                            <ShieldAlert className="size-2.5" /> {patterns.length} dark pattern(s)
                          </p>
                          <p className="m-0 mt-0.5 line-clamp-2 text-[8.5px] leading-snug text-dim">{patterns.map((x) => x.label).join(" · ")}</p>
                        </div>
                      )}
                      <div className="flex gap-1 pt-0.5">
                        <Btn size="xs" variant="outline" onClick={() => dispatch({ type: "wishlist", productId: p.id })}>
                          {state.wishlist.includes(p.id) ? "salvo" : "salvar"}
                        </Btn>
                        <Btn
                          size="xs"
                          variant="ghost"
                          icon={<ArrowUpRight className="size-3" />}
                          onClick={() => dispatch({ type: "toast", title: "Link direto bloqueado no protótipo", detail: `No produto real, abriria ${p.store} já com a camada de preço real aplicada.`, tone: "info" })}
                        >
                          abrir
                        </Btn>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* linhas de specs */}
              <div className="col-span-full mt-1 grid gap-2" style={{ gridTemplateColumns: `minmax(120px,150px) repeat(${items.length}, minmax(190px,1fr))` }}>
                {allSpecKeys.map((key) => (
                  <div key={key} className="contents">
                    <div className="flex items-start border-t border-line pt-1.5 text-[9.5px] font-medium uppercase tracking-wider text-faint">{key}</div>
                    {items.map((p) => (
                      <div key={p.id + key} className="border-t border-line pt-1.5 text-[10.5px] text-ink2">
                        {p.specs[key] ?? <span className="text-faint">—</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
            <Badge color="#7ce0b1">menor preço: {best.store}</Badge>
            <Badge color="#f0c987">melhor custo-benefício: {bestValue.store}</Badge>
            <Badge color="#c7a6ff">{items.length} ofertas normalizadas</Badge>
            <span className="ml-auto flex items-center gap-1.5 text-[9.5px] text-dim">
              <TrendingDown className="size-3 text-mint" /> o comparador ignora frete “calculado no fim” e cupom não cumulativo
              <TrendingUp className="size-3 text-gold" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceSpark({ data, accent }: { data: { day: number; price: number }[]; accent: string }) {
  if (data.length === 0) return null;
  const w = 160;
  const h = 34;
  const min = Math.min(...data.map((d) => d.price));
  const max = Math.max(...data.map((d) => d.price));
  const span = max - min || 1;
  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * w} ${h - ((d.price - min) / span) * (h - 4) - 2}`)
    .join(" ");
  const last = data[data.length - 1];

  return (
    <div className="mt-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" aria-label="histórico de preço de 90 dias">
        <path d={path} fill="none" stroke={accent} strokeWidth={1.3} />
        <circle cx={w} cy={h - ((last.price - min) / span) * (h - 4) - 2} r={2} fill={accent} />
        <line x1={0} y1={h - 2} x2={w} y2={h - 2} stroke="#ffffff12" strokeWidth={0.5} />
      </svg>
      <div className="flex justify-between text-[8px] text-faint">
        <span>90d atrás</span>
        <span>hoje</span>
      </div>
    </div>
  );
}

export function PriceHistoryCard({ productId }: { productId: string }) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return null;
  const hist = priceHistory(p);
  const min = Math.min(...hist.map((h) => h.price));
  const max = Math.max(...hist.map((h) => h.price));
  const avg = Math.round(hist.reduce((a, b) => a + b.price, 0) / hist.length);
  return (
    <div className="rounded-lg border border-line bg-panel2/40 p-2">
      <SectionTitle icon={<TrendingDown className="size-3.5" />} title="histórico real de preço" hint="90 dias · dados desta demo" />
      <PriceSpark data={hist} accent={p.accent} />
      <div className="mt-1 grid grid-cols-3 gap-1 text-center">
        {[
          { l: "mínimo", v: min },
          { l: "média", v: avg },
          { l: "hoje", v: p.price },
        ].map((x) => (
          <div key={x.l}>
            <p className="m-0 mono text-[10.5px] text-ink">R$ {x.v.toLocaleString("pt-BR")}</p>
            <p className="m-0 text-[8px] uppercase tracking-wider text-faint">{x.l}</p>
          </div>
        ))}
      </div>
      <p className="m-0 mt-1 flex items-start gap-1 text-[9px] leading-snug text-dim">
        {p.price <= avg ? <Check className="mt-0.5 size-2.5 shrink-0 text-mint" /> : <TrendingUp className="mt-0.5 size-2.5 shrink-0 text-gold" />}
        {p.price <= avg ? "abaixo da média dos últimos 90 dias" : "acima da média dos últimos 90 dias — se não é urgente, espere"}
      </p>
      <div className="mt-1">
        <Meter value={p.price / max} color={p.price <= avg ? "#7ce0b1" : "#f0c987"} label="preço vs. topo do período" hint={`${Math.round((p.price / max) * 100)}%`} />
      </div>
    </div>
  );
}
