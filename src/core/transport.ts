import { useSyncExternalStore } from "react";

/**
 * Transporte de reprodução separado do store principal: o tempo muda a
 * cada quadro, então quem depende dele (playhead, relógio, prévia) assina
 * apenas este pequeno store — evitando re-renderizar a interface inteira.
 */
class Transport {
  t = 0;
  playing = false;
  duration = 0;
  private listeners = new Set<() => void>();
  private snapshot = { t: 0, playing: false, duration: 0 };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;
  getTime = () => this.t;

  private emit() {
    this.snapshot = { t: this.t, playing: this.playing, duration: this.duration };
    this.listeners.forEach((l) => l());
  }

  seek(t: number) {
    this.t = Math.max(0, t);
    this.emit();
  }

  setPlaying(v: boolean) {
    this.playing = v;
    this.emit();
  }

  setDuration(d: number) {
    this.duration = d;
    this.emit();
  }

  /** atualiza apenas o tempo durante a reprodução (notifica assinantes) */
  tick(t: number) {
    this.t = t;
    this.emit();
  }
}

export const transport = new Transport();

export function useTransport() {
  return useSyncExternalStore(transport.subscribe, transport.getSnapshot, transport.getSnapshot);
}
