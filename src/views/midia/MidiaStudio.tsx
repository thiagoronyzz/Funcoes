import { Box, Film, Image as ImageIcon, Loader2, Sparkles, Trash2, UploadCloud, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { assetFromImageDataUrl, assetFromVideoBlob, defaultGenOptions, generateImageDataUrl, generateVideoBlob, GENERATORS, renderGenerator, type GenKind, type GenOptions } from "@/core/generate";
import { importFilesPersist } from "@/core/media";
import { store, useEditzz } from "@/core/store";
import { Badge, Btn, Chip, EmptyState, Sel, Slider, TextField, Toggle } from "@/components/ui";
import { cn, fmtBytes, fmtDuration, pickFiles } from "@/lib/utils";

const PALETTES: { name: string; c1: string; c2: string }[] = [
  { name: "Neon", c1: "#a855f7", c2: "#22d3ee" },
  { name: "Pôr do sol", c1: "#f97316", c2: "#f472b6" },
  { name: "Oceano", c1: "#0ea5e9", c2: "#14b8a6" },
  { name: "Floresta", c1: "#22c55e", c2: "#a3e635" },
  { name: "Vinho", c1: "#be123c", c2: "#fbbf24" },
  { name: "Grafite", c1: "#64748b", c2: "#0f172a" },
];

export default function MidiaStudio() {
  const { state, store: s } = useEditzz();
  const [kindFilter, setKindFilter] = useState<"todos" | "video" | "image" | "audio">("todos");
  const [gen, setGen] = useState<GenKind>(GENERATORS[0].id);
  const [opts, setOpts] = useState<GenOptions>(() => ({ ...defaultGenOptions(), width: 1280, height: 720 }));
  const [seconds, setSeconds] = useState(6);
  const [fps, setFps] = useState(30);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const def = useMemo(() => GENERATORS.find((g) => g.id === gen) ?? GENERATORS[0], [gen]);
  const assets = state.assets.filter((a) => kindFilter === "todos" || a.kind === kindFilter);
  const totalBytes = state.assets.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);

  /* prévia animada do gerador selecionado */
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const w = 320;
    const h = Math.round((w * opts.height) / Math.max(1, opts.width));
    canvas.width = w;
    canvas.height = h;
    const t0 = performance.now();
    const loop = () => {
      if (!alive) return;
      const t = (performance.now() - t0) / 1000;
      renderGenerator(gen, ctx, t, { ...opts, width: w, height: h });
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [gen, opts]);

  const makeImage = async () => {
    setBusy("Gerando imagem…");
    try {
      const dataUrl = generateImageDataUrl(gen, opts);
      const asset = assetFromImageDataUrl(`${def.name} (imagem)`, dataUrl, opts.width, opts.height);
      asset.origin = "gerado";
      s.addAssets([asset]);
      store.toast("Imagem gerada", "Adicionada ao acervo · clique em + para ir à timeline.", "ok");
    } finally {
      setBusy(null);
    }
  };

  const makeVideo = async () => {
    setBusy("Gravando clipe gerado…");
    setProgress(0);
    try {
      const blob = await generateVideoBlob(gen, opts, seconds, setProgress, fps);
      if (!blob) {
        store.toast("Gravação indisponível", "Este navegador não suporta MediaRecorder.", "erro");
        return;
      }
      const asset = await assetFromVideoBlob(`${def.name} (${seconds}s)`, blob, gen);
      s.addAssets([asset]);
      store.toast("Clipe gerado", `${seconds}s · ${fmtBytes(blob.size)} · pronto para a timeline`, "ok");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const importFiles = async (files: File[]) => {
    if (!files.length) return;
    setBusy("Importando…");
    try {
      const imported = await importFilesPersist(files);
      s.addAssets(imported);
      store.toast(`${imported.length} arquivo(s) importado(s)`, "Guardados no navegador para reabrir depois.", "ok");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <div className="panel flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <span className="font-display text-[12.5px] font-semibold text-ink">Estúdio de mídia</span>
        <Badge color="#22d3ee">gerador procedural</Badge>
        <Chip>{state.assets.length} itens</Chip>
        {totalBytes > 0 && <Chip>{fmtBytes(totalBytes)} no acervo</Chip>}
        <div className="ml-auto flex items-center gap-1.5">
          <Btn size="sm" icon={<UploadCloud className="size-3.5" />} onClick={() => void pickFiles("video/*,image/*,audio/*").then(importFiles)}>
            Importar arquivos
          </Btn>
          <Btn
            size="sm"
            variant="danger"
            icon={<Trash2 className="size-3.5" />}
            onClick={() => {
              if (!state.assets.length) return;
              if (window.confirm(`Remover todos os ${state.assets.length} itens do acervo? Os clipes continuam na timeline.`)) {
                state.assets.forEach((a) => s.removeAsset(a.id));
                store.toast("Acervo limpo", undefined, "info");
              }
            }}
          >
            limpar acervo
          </Btn>
        </div>
      </div>

      <div className="media-studio-layout">
        {/* biblioteca */}
        <div className="panel flex min-h-0 flex-col p-2">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="font-display text-[11.5px] font-semibold text-ink">Acervo</span>
            {(["todos", "video", "image", "audio"] as const).map((k) => (
              <Chip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
                {k === "todos" ? "todos" : k === "video" ? "vídeos" : k === "image" ? "fotos" : "áudios"}
              </Chip>
            ))}
            <span className="ml-auto text-[10px] text-dim">duplo clique abre na timeline</span>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-1">
            {assets.length === 0 ? (
              <EmptyState
                icon={<Box className="size-6" />}
                title="Acervo vazio"
                desc="Importe arquivos ou gere mídia procedural — fundos animados, partículas, cartões e barras de cor."
                action={
                  <Btn size="sm" variant="primary" icon={<Wand2 className="size-3.5" />} onClick={() => void makeImage()}>
                    Gerar uma imagem
                  </Btn>
                }
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="group overflow-hidden rounded-xl border border-line bg-panel2/50">
                    <div className="relative h-24 bg-bg2">
                      {asset.thumb ? (
                        <img src={asset.thumb} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-dim">
                          {asset.kind === "video" ? <Film className="size-5" /> : asset.kind === "audio" ? <Sparkles className="size-5" /> : <ImageIcon className="size-5" />}
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white">{asset.kind}</span>
                      {asset.origin !== "arquivo" && (
                        <span className="absolute right-1 top-1 rounded bg-vio/80 px-1 text-[9px] text-white">{asset.origin}</span>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[10.5px] text-ink">{asset.name}</p>
                      <p className="text-[9.5px] text-dim">
                        {asset.duration > 0 ? fmtDuration(asset.duration) : ""} {asset.width > 0 ? `${asset.width}×${asset.height}` : ""}
                      </p>
                      <div className="mt-1 flex gap-1">
                        <Btn size="xs" full onClick={() => s.addAssetToTimeline(asset)}>
                          + timeline
                        </Btn>
                        <Btn size="xs" variant="ghost" onClick={() => s.removeAsset(asset.id)} title="Remover do acervo">
                          <Trash2 className="size-3" />
                        </Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* gerador */}
        <div className="panel flex min-h-0 flex-col p-2">
          <p className="mb-1.5 flex items-center gap-1.5 font-display text-[11.5px] font-semibold text-ink">
            <Wand2 className="size-3.5 text-vio" /> Gerador procedural
          </p>
          <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            <canvas ref={previewRef} className="w-full rounded-xl border border-line bg-bg2" />
            <p className="text-[10.5px] leading-relaxed text-dim">{def.desc}</p>

            <div className="grid grid-cols-2 gap-1.5">
              {GENERATORS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGen(g.id)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-left text-[10.5px] transition",
                    gen === g.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/50 text-muted hover:text-ink"
                  )}
                >
                  <span className="block truncate">{g.name}</span>
                  <span className="block truncate text-[9px] text-dim">{g.supports.join(" + ")}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 rounded-xl border border-line bg-panel2/40 p-2">
              <TextField label="Texto no gerador" value={opts.text ?? ""} onChange={(v) => setOpts((o) => ({ ...o, text: v }))} placeholder="editzz" />
              <div className="flex flex-wrap gap-1">
                {PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => setOpts((o) => ({ ...o, c1: p.c1, c2: p.c2 }))}
                    className="h-7 w-12 rounded-lg border border-line"
                    style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                  />
                ))}
              </div>
              <Sel
                label="Formato"
                value={`${opts.width}x${opts.height}`}
                onChange={(v) => {
                  const [w, h] = v.split("x").map(Number);
                  setOpts((o) => ({ ...o, width: w, height: h }));
                }}
                options={[
                  { value: "1280x720", label: "16:9 · 1280×720" },
                  { value: "1920x1080", label: "16:9 · 1920×1080" },
                  { value: "1080x1920", label: "9:16 · 1080×1920" },
                  { value: "1080x1080", label: "1:1 · 1080×1080" },
                ]}
              />
              <Slider label="Semente (variação)" value={opts.seed} min={1} max={99} onChange={(v) => setOpts((o) => ({ ...o, seed: v }))} format={(v) => `#${v.toFixed(0)}`} />
              <Toggle label="Só gerar em vídeo" checked={!def.supports.includes("foto")} onChange={() => undefined} hint={def.supports.includes("foto") ? "Este gerador também sai como imagem" : "Disponível apenas como clipe gravado"} />
            </div>

            <div className="space-y-1.5 rounded-xl border border-line bg-panel2/40 p-2">
              <p className="text-[11px] font-medium text-ink">Gravar clipe de vídeo</p>
              <Slider label="Duração" value={seconds} min={2} max={30} onChange={setSeconds} unit="s" />
              <Slider label="Quadros por segundo" value={fps} min={15} max={60} onChange={setFps} unit=" fps" />
              <div className="grid grid-cols-2 gap-1.5">
                <Btn size="sm" icon={<ImageIcon className="size-3.5" />} onClick={() => void makeImage()} disabled={!!busy}>
                  Gerar imagem
                </Btn>
                <Btn size="sm" variant="primary" icon={<Film className="size-3.5" />} onClick={() => void makeVideo()} disabled={!!busy}>
                  Gerar vídeo
                </Btn>
              </div>
              {busy && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-[10.5px] text-ink">
                    <Loader2 className="size-3 animate-spin" /> {busy}
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-bg2">
                    <div className="grad-bg h-full" style={{ width: `${Math.max(3, progress * 100)}%` }} />
                  </div>
                  <p className="text-[9.5px] text-dim">A gravação acontece em tempo real — a aba precisa ficar visível.</p>
                </div>
              )}
              <p className="text-[10px] text-dim">
                Dica: use como fundo animado; depois aplique máscara, chroma key ou mistura na timeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
