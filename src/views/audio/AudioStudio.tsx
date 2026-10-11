import { Activity, AudioLines, Download, Loader2, Mic, Music2, Play, Scissors, Sparkles, Trash2, Volume2, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  assetFromAudioBuffer,
  audioCtx,
  detectBeats,
  detectSilence,
  encodeWav,
  energyMap,
  generateMusic,
  generateSfx,
  isolateVoice,
  peaksFromBuffer,
  processBuffer,
  SFX_LIST,
} from "@/core/audio";
import { pool, recordMicrophone } from "@/core/media";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import { Badge, Btn, Chip, EmptyState, Section, Sel, Slider, Toggle } from "@/components/ui";
import { MUSIC_STYLES, SOUND_EFFECTS, VOICE_EFFECTS } from "@/lib/presets";
import { cn, download, fmtBytes, fmtDuration } from "@/lib/utils";

function applyTailFade(buffer: AudioBuffer, durationSeconds = 1.5) {
  const frames = Math.min(buffer.length, Math.max(1, Math.round(durationSeconds * buffer.sampleRate)));
  const start = buffer.length - frames;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < frames; i++) {
      samples[start + i] *= 1 - i / Math.max(1, frames - 1);
    }
  }
}

export default function AudioStudio() {
  const { state, store: s } = useEditzz();
  const [style, setStyle] = useState(MUSIC_STYLES[0].id);
  const [bpm, setBpm] = useState(MUSIC_STYLES[0].bpm);
  const [seconds, setSeconds] = useState(24);
  const [previewLoop, setPreviewLoop] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(state.assets.find((a) => a.kind === "audio" || a.hasAudio)?.id ?? null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [energy, setEnergy] = useState<number[]>([]);
  const [beats, setBeats] = useState<number[]>([]);
  const [silences, setSilences] = useState<{ start: number; end: number }[]>([]);
  const [voice, setVoice] = useState(VOICE_EFFECTS[0].id);
  const [pitch, setPitch] = useState(0);
  const [denoise, setDenoise] = useState(0);
  const [gain, setGain] = useState(0);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Awaited<ReturnType<typeof recordMicrophone>>>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const audios = state.assets.filter((a) => a.kind === "audio" || a.hasAudio);
  const selected = audios.find((a) => a.id === selectedId) ?? null;
  const styleDef = useMemo(() => MUSIC_STYLES.find((m) => m.id === style) ?? MUSIC_STYLES[0], [style]);
  useEffect(() => () => {
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
    const source = previewSourceRef.current;
    previewSourceRef.current = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* já parado */
      }
      source.disconnect();
    }
  }, []);

  /* analisa o áudio selecionado */
  useEffect(() => {
    if (!selected) {
      setPeaks([]);
      setEnergy([]);
      setBeats([]);
      setSilences([]);
      return;
    }
    let alive = true;
    void (async () => {
      const buffer = await pool.decodeAudio(selected);
      if (!buffer || !alive) return;
      setPeaks(peaksFromBuffer(buffer, 420));
      setEnergy(energyMap(buffer, 200));
      setBeats(detectBeats(buffer));
      setSilences(detectSilence(buffer, 0.012, 0.35));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    if (state.assets.length && !selectedId) setSelectedId(audios[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.assets.length]);

  const compose = async () => {
    setBusy("Compondo trilha…");
    try {
      const buffer = await generateMusic({ style, bpm, seconds });
      if (fadeOut) applyTailFade(buffer);
      const { asset } = assetFromAudioBuffer(`${styleDef.name} · ${seconds}s`, buffer);
      s.addAssets([asset]);
      setSelectedId(asset.id);
      store.toast("Trilha pronta", `${styleDef.name} · ${bpm} BPM · ${seconds}s`, "ok");
    } finally {
      setBusy(null);
    }
  };

  const spawnSfx = async (id: string) => {
    setBusy("Sintetizando efeito…");
    try {
      const meta = SOUND_EFFECTS.find((x) => x.id === id);
      const buffer = await generateSfx(id);
      const { asset } = assetFromAudioBuffer(meta?.name ?? id, buffer);
      s.addAssets([asset]);
      s.addAssetToTimeline(asset, undefined, transport.getTime());
      store.toast("SFX adicionado", `${meta?.name ?? id} no playhead`, "ok");
    } finally {
      setBusy(null);
    }
  };

  const processSelected = async (mode: "voice" | "denoise" | "isolate" | "normalize") => {
    if (!selected) return;
    setBusy("Processando áudio…");
    try {
      const buffer = await pool.decodeAudio(selected);
      if (!buffer) throw new Error("sem áudio");
      const out =
        mode === "isolate"
          ? await isolateVoice(buffer)
          : await processBuffer(buffer, {
              voice: mode === "voice" ? voice : "none",
              pitch: mode === "voice" ? pitch : 0,
              denoise: mode === "denoise" ? Math.max(50, denoise) : denoise,
              gain,
              normalize: mode === "normalize",
              highpass: mode === "denoise" ? 90 : 0,
              lowpass: 0,
            });
      const { asset } = assetFromAudioBuffer(`${selected.name} · ${labelFor(mode)}`, out);
      s.addAssets([asset]);
      setSelectedId(asset.id);
      store.toast("Áudio processado", `${labelFor(mode)} · WAV criado no acervo`, "ok");
    } catch {
      store.toast("Falha ao processar", "Este arquivo pode não ter áudio decodificável.", "erro");
    } finally {
      setBusy(null);
    }
  };

  const stopPreview = () => {
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
    const source = previewSourceRef.current;
    previewSourceRef.current = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* já parado */
      }
      source.disconnect();
    }
    setPlaying(false);
  };

  const playPreview = async () => {
    if (!selected) return;
    if (previewSourceRef.current) {
      stopPreview();
      return;
    }
    const buffer = await pool.decodeAudio(selected);
    if (!buffer) return;
    const ctx = audioCtx();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (ctx.state === "suspended") await ctx.resume();
    source.loop = previewLoop;
    source.connect(ctx.destination);
    source.onended = () => {
      if (previewSourceRef.current !== source) return;
      if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
      previewSourceRef.current = null;
      source.disconnect();
      setPlaying(false);
    };
    source.start();
    previewSourceRef.current = source;
    setPlaying(true);
    previewTimerRef.current = window.setTimeout(() => {
      try {
        source.stop();
      } catch {
        /* já parado */
      }
    }, Math.min(30, buffer.duration) * 1000);
  };

  const exportWav = async () => {
    if (!selected) return;
    const buffer = await pool.decodeAudio(selected);
    if (!buffer) return;
    const wav = encodeWav(buffer);
    download(wav, `${selected.name.replace(/\s+/g, "-").toLowerCase()}.wav`);
    store.toast("WAV exportado", `${fmtDuration(buffer.duration)} · ${fmtBytes(wav.size)}`, "ok");
  };

  const toggleRecord = async () => {
    if (recording && recRef.current) {
      const blob = await recRef.current.stop();
      setRecording(false);
      const file = new File([blob], `narracao-${Date.now()}.webm`, { type: blob.type });
      const asset = await pool.registerFile(file);
      if (asset) {
        asset.origin = "gravação";
        asset.name = `Narração ${new Date().toLocaleTimeString("pt-BR")}`;
        s.addAssets([asset]);
        setSelectedId(asset.id);
        store.toast("Narração gravada", fmtDuration(asset.duration ?? 0), "ok");
      }
      return;
    }
    const rec = await recordMicrophone();
    if (!rec) {
      store.toast("Microfone indisponível", "Autorize o microfone para narrar.", "erro");
      return;
    }
    recRef.current = rec;
    rec.start();
    setRecording(true);
    store.toast("Gravando narração…", "Fale perto do microfone. Clique de novo para parar.", "info");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <div className="panel flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <span className="font-display text-[12.5px] font-semibold text-ink">Estúdio de áudio</span>
        <Badge color="#78aaa5">Web Audio local</Badge>
        <Chip>{audios.length} faixas</Chip>
        {beats.length > 0 && <Chip>{beats.length} batidas detectadas</Chip>}
        {silences.length > 0 && <Chip>{silences.length} pausas</Chip>}
        <div className="ml-auto flex items-center gap-1.5">
          <Btn size="sm" variant={recording ? "danger" : "outline"} icon={<Mic className="size-3.5" />} onClick={() => void toggleRecord()}>
            {recording ? "Parar gravação" : "Gravar voz"}
          </Btn>
          <Btn size="sm" icon={<Download className="size-3.5" />} onClick={() => void exportWav()} disabled={!selected}>
            Exportar WAV
          </Btn>
        </div>
      </div>

      <div className="audio-studio-layout">
        <div className="flex min-h-0 flex-col gap-2">
          {/* onda + análise */}
          <div className="panel flex min-h-0 flex-col p-2">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="font-display text-[11.5px] font-semibold text-ink">Forma de onda e análise</span>
              <div className="ml-auto flex items-center gap-1.5">
                <Btn size="sm" variant={playing ? "primary" : "outline"} icon={<Play className="size-3.5" />} onClick={() => void playPreview()} disabled={!selected}>
                  {playing ? "Tocando…" : "Ouvir"}
                </Btn>
                <Toggle label="Repetir" checked={previewLoop} onChange={setPreviewLoop} />
              </div>
            </div>

            {!selected && <EmptyState icon={<AudioLines className="size-6" />} title="Nenhum áudio selecionado" desc="Importe um arquivo, grave a narração ou componha uma trilha procedural ao lado." />}

            {selected && (
              <>
                <div className="scroll-thin mb-2 flex gap-1.5 overflow-x-auto pb-1">
                  {audios.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={cn(
                        "shrink-0 rounded-lg border px-2 py-1 text-[10.5px] transition",
                        a.id === selected.id ? "border-cy bg-cy/15 text-white" : "border-line bg-panel2/50 text-muted hover:text-ink"
                      )}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>

                <div className="relative h-32 overflow-hidden rounded-xl border border-line bg-bg2">
                  {peaks.length === 0 && (
                    <div className="flex h-full items-center justify-center text-[11px] text-dim">
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" /> decodificando áudio…
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center gap-px px-1">
                    {peaks.map((p, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm bg-cy/80"
                        style={{ height: `${Math.max(2, p * 92)}%` }}
                      />
                    ))}
                  </div>
                  {beats.map((b, i) => (
                    <span key={i} className="absolute top-0 bottom-0 w-px bg-pink/80" style={{ left: `${(b / Math.max(0.1, selected.duration)) * 100}%` }} />
                  ))}
                  {silences.map((w, i) => (
                    <span
                      key={`s${i}`}
                      className="absolute top-0 bottom-0 bg-rose/15"
                      style={{ left: `${(w.start / Math.max(0.1, selected.duration)) * 100}%`, width: `${((w.end - w.start) / Math.max(0.1, selected.duration)) * 100}%` }}
                    />
                  ))}
                  <span className="absolute bottom-1 left-2 font-mono text-[9.5px] text-white/70">{fmtDuration(selected.duration)}</span>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-panel2/40 p-2">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-ink">
                      <Activity className="size-3.5 text-pink" /> Mapa de energia
                    </p>
                    <div className="flex h-14 items-end gap-px">
                      {energy.map((v, i) => (
                        <span key={i} className="flex-1 rounded-t-sm bg-vio/85" style={{ height: `${Math.max(3, v * 100)}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 rounded-xl border border-line bg-panel2/40 p-2 text-[10.5px] text-muted">
                    <p className="flex justify-between"><span className="text-dim">Canais</span><span className="text-ink">{selected.kind === "audio" ? "áudio" : "vídeo"}</span></p>
                    <p className="flex justify-between"><span className="text-dim">Duração</span><span className="text-ink">{fmtDuration(selected.duration)}</span></p>
                    <p className="flex justify-between"><span className="text-dim">Tamanho</span><span className="text-ink">{selected.sizeBytes ? fmtBytes(selected.sizeBytes) : "—"}</span></p>
                    <p className="flex justify-between"><span className="text-dim">Batidas</span><span className="text-ink">{beats.length}</span></p>
                    <p className="flex justify-between"><span className="text-dim">Pausas longas</span><span className="text-ink">{silences.length}</span></p>
                    <div className="flex gap-1 pt-1">
                      <Btn
                        size="xs"
                        onClick={() => {
                          s.setMarkers([...state.project.markers.filter((m) => m.kind !== "batida"), ...beats.map((t, i) => ({ id: `b${i}`, t, label: "batida", color: "#d58f73", kind: "batida" as const }))], "Marcadores de batida");
                          store.toast(`${beats.length} marcadores`, "Batidas marcadas na timeline.", "ok");
                        }}
                      >
                        marcar batidas
                      </Btn>
                      <Btn
                        size="xs"
                        variant="soft"
                        onClick={() => {
                          s.addAssetToTimeline(selected, undefined, 0);
                          store.toast("Faixa na timeline", "Áudio enviado para o começo da timeline.", "ok");
                        }}
                      >
                        enviar à timeline
                      </Btn>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* biblioteca de efeitos */}
          <div className="panel flex min-h-0 flex-1 flex-col p-2">
            <p className="mb-1.5 flex items-center gap-1.5 font-display text-[11.5px] font-semibold text-ink">
              <Sparkles className="size-3.5 text-vio" /> Banco de efeitos sonoros
            </p>
            <div className="scroll-thin grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {SFX_LIST.map((id) => {
                const meta = SOUND_EFFECTS.find((x) => x.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void spawnSfx(id)}
                    disabled={!!busy}
                    title={meta?.desc}
                    className="rounded-xl border border-line bg-panel2/50 px-2 py-2 text-left transition hover:border-vio/60 hover:bg-vio/10"
                  >
                    <span className="block truncate text-[11px] text-ink">{meta?.name ?? id}</span>
                    <span className="block truncate text-[9.5px] text-dim">{meta?.desc}</span>
                  </button>
                );
              })}
            </div>
            {busy && (
              <div className="mt-2 flex items-center gap-2 text-[10.5px] text-ink">
                <Loader2 className="size-3.5 animate-spin" /> {busy}
              </div>
            )}
          </div>
        </div>

        {/* painel direito */}
        <div className="panel scroll-thin flex min-h-0 flex-col overflow-y-auto">
          <Section title="Compor trilha" icon={<Music2 className="size-3.5 text-cy" />}>
            <div className="grid grid-cols-2 gap-1.5">
              {MUSIC_STYLES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setStyle(m.id);
                    setBpm(m.bpm);
                  }}
                  title={m.desc}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-left text-[10.5px] transition",
                    style === m.id ? "border-cy bg-cy/15 text-white" : "border-line bg-panel2/50 text-muted hover:text-ink"
                  )}
                >
                  <span className="block truncate">{m.name}</span>
                  <span className="block truncate text-[9px] text-dim">{m.bpm} BPM</span>
                </button>
              ))}
            </div>
            <Slider label="Andamento (BPM)" value={bpm} min={50} max={180} onChange={setBpm} />
            <Slider label="Duração" value={seconds} min={8} max={90} onChange={setSeconds} unit="s" />
            <Toggle label="Finalizar com fade" checked={fadeOut} onChange={setFadeOut} hint="Suaviza o fim da trilha gerada" />
            <Btn full variant="primary" icon={<Music2 className="size-3.5" />} onClick={() => void compose()} disabled={!!busy}>
              Compor trilha de {seconds}s
            </Btn>
            <p className="text-[10.5px] leading-relaxed text-dim">
              A composição usa osciladores, ruído e convolução: bateria sintetizada, baixo, acordes e melodia gerados a partir do estilo escolhido.
            </p>
          </Section>

          <Section title="Tratar voz" icon={<Mic className="size-3.5 text-pink" />}>
            <Sel label="Efeito de voz" value={voice} onChange={setVoice} options={VOICE_EFFECTS.map((v) => ({ value: v.id, label: v.name }))} />
            <Slider label="Tom" value={pitch} min={-12} max={12} onChange={setPitch} unit=" semitons" accent="#d58f73" />
            <Slider label="Redução de ruído" value={denoise} min={0} max={100} onChange={setDenoise} accent="#d58f73" />
            <Slider label="Ganho" value={gain} min={-12} max={18} onChange={setGain} unit=" dB" accent="#d58f73" />
            <div className="grid grid-cols-2 gap-1.5">
              <Btn size="sm" disabled={!selected || !!busy} onClick={() => void processSelected("voice")}>
                Aplicar voz
              </Btn>
              <Btn size="sm" disabled={!selected || !!busy} onClick={() => void processSelected("denoise")}>
                Limpar ruído
              </Btn>
              <Btn size="sm" disabled={!selected || !!busy} onClick={() => void processSelected("isolate")}>
                Isolar voz
              </Btn>
              <Btn size="sm" disabled={!selected || !!busy} onClick={() => void processSelected("normalize")}>
                Normalizar
              </Btn>
            </div>
            <p className="text-[10.5px] leading-relaxed text-dim">
              Processamos em OfflineAudioContext: filtros, gate de ruído, compressor, convolução de reverb e
              equalização. O resultado entra no acervo como um WAV novo — nada é sobrescrito.
            </p>
          </Section>

          <Section title="Ferramentas" icon={<Waves className="size-3.5 text-lime" />} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-1.5">
              <Btn size="sm" disabled={!selected} onClick={() => void processSelected("normalize")}>
                Deixar em −1 dB
              </Btn>
              <Btn
                size="sm"
                disabled={!selected}
                onClick={() => {
                  if (!selected) return;
                  s.addAssetToTimeline(selected, undefined, transport.getTime());
                  store.toast("Áudio na timeline", "Adicionado no playhead atual.", "ok");
                }}
              >
                Inserir no playhead
              </Btn>
              <Btn
                size="sm"
                variant="danger"
                icon={<Trash2 className="size-3.5" />}
                disabled={!selected}
                onClick={() => {
                  if (selected) s.removeAsset(selected.id);
                }}
              >
                Remover do acervo
              </Btn>
              <Btn
                size="sm"
                disabled={!selected}
                onClick={() => {
                  if (!selected) return;
                  void (async () => {
                    const buffer = await pool.decodeAudio(selected);
                    if (!buffer) return;
                    const beats = detectBeats(buffer);
                    const markers = beats.map((t, i) => ({ id: `b${i}`, t, label: "batida", color: "#d58f73", kind: "batida" as const }));
                    s.setMarkers([...state.project.markers.filter((m) => m.kind !== "batida"), ...markers], "Marcadores de batida");
                    store.toast("Batidas marcadas", `${beats.length} pontos`, "ok");
                  })();
                }}
              >
                Marcar batidas
              </Btn>
            </div>
            <div className="flex flex-wrap gap-1">
              <Chip onClick={() => void processSelected("isolate")}>voz isolada</Chip>
              <Chip onClick={() => store.toast("SFX no playhead", "Use o banco de efeitos abaixo.", "info")}>dica: SFX</Chip>
              <Chip onClick={() => void exportWav()}>exportar WAV</Chip>
            </div>
          </Section>

          <Section title="Medidor" icon={<Volume2 className="size-3.5 text-cy" />} defaultOpen={false}>
            <div className="flex h-24 items-end gap-1 rounded-xl border border-line bg-bg2 p-2">
              {energy.slice(0, 40).map((v, i) => (
                <span key={i} className="flex-1 rounded-t bg-emerald/80" style={{ height: `${Math.max(4, v * 100)}%` }} />
              ))}
              {energy.length === 0 && <span className="text-[10.5px] text-dim">sem análise ainda</span>}
            </div>
            <p className="text-[10.5px] text-dim">
              Picos no topo indicam onde a faixa é mais forte — útil para escolher onde cortar.
            </p>
          </Section>

          <Section title="Silêncios encontrados" icon={<Scissors className="size-3.5" />} defaultOpen={false}>
            {silences.length === 0 && <p className="text-[10.5px] text-dim">Nenhuma pausa longa detectada (ou áudio não selecionado).</p>}
            <div className="space-y-1">
              {silences.slice(0, 8).map((w, i) => (
                <p key={i} className="flex justify-between text-[10.5px] text-muted">
                  <span>{w.start.toFixed(2)}s → {w.end.toFixed(2)}s</span>
                  <span className="text-dim">{(w.end - w.start).toFixed(2)}s</span>
                </p>
              ))}
            </div>
            {silences.length > 0 && (
              <Btn
                size="sm"
                full
                onClick={() => {
                  const markers = silences.map((w, i) => ({ id: `si${i}`, t: w.start, label: "silêncio", color: "#fb7185", kind: "manual" as const }));
                  s.setMarkers([...state.project.markers, ...markers], "Marcadores de silêncio");
                  store.toast("Silêncios marcados", "Use Vídeo → Remover silêncio para cortar.", "ok");
                }}
              >
                Marcar silêncios na timeline
              </Btn>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function labelFor(mode: "voice" | "denoise" | "isolate" | "normalize") {
  if (mode === "voice") return "voz tratada";
  if (mode === "denoise") return "ruído removido";
  if (mode === "isolate") return "voz isolada";
  return "normalizado";
}
