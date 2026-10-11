import {
  BarChart3,
  Captions,
  Crosshair,
  Film,
  Gauge,
  Layers,
  Music,
  RefreshCw,
  Scissors,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  autoReframe,
  computeStabilization,
  detectScenes,
  energyForAsset,
  paletteFromAsset,
  silenceWindows,
  suggestCuts,
  trackObject,
} from "@/core/analysis";
import { detectBeats } from "@/core/audio";
import { STABILIZER } from "@/core/engine";
import { pool } from "@/core/media";
import { clipEnd, createTextClip, projectDuration, type Clip, type Marker } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import { Badge, Btn, Section, Slider, TextField, Toggle } from "@/components/ui";
import { CAPTION_STYLES, SPEED_CURVES } from "@/lib/presets";
import { clamp, uid } from "@/lib/utils";

const FILLERS = ["né", "tipo assim", "aham", "éé", "ahn", "então", "bom", "cara", "meio que"];

export default function ToolsPanel() {
  const { state, store: s } = useEditzz();
  const [script, setScript] = useState("Bem-vindo ao editzz! Neste vídeo você vai ver como editar tudo pelo navegador. Solte arquivos, corte no ritmo da música e exporte em segundos.");
  const [trackX, setTrackX] = useState(0.5);
  const [trackY, setTrackY] = useState(0.5);
  const [trackSize, setTrackSize] = useState(0.16);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [sceneThreshold, setSceneThreshold] = useState(0.055);
  const [silenceMin, setSilenceMin] = useState(0.4);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [energy, setEnergy] = useState<number[]>([]);

  const videoClips = state.project.clips.filter((c) => c.kind === "video");
  const selectedVideo = state.project.clips.find((c) => c.id === state.selectedClipIds[0] && c.kind === "video") ?? videoClips[0];
  const duration = projectDuration(state.project);

  const run = async (label: string, fn: (report: (p: number) => void) => Promise<void>) => {
    setBusy(label);
    setProgress(0);
    try {
      await fn((p) => setProgress(p));
      store.toast(`${label} concluído`, undefined, "ok");
    } catch {
      store.toast(`${label} falhou`, "Tente novamente com outro clipe.", "erro");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  /* ── legendas automáticas (Web Speech API) ── */
  const startAutoCaptions = async () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      store.toast("Reconhecimento de fala indisponível", "Use “Legendas a partir do roteiro” neste navegador.", "warn");
      return;
    }
    const audioAsset = state.assets.find((a) => a.hasAudio && a.kind !== "image");
    if (!audioAsset) {
      store.toast("Sem faixa de áudio", "Adicione um vídeo ou música com fala para transcrever.", "warn");
      return;
    }
    const buffer = await pool.decodeAudio(audioAsset);
    if (!buffer) {
      store.toast("Não foi possível ler o áudio", undefined, "erro");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;
    const started = performance.now();
    const clips: Clip[] = [];
    let offset = 0;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript?.trim();
        if (!text) continue;
        if (clips.length) {
          clips[clips.length - 1].duration = Math.max(0.6, performance.now() / 1000 - started - offset);
        }
        const clip = createTextClip(
          state.project.tracks.find((t) => t.kind === "text")?.id ?? state.project.tracks[0].id,
          offset,
          Math.max(1.2, text.length * 0.06),
          text
        );
        if (clip.text) {
          const style = CAPTION_STYLES[0];
          clip.text = {
            ...clip.text,
            bgEnabled: true,
            bgColor: style.bg,
            color: style.color,
            uppercase: style.uppercase,
            weight: style.weight,
            size: style.size,
            radius: style.radius,
            padding: style.padding,
            animation: "fade_in",
          };
        }
        clips.push(clip);
        offset += clip.duration;
      }
    };
    recognition.onerror = () => store.toast("Erro no reconhecimento", "Verifique a permissão do microfone do sistema.", "erro");
    recognition.onend = () => {
      if (clips.length) {
        s.commit("Legendas automáticas", (p) => ({ ...p, clips: [...p.clips, ...clips] }));
        store.toast(`${clips.length} legendas criadas`, "Ajuste o texto direto nos clipes da faixa de texto.", "ok");
      } else {
        store.toast("Nenhuma fala reconhecida", "O áudio é reproduzido nos alto-falantes para a transcrição.", "warn");
      }
    };

    // toca o áudio do projeto para o reconhecedor "ouvir"
    const { ProjectAudioMixer } = await import("@/core/audio");
    const mixer = new ProjectAudioMixer();
    await mixer.start(state.project, state.assets, 0);
    transport.seek(0);
    s.setPlayhead(0);
    transport.setPlaying(true);
    void s;
    recognition.start();
    setTimeout(() => {
      recognition.stop();
      mixer.stop();
      transport.setPlaying(false);
    }, Math.min(duration, 60) * 1000);
    store.toast("Ouvindo o projeto…", "A transcrição acontece enquanto o áudio é reproduzido.", "info");
  };

  /* ── legendas a partir do roteiro ── */
  const scriptToCaptions = () => {
    const textTrack = state.project.tracks.find((t) => t.kind === "text")?.id ?? state.project.tracks[0].id;
    const chunks = script
      .split(/(?<=[.!?])\s+/)
      .flatMap((sentence) => {
        const words = sentence.split(/\s+/);
        const out: string[] = [];
        for (let i = 0; i < words.length; i += 7) out.push(words.slice(i, i + 7).join(" "));
        return out.filter(Boolean);
      });
    if (!chunks.length) {
      store.toast("Cole um roteiro", "O texto será distribuído em legendas sincronizadas.", "warn");
      return;
    }
    const total = Math.max(duration, 5);
    const per = clamp(total / chunks.length, 0.8, 6);
    const clips: Clip[] = chunks.map((chunk, i) => {
      const clip = createTextClip(textTrack, i * per, per, chunk);
      if (clip.text) {
        clip.text = {
          ...clip.text,
          bgEnabled: true,
          bgColor: "#000000cc",
          size: 48,
          weight: 700,
          uppercase: true,
          radius: 10,
          padding: 14,
          animation: "fade_in",
        };
      }
      return clip;
    });
    s.commit("Legendas do roteiro", (p) => ({ ...p, clips: [...p.clips, ...clips] }));
    store.toast(`${clips.length} legendas criadas`, "Use a aba Texto para mudar o estilo de todas.", "ok");
  };

  const karaokeFromLyrics = () => {
    const textTrack = state.project.tracks.find((t) => t.kind === "text")?.id ?? state.project.tracks[0].id;
    const lines = script.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      store.toast("Uma linha por verso", "Escreva a letra com uma linha para cada frase.", "warn");
      return;
    }
    const total = Math.max(duration, 6);
    const per = total / lines.length;
    const clips: Clip[] = lines.map((line, i) => {
      const clip = createTextClip(textTrack, i * per, per, line);
      if (clip.text) {
        clip.text = {
          ...clip.text,
          size: 64,
          weight: 800,
          uppercase: true,
          color: "#ffffff",
          strokeEnabled: true,
          strokeColor: "#000000",
          strokeWidth: 6,
          animation: "karaoke",
        };
      }
      return clip;
    });
    s.commit("Karaokê", (p) => ({ ...p, clips: [...p.clips, ...clips] }));
    store.toast(`${clips.length} linhas sincronizadas`, "Cada linha destaca as palavras conforme o tempo passa.", "ok");
  };

  const applyCaptionStyleToAll = (styleId: string) => {
    const style = CAPTION_STYLES.find((c) => c.id === styleId);
    if (!style) return;
    s.commit("Estilo de legenda", (p) => ({
      ...p,
      clips: p.clips.map((c) =>
        c.kind === "text" && c.text
          ? {
              ...c,
              text: {
                ...c.text,
                bgEnabled: style.bg !== "transparent",
                bgColor: style.bg,
                color: style.color,
                strokeEnabled: style.stroke > 0,
                strokeWidth: style.stroke,
                strokeColor: "#000000",
                uppercase: style.uppercase,
                weight: style.weight,
                size: style.size,
                radius: style.radius,
                padding: style.padding,
              },
            }
          : c
      ),
    }));
    store.toast("Estilo aplicado", style.name, "ok");
  };

  const cleanFillers = () => {
    let changed = 0;
    s.commit("Limpar muletas", (p) => ({
      ...p,
      clips: p.clips.map((c) => {
        if (c.kind !== "text" || !c.text) return c;
        let text = c.text.content;
        FILLERS.forEach((f) => {
          const re = new RegExp(`\\b${f}\\b`, "gi");
          if (re.test(text)) {
            text = text.replace(re, "").replace(/\s{2,}/g, " ").trim();
            changed++;
          }
        });
        return { ...c, text: { ...c.text, content: text } };
      }),
    }));
    store.toast(changed ? `${changed} muleta(s) removida(s)` : "Nenhuma muleta encontrada", undefined, changed ? "ok" : "info");
  };

  const checkContrast = () => {
    const texts = state.project.clips.filter((c) => c.kind === "text" && c.text);
    if (!texts.length) {
      store.toast("Sem legendas no projeto", undefined, "warn");
      return;
    }
    const issues = texts.filter((c) => {
      const fg = c.text!.color;
      const bg = c.text!.bgEnabled ? c.text!.bgColor.slice(0, 7) : null;
      if (!bg) return false;
      const lum = (hex: string) => {
        const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
        const r = ((n >> 16) & 255) / 255;
        const g = ((n >> 8) & 255) / 255;
        const b = (n & 255) / 255;
        const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const l1 = lum(fg);
      const l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return ratio < 4.5;
    });
    if (issues.length) {
      store.toast(`${issues.length} legenda(s) com contraste baixo`, "Abaixo de 4.5:1 fica difícil de ler no celular.", "warn");
    } else {
      store.toast("Contraste aprovado", "Todas as legendas passam em 4.5:1.", "ok");
    }
  };

  /* ── detecção de cenas ── */
  const runScenes = () =>
    run("Detectar cenas", async (report) => {
      if (!selectedVideo) throw new Error("sem vídeo");
      const asset = state.assets.find((a) => a.id === selectedVideo.assetId);
      if (!asset) throw new Error("sem asset");
      const cuts = await detectScenes(asset, {
        from: selectedVideo.in,
        to: Math.min(asset.duration, selectedVideo.in + selectedVideo.duration),
        threshold: sceneThreshold,
        onProgress: report,
      });
      if (!cuts.length) {
        store.toast("Nenhum corte encontrado", "Tente reduzir o limiar de sensibilidade.", "warn");
        return;
      }
      const markers: Marker[] = cuts.map((t, i) => ({
        id: uid("mk"),
        t: selectedVideo.start + (t - selectedVideo.in) / selectedVideo.speed,
        label: `Cena ${i + 1}`,
        color: "#22d3ee",
        kind: "cena",
      }));
      s.commit("Dividir em cenas", (p) => {
        let clips = [...p.clips];
        const base = clips.find((c) => c.id === selectedVideo.id);
        if (!base) return p;
        const idx = clips.findIndex((c) => c.id === selectedVideo.id);
        const min = Math.min(asset.duration, base.in + base.duration);
        const points = [base.in, ...cuts.filter((t) => t > base.in && t < min), min];
        const parts: Clip[] = [];
        for (let i = 0; i < points.length - 1; i++) {
          const len = (points[i + 1] - points[i]) / base.speed;
          const part: Clip = {
            ...JSON.parse(JSON.stringify(base)),
            id: i === 0 ? base.id : uid("clip"),
            start: base.start + (points[i] - base.in) / base.speed,
            duration: Math.max(0.05, len),
            in: points[i],
            transitionIn: i === 0 ? base.transitionIn : undefined,
          };
          parts.push(part);
        }
        clips = clips.filter((c) => c.id !== base.id);
        clips.splice(idx, 0, ...parts);
        return { ...p, clips, markers: [...p.markers, ...markers] };
      });
      store.toast(`${cuts.length} cenas detectadas`, "O clipe foi dividido nos cortes encontrados.", "ok");
    });

  /* ── remover silêncio ── */
  const removeSilence = () =>
    run("Remover silêncio", async () => {
      const target = state.project.clips.find((c) => c.kind !== "image" && c.assetId);
      const asset = state.assets.find((a) => a.id === target?.assetId);
      if (!target || !asset) throw new Error("sem clipe");
      const windows = await silenceWindows(asset, 0.012, silenceMin);
      if (!windows.length) {
        store.toast("Nenhum silêncio relevante", "Tente reduzir a duração mínima.", "warn");
        return;
      }
      s.commit("Remover silêncios", (p) => {
        let clips = [...p.clips];
        const base = clips.find((c) => c.id === target.id);
        if (!base) return p;
        const idx = clips.findIndex((c) => c.id === target.id);
        const parts: Clip[] = [];
        let cursor = base.in;
        const end = base.in + base.duration * base.speed;
        const inside = windows
          .filter((w) => w.end > base.in && w.start < end)
          .map((w) => ({ start: Math.max(w.start, base.in), end: Math.min(w.end, end) }));
        let offset = 0;
        inside.forEach((w) => {
          if (w.start - cursor > 0.15) {
            parts.push({
              ...JSON.parse(JSON.stringify(base)),
              id: parts.length === 0 ? base.id : uid("clip"),
              start: base.start + offset / base.speed,
              in: cursor,
              duration: (w.start - cursor) / base.speed,
            });
            offset += w.start - cursor;
          }
          cursor = w.end;
        });
        if (end - cursor > 0.15) {
          parts.push({
            ...JSON.parse(JSON.stringify(base)),
            id: parts.length === 0 ? base.id : uid("clip"),
            start: base.start + offset / base.speed,
            in: cursor,
            duration: (end - cursor) / base.speed,
          });
        }
        if (!parts.length) return p;
        clips = clips.filter((c) => c.id !== base.id);
        clips.splice(idx, 0, ...parts);
        return { ...p, clips };
      });
      store.toast(`${windows.length} pausas removidas`, "O clipe foi reconstruído sem os trechos silenciosos.", "ok");
    });

  /* ── batidas ── */
  const detectBeatsAction = () =>
    run("Detectar batidas", async () => {
      const audio = state.assets.find((a) => a.kind === "audio") ?? state.assets.find((a) => a.hasAudio && a.kind === "video");
      if (!audio) throw new Error("sem áudio");
      const buffer = await pool.decodeAudio(audio);
      if (!buffer) throw new Error("decode");
      const beats = detectBeats(buffer);
      const markers: Marker[] = beats.map((t) => ({ id: uid("mk"), t, label: "batida", color: "#d58f73", kind: "batida" }));
      s.setMarkers([...state.project.markers.filter((m) => m.kind !== "batida"), ...markers], "Marcadores de batida");
      setEnergy(await energyForAsset(audio, 200));
      store.toast(`${beats.length} batidas marcadas`, "Use “Cortar no ritmo” para fatiar os clipes nelas.", "ok");
    });

  const cutOnBeats = () =>
    run("Cortar no ritmo", async () => {
      const beats = state.project.markers.filter((m) => m.kind === "batida").map((m) => m.t);
      if (beats.length < 2) {
        store.toast("Sem marcadores de batida", "Detecte as batidas antes de cortar no ritmo.", "warn");
        return;
      }
      s.commit("Cortar na batida", (p) => {
        const out: Clip[] = [];
        p.clips.forEach((clip) => {
          if (clip.kind === "audio" || clip.kind === "adjust") {
            out.push(clip);
            return;
          }
          const inside = beats.filter((b) => b > clip.start + 0.12 && b < clipEnd(clip) - 0.12);
          if (!inside.length) {
            out.push(clip);
            return;
          }
          const points = [clip.start, ...inside, clipEnd(clip)];
          for (let i = 0; i < points.length - 1; i++) {
            const len = points[i + 1] - points[i];
            out.push({
              ...JSON.parse(JSON.stringify(clip)),
              id: i === 0 ? clip.id : uid("clip"),
              start: points[i],
              duration: len,
              in: clip.in + (points[i] - clip.start) * clip.speed,
              transitionIn: i === 0 ? clip.transitionIn : undefined,
            });
          }
        });
        return { ...p, clips: out };
      });
      store.toast("Cortes criados", "Todo o vídeo foi fatiado nos marcadores de batida.", "ok");
    });

  /* ── auto-reframe ── */
  const runReframe = () =>
    run("Auto-reframe", async (report) => {
      const videoClip = state.project.clips.find((c) => c.kind === "video");
      const asset = state.assets.find((a) => a.id === videoClip?.assetId);
      if (!videoClip || !asset) throw new Error("sem vídeo");
      const path = await autoReframe(asset, { from: videoClip.in, to: Math.min(asset.duration, videoClip.in + videoClip.duration), onProgress: report });
      if (!path.length) throw new Error("sem amostras");
      const keyframes = path
        .filter((_, i) => i % 3 === 0)
        .map((p) => ({ t: clamp((p.t - videoClip.in) / videoClip.speed, 0, videoClip.duration), v: p.x, e: "ease_in_out" as const }));
      s.updateClip(
        videoClip.id,
        {
          transform: { ...videoClip.transform, scale: 1.18 },
          keyframes: { ...videoClip.keyframes, x: keyframes },
        },
        "Auto-reframe"
      );
      store.toast("Auto-reframe aplicado", `${keyframes.length} keyframes seguindo o assunto.`, "ok");
    });

  /* ── rastreamento ── */
  const runTracking = (attach: "keyframes" | "text") =>
    run("Rastrear objeto", async (report) => {
      const clip = selectedVideo;
      const asset = state.assets.find((a) => a.id === clip?.assetId);
      if (!clip || !asset) throw new Error("sem vídeo");
      const path = await trackObject(
        asset,
        { x: trackX - trackSize / 2, y: trackY - trackSize / 2, w: trackSize, h: trackSize },
        { from: clip.in, to: Math.min(asset.duration, clip.in + clip.duration), step: 1 / 15, onProgress: report }
      );
      if (path.length < 2) throw new Error("sem movimento");
      const kfX = path.map((p) => ({ t: clamp((p.t - clip.in) / clip.speed, 0, clip.duration), v: p.x * 2, e: "linear" as const }));
      const kfY = path.map((p) => ({ t: clamp((p.t - clip.in) / clip.speed, 0, clip.duration), v: p.y * 2, e: "linear" as const }));
      if (attach === "keyframes") {
        s.updateClip(clip.id, { keyframes: { ...clip.keyframes, x: kfX, y: kfY } }, "Rastrear objeto");
        store.toast("Movimento aplicado ao clipe", `${path.length} pontos rastreados.`, "ok");
      } else {
        const textTrack = state.project.tracks.find((t) => t.kind === "text")?.id ?? state.project.tracks[0].id;
        const textClip = createTextClip(textTrack, clip.start, clip.duration, "Siga-me 👀");
        textClip.keyframes = { x: kfX, y: kfY };
        textClip.text = { ...textClip.text!, animation: "none", size: 56, bgEnabled: true, bgColor: "#282b29dd", radius: 14, padding: 12, weight: 700 };
        s.commit("Anexar texto rastreado", (p) => ({ ...p, clips: [...p.clips, textClip] }));
        store.toast("Texto preso ao objeto", "O texto segue o ponto rastreado com keyframes.", "ok");
      }
      void STABILIZER;
    });

  const stabilizeSelection = () =>
    run("Estabilizar", async (report) => {
      const clip = selectedVideo;
      const asset = state.assets.find((a) => a.id === clip?.assetId);
      if (!clip || !asset) throw new Error("sem vídeo");
      const track = await computeStabilization(asset, {
        from: clip.in,
        to: Math.min(asset.duration, clip.in + clip.duration),
        onProgress: report,
      });
      STABILIZER.set(clip.id, track);
      s.updateClip(clip.id, { stabilize: 0.7 }, "Estabilizar");
    });

  const suggest = () =>
    run("Sugerir cortes", async (report) => {
      const { cuts } = await suggestCuts(state.project, state.assets, 10, report);
      const markers: Marker[] = cuts.map((t) => ({ id: uid("mk"), t, label: "sugestão", color: "#a3e635", kind: "sugestão" }));
      s.setMarkers([...state.project.markers.filter((m) => m.kind !== "sugestão"), ...markers], "Sugestões de corte");
      store.toast(`${cuts.length} sugestões`, "Marcadores verdes indicam onde o corte tem mais impacto.", "ok");
    });

  const alternatingMulticam = () =>
    run("Multicam", async () => {
      const tracks = state.project.tracks.filter((t) => t.kind === "video" || t.kind === "overlay");
      if (tracks.length < 2) {
        store.toast("Precisa de duas faixas com vídeo", "Adicione o segundo ângulo em outra faixa.", "warn");
        return;
      }
      const [a, b] = tracks;
      const clipA = state.project.clips.filter((c) => c.trackId === a.id).sort((x, y) => x.start - y.start)[0];
      const clipB = state.project.clips.filter((c) => c.trackId === b.id).sort((x, y) => x.start - y.start)[0];
      if (!clipA || !clipB) throw new Error("sem clipes");
      const total = Math.min(clipEnd(clipA), clipEnd(clipB));
      const seg = 2;
      s.commit("Multicam alternado", (p) => {
        const out: Clip[] = p.clips.filter((c) => c.id !== clipA.id && c.id !== clipB.id);
        for (let t = clipA.start, i = 0; t < total; t += seg, i++) {
          const src = i % 2 === 0 ? clipA : clipB;
          const len = Math.min(seg, total - t);
          out.push({
            ...JSON.parse(JSON.stringify(src)),
            id: uid("clip"),
            start: t,
            duration: len,
            in: src.in + (t - src.start) * src.speed,
            trackId: a.id,
          });
        }
        return { ...p, clips: out };
      });
      store.toast("Multicam montado", "Ângulos alternados a cada 2 segundos na faixa principal.", "ok");
    });

  const energyView = useMemo(() => energy, [energy]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-3 py-2">
        <p className="font-display text-[12.5px] font-semibold text-ink">Ferramentas inteligentes</p>
        <p className="text-[10.5px] text-dim">Análise e automação que rodam no seu navegador, sem enviar mídia para servidor.</p>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <Section title="Legendas e texto" icon={<Captions className="size-3.5 text-amber" />}>
          <Btn size="sm" full variant={autoCaptions ? "primary" : "outline"} icon={<Captions className="size-3.5" />} onClick={startAutoCaptions}>
            Legendas automáticas (fala)
          </Btn>
          <Toggle label="Sugerir limpeza de muletas" checked={autoCaptions} onChange={setAutoCaptions} />
          <TextField label="Roteiro / letra da música" textarea rows={5} value={script} onChange={setScript} />
          <div className="grid grid-cols-2 gap-1.5">
            <Btn size="sm" onClick={scriptToCaptions}>Roteiro → legendas</Btn>
            <Btn size="sm" onClick={karaokeFromLyrics}>Karaokê por linha</Btn>
            <Btn size="sm" onClick={cleanFillers}>Limpar muletas</Btn>
            <Btn size="sm" onClick={checkContrast}>Ver contraste</Btn>
          </div>
          <p className="text-[10.5px] font-medium text-muted">Estilos rápidos de legenda</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CAPTION_STYLES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => applyCaptionStyleToAll(c.id)}
                className="rounded-lg border border-line bg-panel2/60 px-2 py-1.5 text-[10.5px] text-ink transition hover:border-amber/60"
              >
                {c.name}
              </button>
            ))}
          </div>
          <Btn size="sm" full variant="soft" icon={<Sparkles className="size-3.5" />} onClick={async () => {
            const asset = state.assets.find((a) => a.kind === "video");
            if (!asset) return;
            const palette = await paletteFromAsset(asset, 1);
            if (palette.length) store.toast("Paleta extraída", palette.join(" · "), "ok");
          }}>
            Extrair paleta do vídeo
          </Btn>
        </Section>

        <Section title="Cortes automáticos" icon={<Scissors className="size-3.5 text-cy" />}>
          <Slider label="Sensibilidade de cena" value={sceneThreshold} min={0.02} max={0.18} step={0.005} onChange={setSceneThreshold} format={(v) => v.toFixed(3)} accent="#22d3ee" />
          <div className="grid grid-cols-2 gap-1.5">
            <Btn size="sm" onClick={runScenes} icon={<Film className="size-3.5" />}>Detectar cenas</Btn>
            <Btn size="sm" onClick={suggest} icon={<Zap className="size-3.5" />}>Sugerir cortes</Btn>
            <Btn size="sm" onClick={detectBeatsAction} icon={<Music className="size-3.5" />}>Detectar batidas</Btn>
            <Btn size="sm" onClick={cutOnBeats} icon={<Scissors className="size-3.5" />}>Cortar no ritmo</Btn>
          </div>
          <Slider label="Silêncio mínimo" value={silenceMin} min={0.2} max={1.5} step={0.05} onChange={setSilenceMin} format={(v) => `${v.toFixed(2)}s`} accent="#34d399" />
          <div className="grid grid-cols-2 gap-1.5">
            <Btn size="sm" onClick={removeSilence}>Remover silêncio</Btn>
            <Btn size="sm" onClick={alternatingMulticam} icon={<Layers className="size-3.5" />}>Multicam alternado</Btn>
          </div>
        </Section>

        <Section title="Movimento e enquadramento" icon={<Crosshair className="size-3.5 text-vio" />}>
          <div className="grid grid-cols-2 gap-2">
            <Slider label="Alvo X" value={trackX} min={0} max={1} step={0.01} onChange={setTrackX} format={(v) => `${(v * 100).toFixed(0)}%`} />
            <Slider label="Alvo Y" value={trackY} min={0} max={1} step={0.01} onChange={setTrackY} format={(v) => `${(v * 100).toFixed(0)}%`} />
          </div>
          <Slider label="Tamanho da amostra" value={trackSize} min={0.06} max={0.4} step={0.01} onChange={setTrackSize} format={(v) => `${(v * 100).toFixed(0)}%`} />
          <div className="grid grid-cols-2 gap-1.5">
            <Btn size="sm" onClick={() => void runTracking("keyframes")} icon={<Crosshair className="size-3.5" />}>Rastrear clipe</Btn>
            <Btn size="sm" onClick={() => void runTracking("text")} icon={<Captions className="size-3.5" />}>Texto no objeto</Btn>
            <Btn size="sm" onClick={runReframe} icon={<Wand2 className="size-3.5" />}>Auto-reframe 9:16</Btn>
            <Btn size="sm" onClick={stabilizeSelection} icon={<Gauge className="size-3.5" />}>Estabilizar</Btn>
          </div>
          <p className="text-[10.5px] leading-relaxed text-dim">
            O rastreamento usa correlação normalizada entre quadros e gera keyframes de posição — funciona com texto e adesivos.
          </p>
        </Section>

        <Section title="Ritmo e energia" icon={<BarChart3 className="size-3.5 text-pink" />} defaultOpen={false}>
          <Btn size="sm" full variant="soft" icon={<RefreshCw className="size-3.5" />} onClick={detectBeatsAction}>
            Recalcular mapa de energia
          </Btn>
          {energyView.length > 0 && (
            <div className="flex h-16 items-end gap-px rounded-lg border border-line bg-bg2/60 p-1">
              {energyView.map((v, i) => (
                <span key={i} className="flex-1 rounded-t-sm bg-vio/85" style={{ height: `${Math.max(3, v * 100)}%` }} />
              ))}
            </div>
          )}
          <p className="text-[10.5px] text-dim">
            O mapa mostra onde há som forte ao longo do tempo — útil para escolher cortes e batidas.
          </p>
        </Section>

        <Section title="Aplicar em lote" icon={<Layers className="size-3.5" />} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1.5">
            {SPEED_CURVES.slice(0, 4).map((c) => (
              <Btn
                key={c.id}
                size="sm"
                onClick={() => {
                  s.commit(`Curva: ${c.name}`, (p) => ({
                    ...p,
                    clips: p.clips.map((clip) => (clip.kind === "video" ? { ...clip, speedCurve: c.id } : clip)),
                  }));
                  store.toast("Curva aplicada em todo o vídeo", c.name, "ok");
                }}
              >
                {c.name}
              </Btn>
            ))}
          </div>
          <Badge color="#a3e635">tudo local</Badge>
        </Section>
      </div>

      {busy && (
        <div className="border-t border-line bg-vio/10 px-3 py-2">
          <p className="text-[11px] text-ink">{busy}</p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg2">
            <div className="grad-bg h-full transition-all" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* tipos mínimos da Web Speech API */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
}
