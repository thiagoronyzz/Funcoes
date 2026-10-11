import {
  ArrowLeftRight,
  Brush,
  Contrast,
  Crop,
  Droplet,
  Download,
  Eraser,
  Eye,
  EyeOff,
  Grid3X3,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Move,
  Palette,
  PenTool,
  Pipette,
  Redo2,
  RotateCw,
  Save,
  Scissors,
  Sliders,
  Sparkles,
  Stamp,
  Sun,
  Trash2,
  Type as TypeIcon,
  Undo2,
  UploadCloud,
  Wand2,
  Waves,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  asciiArt,
  autoEnhance,
  BAND_RANGES,
  collage,
  defaultRecipe,
  extractPalette,
  HSL_BANDS,
  readExif,
  recipeFromLook,
  renderImage,
  histogram as makeHistogram,
  pixelArt,
  removeBackground,
  simulateColorBlindness,
  type BrushTool,
  type ExifData,
  type ImageRecipe,
  type MaskOp,
  type Overlay,
  type RasterOp,
} from "@/core/imageops";
import { putMedia } from "@/core/db";
import { importFilesPersist, pool } from "@/core/media";
import { store, useEditzz } from "@/core/store";
import { ADJUST_DEFS, FONTS, LOOKS, LOOK_GROUPS, STICKER_GROUPS, SHAPES, type Adjustments } from "@/lib/presets";
import { Badge, Btn, Chip, EmptyState, IconBtn, Loading, Modal, NumField, Section, Sel, Slider, Tabs, TextField, Toggle } from "@/components/ui";
import { cn, clamp, download, fmtBytes, pickFiles, uid } from "@/lib/utils";

type Tool =
  | "move"
  | "crop"
  | "perspective"
  | "pick"
  | "erase"
  | "heal"
  | "clone"
  | "smooth"
  | "teeth"
  | "redeye"
  | "dodge"
  | "burn"
  | "liquify_push"
  | "liquify_pinch"
  | "liquify_bulge";

type Panel = "basico" | "curvas" | "color" | "looks" | "retocar" | "texto" | "moldura" | "arte" | "exportar";

const BRUSH_TOOLS: { id: Tool; name: string; icon: typeof Brush; hint: string }[] = [
  { id: "move", name: "Mover", icon: Move, hint: "Arraste elementos e enquadramento." },
  { id: "crop", name: "Cortar", icon: Crop, hint: "Arraste sobre a imagem para definir o corte." },
  { id: "perspective", name: "Perspectiva", icon: Grid3X3, hint: "Arraste os cantos para corrigir a perspectiva." },
  { id: "pick", name: "Conta-gotas", icon: Pipette, hint: "Clique para capturar uma cor da imagem." },
  { id: "erase", name: "Apagar", icon: Eraser, hint: "Remove e preenche com o entorno (inpaint)." },
  { id: "heal", name: "Remendar", icon: Stamp, hint: "Corrige imperfeições e manchas." },
  { id: "clone", name: "Clonar", icon: Brush, hint: "Alt+clique define a origem; pinte para copiar." },
  { id: "smooth", name: "Suavizar", icon: Droplet, hint: "Suaviza a pele mantendo a textura." },
  { id: "teeth", name: "Clarear dentes", icon: Sparkles, hint: "Remove amarelado do sorriso." },
  { id: "redeye", name: "Olhos vermelhos", icon: Eye, hint: "Zera o vermelho dos olhos." },
  { id: "dodge", name: "Iluminar", icon: Sun, hint: "Clareia as áreas pintadas." },
  { id: "burn", name: "Escurecer", icon: Contrast, hint: "Escurece e dá profundidade." },
  { id: "liquify_push", name: "Liquify empurrar", icon: Waves, hint: "Deforma empurrando a área pintada." },
  { id: "liquify_pinch", name: "Liquify afinar", icon: Waves, hint: "Afinar — nariz, cintura, etc." },
  { id: "liquify_bulge", name: "Liquify engordar", icon: Waves, hint: "Aumenta volumes localmente." },
];

export default function PhotoStudio() {
  const { state, store: s } = useEditzz();
  const photos = state.assets.filter((a) => a.kind === "image");
  const [photoId, setPhotoId] = useState<string | null>(photos[0]?.id ?? null);
  const [tool, setTool] = useState<Tool>("move");
  const [panel, setPanel] = useState<Panel>("basico");
  const [recipe, setRecipe] = useState<ImageRecipe>(() => defaultRecipe(1000, 1000));
  const [ops, setOps] = useState<RasterOp[]>([]);
  const [masks, setMasks] = useState<MaskOp[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<ImageRecipe[]>([]);
  const [redoStack, setRedoStack] = useState<ImageRecipe[]>([]);
  const [brushSize, setBrushSize] = useState(26);
  const [brushStrength, setBrushStrength] = useState(70);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);
  const [compare, setCompare] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [histo, setHisto] = useState<{ r: number[]; g: number[]; b: number[]; l: number[] } | null>(null);
  const [bgModal, setBgModal] = useState(false);
  const [artModal, setArtModal] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [importRecipeOpen, setImportRecipeOpen] = useState(false);
  const [renderCanvas, setRenderCanvas] = useState<HTMLCanvasElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const paintRef = useRef<{ points: { x: number; y: number }[]; tool: Tool } | null>(null);

  const photo = photos.find((p) => p.id === photoId) ?? photos[0] ?? null;

  /* ── carrega a foto ── */
  useEffect(() => {
    if (!photo) {
      imgRef.current = null;
      setImgReady(false);
      return;
    }
    setImgReady(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
      setRecipe((current) => ({ ...current, resize: { ...current.resize, w: img.naturalWidth, h: img.naturalHeight } }));
      void pool.thumbnail(photo).then(() => undefined);
    };
    img.src = photo.url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id]);

  /* ── loop de renderização (não destrutivo) ── */
  const render = useCallback(async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return;
    setRendering(true);
    try {
      const srcW = img.naturalWidth;
      const scaledOps = ops.map((o) => ({ ...o, size: Math.max(3, o.size * srcW) }));
      const out = await renderImage(img, recipe, scaledOps, masks, overlays, { maxSize: 1600 });
      setRenderCanvas(out);
      canvas.width = out.width;
      canvas.height = out.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, out.width, out.height);
        ctx.drawImage(out, 0, 0);
      }
    } finally {
      setRendering(false);
    }
  }, [recipe, ops, masks, overlays]);

  useEffect(() => {
    const id = setTimeout(() => void render(), 40);
    return () => clearTimeout(id);
  }, [render, imgReady]);

  /* ── histórico não destrutivo ── */
  const commit = (next: ImageRecipe, label = "Ajuste") => {
    setUndoStack((stack) => [...stack.slice(-39), recipe]);
    setRedoStack([]);
    setRecipe(next);
    void label;
  };
  const undo = () => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack((r) => [...r, recipe]);
      setRecipe(prev);
      return stack.slice(0, -1);
    });
  };
  const redo = () => {
    setRedoStack((stack) => {
      if (!stack.length) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((u) => [...u, recipe]);
      setRecipe(next);
      return stack.slice(0, -1);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "[") setBrushSize((v) => clamp(v - 4, 2, 90));
      if (e.key === "]") setBrushSize((v) => clamp(v + 4, 2, 90));
      if (e.key.toLowerCase() === "b") setTool("heal");
      if (e.key.toLowerCase() === "c") setTool("crop");
      if (e.key === "Escape") setCropRect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, ops]);

  const setAdj = (key: keyof Adjustments, value: number) =>
    setRecipe((r) => ({ ...r, adjust: { ...r.adjust, [key]: value } }));

  const toNorm = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: clamp((e.clientX - rect.left) / rect.width, 0, 1), y: clamp((e.clientY - rect.top) / rect.height, 0, 1) };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toNorm(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (tool === "pick") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const d = ctx?.getImageData(Math.round(p.x * canvas.width), Math.round(p.y * canvas.height), 1, 1).data;
        if (d) {
          const hex = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
          setPalette((list) => [hex, ...list.filter((c) => c !== hex)].slice(0, 12));
          store.toast("Cor capturada", hex, "ok");
        }
      }
      return;
    }

    if (tool === "crop") {
      setDragging(p);
      setCropRect({ x: p.x, y: p.y, w: 0, h: 0 });
      return;
    }

    if (tool === "perspective") {
      setDragging(p);
      return;
    }

    if (tool === "clone" && e.altKey) {
      setCloneSource(p);
      store.toast("Origem do clone definida", "Agora pinte para copiar desta área.", "info");
      return;
    }

    if (tool === "move") {
      // move a sobreposição mais próxima do clique
      const found = [...overlays].reverse().find((o) => Math.hypot(o.x - p.x, o.y - p.y) < 0.14);
      if (found) {
        setSelectedOverlay(found.id);
        const origin = { x: found.x, y: found.y };
        const move = (ev: PointerEvent) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const nx = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
          const ny = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
          setOverlays((list) => list.map((o) => (o.id === found.id ? { ...o, x: origin.x + (nx - p.x), y: origin.y + (ny - p.y) } : o)));
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      } else {
        setSelectedOverlay(null);
      }
      return;
    }

    paintRef.current = { points: [p], tool };
    setDragging(p);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging && !paintRef.current) return;
    const p = toNorm(e);
    if (tool === "crop" && dragging) {
      setCropRect({ x: Math.min(dragging.x, p.x), y: Math.min(dragging.y, p.y), w: Math.abs(p.x - dragging.x), h: Math.abs(p.y - dragging.y) });
      return;
    }
    if (tool === "perspective" && dragging) {
      const corner =
        e.shiftKey ? "br" : Math.hypot(p.x, p.y) < 0.5 ? "tl" : Math.hypot(1 - p.x, p.y) < 0.5 ? "tr" : "br";
      setRecipe((r) => ({ ...r, perspective: { ...r.perspective, [corner]: [p.x < 0.5 ? p.x - 0.001 : p.x - 1, p.y < 0.5 ? p.y : p.y - 1] } }));
      return;
    }
    if (paintRef.current) paintRef.current.points.push(p);
  };

  const onUp = () => {
    const paint = paintRef.current;
    paintRef.current = null;
    setDragging(null);
    if (paint && paint.points.length && paint.tool !== "crop" && paint.tool !== "perspective") {
      const rasterTool = paint.tool as BrushTool;
      const op: RasterOp = {
        id: uid("op"),
        tool: rasterTool,
        size: brushSize / 2200,
        strength: brushStrength,
        points: paint.points.filter((_, i) => i % 2 === 0).slice(0, 220),
        source: rasterTool === "clone" ? (cloneSource ?? { x: 0.3, y: 0.3 }) : undefined,
      };
      setOps((list) => [...list, op]);
    }
  };

  const applyCrop = () => {
    if (!cropRect || cropRect.w < 0.02 || cropRect.h < 0.02) {
      store.toast("Selecione uma área", "Arraste sobre a imagem com a ferramenta Cortar.", "warn");
      return;
    }
    commit(
      {
        ...recipe,
        crop: {
          x: recipe.crop.x + cropRect.x * recipe.crop.w,
          y: recipe.crop.y + cropRect.y * recipe.crop.h,
          w: cropRect.w * recipe.crop.w,
          h: cropRect.h * recipe.crop.h,
        },
      },
      "Cortar"
    );
    setCropRect(null);
  };

  const cropToAspect = (ratio: number, name: string) => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const current = recipe.crop;
    const cw = current.w * w;
    const ch = current.h * h;
    let nw = cw;
    let nh = cw / ratio;
    if (nh > ch) {
      nh = ch;
      nw = ch * ratio;
    }
    commit(
      {
        ...recipe,
        crop: {
          x: current.x + ((cw - nw) / w) / 2,
          y: current.y + ((ch - nh) / h) / 2,
          w: nw / w,
          h: nh / h,
        },
      },
      `Corte ${name}`
    );
  };

  const doRemoveBackground = async (mode: "auto" | "chroma", color: string, tolerance: number) => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = await renderImage(img, recipe, [], [], [], { maxSize: 2000, skipFrame: true });
    const cut = removeBackground(canvas, { mode, color, tolerance, feather: 8, edgeShrink: 1 });
    // vira uma imagem de sobreposição opcional? mantemos como novo asset recortado
    const blob = await new Promise<Blob | null>((r) => cut.toBlob((b) => r(b), "image/png"));
    if (!blob) return;
    const file = new File([blob], `recorte-${Date.now()}.png`, { type: "image/png" });
    const asset = await pool.registerFile(file);
    if (asset) {
      asset.name = `Recorte · ${photo?.name ?? "foto"}`;
      s.addAssets([asset]);
      void putMedia(asset.id, blob, { id: asset.id, name: asset.name, kind: "image" });
      setPhotoId(asset.id);
      store.toast("Fundo removido", "Um novo PNG transparente entrou no acervo.", "ok");
    }
  };

  const exportImage = async (format: "image/png" | "image/jpeg" | "image/webp", quality: number, maxSize: number, baseName: string) => {
    const img = imgRef.current;
    if (!img) return;
    const out = await renderImage(img, recipe, ops.map((o) => ({ ...o, size: Math.max(3, o.size * img.naturalWidth) })), masks, overlays, { maxSize: maxSize || 0 });
    const blob = await new Promise<Blob | null>((r) => out.toBlob((b) => r(b), format, quality));
    if (!blob) {
      store.toast("Falha ao exportar", undefined, "erro");
      return;
    }
    const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
    download(blob, `${baseName || "editzz-foto"}-${out.width}x${out.height}.${ext}`);
    store.toast("Imagem exportada", `${out.width}×${out.height} · ${fmtBytes(blob.size)}`, "ok");
  };

  const readPhotoExif = async () => {
    if (!photo) return;
    const blob = await fetch(photo.url).then((r) => r.blob());
    const data = await readExif(new File([blob], photo.name));
    setExif(data);
    if (!data) store.toast("Sem metadados EXIF", "Fotos exportadas pelo editzz não guardam EXIF.", "warn");
  };

  const loadRecipeFromFile = async () => {
    const [file] = await pickFiles(".json");
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { recipe?: ImageRecipe };
      if (parsed.recipe) {
        commit(parsed.recipe, "Receita carregada");
        store.toast("Receita aplicada", file.name, "ok");
      }
    } catch {
      store.toast("Arquivo inválido", undefined, "erro");
    }
  };

  const selected = overlays.find((o) => o.id === selectedOverlay) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      {/* barra superior */}
      <div className="panel flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <span className="font-display text-[12.5px] font-semibold text-ink">Estúdio de foto</span>
        {photos.length > 1 && (
          <Sel
            compact
            className="photo-quick-select"
            value={photo?.id ?? ""}
            onChange={setPhotoId}
            options={photos.map((item) => ({ value: item.id, label: item.name }))}
          />
        )}
        <Badge color="#d58f73">não destrutivo</Badge>
        {photo && <Chip>{photo.name}</Chip>}
        <Chip>{ops.length} pinceladas</Chip>
        <Chip>{overlays.length} camadas</Chip>

        <div className="mx-1 h-5 w-px bg-line" />
        <IconBtn size="sm" title="Desfazer (Ctrl+Z)" onClick={undo} disabled={!undoStack.length}>
          <Undo2 className="size-3.5" />
        </IconBtn>
        <IconBtn size="sm" title="Refazer" onClick={redo} disabled={!redoStack.length}>
          <Redo2 className="size-3.5" />
        </IconBtn>
        <IconBtn
          size="sm"
          title={compare ? "Voltar à edição" : "Ver original (antes/depois)"}
          active={compare}
          onClick={() => setCompare((v) => !v)}
        >
          <ArrowLeftRight className="size-3.5" />
        </IconBtn>

        <div className="ml-auto flex items-center gap-1.5">
          <Btn
            size="sm"
            icon={<UploadCloud className="size-3.5" />}
            onClick={() =>
              void pickFiles("image/*").then(async (files) => {
                if (!files.length) return;
                const imported = await importFilesPersist(files);
                s.addAssets(imported);
                if (imported[0]) setPhotoId(imported[0].id);
              })
            }
          >
            Importar foto
          </Btn>
          <Btn
            size="sm"
            variant="primary"
            icon={<Download className="size-3.5" />}
            onClick={() => setPanel("exportar")}
          >
            Exportar
          </Btn>
        </div>
      </div>

      <div className="photo-editor-layout">
        {/* tira de fotos */}
        <div className="photo-editor-library panel min-h-0 flex-col p-2">
          <p className="mb-1.5 flex items-center gap-1.5 font-display text-[11.5px] font-semibold text-ink">
            <ImageIcon className="size-3.5 text-pink" /> Fotos do acervo
          </p>
          <div className="scroll-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {photos.length === 0 && (
              <EmptyState
                icon={<ImageIcon className="size-6" />}
                title="Sem fotos"
                desc="Importe imagens para editar com camadas, pincéis e IA local."
                action={
                  <Btn size="sm" variant="primary" onClick={loadRecipeFromFile}>
                    Carregar receita
                  </Btn>
                }
              />
            )}
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPhotoId(p.id);
                  setOps([]);
                  setOverlays([]);
                  setMasks([]);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border p-1.5 text-left transition",
                  p.id === photo?.id ? "border-pink bg-pink/10" : "border-line bg-panel2/50 hover:border-line2"
                )}
              >
                <img src={p.thumb ?? p.url} alt="" className="size-10 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] text-ink">{p.name}</span>
                  <span className="block text-[9.5px] text-dim">
                    {p.width}×{p.height}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-1.5">
            <Btn size="sm" full icon={<Save className="size-3.5" />} onClick={() => {
              const payload = JSON.stringify({ app: "editzz", kind: "receita-imagem", version: 1, recipe }, null, 2);
              download(new Blob([payload], { type: "application/json" }), `${recipeName || "receita"}.editzz-photo.json`);
            }}>
              Salvar receita (.json)
            </Btn>
            <Btn size="sm" full icon={<UploadCloud className="size-3.5" />} onClick={loadRecipeFromFile}>
              Carregar receita
            </Btn>
            <Btn size="sm" full icon={<Sparkles className="size-3.5" />} onClick={async () => {
              const canvas = renderCanvas;
              if (!canvas) return;
              const patch = autoEnhance(canvas);
              commit({ ...recipe, ...patch, adjust: { ...recipe.adjust, ...(patch.adjust ?? {}) } }, "Realce automático");
              store.toast("Realce aplicado", "Correção calculada a partir do histograma.", "ok");
            }}>
              Realce automático
            </Btn>
          </div>
        </div>

        {/* palco */}
        <div className="photo-editor-stage">
          <div className="panel flex min-h-0 flex-1 flex-col p-2">
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              {BRUSH_TOOLS.map((t) => (
                <IconBtn key={t.id} size="sm" title={`${t.name} — ${t.hint}`} active={tool === t.id} onClick={() => setTool(t.id)}>
                  <t.icon className="size-3.5" />
                </IconBtn>
              ))}
              <div className="mx-1 h-5 w-px bg-line" />
              <span className="text-[10px] text-dim">pincel</span>
              <input type="range" min={2} max={90} value={brushSize} onChange={(e) => setBrushSize(parseFloat(e.target.value))} className="w-20" title="Tamanho do pincel ([ e ])" />
              <span className="w-7 font-mono text-[10px] text-muted">{brushSize}</span>
              <span className="text-[10px] text-dim">força</span>
              <input type="range" min={5} max={100} value={brushStrength} onChange={(e) => setBrushStrength(parseFloat(e.target.value))} className="w-16" />
              {cloneSource && <Chip>origem {Math.round(cloneSource.x * 100)}%, {Math.round(cloneSource.y * 100)}%</Chip>}
              {cropRect && <Chip onClick={applyCrop}>aplicar corte</Chip>}
              {rendering && <Loader2 className="size-3.5 animate-spin text-vio" />}
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(#292e30_0%_25%,#1a1d1f_0%_50%)] bg-[length:20px_20px] p-2">
              {!photo && (
                <div className="text-center">
                  <p className="font-display text-sm font-semibold text-ink/80">Nenhuma foto selecionada</p>
                  <p className="mt-1 text-[11.5px] text-muted">Importe uma imagem ou gere uma no estúdio de vídeo.</p>
                </div>
              )}
              {photo && !imgReady && <Loading label="Carregando foto…" />}
              <div className="relative h-full w-full">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  className={cn(
                    "mx-auto max-h-full max-w-full touch-none select-none rounded-lg",
                    tool === "move" || tool === "pick" ? "cursor-pointer" : "cursor-crosshair"
                  )}
                  style={{ display: photo ? "block" : "none" }}
                />
                {compare && photo && (
                  <img
                    src={photo.url}
                    alt="original"
                    className="pointer-events-none absolute inset-0 mx-auto max-h-full max-w-full rounded-lg object-contain opacity-95"
                  />
                )}
                {cropRect && cropRect.w > 0.01 && (
                  <div
                    className="pointer-events-none absolute rounded-sm border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                    style={{ left: `${cropRect.x * 100}%`, top: `${cropRect.y * 100}%`, width: `${cropRect.w * 100}%`, height: `${cropRect.h * 100}%` }}
                  />
                )}
                {overlays.map((o) => (
                  <span
                    key={o.id}
                    className={cn(
                      "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-1 text-[9px]",
                      o.id === selectedOverlay ? "border-white bg-white/20 text-white" : "border-white/30 bg-black/40 text-white/70"
                    )}
                    style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%` }}
                  >
                    {o.type === "text" ? (o as { text: string }).text.slice(0, 14) : o.type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <Chip onClick={() => setRecipe((r) => ({ ...r, rotate90: (r.rotate90 + 90) % 360 }))}>girar 90°</Chip>
              <Chip active={recipe.flipH} onClick={() => setRecipe((r) => ({ ...r, flipH: !r.flipH }))}>espelhar</Chip>
              <Chip active={recipe.flipV} onClick={() => setRecipe((r) => ({ ...r, flipV: !r.flipV }))}>inverter</Chip>
              <Chip onClick={() => setRecipe((r) => ({ ...r, crop: { x: 0, y: 0, w: 1, h: 1 } }))}>limpar corte</Chip>
              <Chip onClick={() => void cropToAspect(1, "1:1")}>1:1</Chip>
              <Chip onClick={() => void cropToAspect(9 / 16, "9:16")}>9:16</Chip>
              <Chip onClick={() => void cropToAspect(16 / 9, "16:9")}>16:9</Chip>
              <Chip onClick={() => void cropToAspect(4 / 5, "4:5")}>4:5</Chip>
              <Chip onClick={() => setOps([])}>limpar pinceladas</Chip>
              <Chip active={recipe.frame.id !== "none"} onClick={() => setPanel("moldura")}>moldura</Chip>
              <Chip className="ml-auto" onClick={() => setPanel("arte")}>arte e colagem</Chip>
            </div>
          </div>
        </div>

        {/* painel direito */}
        <div className="photo-editor-controls panel min-h-0 flex-col">
          <Tabs
            className="m-2"
            value={panel}
            onChange={setPanel}
            tabs={[
              { id: "basico" as Panel, label: "Básico" },
              { id: "curvas" as Panel, label: "Curvas" },
              { id: "color" as Panel, label: "Cor" },
              { id: "looks" as Panel, label: "Looks" },
              { id: "retocar" as Panel, label: "Retocar" },
              { id: "texto" as Panel, label: "Texto" },
              { id: "moldura" as Panel, label: "Moldura" },
              { id: "arte" as Panel, label: "Arte" },
              { id: "exportar" as Panel, label: "Exportar" },
            ]}
          />
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {panel === "basico" && (
              <>
                <Section title="Luz e contraste" icon={<Sun className="size-3.5 text-amber" />}>
                  {ADJUST_DEFS.filter((d) => ["exposure", "brightness", "contrast", "highlights", "shadows", "whites", "blacks", "fade"].includes(d.key)).map((d) => (
                    <Slider key={d.key} label={d.label} value={recipe.adjust[d.key]} min={d.min} max={d.max} onChange={(v) => setAdj(d.key, v)} onReset={() => setAdj(d.key, d.def)} accent="#fbbf24" />
                  ))}
                </Section>
                <Section title="Textura e detalhe" icon={<Sliders className="size-3.5 text-cy" />}>
                  {ADJUST_DEFS.filter((d) => ["clarity", "dehaze", "sharpen", "blur", "grain", "vignette", "bloom", "chromatic"].includes(d.key)).map((d) => (
                    <Slider key={d.key} label={d.label} value={recipe.adjust[d.key]} min={d.min} max={d.max} onChange={(v) => setAdj(d.key, v)} onReset={() => setAdj(d.key, d.def)} accent="#22d3ee" />
                  ))}
                </Section>
                <Section title="Cor básica" icon={<Palette className="size-3.5 text-pink" />} defaultOpen={false}>
                  {ADJUST_DEFS.filter((d) => ["saturation", "vibrance", "temperature", "tint", "hue"].includes(d.key)).map((d) => (
                    <Slider key={d.key} label={d.label} value={recipe.adjust[d.key]} min={d.min} max={d.max} onChange={(v) => setAdj(d.key, v)} onReset={() => setAdj(d.key, d.def)} accent="var(--app-accent)" />
                  ))}
                  <Toggle
                    label="Vinheta circular"
                    checked={recipe.vignetteShape === "circle"}
                    onChange={(v) => setRecipe((r) => ({ ...r, vignetteShape: v ? "circle" : "off" }))}
                  />
                </Section>
                <Section title="Redimensionar" icon={<Layers className="size-3.5" />} defaultOpen={false}>
                  <NumField label="Largura" value={recipe.resize.w} onChange={(v) => setRecipe((r) => ({ ...r, resize: { ...r.resize, w: Math.round(v), h: Math.round((v / r.resize.w) * r.resize.h) } }))} />
                  <NumField label="Altura" value={recipe.resize.h} onChange={(v) => setRecipe((r) => ({ ...r, resize: { ...r.resize, h: Math.round(v), w: Math.round((v / r.resize.h) * r.resize.w) } }))} />
                  <Toggle label="Manter proporção" checked={recipe.resize.keepRatio} onChange={(v) => setRecipe((r) => ({ ...r, resize: { ...r.resize, keepRatio: v } }))} />
                  <Toggle label="Interpolação nítida (nearest)" checked={recipe.resize.mode === "nearest"} onChange={(v) => setRecipe((r) => ({ ...r, resize: { ...r.resize, mode: v ? "nearest" : "lanczos" } }))} hint="Ideal para pixel art" />
                </Section>
                <Section title="Endireitar" icon={<RotateCw className="size-3.5 text-vio" />} defaultOpen={false}>
                  <Slider label="Ângulo" value={recipe.straighten} min={-45} max={45} step={0.1} onChange={(v) => setRecipe((r) => ({ ...r, straighten: v }))} unit="°" />
                </Section>
              </>
            )}

            {panel === "curvas" && <CurvesPanel recipe={recipe} onChange={(r) => commit(r, "Curvas")} />}

            {panel === "color" && (
              <>
                <Section title="HSL por faixa" icon={<Palette className="size-3.5 text-vio" />}>
                  <div className="scroll-thin max-h-64 space-y-2 overflow-y-auto pr-1">
                    {HSL_BANDS.map((band) => (
                      <div key={band} className="rounded-xl border border-line bg-panel2/50 p-2">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="size-3 rounded-full" style={{ background: bandColor(band) }} />
                          <span className="text-[11px] capitalize text-ink">{band}</span>
                          <span className="ml-auto font-mono text-[9.5px] text-dim">{BAND_RANGES[band][0]}°–{BAND_RANGES[band][1]}°</span>
                        </div>
                        {(["h", "s", "l"] as const).map((key) => (
                          <Slider
                            key={key}
                            label={key === "h" ? "Matiz" : key === "s" ? "Saturação" : "Luminância"}
                            value={recipe.hsl[band][key]}
                            min={-100}
                            max={100}
                            onChange={(v) => setRecipe((r) => ({ ...r, hsl: { ...r.hsl, [band]: { ...r.hsl[band], [key]: v } } }))}
                            onReset={() => setRecipe((r) => ({ ...r, hsl: { ...r.hsl, [band]: { ...r.hsl[band], [key]: 0 } } }))}
                            compact
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="Grade de cor (3 vias)" icon={<Palette className="size-3.5 text-pink" />} defaultOpen={false}>
                  {(["shadows", "mids", "highlights"] as const).map((wheel) => (
                    <div key={wheel} className="rounded-xl border border-line bg-panel2/50 p-2">
                      <p className="mb-1 text-[11px] capitalize text-ink">{wheel === "shadows" ? "Sombras" : wheel === "mids" ? "Meio-tons" : "Altas luzes"}</p>
                      <Slider label="Matiz" value={recipe.grade[wheel].h} min={0} max={360} onChange={(v) => setRecipe((r) => ({ ...r, grade: { ...r.grade, [wheel]: { ...r.grade[wheel], h: v } } }))} compact />
                      <Slider label="Saturação" value={recipe.grade[wheel].s} min={0} max={100} onChange={(v) => setRecipe((r) => ({ ...r, grade: { ...r.grade, [wheel]: { ...r.grade[wheel], s: v } } }))} compact />
                      <Slider label="Luminância" value={recipe.grade[wheel].l} min={-100} max={100} onChange={(v) => setRecipe((r) => ({ ...r, grade: { ...r.grade, [wheel]: { ...r.grade[wheel], l: v } } }))} compact />
                    </div>
                  ))}
                  <Slider label="Equilíbrio" value={recipe.grade.balance} min={-100} max={100} onChange={(v) => setRecipe((r) => ({ ...r, grade: { ...r.grade, balance: v } }))} />
                  <Slider label="Mistura" value={recipe.grade.blending} min={0} max={100} onChange={(v) => setRecipe((r) => ({ ...r, grade: { ...r.grade, blending: v } }))} />
                </Section>
                <Section title="Níveis" icon={<Contrast className="size-3.5 text-lime" />} defaultOpen={false}>
                  <Slider label="Preto" value={recipe.levels.black} min={0} max={120} onChange={(v) => setRecipe((r) => ({ ...r, levels: { ...r.levels, black: v } }))} accent="#a3e635" />
                  <Slider label="Branco" value={recipe.levels.white} min={140} max={255} onChange={(v) => setRecipe((r) => ({ ...r, levels: { ...r.levels, white: v } }))} accent="#a3e635" />
                  <Slider label="Gama" value={recipe.levels.gamma} min={0.2} max={2.4} step={0.01} onChange={(v) => setRecipe((r) => ({ ...r, levels: { ...r.levels, gamma: v } }))} format={(v) => v.toFixed(2)} accent="#a3e635" />
                </Section>
                <Section title="Histograma" icon={<Sliders className="size-3.5" />} defaultOpen={false}>
                  <Btn size="sm" full variant="soft" onClick={() => renderCanvas && setHisto(makeHistogram(renderCanvas))}>
                    Calcular histograma
                  </Btn>
                  {histo && <Histogram data={histo} />}
                </Section>
              </>
            )}

            {panel === "looks" && (
              <>
                <Section title="Looks e filtros" icon={<Sparkles className="size-3.5 text-vio" />}>
                  <div className="scroll-thin max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {LOOK_GROUPS.map((group) => (
                      <div key={group}>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-dim">{group}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {LOOKS.filter((l) => l.group === group).map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              title={l.desc}
                              onClick={() => commit({ ...recipe, ...recipeFromLook(l.id) }, `Look ${l.name}`)}
                              className={cn(
                                "rounded-lg border px-2 py-1.5 text-left text-[10.5px] transition",
                                recipe.look === l.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/50 text-muted hover:border-vio/50 hover:text-ink"
                              )}
                            >
                              {l.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Slider label="Intensidade" value={recipe.lookIntensity} min={0} max={100} onChange={(v) => setRecipe((r) => ({ ...r, lookIntensity: v }))} accent="var(--app-accent)" />
                  <Btn size="sm" full onClick={() => commit({ ...recipe, look: "none", lookIntensity: 100, effects: [] }, "Remover look")}>
                    Remover look
                  </Btn>
                </Section>
                <Section title="Efeitos criativos" icon={<Wand2 className="size-3.5 text-pink" />} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1">
                    {["grain_film", "light_leak", "vhs_photo", "posterize", "halftone", "dither", "emboss", "sketch", "cartoon", "watercolor", "film_burn", "duotone", "glitch", "bloom_soft", "long_exposure"].map((id) => {
                      const active = recipe.effects.some((e) => e.id === id);
                      return (
                        <Chip
                          key={id}
                          active={active}
                          onClick={() =>
                            setRecipe((r) => ({
                              ...r,
                              effects: active ? r.effects.filter((e) => e.id !== id) : [...r.effects, { id, amount: 55 }],
                            }))
                          }
                        >
                          {id}
                        </Chip>
                      );
                    })}
                  </div>
                  {recipe.effects.map((eff) => (
                    <Slider
                      key={eff.id}
                      label={eff.id}
                      value={eff.amount}
                      min={0}
                      max={100}
                      onChange={(v) => setRecipe((r) => ({ ...r, effects: r.effects.map((e) => (e.id === eff.id ? { ...e, amount: v } : e)) }))}
                      accent="var(--app-accent)"
                    />
                  ))}
                </Section>
              </>
            )}

            {panel === "retocar" && (
              <>
                <Section title="Pincéis" icon={<Brush className="size-3.5 text-cyan" />}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BRUSH_TOOLS.filter((t) => !["move", "pick"].includes(t.id)).map((t) => (
                      <Btn key={t.id} size="sm" variant={tool === t.id ? "primary" : "outline"} onClick={() => setTool(t.id)} title={t.hint}>
                        {t.name}
                      </Btn>
                    ))}
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-dim">
                    Pinte sobre a imagem. Alt+clique define a origem do clone. Cada traço vira uma operação não destrutiva —
                    remova quando quiser.
                  </p>
                  <Slider label="Tamanho do pincel" value={brushSize} min={2} max={90} onChange={setBrushSize} />
                  <Slider label="Força" value={brushStrength} min={5} max={100} onChange={setBrushStrength} />
                  <Toggle
                    label="Modo comparar"
                    checked={compare}
                    onChange={setCompare}
                    hint="Sobrepõe o original para conferir o resultado"
                  />
                </Section>
                <Section title={`Pinceladas (${ops.length})`} icon={<Brush className="size-3.5" />} defaultOpen={false}>
                  <div className="space-y-1">
                    {[...ops].reverse().map((op) => (
                      <div key={op.id} className="flex items-center gap-2 rounded-lg border border-line bg-panel2/50 px-2 py-1">
                        <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted">
                          {op.tool} · {op.points.length} pts
                        </span>
                        <IconBtn size="sm" title="Remover" onClick={() => setOps((list) => list.filter((o) => o.id !== op.id))}>
                          <Trash2 className="size-3 text-rose" />
                        </IconBtn>
                      </div>
                    ))}
                    {ops.length === 0 && <p className="text-[10.5px] text-dim">Nenhuma pincelada ainda.</p>}
                  </div>
                </Section>
                <Section title="Máscaras locais" icon={<Layers className="size-3.5 text-cyan" />} defaultOpen={false}>
                  <Btn
                    size="sm"
                    full
                    variant="soft"
                    onClick={() =>
                      setMasks((list) => [
                        ...list,
                        { id: uid("mk"), kind: "radial", x: 0.5, y: 0.4, radius: 0.3, angle: 0, feather: 60, invert: false, adjust: {}, exposure: 30 },
                      ])
                    }
                  >
                    Adicionar máscara radial
                  </Btn>
                  {masks.map((m) => (
                    <div key={m.id} className="rounded-xl border border-line bg-panel2/50 p-2">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] capitalize text-ink">{m.kind}</span>
                        <IconBtn size="sm" title="Remover" onClick={() => setMasks((list) => list.filter((x) => x.id !== m.id))}>
                          <Trash2 className="size-3 text-rose" />
                        </IconBtn>
                      </div>
                      <Slider label="Exposição" value={m.exposure} min={-100} max={100} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, exposure: v } : x)))} compact />
                      <Slider label="Raio" value={m.radius} min={0.05} max={1} step={0.01} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, radius: v } : x)))} compact />
                      <Slider label="X" value={m.x} min={0} max={1} step={0.01} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, x: v } : x)))} compact />
                      <Slider label="Y" value={m.y} min={0} max={1} step={0.01} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, y: v } : x)))} compact />
                      <Slider label="Suavidade" value={m.feather} min={0} max={100} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, feather: v } : x)))} compact />
                      <Toggle label="Inverter" checked={m.invert} onChange={(v) => setMasks((list) => list.map((x) => (x.id === m.id ? { ...x, invert: v } : x)))} />
                    </div>
                  ))}
                </Section>
                <Section title="Remover fundo" icon={<Scissors className="size-3.5 text-pink" />} defaultOpen={false}>
                  <p className="text-[10.5px] leading-relaxed text-dim">
                    Detecta automaticamente o fundo pelas bordas ou usa uma cor-chave (verde/azul) e cria um PNG transparente no acervo.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Btn size="sm" onClick={() => void doRemoveBackground("auto", "#00b140", 24)}>
                      Fundo automático
                    </Btn>
                    <Btn size="sm" onClick={() => void doRemoveBackground("chroma", "#00b140", 32)}>
                      Chroma verde
                    </Btn>
                  </div>
                  <Btn size="sm" full icon={<Trash2 className="size-3.5" />} onClick={() => setMasks([])}>
                    Limpar máscaras
                  </Btn>
                </Section>
              </>
            )}

            {panel === "texto" && (
              <>
                <Section title="Camadas" icon={<TypeIcon className="size-3.5 text-amber" />}>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Btn
                      size="sm"
                      onClick={() =>
                        setOverlays((list) => [
                          ...list,
                          {
                            id: uid("ov"), type: "text", x: 0.5, y: 0.82, scale: 1, rotate: 0, opacity: 1, blend: "normal",
                            text: "Seu texto", font: FONTS[0].id, weight: 700, size: 60, color: "#ffffff", align: "center", uppercase: false,
                            letterSpacing: 0, strokeColor: "#000000", strokeWidth: 0, shadow: true, bg: "transparent", bgOpacity: 1, radius: 12,
                          },
                        ])
                      }
                    >
                      Texto
                    </Btn>
                    <Btn size="sm" onClick={() => setOverlays((list) => [...list, { id: uid("ov"), type: "shape", x: 0.5, y: 0.5, scale: 0.5, rotate: 0, opacity: 0.9, blend: "normal", shape: "rect", fill: "#d7a45a", stroke: "#ffffff", strokeWidth: 0 }])}>
                      Forma
                    </Btn>
                    <Btn size="sm" onClick={() => setOverlays((list) => [...list, { id: uid("ov"), type: "sticker", x: 0.8, y: 0.2, scale: 1, rotate: 0, opacity: 1, blend: "normal", emoji: "🔥", size: 1 }])}>
                      Adesivo
                    </Btn>
                    <Btn size="sm" onClick={() => setOverlays((list) => [...list, { id: uid("ov"), type: "image", x: 0.5, y: 0.5, scale: 0.4, rotate: 0, opacity: 1, blend: "normal", src: "", width: 0.3, height: 0.3 }])}>
                      Imagem
                    </Btn>
                  </div>
                  <div className="space-y-1">
                    {overlays.map((o) => (
                      <div
                        key={o.id}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-[10.5px] transition",
                          o.id === selectedOverlay ? "border-amber bg-amber/15 text-white" : "border-line bg-panel2/50 text-muted hover:text-ink"
                        )}
                      >
                        <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setSelectedOverlay(o.id)}>
                          {o.type === "text" ? (o as { text: string }).text : o.type}
                        </button>
                        <button
                          type="button"
                          title="Visibilidade"
                          className="rounded-md p-1 text-dim transition hover:bg-white/10 hover:text-ink"
                          onClick={() => setOverlays((list) => list.map((x) => (x.id === o.id ? { ...x, opacity: x.opacity > 0.05 ? 0 : 1 } : x)))}
                        >
                          {o.opacity > 0.05 ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                        </button>
                        <button
                          type="button"
                          title="Remover"
                          className="rounded-md p-1 text-dim transition hover:bg-rose/20 hover:text-rose"
                          onClick={() => setOverlays((list) => list.filter((x) => x.id !== o.id))}
                        >
                          <Trash2 className="size-3 text-rose" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Section>

                {selected && (
                  <Section title="Propriedades da camada" icon={<PenTool className="size-3.5 text-vio" />}>
                    <Slider label="Posição X" value={selected.x} min={0} max={1} step={0.005} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id ? { ...o, x: v } : o)))} format={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Slider label="Posição Y" value={selected.y} min={0} max={1} step={0.005} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id ? { ...o, y: v } : o)))} format={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Slider label="Escala" value={selected.scale} min={0.1} max={3} step={0.02} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id ? { ...o, scale: v } : o)))} format={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Slider label="Rotação" value={selected.rotate} min={-180} max={180} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id ? { ...o, rotate: v } : o)))} unit="°" />
                    <Slider label="Opacidade" value={selected.opacity} min={0} max={1} step={0.02} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id ? { ...o, opacity: v } : o)))} />
                    {selected.type === "text" && (
                      <>
                        <TextField textarea rows={2} label="Texto" value={selected.text} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, text: v } : o)))} />
                        <Sel label="Fonte" value={selected.font} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, font: v } : o)))} options={FONTS.map((f) => ({ value: f.id, label: f.name }))} />
                        <Slider label="Tamanho" value={selected.size} min={12} max={220} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, size: v } : o)))} />
                        <div className="flex items-center gap-2">
                          <input type="color" value={selected.color} onChange={(e) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, color: e.target.value } : o)))} className="size-8" />
                          <Toggle label="Maiúsculas" checked={selected.uppercase} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, uppercase: v } : o)))} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Sel
                            label="Fundo"
                            value={selected.bg ?? "transparent"}
                            onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, bg: v } : o)))}
                            options={[{ value: "transparent", label: "Sem fundo" }, ...palette.slice(0, 6).map((c) => ({ value: c, label: c })), { value: "#000000cc", label: "Preto suave" }]}
                          />
                          <NumField label="Contorno" value={selected.strokeWidth} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "text" ? { ...o, strokeWidth: v } : o)))} />
                        </div>
                      </>
                    )}
                    {selected.type === "sticker" && (
                      <>
                        <TextField label="Emoji" value={selected.emoji} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "sticker" ? { ...o, emoji: v } : o)))} />
                        <div className="flex flex-wrap gap-1">
                          {STICKER_GROUPS.flatMap((g) => g.items).slice(0, 20).map((e) => (
                            <button key={e} type="button" className="rounded border border-line px-1.5 text-base" onClick={() => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "sticker" ? { ...o, emoji: e } : o)))}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {selected.type === "shape" && (
                      <>
                        <Sel label="Forma" value={selected.shape} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "shape" ? { ...o, shape: v } : o)))} options={SHAPES.map((sh) => ({ value: sh.id, label: sh.name }))} />
                        <div className="flex items-center gap-2">
                          <input type="color" value={selected.fill} title="Preenchimento" onChange={(e) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "shape" ? { ...o, fill: e.target.value } : o)))} className="size-8" />
                          <input type="color" value={selected.stroke} title="Contorno" onChange={(e) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "shape" ? { ...o, stroke: e.target.value } : o)))} className="size-8" />
                        </div>
                        <Slider label="Espessura do contorno" value={selected.strokeWidth} min={0} max={40} onChange={(v) => setOverlays((list) => list.map((o) => (o.id === selected.id && o.type === "shape" ? { ...o, strokeWidth: v } : o)))} />
                      </>
                    )}
                  </Section>
                )}

                <Section title="Cores capturadas" icon={<Pipette className="size-3.5 text-cyan" />} defaultOpen={false}>
                  <p className="text-[10.5px] text-dim">Use a ferramenta conta-gotas sobre a imagem para montar sua paleta.</p>
                  <div className="flex flex-wrap gap-1">
                    {palette.map((c) => (
                      <button key={c} type="button" title={c} onClick={() => void navigator.clipboard?.writeText(c)} className="size-7 rounded-lg border border-line" style={{ background: c }} />
                    ))}
                  </div>
                  <Btn size="sm" full variant="soft" onClick={() => renderCanvas && setPalette(extractPalette(renderCanvas, 10))}>
                    Extrair paleta da imagem
                  </Btn>
                </Section>
              </>
            )}

            {panel === "moldura" && <FramePanel recipe={recipe} onChange={(r) => commit(r, "Moldura")} />}

            {panel === "arte" && (
              <>
                <Section title="Colagem" icon={<Grid3X3 className="size-3.5 text-vio" />}>
                  <p className="text-[10.5px] leading-relaxed text-dim">
                    Gera uma folha com as fotos do acervo — ideal para antes/depois, grades de produto e carrosséis.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Btn size="sm" onClick={() => void makeCollage(2)}>2 colunas</Btn>
                    <Btn size="sm" onClick={() => void makeCollage(3)}>3 colunas</Btn>
                    <Btn size="sm" onClick={() => void makeCollage(4)}>4 colunas</Btn>
                    <Btn size="sm" onClick={() => void makeCollage(9)}>Grade 3×3</Btn>
                  </div>
                </Section>
                <Section title="Arte generativa" icon={<Sparkles className="size-3.5 text-pink" />} defaultOpen={false}>
                  <Btn size="sm" full variant="soft" onClick={() => setArtModal(true)}>
                    Abrir estúdio de arte (pixel art, ASCII, daltonismo)
                  </Btn>
                </Section>
                <Section title="Receita atual" icon={<History className="size-3.5" />} defaultOpen={false}>
                  <TextField label="Nome da receita" value={recipeName} onChange={setRecipeName} placeholder="meu-look-foto" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Btn
                      size="sm"
                      onClick={() => {
                        const list = JSON.parse(localStorage.getItem("editzz.photoRecipes") ?? "[]") as { name: string; recipe: ImageRecipe }[];
                        list.push({ name: recipeName || `Receita ${list.length + 1}`, recipe });
                        localStorage.setItem("editzz.photoRecipes", JSON.stringify(list.slice(-20)));
                        store.toast("Receita guardada", "Disponível para aplicar em outras fotos.", "ok");
                      }}
                    >
                      Guardar
                    </Btn>
                    <Btn size="sm" onClick={() => setImportRecipeOpen(true)}>
                      Aplicar receita
                    </Btn>
                  </div>
                  <Btn size="sm" full variant="ghost" icon={<X className="size-3.5" />} onClick={() => { setRecipe(defaultRecipe(photo?.width ?? 1000, photo?.height ?? 1000)); setOps([]); setMasks([]); setOverlays([]); }}>
                    Zerar edição
                  </Btn>
                </Section>
              </>
            )}

            {panel === "exportar" && (
              <>
                <Section title="Exportar imagem" icon={<Download className="size-3.5 text-lime" />}>
                  <ExportPhoto onExport={exportImage} />
                </Section>
                <Section title="Metadados EXIF" icon={<ImageIcon className="size-3.5" />} defaultOpen={false}>
                  <Btn size="sm" full variant="soft" onClick={() => void readPhotoExif()}>
                    Ler EXIF da foto
                  </Btn>
                  {exif && (
                    <div className="space-y-0.5 text-[10.5px]">
                      {Object.entries(exif).map(([k, v]) => (
                        <p key={k} className="flex justify-between gap-2">
                          <span className="text-dim">{k}</span>
                          <span className="truncate text-ink">{String(v)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </Section>
                <Section title="Fluxo de trabalho" icon={<Layers className="size-3.5" />} defaultOpen={false}>
                  <Btn size="sm" full onClick={() => setBgModal(true)}>
                    Ver checklist de retoque
                  </Btn>
                  <ul className="space-y-1 text-[10.5px] text-muted">
                    <li>• Corrija a perspectiva e o corte antes dos ajustes de cor.</li>
                    <li>• Use máscaras locais para olhos, pele e fundo.</li>
                    <li>• Finalize com look, grão e moldura.</li>
                    <li>• Exporte em PNG para manter transparência.</li>
                  </ul>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={bgModal} onClose={() => setBgModal(false)} title="Checklist de retoque profissional">
        <div className="space-y-2 text-[11.5px] leading-relaxed text-muted">
          {[
            "Enquadramento: corte e endireitamento primeiro, para não reprocessar a imagem depois.",
            "Exposição: recupere altas luzes e sombras antes de mexer no contraste.",
            "Pele: use Suavizar com força baixa e Reparar para manchas e linhas finas.",
            "Olhos: Iluminar no branco dos olhos e Olhos vermelhos para pupilas.",
            "Cor: HSL por faixa evita mudar toda a imagem; máscaras afinam o resultado.",
            "Look: aplique por último e sempre com intensidade entre 40% e 80%.",
            "Grão e vinheta: dão acabamento, mas em excesso escondem a foto.",
          ].map((tip) => (
            <p key={tip} className="flex gap-2">
              <span className="text-vio">•</span>
              {tip}
            </p>
          ))}
          <Btn full variant="primary" onClick={() => { setBgModal(false); setPanel("retocar"); }}>
            Começar pelo retoque
          </Btn>
        </div>
      </Modal>

      <Modal open={artModal} onClose={() => setArtModal(false)} title="Estúdio de arte" wide>
        <ArtStudio canvas={renderCanvas} />
      </Modal>

      <Modal open={importRecipeOpen} onClose={() => setImportRecipeOpen(false)} title="Receitas guardadas">
        <div className="space-y-1.5">
          {(JSON.parse(localStorage.getItem("editzz.photoRecipes") ?? "[]") as { name: string; recipe: ImageRecipe }[]).map((r, i) => (
            <div key={`${r.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-panel2/60 p-2">
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">{r.name}</span>
              <Btn size="sm" variant="soft" onClick={() => { setRecipe(r.recipe); setImportRecipeOpen(false); store.toast("Receita aplicada", r.name, "ok"); }}>
                aplicar
              </Btn>
            </div>
          ))}
          <Btn size="sm" full variant="ghost" onClick={() => { localStorage.removeItem("editzz.photoRecipes"); store.toast("Receitas apagadas", undefined, "info"); }}>
            limpar todas
          </Btn>
        </div>
      </Modal>
    </div>
  );

  async function makeCollage(cols: number) {
    if (photos.length < 2) {
      store.toast("Precisa de duas fotos", "Importe mais imagens para montar a colagem.", "warn");
      return;
    }
    const ratio = 4 / 3;
    const picked = photos.slice(0, cols * cols);
    const cells = await Promise.all(
      picked.map((p) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = p.url;
        return new Promise<HTMLCanvasElement>((resolve) => {
          img.onload = () => {
            const cell = document.createElement("canvas");
            cell.height = 900;
            cell.width = Math.round(900 * ratio);
            const ctx = cell.getContext("2d");
            if (ctx) {
              const cover = Math.max(cell.width / img.naturalWidth, cell.height / img.naturalHeight);
              const w = img.naturalWidth * cover;
              const h = img.naturalHeight * cover;
              ctx.drawImage(img, (cell.width - w) / 2, (cell.height - h) / 2, w, h);
            }
            resolve(cell);
          };
          img.onerror = () => resolve(document.createElement("canvas"));
        });
      })
    );
    const sheet = collage(cells, cols, 18, "#0b0b12", 14);
    const blob = await new Promise<Blob | null>((r) => sheet.toBlob((b) => r(b), "image/jpeg", 0.92));
    if (blob) {
      download(blob, `editzz-colagem-${cols}x${cols}.jpg`);
      store.toast("Colagem gerada", `${picked.length} fotos · grade ${cols}×${cols}`, "ok");
    }
  }
}

/* ────────────── curvas (editor gráfico) ────────────── */

function CurvesPanel({ recipe, onChange }: { recipe: ImageRecipe; onChange: (r: ImageRecipe) => void }) {
  const [channel, setChannel] = useState<"rgb" | "r" | "g" | "b">("rgb");
  const points = recipe.curves[channel];
  const size = 190;
  const toPath = (list: { x: number; y: number }[]) => list.map((p) => `${p.x * size},${(1 - p.y) * size}`).join(" ");

  const addPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    const next = [...points, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }].sort((a, b) => a.x - b.x);
    onChange({ ...recipe, curves: { ...recipe.curves, [channel]: next } });
  };

  return (
    <>
      <Section title="Curvas de tom" icon={<Sliders className="size-3.5 text-cyan" />}>
        <div className="flex gap-1">
          {(["rgb", "r", "g", "b"] as const).map((c) => (
            <Chip key={c} active={channel === c} onClick={() => setChannel(c)}>
              {c === "rgb" ? "RGB" : c.toUpperCase()}
            </Chip>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[220px] cursor-crosshair rounded-xl border border-line bg-bg2"
          onClick={addPoint}
        >
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g} stroke="rgba(255,255,255,0.08)">
              <line x1={g * size} y1={0} x2={g * size} y2={size} />
              <line x1={0} y1={g * size} x2={size} y2={g * size} />
            </g>
          ))}
          <polyline
            points={toPath([{ x: 0, y: 0 }, ...points, { x: 1, y: 1 }])}
            fill="none"
            stroke={channel === "rgb" ? "#22d3ee" : channel === "r" ? "#fb7185" : channel === "g" ? "#a3e635" : "#86a9d0"}
            strokeWidth={2}
          />
          {points.map((p, i) => (
            <circle key={i} cx={p.x * size} cy={(1 - p.y) * size} r={4} fill="#fff" />
          ))}
        </svg>
        <div className="flex gap-1.5">
          <Btn size="sm" onClick={() => onChange({ ...recipe, curves: { ...recipe.curves, [channel]: [] } })}>
            Resetar curva
          </Btn>
          <Btn size="sm" variant="soft" onClick={() => onChange({ ...recipe, curves: { ...recipe.curves, rgb: [{ x: 0.25, y: 0.18 }, { x: 0.75, y: 0.82 }] } })}>
            Curva S
          </Btn>
        </div>
        <p className="text-[10.5px] leading-relaxed text-dim">
          Clique no gráfico para criar pontos de controle. A curva é aplicada com interpolação suave (Catmull-Rom),
          igual aos editores profissionais.
        </p>
      </Section>
    </>
  );
}

function Histogram({ data }: { data: { r: number[]; g: number[]; b: number[]; l: number[] } }) {
  const max = Math.max(...data.l, 1);
  return (
    <div className="flex h-20 items-end gap-px rounded-xl border border-line bg-bg2/70 p-1">
      {data.l.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px]"
          style={{
            height: `${Math.max(2, (v / max) * 100)}%`,
            background: `linear-gradient(180deg, rgba(255,255,255,0.75), rgba(215,164,90,0.45))`,
          }}
        />
      ))}
    </div>
  );
}

function bandColor(band: string) {
  const map: Record<string, string> = {
    red: "#f87171", orange: "#fb923c", yellow: "#facc15", green: "#4ade80",
    aqua: "#22d3ee", blue: "#60a5fa", purple: "#a855f7", magenta: "#f472b6",
  };
  return map[band] ?? "#888";
}

/* ────────────── moldura ────────────── */

function FramePanel({ recipe, onChange }: { recipe: ImageRecipe; onChange: (r: ImageRecipe) => void }) {
  const frames: { id: ImageRecipe["frame"]["id"]; name: string }[] = [
    { id: "none", name: "Sem moldura" },
    { id: "polaroid", name: "Polaroid" },
    { id: "film", name: "Filme 35mm" },
    { id: "rounded", name: "Cantos redondos" },
    { id: "double", name: "Moldura dupla" },
    { id: "color", name: "Cor sólida" },
    { id: "shadow", name: "Sombra suave" },
    { id: "phone", name: "Celular" },
  ];
  return (
    <>
      <Section title="Moldura" icon={<ImageIcon className="size-3.5 text-vio" />}>
        <div className="grid grid-cols-2 gap-1.5">
          {frames.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange({ ...recipe, frame: { ...recipe.frame, id: f.id } })}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-[10.5px] transition",
                recipe.frame.id === f.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/50 text-muted hover:text-ink"
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={recipe.frame.color} onChange={(e) => onChange({ ...recipe, frame: { ...recipe.frame, color: e.target.value } })} className="size-8" />
          <span className="text-[11px] text-muted">cor da moldura</span>
        </div>
        <Slider label="Espessura" value={recipe.frame.width} min={1} max={80} onChange={(v) => onChange({ ...recipe, frame: { ...recipe.frame, width: v } })} />
        <Slider label="Cantos" value={recipe.frame.radius} min={0} max={120} onChange={(v) => onChange({ ...recipe, frame: { ...recipe.frame, radius: v } })} />
      </Section>
      <Section title="Marca d'água" icon={<Stamp className="size-3.5" />} defaultOpen={false}>
        <Toggle label="Ativar marca d'água" checked={recipe.watermark.enabled} onChange={(v) => onChange({ ...recipe, watermark: { ...recipe.watermark, enabled: v } })} />
        <TextField label="Texto" value={recipe.watermark.text} onChange={(v) => onChange({ ...recipe, watermark: { ...recipe.watermark, text: v } })} />
        <Sel
          label="Posição"
          value={recipe.watermark.pos}
          onChange={(v) => onChange({ ...recipe, watermark: { ...recipe.watermark, pos: v } })}
          options={[
            { value: "tl", label: "Alto esquerda" },
            { value: "tr", label: "Alto direita" },
            { value: "bl", label: "Baixo esquerda" },
            { value: "br", label: "Baixo direita" },
            { value: "center", label: "Centro" },
          ]}
        />
        <Slider label="Tamanho" value={recipe.watermark.size} min={10} max={160} onChange={(v) => onChange({ ...recipe, watermark: { ...recipe.watermark, size: v } })} />
        <Slider label="Opacidade" value={recipe.watermark.opacity} min={0.05} max={1} step={0.05} onChange={(v) => onChange({ ...recipe, watermark: { ...recipe.watermark, opacity: v } })} />
      </Section>
    </>
  );
}

/* ────────────── exportar foto ────────────── */

function ExportPhoto({ onExport }: { onExport: (format: "image/png" | "image/jpeg" | "image/webp", quality: number, maxSize: number, name: string) => Promise<void> }) {
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(0.92);
  const [maxSize, setMaxSize] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <TextField label="Nome do arquivo" value={name} onChange={setName} placeholder="editzz-foto" />
      <Sel
        label="Formato"
        value={format}
        onChange={(v) => setFormat(v as typeof format)}
        options={[
          { value: "image/png", label: "PNG (sem perdas, transparência)" },
          { value: "image/jpeg", label: "JPEG (menor, para redes)" },
          { value: "image/webp", label: "WebP (moderno e leve)" },
        ]}
      />
      {format !== "image/png" && <Slider label="Qualidade" value={quality * 100} min={40} max={100} onChange={(v) => setQuality(v / 100)} format={(v) => `${v.toFixed(0)}%`} />}
      <Sel
        label="Tamanho máximo"
        value={String(maxSize)}
        onChange={(v) => setMaxSize(parseInt(v, 10))}
        options={[
          { value: "0", label: "Tamanho original" },
          { value: "3840", label: "4K (3840)" },
          { value: "1920", label: "Full HD (1920)" },
          { value: "1280", label: "HD (1280)" },
          { value: "1080", label: "Quadrado/Reels (1080)" },
        ]}
      />
      <Btn
        full
        variant="primary"
        disabled={busy}
        icon={busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        onClick={async () => {
          setBusy(true);
          try {
            await onExport(format, quality, maxSize, name);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Processando…" : "Baixar imagem"}
      </Btn>
    </div>
  );
}

/* ────────────── estúdio de arte ────────────── */

function ArtStudio({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const [pixelSize, setPixelSize] = useState(10);
  const [colors, setColors] = useState(16);
  const [cols, setCols] = useState(110);
  const [blind, setBlind] = useState<"protan" | "deutan" | "tritan">("deutan");
  const [ascii, setAscii] = useState<string>("");
  const [preview, setPreview] = useState<string>("");

  if (!canvas) return <p className="text-[11.5px] text-dim">Carregue uma foto para usar o estúdio de arte.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5 rounded-xl border border-line bg-panel2/50 p-2">
          <p className="text-[11px] font-medium text-ink">Pixel art</p>
          <Slider label="Bloco" value={pixelSize} min={2} max={40} onChange={setPixelSize} compact />
          <Slider label="Cores" value={colors} min={2} max={64} onChange={setColors} compact />
          <Btn size="sm" full onClick={() => setPreview(pixelArt(canvas, pixelSize, colors).toDataURL("image/png"))}>
            Gerar
          </Btn>
        </div>
        <div className="space-y-1.5 rounded-xl border border-line bg-panel2/50 p-2">
          <p className="text-[11px] font-medium text-ink">ASCII art</p>
          <Slider label="Colunas" value={cols} min={40} max={220} onChange={setCols} compact />
          <Btn size="sm" full onClick={() => setAscii(asciiArt(canvas, cols))}>
            Gerar
          </Btn>
          <Btn size="sm" full variant="soft" onClick={() => ascii && void navigator.clipboard?.writeText(ascii)}>
            Copiar
          </Btn>
        </div>
        <div className="space-y-1.5 rounded-xl border border-line bg-panel2/50 p-2">
          <p className="text-[11px] font-medium text-ink">Daltonismo</p>
          <Sel
            value={blind}
            onChange={(v) => setBlind(v as typeof blind)}
            options={[
              { value: "protan", label: "Protanopia" },
              { value: "deutan", label: "Deuteranopia" },
              { value: "tritan", label: "Tritanopia" },
            ]}
          />
          <Btn size="sm" full onClick={() => setPreview(simulateColorBlindness(canvas, blind).toDataURL("image/png"))}>
            Simular
          </Btn>
        </div>
      </div>
      {preview && <img src={preview} alt="arte" className="mx-auto max-h-64 rounded-xl border border-line" />}
      {ascii && (
        <pre className="scroll-thin max-h-56 overflow-auto rounded-xl border border-line bg-bg2 p-2 font-mono text-[5px] leading-[6px] text-lime">
          {ascii}
        </pre>
      )}
    </div>
  );
}
