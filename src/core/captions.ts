import { createTextClip, type Clip, type Project } from "@/core/model";
import { download } from "@/lib/utils";

/**
 * Legendas: importação/exportação de arquivos de legenda e utilitários de
 * sincronização para o painel de texto do editzz.
 */

export const CAPTION_LANGS = [
  { id: "pt-BR", name: "Português (Brasil)" },
  { id: "en-US", name: "Inglês (EUA)" },
  { id: "es-ES", name: "Espanhol" },
  { id: "fr-FR", name: "Francês" },
  { id: "de-DE", name: "Alemão" },
  { id: "it-IT", name: "Italiano" },
  { id: "ja-JP", name: "Japonês" },
  { id: "ko-KR", name: "Coreano" },
] as const;

const stampVtt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
};

const parseStamp = (raw: string) => {
  const clean = raw.trim().replace(",", ".");
  const parts = clean.split(":").map(parseFloat);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(clean) || 0;
};

/** Gera o arquivo .vtt a partir dos clipes de texto do projeto. */
export function buildVtt(project: Project): string {
  const lines: string[] = ["WEBVTT", ""];
  project.clips
    .filter((c) => c.kind === "text" && c.text?.content)
    .sort((a, b) => a.start - b.start)
    .forEach((c, i) => {
      lines.push(String(i + 1));
      lines.push(`${stampVtt(c.start)} --> ${stampVtt(c.start + c.duration)}`);
      lines.push(c.text!.content.replace(/\n/g, " "));
      lines.push("");
    });
  return lines.join("\n");
}

export function exportVtt(project: Project) {
  const vtt = buildVtt(project);
  if (!vtt.trim()) return false;
  download(new Blob([vtt], { type: "text/vtt;charset=utf-8" }), `${project.name.replace(/\s+/g, "-").toLowerCase()}.vtt`);
  return true;
}

interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

/** Lê .vtt ou .srt e devolve as falas com seus tempos. */
export function parseSubtitles(raw: string): ParsedCue[] {
  const blocks = raw.replace(/\r/g, "").split(/\n{2,}/);
  const cues: ParsedCue[] = [];
  blocks.forEach((block) => {
    const lines = block.split("\n").filter((l) => l.trim() && l !== "WEBVTT");
    const idx = lines.findIndex((l) => l.includes("-->"));
    if (idx === -1) return;
    const [from, to] = lines[idx].split("-->");
    if (!from || !to) return;
    const text = lines
      .slice(idx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text) return;
    cues.push({ start: parseStamp(from) || 0, end: parseStamp(to.split(" ")[0]) || 0, text });
  });
  return cues;
}

/**
 * Converte legendas importadas em clipes de texto na faixa escolhida,
 * aplicando o estilo de legenda padrão do editzz.
 */
export function captionsToClips(raw: string, trackId: string, style?: Partial<Clip["text"]>): Clip[] {
  return parseSubtitles(raw).map((cue) => {
    const clip = createTextClip(trackId, cue.start, Math.max(0.4, cue.end - cue.start), cue.text);
    if (clip.text) {
      clip.text = {
        ...clip.text,
        bgEnabled: true,
        bgColor: "#000000cc",
        color: "#ffffff",
        size: 48,
        weight: 700,
        uppercase: true,
        radius: 10,
        padding: 12,
        animation: "fade_in",
        ...style,
      };
    }
    return clip;
  });
}

/**
 * Quebra um texto corrido em blocos de legenda curtos (máx. de caracteres),
 * respeitando pontuação — base das legendas automáticas.
 */
export function splitCaptionText(text: string, maxChars = 46): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  sentences.forEach((sentence) => {
    if (sentence.length <= maxChars) {
      out.push(sentence);
      return;
    }
    let current = "";
    sentence.split(" ").forEach((word) => {
      if ((current + " " + word).trim().length > maxChars) {
        if (current) out.push(current.trim());
        current = word;
      } else {
        current = `${current} ${word}`;
      }
    });
    if (current.trim()) out.push(current.trim());
  });
  return out;
}

/** Distribui um roteiro em clipes de legenda ao longo do tempo. */
export function scriptToCaptionClips(
  script: string,
  trackId: string,
  total: number,
  maxChars = 46,
  style?: Partial<Clip["text"]>
): Clip[] {
  const blocks = splitCaptionText(script, maxChars);
  if (!blocks.length) return [];
  const per = Math.max(0.7, total / blocks.length);
  return blocks.map((text, i) => {
    const clip = createTextClip(trackId, i * per, per, text);
    if (clip.text) {
      clip.text = {
        ...clip.text,
        bgEnabled: true,
        bgColor: "#000000cc",
        color: "#ffffff",
        size: 48,
        weight: 700,
        uppercase: true,
        radius: 10,
        padding: 12,
        animation: "fade_in",
        ...style,
      };
    }
    return clip;
  });
}
