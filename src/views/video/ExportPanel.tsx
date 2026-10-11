import {
  Camera,
  Captions,
  CheckCircle2,
  Download,
  FileImage,
  Film,
  Gauge,
  HardDriveDownload,
  Info,
  Save,
  Square,
  UploadCloud,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { exportCapabilities, exportFrame, exportSrt, exportStoryboard, VideoExporter, type ExportProgress } from "@/core/exporter";
import { buildVtt, exportVtt } from "@/core/captions";
import { readExif, renderImage, defaultRecipe, autoEnhance, type ImageRecipe } from "@/core/imageops";
import { putMedia, saveProjectRecord } from "@/core/db";
import { projectDuration, type Project } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import { Badge, Btn, Chip, ProgressBar, Section, Sel, Slider, Toggle } from "@/components/ui";
import { ASPECTS, EXPORT_PRESETS, EXPORT_TIPS, LOOKS } from "@/lib/presets";
import { cn, download, fmtBytes, fmtTime } from "@/lib/utils";

export default function ExportPanel() {
  const { state, store: s } = useEditzz();
  const cfg = state.exportSettings;
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const exporter = useRef<VideoExporter | null>(null);
  const caps = useMemo(() => exportCapabilities(), []);
  const duration = projectDuration(state.project);
  const rangeStart = cfg.useRange ? (state.project.inPoint ?? 0) : 0;
  const rangeEnd = cfg.useRange ? (state.project.outPoint ?? duration) : duration;
  const exportSeconds = Math.max(0.2, rangeEnd - rangeStart);

  const run = async () => {
    if (!state.project.clips.length) {
      store.toast("Projeto vazio", "Adicione mídia à timeline antes de exportar.", "warn");
      return;
    }
    setBusy(true);
    setResult(null);
    const inst = new VideoExporter();
    exporter.current = inst;
    try {
      const blob = await inst.run(
        state.project,
        state.assets,
        {
          width: cfg.width,
          height: cfg.height,
          fps: cfg.fps,
          bitrate: cfg.bitrate,
          format: cfg.format,
          start: rangeStart,
          end: rangeEnd,
          audio: true,
        },
        (p) => setProgress(p)
      );
      if (blob) {
        const name = `${state.project.name.replace(/\s+/g, "-").toLowerCase()}-${cfg.width}p.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
        setResult({ url: URL.createObjectURL(blob), size: blob.size, name, type: blob.type });
        download(blob, name);
        store.toast("Exportação concluída", `${fmtBytes(blob.size)} · ${name}`, "ok");
      } else {
        store.toast("Exportação cancelada", undefined, "warn");
      }
    } catch {
      store.toast("Falha na exportação", "Reduza a resolução ou feche outras abas pesadas.", "erro");
    } finally {
      setBusy(false);
      exporter.current = null;
      setTimeout(() => setProgress(null), 2500);
    }
  };

  const saveJson = () => {
    const payload = JSON.stringify({ app: "editzz", version: 1, project: state.project, assets: state.assets.map((a) => ({ ...a, url: "" })) }, null, 2);
    download(new Blob([payload], { type: "application/json" }), `${state.project.name.replace(/\s+/g, "-").toLowerCase()}.editzz.json`);
    store.toast("Projeto salvo em arquivo", "Mídia referenciada · use o navegador para reabrir", "ok");
  };

  const saveLocal = async () => {
    try {
      await saveProjectRecord({
        id: state.project.id,
        name: state.project.name,
        updatedAt: Date.now(),
        json: JSON.stringify({ project: state.project, assets: state.assets.map((a) => ({ ...a, url: "" })) }),
      });
      for (const asset of state.assets) {
        const blob = await fetch(asset.url)
          .then((r) => r.blob())
          .catch(() => null);
        if (blob) await putMedia(asset.id, blob, { id: asset.id, name: asset.name, kind: asset.kind });
      }
      await s.refreshProjects();
      store.toast("Projeto salvo no navegador", "Mídia e timeline guardadas no IndexedDB.", "ok");
    } catch {
      store.toast("Não foi possível salvar", "Armazenamento do navegador cheio ou bloqueado.", "erro");
    }
  };

  const png = async () => {
    await exportFrame(state.project, state.assets, transport.getTime(), cfg.width, cfg.height);
    store.toast("Quadro exportado", `PNG em ${cfg.width}×${cfg.height}.`, "ok");
  };

  const storyboard = async () => {
    setBusy(true);
    try {
      await exportStoryboard(state.project, state.assets, { count: 12, cols: 4, thumbWidth: 480 });
      store.toast("Storyboard gerado", "12 quadros em folha de contato.", "ok");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-3 py-2">
        <p className="font-display text-[12.5px] font-semibold text-ink">Exportar</p>
        <p className="text-[10.5px] text-dim">
          {cfg.width}×{cfg.height} · {cfg.fps} fps · {fmtTime(exportSeconds)} de vídeo
        </p>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <Section title="Formato pronto" icon={<Film className="size-3.5 text-vio" />}>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPORT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => s.applyExportPreset(p.id)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-left transition",
                  cfg.preset === p.id ? "border-vio bg-vio/15" : "border-line bg-panel2/60 hover:border-line2"
                )}
              >
                <span className="block truncate text-[11px] font-medium text-ink">{p.name}</span>
                <span className="block truncate text-[9.5px] text-dim">
                  {p.w}×{p.h} · {p.fps}fps · {p.hint}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Ajustes finos" icon={<Gauge className="size-3.5 text-cy" />} defaultOpen={false}>
          <Sel
            label="Proporção"
            value={`${state.project.width}x${state.project.height}`}
            onChange={(v) => {
              const [w, h] = v.split("x").map(Number);
              s.setProjectFormat(w, h);
              s.set({ exportSettings: { ...cfg, width: w, height: h } });
            }}
            options={ASPECTS.map((a) => ({ value: `${a.w}x${a.h}`, label: `${a.name} · ${a.hint}` }))}
          />
          <Slider label="Largura" value={cfg.width} min={480} max={3840} step={2} onChange={(v) => s.set({ exportSettings: { ...cfg, width: Math.round(v), preset: "custom" } })} unit="px" />
          <Slider label="Altura" value={cfg.height} min={270} max={2160} step={2} onChange={(v) => s.set({ exportSettings: { ...cfg, height: Math.round(v), preset: "custom" } })} unit="px" />
          <Sel
            label="Quadros por segundo"
            value={String(cfg.fps)}
            onChange={(v) => s.set({ exportSettings: { ...cfg, fps: parseInt(v, 10) } })}
            options={[24, 25, 30, 50, 60].map((f) => ({ value: String(f), label: `${f} fps` }))}
          />
          <Slider
            label="Qualidade (bitrate)"
            value={cfg.bitrate / 1_000_000}
            min={1}
            max={30}
            step={0.5}
            onChange={(v) => s.set({ exportSettings: { ...cfg, bitrate: Math.round(v * 1_000_000) } })}
            format={(v) => `${v.toFixed(1)} Mbps`}
            accent="#22d3ee"
          />
          <Sel
            label="Arquivo"
            value={cfg.format}
            onChange={(v) => s.set({ exportSettings: { ...cfg, format: v as typeof cfg.format } })}
            options={[
              { value: "auto", label: `Automático (${caps.mp4 ? "MP4" : "WebM"})` },
              { value: "mp4", label: "MP4 (H.264)" },
              { value: "webm", label: "WebM (VP8/VP9)" },
            ]}
          />
          <Toggle
            label="Exportar somente o intervalo"
            checked={cfg.useRange}
            onChange={(v) => s.set({ exportSettings: { ...cfg, useRange: v } })}
            hint="Marcado com Entrada/Saída na prévia"
          />
        </Section>

        <Section title="Gravar e baixar" icon={<Download className="size-3.5 text-lime" />}>
          <Btn
            full
            variant="primary"
            size="md"
            icon={busy ? <Square className="size-3.5" /> : <UploadCloud className="size-4" />}
            onClick={() => (busy ? exporter.current?.cancel() : void run())}
            disabled={!caps.supported}
          >
            {busy ? "Cancelar gravação" : "Exportar vídeo"}
          </Btn>
          {!caps.supported && (
            <p className="text-[10.5px] text-amber">
              Este navegador não expõe MediaRecorder. Tente Chrome, Edge ou Firefox atualizados.
            </p>
          )}
          {progress && (
            <div className="space-y-1.5 rounded-xl border border-line bg-panel2/60 p-2">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-ink">{progress.message}</span>
                <Badge color={progress.phase === "concluído" ? "#a3e635" : "#d7a45a"}>{progress.phase}</Badge>
              </div>
              <ProgressBar value={progress.progress} />
              <p className="text-[10px] text-dim">
                A gravação acontece em tempo real ({fmtTime(exportSeconds, false)}). Mantenha esta aba aberta e em primeiro plano.
              </p>
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 rounded-xl border border-lime/40 bg-lime/10 p-2">
              <CheckCircle2 className="size-4 shrink-0 text-lime" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] text-ink">{result.name}</p>
                <p className="text-[10px] text-dim">{fmtBytes(result.size)}</p>
              </div>
              <a href={result.url} download={result.name} className="rounded-lg bg-lime/20 px-2 py-1 text-[10.5px] text-lime">
                baixar de novo
              </a>
            </div>
          )}
        </Section>

        <Section title="Outros arquivos" icon={<FileImage className="size-3.5 text-pink" />}>
          <div className="grid grid-cols-2 gap-1.5">
            <Btn size="sm" icon={<Camera className="size-3.5" />} onClick={() => void png()}>
              Quadro PNG
            </Btn>
            <Btn size="sm" icon={<FileImage className="size-3.5" />} onClick={storyboard} disabled={busy}>
              Storyboard
            </Btn>
            <Btn size="sm" icon={<Captions className="size-3.5" />} onClick={() => (exportSrt(state.project) ? store.toast("Legendas .srt exportadas", undefined, "ok") : store.toast("Sem legendas no projeto", undefined, "warn"))}>
              Legendas .srt
            </Btn>
            <Btn size="sm" icon={<Captions className="size-3.5" />} onClick={() => (exportVtt(state.project) ? store.toast("Legendas .vtt exportadas", undefined, "ok") : store.toast("Sem legendas no projeto", undefined, "warn"))}>
              Legendas .vtt
            </Btn>
            <Btn size="sm" icon={<Save className="size-3.5" />} onClick={saveJson}>
              Projeto .json
            </Btn>
            <Btn size="sm" icon={<HardDriveDownload className="size-3.5" />} onClick={() => void saveLocal()}>
              Salvar no navegador
            </Btn>
          </div>
          <Btn size="sm" full variant="soft" onClick={printVttPreview}>
            Pré-visualizar arquivo de legenda
          </Btn>
        </Section>

        <Section title="Dicas de exportação" icon={<Info className="size-3.5" />} defaultOpen={false}>
          <ul className="space-y-1 text-[10.5px] leading-relaxed text-muted">
            {EXPORT_TIPS.map((tip) => (
              <li key={tip} className="flex gap-1.5">
                <span className="text-vio">•</span>
                {tip}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1">
            <Chip>{caps.mp4 ? "MP4 suportado" : "MP4 indisponível"}</Chip>
            <Chip>{caps.webm ? "WebM suportado" : "WebM indisponível"}</Chip>
            <Chip>{fmtTime(duration, false)} de timeline</Chip>
          </div>
        </Section>

        <Section title="EXIF da última foto" icon={<FileImage className="size-3.5" />} defaultOpen={false}>
          <ExifCard />
        </Section>

        <Section title="Duplicar projeto com receita" icon={<Save className="size-3.5" />} defaultOpen={false}>
          <DuplicateProject />
        </Section>

        <Section title="Processar imagem em lote" icon={<FileImage className="size-3.5" />} defaultOpen={false}>
          <BatchImages />
        </Section>
      </div>
    </div>
  );
}

function printVttPreview() {
  const vtt = buildVtt(store.getSnapshot().project);
  if (!vtt.trim()) {
    store.toast("Sem legendas", "Adicione texto com caixa de legenda para exportar.", "warn");
    return;
  }
  console.info(vtt);
  store.toast("Arquivo .vtt gerado", "Prévia enviada para o console do navegador.", "ok");
}

function ExifCard() {
  const { state } = useEditzz();
  const photo = state.assets.find((a) => a.kind === "image");
  const [data, setData] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-[10.5px] text-dim">
        {photo ? `Foto: ${photo.name}` : "Importe uma foto para ler os metadados."}
      </p>
      <Btn
        size="sm"
        full
        variant="soft"
        disabled={!photo || loading}
        onClick={async () => {
          if (!photo) return;
          setLoading(true);
          try {
            const file = await fetch(photo.url).then((r) => r.blob());
            const exif = await readExif(new File([file], photo.name));
            setData(exif as unknown as Record<string, string | number>);
          } catch {
            store.toast("EXIF indisponível", "A imagem pode ter sido gerada ou processada.", "warn");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Lendo…" : "Ler EXIF"}
      </Btn>
      {data && (
        <div className="space-y-0.5 text-[10.5px] text-muted">
          {Object.entries(data)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => (
              <p key={k} className="flex justify-between gap-2">
                <span className="text-dim">{k}</span>
                <span className="truncate text-ink">{String(v)}</span>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

function BatchImages() {
  const { state, store: s } = useEditzz();
  const [look, setLook] = useState("cinematic_teal");
  const [maxSize, setMaxSize] = useState(1920);
  const [busy, setBusy] = useState(false);
  const photos = state.assets.filter((a) => a.kind === "image");

  const process = async () => {
    if (!photos.length) {
      store.toast("Nenhuma foto no acervo", undefined, "warn");
      return;
    }
    setBusy(true);
    try {
      const { recipeFromLook } = await import("@/core/imageops");
      for (const asset of photos) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = asset.url;
        await new Promise<void>((r) => {
          img.onload = () => r();
          img.onerror = () => r();
        });
        const base = defaultRecipe(img.naturalWidth || 1000, img.naturalHeight || 1000);
        const patch: Partial<ImageRecipe> = recipeFromLook(look);
        const recipe: ImageRecipe = { ...base, ...patch, adjust: { ...base.adjust, ...(patch.adjust ?? {}) } };
        const canvas = await renderImage(img, recipe, [], [], [], { maxSize });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), "image/png", 0.95));
        if (blob) {
          const url = URL.createObjectURL(blob);
          download(blob, `editzz-${look}-${asset.name.replace(/\.[^.]+$/, "")}.png`);
          URL.revokeObjectURL(url);
        }
      }
      store.toast(`${photos.length} imagem(ns) processada(s)`, "Arquivos baixados com o look aplicado.", "ok");
      void s;
    } finally {
      setBusy(false);
    }
  };

  const enhanceAll = async () => {
    if (!photos.length) return;
    setBusy(true);
    try {
      for (const asset of photos) {
        const img = new Image();
        img.src = asset.url;
        await new Promise<void>((r) => {
          img.onload = () => r();
          img.onerror = () => r();
        });
        const probe = document.createElement("canvas");
        probe.width = 320;
        probe.height = Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * 320) || 320;
        probe.getContext("2d")?.drawImage(img, 0, 0, probe.width, probe.height);
        const base = defaultRecipe(img.naturalWidth || 1000, img.naturalHeight || 1000);
        const patch = autoEnhance(probe);
        const recipe: ImageRecipe = { ...base, ...patch, adjust: { ...base.adjust, ...(patch.adjust ?? {}) } };
        const canvas = await renderImage(img, recipe, [], [], [], { maxSize });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.94));
        if (blob) download(blob, `editzz-realce-${asset.name.replace(/\.[^.]+$/, "")}.jpg`);
      }
      store.toast("Realce aplicado", `${photos.length} foto(s) corrigidas automaticamente.`, "ok");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Sel
        label="Look para lote"
        value={look}
        onChange={setLook}
        options={[
          { value: "cinematic_teal", label: "Cinema teal & orange" },
          { value: "film_kodak", label: "Filme Kodak" },
          { value: "bw_contrast", label: "Preto e branco forte" },
          { value: "vivid_pop", label: "Cores vibrantes" },
          { value: "vintage_fade", label: "Vintage desbotado" },
          { value: "noir", label: "Noir" },
        ]}
      />
      <Slider label="Tamanho máximo" value={maxSize} min={640} max={4096} step={64} onChange={setMaxSize} unit="px" />
      <div className="grid grid-cols-2 gap-1.5">
        <Btn size="sm" disabled={busy} onClick={() => void process()}>
          Aplicar look
        </Btn>
        <Btn size="sm" disabled={busy} onClick={() => void enhanceAll()}>
          Realce automático
        </Btn>
      </div>
      <p className="text-[10.5px] text-dim">{photos.length} foto(s) no acervo. Os arquivos baixam um a um.</p>
    </div>
  );
}

/* ────────────── duplicar projeto aplicando uma receita de cor ────────────── */

function DuplicateProject() {
  const { state, store: s } = useEditzz();
  const [look, setLook] = useState("cinematic_teal");
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-[10.5px] leading-relaxed text-dim">
        Cria uma cópia completa do projeto (clipes, faixas, marcadores e áudio) com um novo look aplicado em todos os
        clipes de uma vez — ótima forma de gerar duas versões da mesma peça.
      </p>
      <Sel
        label="Receita de cor"
        value={look}
        onChange={setLook}
        options={LOOKS.slice(0, 40).map((l) => ({ value: l.id, label: `${l.name} · ${l.group}` }))}
      />
      <Btn
        size="sm"
        full
        variant="primary"
        disabled={!state.project.clips.length}
        onClick={() => {
          const clone: Project = {
            ...JSON.parse(JSON.stringify(state.project)) as Project,
            id: `proj_${Math.random().toString(36).slice(2, 10)}`,
            name: `${state.project.name} · ${LOOKS.find((l) => l.id === look)?.name ?? "nova cor"}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            clips: state.project.clips.map((c) => (c.kind === "audio" ? c : { ...c, look, lookIntensity: 90 })),
          };
          s.loadProject(clone, state.assets);
          void s.persist();
          setOpen(true);
          store.toast("Projeto duplicado", `Nova versão com o look “${LOOKS.find((l) => l.id === look)?.name}”.`, "ok");
        }}
      >
        Duplicar com esta receita
      </Btn>
      {open && (
        <p className="text-[10px] text-lime">Cópia criada e salva no navegador — a versão original continua em “Projetos salvos”.</p>
      )}
    </div>
  );
}
