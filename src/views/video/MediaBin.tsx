import {
  AudioLines,
  Box,
  FileVideo,
  Image as ImageIcon,
  Mic,
  Music2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { generateMusic, assetFromAudioBuffer } from "@/core/audio";
import { buildStarterAssets, generateVideoBlob, defaultGenOptions, assetFromVideoBlob } from "@/core/generate";
import { importFilesPersist, pool, recordMicrophone } from "@/core/media";
import { createDefaultProject } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { Btn, Chip, EmptyState, Loading } from "@/components/ui";
import { EXPORT_PRESETS, MUSIC_STYLES } from "@/lib/presets";
import { cn, fmtBytes, fmtDuration, fmtTime, pickFiles } from "@/lib/utils";
import type { MediaAsset } from "@/core/model";

export default function MediaBin() {
  const { state, store: s } = useEditzz();
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const recRef = useRef<Awaited<ReturnType<typeof recordMicrophone>>>(null);
  const [recording, setRecording] = useState(false);

  const filter = state.assetFilter.toLowerCase();
  const assets = state.assets.filter((a) => !filter || a.name.toLowerCase().includes(filter));

  const importFiles = async (files: File[]) => {
    if (!files.length) return;
    setBusy("Lendo arquivos…");
    try {
      const imported = await importFilesPersist(files);
      s.addAssets(imported);
      store.toast(`${imported.length} mídia(s) importada(s)`, "Arraste para a timeline ou clique em +", "ok");
    } finally {
      setBusy(null);
    }
  };

  const loadSamplePack = async () => {
    setBusy("Gerando pacote de exemplo…");
    setProgress(0);
    try {
      const { images } = await buildStarterAssets();
      s.addAssets(images);
      setBusy("Gravando clipe de vídeo de exemplo…");
      const blob = await generateVideoBlob("neon", { ...defaultGenOptions(), width: 1280, height: 720, text: "editzz" }, 5, setProgress);
      if (blob) {
        const asset = await assetFromVideoBlob("Clipe gerado · túnel neon", blob, "neon");
        s.addAssets([asset]);
      }
      setBusy("Sintetizando trilha lo-fi…");
      const buffer = await generateMusic({ style: "lofi", bpm: 78, seconds: 16 });
      const { asset: audio } = assetFromAudioBuffer("Trilha lo-fi (gerada)", buffer);
      s.addAssets([audio]);
      store.toast("Pacote de exemplo pronto", "3 imagens, 1 clipe de vídeo e 1 trilha", "ok");
    } catch {
      store.toast("Falha ao gerar exemplo", "Seu navegador pode limitar a gravação de canvas.", "erro");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const quickMusic = async (style: string) => {
    setBusy(`Compondo trilha (${style})…`);
    try {
      const def = MUSIC_STYLES.find((m) => m.id === style);
      const buffer = await generateMusic({ style, bpm: def?.bpm ?? 100, seconds: 24 });
      const { asset } = assetFromAudioBuffer(`${def?.name ?? style} (gerada)`, buffer);
      s.addAssets([asset]);
      store.toast("Trilha criada", `${def?.name} · 24s · pronto para a timeline`, "ok");
    } finally {
      setBusy(null);
    }
  };

  const toggleRecord = async () => {
    if (recording && recRef.current) {
      const blob = await recRef.current.stop();
      setRecording(false);
      const file = new File([blob], `narracao-${Date.now()}.webm`, { type: blob.type });
      const asset = await pool.registerFile(file);
      if (asset) {
        asset.origin = "gravação";
        asset.name = "Narração gravada";
        s.addAssets([asset]);
        store.toast("Narração gravada", `${fmtDuration(asset.duration)} de áudio`, "ok");
      }
      return;
    }
    const rec = await recordMicrophone();
    if (!rec) {
      store.toast("Microfone indisponível", "Autorize o acesso ao microfone no navegador.", "erro");
      return;
    }
    recRef.current = rec;
    rec.start();
    setRecording(true);
    store.toast("Gravando…", "Clique de novo para parar.", "info");
  };

  const newProjectWithFormat = (presetId: string) => {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (state.project.clips.length > 0) {
      s.setProjectFormat(preset.w, preset.h);
      s.setProjectFps(preset.fps);
      store.toast("Formato aplicado", `${preset.name} · ${preset.w}×${preset.h}`, "ok");
    } else {
      s.newProject(preset.w, preset.h, preset.fps, preset.name);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void importFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn("flex h-full min-h-0 flex-col gap-2", dragging && "rounded-xl ring-2 ring-vio/60")}
    >
      <div className="flex items-center gap-1.5">
        <Btn size="sm" variant="primary" icon={<UploadCloud className="size-3.5" />} onClick={() => void pickFiles("video/*,image/*,audio/*").then(importFiles)} full>
          Importar mídia
        </Btn>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Btn size="sm" icon={<Box className="size-3.5" />} onClick={loadSamplePack} title="Gera imagens, um clipe de vídeo real e uma trilha">
          Exemplo
        </Btn>
        <Btn size="sm" icon={<Mic className="size-3.5" />} variant={recording ? "danger" : "outline"} onClick={toggleRecord}>
          {recording ? "Parar" : "Narrar"}
        </Btn>
        <Btn size="sm" icon={<Music2 className="size-3.5" />} onClick={() => void quickMusic("lofi")}>
          Trilha lo-fi
        </Btn>
        <Btn size="sm" icon={<Sparkles className="size-3.5" />} onClick={() => void quickMusic("cinematic")}>
          Trilha cinema
        </Btn>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-line bg-bg2/70 px-2">
          <Search className="size-3.5 text-dim" />
          <input
            value={state.assetFilter}
            onChange={(e) => s.set({ assetFilter: e.target.value })}
            placeholder="Buscar no acervo…"
            className="h-8 w-full bg-transparent text-[11.5px] text-ink outline-none placeholder:text-dim"
          />
        </div>
        <Chip>{state.assets.length} itens</Chip>
      </div>

      {busy && (
        <div className="rounded-lg border border-vio/40 bg-vio/10 px-2.5 py-2">
          <Loading label={busy} />
          {progress > 0 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-bg2">
              <div className="grad-bg h-full" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      )}

      <div className="scroll-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {assets.length === 0 && (
          <EmptyState
            icon={<FileVideo className="size-6" />}
            title="Acervo vazio"
            desc="Importe vídeos, fotos e áudios, ou clique em Exemplo para o editzz gerar mídia de teste de verdade."
            action={
              <Btn size="sm" variant="primary" icon={<Wand2 className="size-3.5" />} onClick={loadSamplePack}>
                Gerar pacote de exemplo
              </Btn>
            }
          />
        )}
        {assets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            onAdd={() => s.addAssetToTimeline(asset)}
            onDelete={() => s.removeAsset(asset.id)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-bg2/40 p-2">
        <p className="mb-1.5 font-display text-[11px] font-semibold text-ink">Começar com formato pronto</p>
        <div className="flex flex-wrap gap-1">
          {EXPORT_PRESETS.slice(0, 5).map((p) => (
            <Chip key={p.id} onClick={() => newProjectWithFormat(p.id)} title={`${p.w}×${p.h} · ${p.fps} fps`}>
              {p.name}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssetRow({ asset, onAdd, onDelete }: { asset: MediaAsset; onAdd: () => void; onDelete: () => void }) {
  const Icon = asset.kind === "video" ? FileVideo : asset.kind === "audio" ? AudioLines : ImageIcon;
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-line bg-panel2/60 p-1.5 transition hover:border-line2">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-bg2">
        {asset.thumb ? (
          <img src={asset.thumb} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon className="size-4 text-dim" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-medium text-ink">{asset.name}</p>
        <p className="flex items-center gap-1.5 text-[10px] text-dim">
          <Icon className="size-3" />
          {asset.kind}
          {asset.duration > 0 && <span>· {fmtDuration(asset.duration)}</span>}
          {asset.width > 0 && <span>· {asset.width}×{asset.height}</span>}
          {asset.sizeBytes ? <span>· {fmtBytes(asset.sizeBytes)}</span> : null}
          {asset.origin === "gerado" && <span className="text-vio">· gerado</span>}
          {asset.origin === "gravação" && <span className="text-pink">· gravação</span>}
        </p>
      </div>
      <div className="flex flex-col gap-1 opacity-70 transition group-hover:opacity-100">
        <button type="button" onClick={onAdd} title="Adicionar na timeline no playhead" className="rounded-md bg-vio/20 p-1 text-vio hover:bg-vio/40 hover:text-white">
          <Plus className="size-3.5" />
        </button>
        <button type="button" onClick={onDelete} title="Remover do acervo" className="rounded-md bg-white/5 p-1 text-dim hover:bg-rose/20 hover:text-rose">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ImportDropzoneHint() {
  return (
    <p className="text-[10.5px] leading-relaxed text-dim">
      Dicas: importe MP4/WebM/MOV, PNG/JPG/WebP, MP3/WAV. Clipes podem ser arrastados entre faixas. {fmtTime(0)}
      {" "}
      Projetos ficam salvos no seu navegador (IndexedDB).
    </p>
  );
}

export { createDefaultProject };
