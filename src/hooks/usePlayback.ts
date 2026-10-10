import { useEffect, useRef, type RefObject } from "react";
import { ProjectAudioMixer } from "@/core/audio";
import { renderFrame } from "@/core/engine";
import { pool } from "@/core/media";
import { clipEnd, projectDuration } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport, useTransport } from "@/core/transport";

/**
 * Loop de reprodução do editzz:
 *  · parado  → renderiza o quadro do playhead sempre que o projeto muda;
 *  · rodando → renderiza em rAF, mantém o áudio sincronizado e respeita
 *              o intervalo de entrada/saída e o modo repetir.
 */
export function usePlayback(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const { state } = useEditzz();
  const { playing } = useTransport();
  const mixerRef = useRef<ProjectAudioMixer | null>(null);
  const renderingRef = useRef(false);
  const dirtyRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const quality = state.preview.quality;

  const draw = async (time: number, isPlaying: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    const w = Math.max(2, Math.round(s.project.width * quality));
    const h = Math.max(2, Math.round(s.project.height * quality));
    if (renderingRef.current) {
      dirtyRef.current = true;
      return;
    }
    renderingRef.current = true;
    try {
      await renderFrame(canvas, {
        project: s.project,
        assets: s.assets,
        time,
        width: w,
        height: h,
        playing: isPlaying,
        showZones: s.preview.safeZones,
        showThirds: s.preview.thirds,
      });
    } finally {
      renderingRef.current = false;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        void draw(transport.getTime(), transport.playing);
      }
    }
  };

  /* quadro estático: redesenha quando o projeto, o tempo ou a qualidade mudam */
  useEffect(() => {
    void draw(transport.getTime(), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.project,
    state.assets,
    state.selectedClipIds,
    quality,
    state.preview.safeZones,
    state.preview.thirds,
    playing,
  ]);

  /* redesenha em seeks mesmo com o projeto idêntico */
  useEffect(() => {
    const unsubscribe = transport.subscribe(() => {
      if (!transport.playing) void draw(transport.t, false);
    });
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* loop de reprodução */
  useEffect(() => {
    if (!playing) {
      mixerRef.current?.stop();
      mixerRef.current = null;
      pool.pauseAll();
      return;
    }
    const startTime = transport.getTime();
    const startWall = performance.now();
    let raf = 0;
    const total = projectDuration(stateRef.current.project);

    const mixer = new ProjectAudioMixer();
    mixerRef.current = mixer;
    void mixer.start(stateRef.current.project, stateRef.current.assets, startTime);

    const loop = () => {
      const s = stateRef.current;
      const end = s.project.outPoint ?? Math.max(total, 0.1);
      const elapsed = (performance.now() - startWall) / 1000;
      const time = startTime + elapsed;
      if (time >= end) {
        if (s.loop) {
          pool.pauseAll();
          transport.seek(s.project.inPoint ?? 0);
          mixerRef.current?.stop();
          store.set({ playing: false });
          transport.setPlaying(false);
          requestAnimationFrame(() => {
            transport.setPlaying(true);
          });
          return;
        }
        transport.seek(end);
        transport.setPlaying(false);
        store.set({ playing: false, playhead: end });
        mixerRef.current?.stop();
        pool.pauseAll();
        return;
      }
      transport.tick(time);
      void draw(time, true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      mixerRef.current?.stop();
      mixerRef.current = null;
      pool.pauseAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* duração exposta ao resto da interface */
  useEffect(() => {
    const total = projectDuration(state.project);
    transport.setDuration(total);
  }, [state.project]);

  return { draw };
}

/** Utilitário: tempo final de um projeto/clipe. */
export { clipEnd };
