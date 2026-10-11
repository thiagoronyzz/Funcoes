/**
 * editzz — biblioteca de recursos (presets, filtros, efeitos, transições, animações).
 * Todos os ids desta biblioteca são consumidos pelos motores de render em src/core/.
 */

/* ────────────────────────────── parâmetros ────────────────────────────── */

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  def: number;
}

export interface EffectDef {
  id: string;
  name: string;
  group: string;
  desc: string;
  params: ParamDef[];
  /** pixel = processa ImageData · draw = desenha por cima · mix = os dois */
  engine: "pixel" | "draw" | "mix";
}

const P = (key: string, label: string, min: number, max: number, def: number, step = 1): ParamDef => ({
  key,
  label,
  min,
  max,
  step,
  def,
});

/* ────────────────────────────── aparência (LOOKS) ────────────────────────────── */

export interface Adjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  dehaze: number;
  sharpen: number;
  blur: number;
  vignette: number;
  grain: number;
  fade: number;
  hue: number;
  bloom: number;
  chromatic: number;
}

export const ADJUST_DEFS: { key: keyof Adjustments; label: string; min: number; max: number; def: number }[] = [
  { key: "exposure", label: "Exposição", min: -100, max: 100, def: 0 },
  { key: "brightness", label: "Brilho", min: -100, max: 100, def: 0 },
  { key: "contrast", label: "Contraste", min: -100, max: 100, def: 0 },
  { key: "saturation", label: "Saturação", min: -100, max: 100, def: 0 },
  { key: "vibrance", label: "Vibração", min: -100, max: 100, def: 0 },
  { key: "temperature", label: "Temperatura", min: -100, max: 100, def: 0 },
  { key: "tint", label: "Matiz (tint)", min: -100, max: 100, def: 0 },
  { key: "highlights", label: "Altas luzes", min: -100, max: 100, def: 0 },
  { key: "shadows", label: "Sombras", min: -100, max: 100, def: 0 },
  { key: "whites", label: "Brancos", min: -100, max: 100, def: 0 },
  { key: "blacks", label: "Pretos", min: -100, max: 100, def: 0 },
  { key: "clarity", label: "Clareza", min: -100, max: 100, def: 0 },
  { key: "dehaze", label: "Dehaze", min: -100, max: 100, def: 0 },
  { key: "sharpen", label: "Nitidez", min: 0, max: 100, def: 0 },
  { key: "blur", label: "Desfoque", min: 0, max: 100, def: 0 },
  { key: "vignette", label: "Vinheta", min: -100, max: 100, def: 0 },
  { key: "grain", label: "Granulado", min: 0, max: 100, def: 0 },
  { key: "fade", label: "Fade (mate)", min: 0, max: 100, def: 0 },
  { key: "hue", label: "Rotação de matiz", min: -180, max: 180, def: 0 },
  { key: "bloom", label: "Bloom", min: 0, max: 100, def: 0 },
  { key: "chromatic", label: "Aberração cromática", min: 0, max: 100, def: 0 },
];

export const defaultAdjustments = (): Adjustments => {
  const o = {} as Adjustments;
  ADJUST_DEFS.forEach((d) => (o[d.key] = d.def));
  return o;
};

export interface LookDef {
  id: string;
  name: string;
  group: string;
  desc: string;
  adjust?: Partial<Adjustments>;
  /** matriz de cor 3x4 (linha maior) aplicada depois dos ajustes */
  matrix?: number[];
  mono?: boolean;
}

export const LOOK_GROUPS = [
  "Tendência",
  "Cinema",
  "Filme analógico",
  "Retrô / VHS",
  "Cor & Pop",
  "Preto e branco",
  "Natureza",
  "Retrato",
  "Noturno",
];

const m = (b: number, c: number, s: number, tintR = 0, tintG = 0, tintB = 0): number[] => [
  b + c + s * 0.35 + tintR, -s * 0.05, -s * 0.05, 0,
  -s * 0.05, b + c + s * 0.6 + tintG, -s * 0.05, 0,
  -s * 0.05, -s * 0.08, b + c + s * 0.2 + tintB, 0,
];

export const LOOKS: LookDef[] = [
  { id: "none", name: "Original", group: "Cor & Pop", desc: "Sem correção — ponto de partida neutro." },
  { id: "auto_grade", name: "Grade Inteligente", group: "Tendência", desc: "Correção automática por histograma (níveis + balanço de branco).", adjust: { contrast: 12, saturation: 8, vibrance: 14 } },
  { id: "viral_pop", name: "Viral Pop", group: "Tendência", desc: "Cores saturadas e brilho alto, estilo feed.", adjust: { saturation: 26, contrast: 14, brightness: 6, vibrance: 18 } },
  { id: "tiktok_clean", name: "Clean Creator", group: "Tendência", desc: "Pele limpa, fundo leve e contraste suave.", adjust: { shadows: 16, highlights: -12, saturation: 6, clarity: 8 } },
  { id: "moody_teal", name: "Moody Teal", group: "Tendência", desc: "Sombras azuladas com pele preservada.", adjust: { contrast: 18, saturation: -6, shadows: -12 }, matrix: m(0.98, 0.02, 0.16, -8, 2, 12) },
  { id: "sunset_glow", name: "Sunset Glow", group: "Tendência", desc: "Calor dourado do fim da tarde.", adjust: { temperature: 26, saturation: 12, bloom: 24 } },
  { id: "neon_dream", name: "Neon Dream", group: "Tendência", desc: "Magenta e ciano neon para conteúdo urbano.", adjust: { saturation: 30, contrast: 20 }, matrix: m(1.02, 0.04, 0.22, 14, -6, 18) },
  { id: "y2k_flash", name: "Y2K Flash", group: "Tendência", desc: "Flash estourado com cromática quente.", adjust: { contrast: 24, highlights: 18, saturation: 18, bloom: 30 } },

  { id: "cinematic", name: "Cinematic", group: "Cinema", desc: "LUT cinematográfica com verdes frios.", adjust: { contrast: 16, saturation: -4 }, matrix: m(0.99, 0.03, 0.1, -4, 4, 8) },
  { id: "blockbuster", name: "Blockbuster", group: "Cinema", desc: "Alto contraste com laranja e azul.", adjust: { contrast: 26, clarity: 14, saturation: 10 }, matrix: m(1.03, 0.06, 0.12, 10, -2, 10) },
  { id: "noir_film", name: "Noir", group: "Cinema", desc: "Preto e branco dramático com grão.", adjust: { contrast: 34, grain: 26, vignette: 30 }, mono: true },
  { id: "technicolor", name: "Technicolor", group: "Cinema", desc: "Saturação de estúdio clássico.", adjust: { saturation: 34, contrast: 12, vibrance: 10 } },
  { id: "nolan_cold", name: "Frio Épico", group: "Cinema", desc: "Azul frio com grão fino.", adjust: { temperature: -22, contrast: 18, grain: 12 } },
  { id: "desert_warm", name: "Deserto", group: "Cinema", desc: "Âmbar seco e pretos elevados.", adjust: { temperature: 30, fade: 12, shadows: 14 } },

  { id: "kodak_2383", name: "Kodak 2383", group: "Filme analógico", desc: "Emulação de filme de cinema.", adjust: { contrast: 12, saturation: -2, grain: 10 }, matrix: m(0.98, 0.02, 0.08, 6, 2, -4) },
  { id: "portra_400", name: "Portra 400", group: "Filme analógico", desc: "Peles cremosas e cores pastel.", adjust: { temperature: 12, saturation: -6, fade: 10, vignette: 10 } },
  { id: "fuji_superia", name: "Fuji Superia", group: "Filme analógico", desc: "Verdes vivos de filme japonês.", adjust: { saturation: 8, contrast: 8 }, matrix: m(0.99, 0.02, 0.1, -4, 8, 0) },
  { id: "cinestill_800t", name: "CineStill 800T", group: "Filme analógico", desc: "Tungstênio noturno com halation.", adjust: { temperature: -18, bloom: 30, contrast: 10 } },
  { id: "ilford_hp5", name: "Ilford HP5", group: "Filme analógico", desc: "P&B com grão de 400 ASA.", adjust: { contrast: 20, grain: 34 }, mono: true },
  { id: "faded_matte", name: "Mate Lavado", group: "Filme analógico", desc: "Preto elevado, look editorial.", adjust: { fade: 42, contrast: -8, saturation: -10 } },

  { id: "vhs_90s", name: "VHS 90s", group: "Retrô / VHS", desc: "Scanlines, cromática e saturação analógica.", adjust: { saturation: 18, contrast: 10, chromatic: 30, grain: 20 } },
  { id: "vhs_rental", name: "Locadora", group: "Retrô / VHS", desc: "Fita gasta com tracking instável.", adjust: { saturation: -10, contrast: 12, fade: 16, chromatic: 22, grain: 28 } },
  { id: "super8", name: "Super 8", group: "Retrô / VHS", desc: "Cores quentes de filme amador.", adjust: { temperature: 20, saturation: 14, vignette: 34, grain: 22 } },
  { id: "polaroid", name: "Polaroid", group: "Retrô / VHS", desc: "Contraste suave e ciano nas sombras.", adjust: { saturation: -8, contrast: -4, fade: 22, bloom: 14 } },
  { id: "sepia_old", name: "Século XIX", group: "Retrô / VHS", desc: "Sépia com vinheta forte.", adjust: { temperature: 34, saturation: -30, vignette: 40, grain: 24 } },
  { id: "arcade_crt", name: "CRT Arcade", group: "Retrô / VHS", desc: "Monitor de tubo com scanlines.", adjust: { saturation: 26, contrast: 18, chromatic: 18 } },

  { id: "punch_daily", name: "Punch Diário", group: "Cor & Pop", desc: "Contraste e cor para fotos do dia a dia.", adjust: { contrast: 18, saturation: 16, clarity: 10 } },
  { id: "pastel", name: "Pastel", group: "Cor & Pop", desc: "Cores suaves e lilás.", adjust: { saturation: -12, brightness: 8, fade: 18 } },
  { id: "candy_hdr", name: "Candy HDR", group: "Cor & Pop", desc: "HDR alegre com cores doces.", adjust: { contrast: 22, saturation: 30, clarity: 18, highlights: -14 } },
  { id: "duotone_purple", name: "Duotone Roxo", group: "Cor & Pop", desc: "Mapa de duas cores para capas.", adjust: { contrast: 16 }, matrix: m(1.0, 0, 0.3, 20, -10, 30) },
  { id: "bleach_bypass", name: "Bleach Bypass", group: "Cor & Pop", desc: "Contraste alto com cor lavada.", adjust: { contrast: 28, saturation: -34, clarity: 16 } },

  { id: "bw_classic", name: "P&B Clássico", group: "Preto e branco", desc: "Conversão neutra com bom contraste.", adjust: { contrast: 14 }, mono: true },
  { id: "bw_high", name: "P&B High Key", group: "Preto e branco", desc: "Claro e etéreo.", adjust: { brightness: 16, contrast: -8 }, mono: true },
  { id: "bw_dramatic", name: "P&B Dramático", group: "Preto e branco", desc: "Pretos profundos e vinheta.", adjust: { contrast: 40, blacks: -22, vignette: 28 }, mono: true },
  { id: "bw_silver", name: "Prata", group: "Preto e branco", desc: "Meios-tons prateados.", adjust: { contrast: 20, clarity: 22, grain: 14 }, mono: true },

  { id: "forest", name: "Floresta", group: "Natureza", desc: "Verdes profundos e ar limpo.", adjust: { dehaze: 22, saturation: 12, shadows: 10 } },
  { id: "golden_hour", name: "Golden Hour", group: "Natureza", desc: "Luz dourada de fim de tarde.", adjust: { temperature: 24, bloom: 18, highlights: 10 } },
  { id: "ocean", name: "Oceano", group: "Natureza", desc: "Azuis turquesa para água e céu.", adjust: { temperature: -18, saturation: 14, clarity: 12 } },
  { id: "desert_dust", name: "Poeira", group: "Natureza", desc: "Tons terrosos com haze.", adjust: { temperature: 18, fade: 20, clarity: -6 } },
  { id: "snow_clean", name: "Neve", group: "Natureza", desc: "Frio limpo com brancos preservados.", adjust: { temperature: -14, whites: 14, contrast: 10 } },

  { id: "skin_soft", name: "Pele Suave", group: "Retrato", desc: "Suaviza textura mantendo detalhe.", adjust: { clarity: -18, saturation: 4, shadows: 12 } },
  { id: "studio_beauty", name: "Estúdio", group: "Retrato", desc: "Luz de beleza com contraste limpo.", adjust: { brightness: 10, contrast: 12, highlights: -10, vibrance: 12 } },
  { id: "warm_portrait", name: "Retrato Quente", group: "Retrato", desc: "Tom de pele natural e acolhedor.", adjust: { temperature: 16, tint: 6, saturation: 6, fade: 8 } },
  { id: "editorial", name: "Editorial", group: "Retrato", desc: "Alta moda com contraste frio.", adjust: { contrast: 22, saturation: -14, clarity: 14 } },

  { id: "night_city", name: "Cidade Noturna", group: "Noturno", desc: "Luzes neon com pretos densos.", adjust: { contrast: 24, saturation: 18, bloom: 26, vignette: 18 } },
  { id: "cyberpunk", name: "Cyberpunk", group: "Noturno", desc: "Magenta e ciano saturados.", adjust: { saturation: 34, contrast: 22, bloom: 20 }, matrix: m(1.02, 0.05, 0.26, 16, -8, 22) },
  { id: "moonlight", name: "Luar", group: "Noturno", desc: "Azul frio de noite.", adjust: { temperature: -30, brightness: 6, contrast: 14 } },
  { id: "lowlight_clean", name: "Noturno Limpo", group: "Noturno", desc: "Reduz ruído percebido em baixa luz.", adjust: { shadows: 26, contrast: -6, saturation: 8, grain: -0 } },
];

/* ────────────────────────────── efeitos ────────────────────────────── */

export const EFFECTS: EffectDef[] = [
  // Distorção
  { id: "glitch", name: "Glitch Digital", group: "Distorção", desc: "Fatias deslocadas + separação RGB com ruído temporal.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 45), P("slices", "Fatias", 2, 40, 12), P("speed", "Velocidade", 1, 30, 10)] },
  { id: "glitch_scan", name: "Glitch Analógico", group: "Distorção", desc: "Scanlines com jitter vertical.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 50), P("speed", "Velocidade", 1, 30, 8)] },
  { id: "rgb_split", name: "Separação RGB", group: "Distorção", desc: "Desloca canais vermelho, verde e azul.", engine: "pixel", params: [P("amount", "Deslocamento", 0, 60, 12)] },
  { id: "wave", name: "Onda", group: "Distorção", desc: "Ondulação senoidal horizontal.", engine: "pixel", params: [P("amount", "Amplitude", 0, 60, 14), P("freq", "Frequência", 1, 60, 18)] },
  { id: "ripple", name: "Ondas de água", group: "Distorção", desc: "Ripple radial animado.", engine: "pixel", params: [P("amount", "Amplitude", 0, 40, 10), P("speed", "Velocidade", 1, 20, 6)] },
  { id: "pixelate", name: "Pixelizar", group: "Distorção", desc: "Bloco de pixels estilo censura.", engine: "pixel", params: [P("size", "Tamanho", 2, 80, 14)] },
  { id: "twirl", name: "Redemoinho", group: "Distorção", desc: "Rotação em espiral no centro.", engine: "pixel", params: [P("amount", "Força", -100, 100, 60)] },
  { id: "fisheye", name: "Olho de peixe", group: "Distorção", desc: "Distorção de grande angular.", engine: "pixel", params: [P("amount", "Força", -100, 100, 45)] },
  { id: "bulge", name: "Lupa", group: "Distorção", desc: "Aumenta a área central.", engine: "pixel", params: [P("amount", "Força", -100, 100, 55), P("radius", "Raio", 10, 100, 45)] },
  { id: "mirror", name: "Espelho", group: "Distorção", desc: "Reflete metade da imagem.", engine: "pixel", params: [P("mode", "Modo", 0, 3, 0)] },
  { id: "kaleidoscope", name: "Caleidoscópio", group: "Distorção", desc: "Simetria radial hipnótica.", engine: "pixel", params: [P("segments", "Segmentos", 2, 16, 6), P("rotate", "Rotação", 0, 360, 0)] },
  { id: "slice", name: "Fatias", group: "Distorção", desc: "Corta e desloca faixas horizontais.", engine: "pixel", params: [P("amount", "Deslocamento", 1, 100, 20), P("count", "Fatias", 2, 40, 10)] },
  { id: "shake", name: "Tremor", group: "Distorção", desc: "Câmera trêmula com ruído.", engine: "draw", params: [P("amount", "Força", 0, 40, 8), P("speed", "Velocidade", 1, 30, 12)] },
  { id: "zoom_pulse", name: "Zoom Pulse", group: "Distorção", desc: "Batida de zoom no ritmo.", engine: "draw", params: [P("amount", "Força", 0, 40, 10), P("bpm", "BPM", 40, 220, 120)] },

  // Estilo / arte
  { id: "cartoon", name: "Cartoon", group: "Estilo", desc: "Posteriza e realça contornos.", engine: "pixel", params: [P("levels", "Níveis", 3, 12, 6), P("edge", "Contorno", 0, 100, 60)] },
  { id: "comic", name: "Quadrinhos", group: "Estilo", desc: "Halftone e contornos de tinta.", engine: "mix", params: [P("dot", "Grade de pontos", 2, 12, 5), P("ink", "Tinta", 0, 100, 70)] },
  { id: "sketch", name: "Lápis", group: "Estilo", desc: "Desenho a lápis em fundo claro.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 70)] },
  { id: "oil", name: "Pintura a óleo", group: "Estilo", desc: "Pinceladas suavizadas com saturação.", engine: "pixel", params: [P("radius", "Pincel", 1, 8, 3), P("amount", "Intensidade", 0, 100, 60)] },
  { id: "watercolor", name: "Aquarela", group: "Estilo", desc: "Lavagem clara com textura de papel.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 60)] },
  { id: "halftone", name: "Meio-tom", group: "Estilo", desc: "Retícula de impressão jornal.", engine: "pixel", params: [P("size", "Grade", 2, 20, 6), P("angle", "Ângulo", 0, 90, 45)] },
  { id: "ascii", name: "ASCII Art", group: "Estilo", desc: "Converte a imagem em caracteres.", engine: "pixel", params: [P("size", "Tamanho", 4, 24, 9), P("color", "Cor (1 = sim)", 0, 1, 1)] },
  { id: "posterize", name: "Posterizar", group: "Estilo", desc: "Reduz a paleta a poucos tons.", engine: "pixel", params: [P("levels", "Níveis", 2, 16, 5)] },
  { id: "threshold", name: "Preto e branco puro", group: "Estilo", desc: "Corte binário de luminância.", engine: "pixel", params: [P("level", "Limiar", 0, 255, 128)] },
  { id: "thermal", name: "Térmico", group: "Estilo", desc: "Mapa de calor falso.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 80)] },
  { id: "xray", name: "Raio-X", group: "Estilo", desc: "Negativo clínico luminoso.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 70)] },
  { id: "emboss", name: "Relevo", group: "Estilo", desc: "Efeito de entalhe em cinza.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 70)] },
  { id: "neon_edge", name: "Neon Contorno", group: "Estilo", desc: "Bordas brilhantes sobre fundo escuro.", engine: "mix", params: [P("hue", "Matiz", 0, 360, 300), P("glow", "Brilho", 0, 100, 60)] },
  { id: "hologram", name: "Holograma", group: "Estilo", desc: "Ciano translúcido com varredura.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 60)] },
  { id: "dither", name: "Dither Retrô", group: "Estilo", desc: "Bayer 4x4 com paleta reduzida.", engine: "pixel", params: [P("size", "Pixel", 1, 6, 1)] },
  { id: "matrix_rain", name: "Chuva Digital", group: "Estilo", desc: "Código verde caindo sobre a cena.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 45)] },

  // Luz e cor
  { id: "bloom", name: "Bloom", group: "Luz", desc: "Halation suave nas luzes.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 40)] },
  { id: "glow_neon", name: "Brilho Neon", group: "Luz", desc: "Realce luminoso saturado.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 45)] },
  { id: "light_leak", name: "Vazamento de luz", group: "Luz", desc: "Luz laranja atravessando a lente.", engine: "draw", params: [P("amount", "Intensidade", 0, 100, 40), P("speed", "Velocidade", 1, 20, 4)] },
  { id: "bokeh_particles", name: "Bokeh Flutuante", group: "Luz", desc: "Bolinhas desfocadas em movimento.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 30), P("size", "Tamanho", 6, 90, 26)] },
  { id: "dust", name: "Poeira na lente", group: "Luz", desc: "Partículas finas flutuando.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 35)] },
  { id: "rain", name: "Chuva", group: "Clima", desc: "Gotas caindo com respingos.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 45), P("angle", "Ângulo", -30, 30, 8)] },
  { id: "snow", name: "Neve", group: "Clima", desc: "Flocos caindo lentamente.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 40), P("size", "Tamanho", 1, 12, 4)] },
  { id: "fog", name: "Neblina", group: "Clima", desc: "Camada de nevoeiro animado.", engine: "draw", params: [P("amount", "Densidade", 0, 100, 35)] },
  { id: "lightning", name: "Relâmpago", group: "Clima", desc: "Flashes elétricos aleatórios.", engine: "draw", params: [P("amount", "Frequência", 0, 100, 30)] },
  { id: "confetti", name: "Confete", group: "Clima", desc: "Papel picado comemorativo.", engine: "draw", params: [P("amount", "Quantidade", 0, 100, 40)] },
  { id: "sparks", name: "Faíscas", group: "Clima", desc: "Brasas voando para cima.", engine: "draw", params: [P("amount", "Quantidade", 0, 100, 35)] },
  { id: "film_burn", name: "Queima de filme", group: "Luz", desc: "Quadro queimando com buraco.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 40)] },
  { id: "vignette_pulse", name: "Vinheta Pulsante", group: "Luz", desc: "Escurecimento nas bordas no ritmo.", engine: "draw", params: [P("amount", "Força", 0, 100, 40), P("bpm", "BPM", 40, 220, 110)] },
  { id: "flash", name: "Flash", group: "Luz", desc: "Estouro de luz por batida.", engine: "draw", params: [P("amount", "Intensidade", 0, 100, 40), P("bpm", "BPM", 40, 220, 128)] },
  { id: "old_film", name: "Filme Antigo", group: "Estilo", desc: "Riscos verticais, grão e trepidação.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 50)] },
  { id: "vhs", name: "VHS", group: "Estilo", desc: "Fita magnética com tracking e cor lavada.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 55)] },
  { id: "crt", name: "CRT / Tubo", group: "Estilo", desc: "Scanlines, máscara de fósforo e curvatura.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 50)] },
  { id: "scanlines", name: "Scanlines", group: "Estilo", desc: "Linhas horizontais de TV.", engine: "draw", params: [P("amount", "Intensidade", 0, 100, 30), P("spacing", "Espaçamento", 2, 12, 3)] },
  { id: "mirror_kaleido_tile", name: "Ladrilho Espelhado", group: "Distorção", desc: "Grade simétrica infinita.", engine: "pixel", params: [P("cols", "Colunas", 1, 6, 2), P("rows", "Linhas", 1, 6, 2)] },
  { id: "datamosh", name: "Datamosh", group: "Distorção", desc: "Artefatos de compressão extrema.", engine: "mix", params: [P("amount", "Intensidade", 0, 100, 45)] },
  { id: "sharpen_pro", name: "Nitidez Pro", group: "Detalhe", desc: "Máscara de nitidez agressiva.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 40), P("radius", "Raio", 1, 4, 1)] },
  { id: "denoise", name: "Redutor de ruído", group: "Detalhe", desc: "Suaviza grão preservando bordas.", engine: "pixel", params: [P("amount", "Força", 0, 100, 40)] },
  { id: "clarity", name: "Clareza Estrutural", group: "Detalhe", desc: "Realce de micro-contraste.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 40)] },
  { id: "upscale", name: "Realce IA", group: "Detalhe", desc: "Combinação de nitidez, contraste local e denoise.", engine: "pixel", params: [P("amount", "Intensidade", 0, 100, 55)] },
  { id: "motion_blur", name: "Desfoque de movimento", group: "Detalhe", desc: "Borrão direcional cinematográfico.", engine: "pixel", params: [P("amount", "Distância", 0, 60, 14), P("angle", "Ângulo", 0, 180, 0)] },
  { id: "tilt_shift", name: "Tilt-Shift", group: "Detalhe", desc: "Miniatura com faixa nítida.", engine: "pixel", params: [P("amount", "Força", 0, 100, 45), P("center", "Centro", 0, 100, 50)] },
  { id: "lens_flare", name: "Reflexo de lente", group: "Luz", desc: "Flares anamórficos azuis.", engine: "draw", params: [P("amount", "Intensidade", 0, 100, 40), P("x", "Posição X", 0, 100, 30), P("y", "Posição Y", 0, 100, 30)] },
];

export const EFFECT_GROUPS = Array.from(new Set(EFFECTS.map((e) => e.group)));

/* ────────────────────────────── transições ────────────────────────────── */

export interface TransitionDef {
  id: string;
  name: string;
  group: string;
  desc: string;
  params?: ParamDef[];
}

export const TRANSITIONS: TransitionDef[] = [
  { id: "dissolve", name: "Dissolver", group: "Suave", desc: "Mistura gradual entre os clipes." },
  { id: "fade_black", name: "Fade por preto", group: "Suave", desc: "Passa pelo preto." },
  { id: "fade_white", name: "Fade por branco", group: "Suave", desc: "Estouro branco." },
  { id: "blur_dissolve", name: "Dissolver com desfoque", group: "Suave", desc: "Desfoque cresce na troca." },
  { id: "cross_zoom", name: "Zoom cruzado", group: "Zoom", desc: "Um entra em zoom, outro sai." },
  { id: "zoom_in", name: "Zoom in", group: "Zoom", desc: "Entra empurrando o quadro." },
  { id: "zoom_out", name: "Zoom out", group: "Zoom", desc: "Sai revelando o próximo." },
  { id: "punch", name: "Impacto", group: "Zoom", desc: "Zoom rápido com flash." },
  { id: "slide_l", name: "Deslizar ←", group: "Deslizar", desc: "O próximo entra pela direita." },
  { id: "slide_r", name: "Deslizar →", group: "Deslizar", desc: "Entra pela esquerda." },
  { id: "slide_up", name: "Deslizar ↑", group: "Deslizar", desc: "Entra por baixo." },
  { id: "slide_down", name: "Deslizar ↓", group: "Deslizar", desc: "Entra por cima." },
  { id: "push_l", name: "Empurrar", group: "Deslizar", desc: "Empurra o clipe anterior." },
  { id: "wipe_l", name: "Cortina ←", group: "Máscara", desc: "Revela em varredura." },
  { id: "wipe_r", name: "Cortina →", group: "Máscara", desc: "Varredura inversa." },
  { id: "wipe_diag", name: "Cortina diagonal", group: "Máscara", desc: "Varredura em diagonal." },
  { id: "circle_open", name: "Círculo", group: "Máscara", desc: "Abre em círculo." },
  { id: "blinds", name: "Persianas", group: "Máscara", desc: "Faixas que giram." },
  { id: "squares", name: "Blocos", group: "Máscara", desc: "Grade de quadrados." },
  { id: "pixel_dissolve", name: "Pixelizar", group: "Glitch", desc: "Dissolve em blocos grandes." },
  { id: "glitch", name: "Glitch", group: "Glitch", desc: "Corte digital com RGB split." },
  { id: "datamosh_t", name: "Datamosh", group: "Glitch", desc: "Artefatos de compressão." },
  { id: "rgb_shift", name: "RGB Split", group: "Glitch", desc: "Canais separados." },
  { id: "whip_pan", name: "Whip pan", group: "Movimento", desc: "Chicote lateral com borrão." },
  { id: "spin", name: "Girar", group: "Movimento", desc: "Rotação entre clipes." },
  { id: "swing", name: "Balanço", group: "Movimento", desc: "Giro pendular rápido." },
  { id: "film_burn_t", name: "Queima de filme", group: "Analógico", desc: "Passa pelo fogo." },
  { id: "light_leak_t", name: "Vazamento de luz", group: "Analógico", desc: "Luz atravessa." },
  { id: "vhs_t", name: "Troca de fita", group: "Analógico", desc: "Ruído de VHS." },
  { id: "paper", name: "Papel rasgado", group: "Analógico", desc: "Rasgo irregular." },
  { id: "none", name: "Corte seco", group: "Suave", desc: "Sem transição." },
];

export const TRANSITION_GROUPS = Array.from(new Set(TRANSITIONS.map((t) => t.group)));

/* ────────────────────────────── curvas de velocidade ────────────────────────────── */

export interface SpeedCurveDef {
  id: string;
  name: string;
  desc: string;
  /** multiplicadores amostrados do início ao fim do clipe */
  curve: number[];
}

export const SPEED_CURVES: SpeedCurveDef[] = [
  { id: "linear", name: "Constante", desc: "Velocidade fixa (usa o valor definido).", curve: [1, 1] },
  { id: "ramp_up", name: "Acelerar", desc: "Começa devagar e acelera.", curve: [0.25, 0.4, 0.7, 1, 1.6, 2.6, 4] },
  { id: "ramp_down", name: "Desacelerar", desc: "Começa rápido e desacelera.", curve: [4, 2.6, 1.6, 1, 0.7, 0.4, 0.25] },
  { id: "hero", name: "Momento heroico", desc: "Acelera, trava no meio e volta a acelerar.", curve: [2.4, 1.4, 0.6, 0.25, 0.25, 0.6, 1.4, 2.4] },
  { id: "bullet_time", name: "Bullet time", desc: "Câmera lenta no centro do clipe.", curve: [1.6, 0.8, 0.3, 0.15, 0.15, 0.3, 0.8, 1.6] },
  { id: "jump_cut", name: "Corte seco", desc: "Alterna entre rápido e normal.", curve: [3, 1, 3, 1, 3, 1] },
  { id: "montage", name: "Montagem rápida", desc: "Acelera todo o clipe com variação.", curve: [2, 3, 2.4, 3.6, 2.8, 3.2] },
  { id: "beat_hit", name: "Batida", desc: "Pulso rápido seguido de normal.", curve: [5, 1.2, 1, 1, 5, 1.2, 1, 1] },
  { id: "smooth_slow", name: "Slow motion suave", desc: "Câmera lenta estável e sutil.", curve: [0.6, 0.5, 0.45, 0.45, 0.5, 0.6] },
];

/* ────────────────────────────── textos e animações ────────────────────────────── */

export const FONTS = [
  { id: "Space Grotesk", name: "Space Grotesk" },
  { id: "Inter", name: "Inter" },
  { id: "Georgia", name: "Georgia (serifa)" },
  { id: "Times New Roman", name: "Times" },
  { id: "Courier New", name: "Courier (mono)" },
  { id: "Impact", name: "Impact (meme)" },
  { id: "Arial Black", name: "Arial Black" },
  { id: "Trebuchet MS", name: "Trebuchet" },
  { id: "Verdana", name: "Verdana" },
  { id: "Comic Sans MS", name: "Comic Sans" },
  { id: "JetBrains Mono", name: "JetBrains Mono" },
];

export const TEXT_ANIMATIONS = [
  { id: "none", name: "Nenhuma", desc: "Texto estático." },
  { id: "fade_in", name: "Surgir", desc: "Aparece com opacidade." },
  { id: "typewriter", name: "Máquina de escrever", desc: "Revela letra por letra." },
  { id: "pop", name: "Pop", desc: "Escala com salto." },
  { id: "slide_up", name: "Subir", desc: "Entra de baixo." },
  { id: "slide_left", name: "Entrar pela direita", desc: "Desliza lateralmente." },
  { id: "bounce", name: "Quicar", desc: "Quica ao entrar." },
  { id: "blur_in", name: "Desfoque", desc: "Surge desfocado." },
  { id: "wave_text", name: "Onda", desc: "Ondula continuamente." },
  { id: "shake_text", name: "Tremer", desc: "Vibração constante." },
  { id: "neon_flicker", name: "Neon piscando", desc: "Pisca como letreiro." },
  { id: "karaoke", name: "Karaokê", desc: "Palavras destacando em sequência." },
  { id: "word_by_word", name: "Palavra por palavra", desc: "Revela por palavra." },
  { id: "zoom_out", name: "Zoom out", desc: "Começa grande e acomoda." },
  { id: "rotate_in", name: "Girar ao entrar", desc: "Roda enquanto aparece." },
  { id: "glitch_text", name: "Glitch", desc: "Falha digital no texto." },
  { id: "gradient_flow", name: "Gradiente animado", desc: "Cores em movimento." },
  { id: "scale_pulse", name: "Pulsar", desc: "Respiração constante." },
];

export const CAPTION_STYLES = [
  { id: "tiktok_box", name: "Caixa TikTok", bg: "#000000cc", color: "#ffffff", stroke: 0, uppercase: true, weight: 700, size: 46, radius: 10, padding: 12 },
  { id: "karaoke_yellow", name: "Karaokê amarelo", bg: "#000000aa", color: "#fde047", stroke: 0, uppercase: true, weight: 800, size: 48, radius: 6, padding: 10 },
  { id: "outline_white", name: "Contorno branco", bg: "transparent", color: "#ffffff", stroke: 6, uppercase: false, weight: 800, size: 50, radius: 0, padding: 0 },
  { id: "neon", name: "Neon", bg: "transparent", color: "#22d3ee", stroke: 0, uppercase: true, weight: 700, size: 48, radius: 0, padding: 0 },
  { id: "minimal", name: "Minimalista", bg: "transparent", color: "#f8fafc", stroke: 0, uppercase: false, weight: 500, size: 40, radius: 0, padding: 0 },
  { id: "podcast", name: "Podcast", bg: "#1e293bdd", color: "#e2e8f0", stroke: 0, uppercase: false, weight: 600, size: 42, radius: 14, padding: 16 },
  { id: "comic", name: "Quadrinhos", bg: "#facc15", color: "#0f172a", stroke: 4, uppercase: true, weight: 800, size: 46, radius: 6, padding: 12 },
  { id: "gradient", name: "Gradiente", bg: "#51412ddd", color: "#ffffff", stroke: 0, uppercase: true, weight: 800, size: 48, radius: 12, padding: 14 },
];

export interface TextStylePreset {
  id: string;
  name: string;
  font: string;
  weight: number;
  size: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  bgColor?: string;
  uppercase?: boolean;
  letterSpacing?: number;
  shadow?: boolean;
  animation?: string;
}

export const TEXT_PRESETS: TextStylePreset[] = [
  { id: "titulo_clean", name: "Título limpo", font: "Space Grotesk", weight: 700, size: 82, color: "#ffffff", letterSpacing: -1, animation: "fade_in" },
  { id: "meme", name: "Meme", font: "Impact", weight: 700, size: 84, color: "#ffffff", strokeColor: "#000000", strokeWidth: 8, uppercase: true, animation: "pop" },
  { id: "neon_sign", name: "Letreiro neon", font: "Space Grotesk", weight: 800, size: 76, color: "#22d3ee", uppercase: true, shadow: true, animation: "neon_flicker" },
  { id: "caixa_alta", name: "Caixa destacada", font: "Inter", weight: 800, size: 64, color: "#0b0b12", bgColor: "#a3e635", uppercase: true, animation: "slide_up" },
  { id: "legenda_yt", name: "Legenda YouTube", font: "Inter", weight: 600, size: 52, color: "#ffffff", bgColor: "#000000aa", animation: "fade_in" },
  { id: "lower_third", name: "Lower third", font: "Inter", weight: 600, size: 48, color: "#ffffff", bgColor: "#51412d", animation: "slide_left" },
  { id: "retro_80s", name: "Retrô 80s", font: "Courier New", weight: 700, size: 66, color: "#f472b6", uppercase: true, shadow: true, animation: "glitch_text" },
  { id: "contagem", name: "Contagem regressiva", font: "Space Grotesk", weight: 700, size: 200, color: "#ffffff", animation: "pop" },
  { id: "serif_cinema", name: "Cinema serifado", font: "Georgia", weight: 400, size: 72, color: "#f8fafc", letterSpacing: 6, animation: "blur_in" },
  { id: "typewriter", name: "Datilografado", font: "Courier New", weight: 500, size: 54, color: "#a3e635", animation: "typewriter" },
  { id: "karaoke", name: "Karaokê", font: "Space Grotesk", weight: 800, size: 64, color: "#ffffff", uppercase: true, animation: "karaoke" },
  { id: "bubble", name: "Balão de fala", font: "Comic Sans MS", weight: 700, size: 54, color: "#0b0b12", bgColor: "#ffffff", animation: "bounce" },
];

export const SHAPES = [
  { id: "rect", name: "Retângulo" },
  { id: "ellipse", name: "Elipse" },
  { id: "triangle", name: "Triângulo" },
  { id: "star", name: "Estrela" },
  { id: "arrow", name: "Seta" },
  { id: "heart", name: "Coração" },
  { id: "line", name: "Linha" },
  { id: "ring", name: "Anel" },
  { id: "speech", name: "Balão" },
  { id: "play", name: "Botão play" },
  { id: "bars", name: "Barras de áudio" },
  { id: "progress", name: "Barra de progresso" },
  { id: "countdown", name: "Contador" },
  { id: "polaroid", name: "Moldura Polaroid" },
  { id: "phone", name: "Moldura de celular" },
  { id: "grid", name: "Grade 3x3" },
];

export const STICKERS = [
  "🔥", "✨", "💥", "🎉", "😍", "😂", "😎", "🤯", "👀", "💯", "🚀", "⭐", "❤️", "💜", "👍", "👏",
  "🎬", "🎵", "🎧", "📸", "💡", "⚡", "🌈", "☁️", "☀️", "🌙", "🍿", "🎮", "🏆", "📈", "💰", "🛒",
  "📍", "🔔", "⚠️", "✅", "❌", "➡️", "⬆️", "🆕", "🆓", "🔒", "🎯", "🧠", "💪", "🙌", "🤝", "😱",
];

export const STICKER_GROUPS: { group: string; items: string[] }[] = [
  { group: "Reações", items: ["🔥", "✨", "💥", "🎉", "😍", "😂", "😎", "🤯", "👀", "💯", "😱", "🙌"] },
  { group: "Marcadores", items: ["📍", "🔔", "⚠️", "✅", "❌", "➡️", "⬆️", "🆕", "🆓", "🔒", "🎯", "💡"] },
  { group: "Criação", items: ["🎬", "🎵", "🎧", "📸", "🎮", "🍿", "🏆", "📈", "💰", "🛒", "🚀", "⭐"] },
  { group: "Natureza", items: ["🌈", "☁️", "☀️", "🌙", "💜", "❤️", "👍", "👏", "🧠", "💪", "🤝", "⚡"] },
];

/* ────────────────────────────── formatos e exportação ────────────────────────────── */

export interface AspectDef {
  id: string;
  name: string;
  w: number;
  h: number;
  hint: string;
}

export const ASPECTS: AspectDef[] = [
  { id: "16:9", name: "16:9 Paisagem", w: 1920, h: 1080, hint: "YouTube, TV" },
  { id: "9:16", name: "9:16 Vertical", w: 1080, h: 1920, hint: "Reels, Shorts, TikTok" },
  { id: "1:1", name: "1:1 Quadrado", w: 1080, h: 1080, hint: "Feed Instagram" },
  { id: "4:5", name: "4:5 Retrato", w: 1080, h: 1350, hint: "Instagram, Facebook" },
  { id: "4:3", name: "4:3 Clássico", w: 1440, h: 1080, hint: "TV antiga, slides" },
  { id: "21:9", name: "21:9 Cinema", w: 2560, h: 1080, hint: "Ultrawide" },
  { id: "2.39:1", name: "2.39:1 Anamórfico", w: 2048, h: 858, hint: "Cinema scope" },
  { id: "3:2", name: "3:2 Fotográfico", w: 1620, h: 1080, hint: "Câmeras DSLR" },
];

export const EXPORT_PRESETS = [
  { id: "reels", name: "Reels / Shorts 1080p", w: 1080, h: 1920, fps: 30, vbr: 6_000_000, hint: "Vertical com legendas" },
  { id: "tiktok", name: "TikTok rápido", w: 1080, h: 1920, fps: 30, vbr: 8_000_000, hint: "Alta taxa para o feed" },
  { id: "yt1080", name: "YouTube 1080p60", w: 1920, h: 1080, fps: 60, vbr: 12_000_000, hint: "Padrão de canal" },
  { id: "yt4k", name: "YouTube 4K", w: 3840, h: 2160, fps: 30, vbr: 24_000_000, hint: "Máxima qualidade do navegador" },
  { id: "feed", name: "Feed quadrado", w: 1080, h: 1080, fps: 30, vbr: 6_000_000, hint: "Instagram / Facebook" },
  { id: "web", name: "Web leve", w: 854, h: 480, fps: 24, vbr: 1_500_000, hint: "Arquivo pequeno" },
  { id: "giflike", name: "Loop curto mudo", w: 720, h: 720, fps: 20, vbr: 2_000_000, hint: "Story curto sem áudio" },
  { id: "podcast", name: "Podcast 1080", w: 1920, h: 1080, fps: 30, vbr: 8_000_000, hint: "Entrevistas com legenda" },
];

export const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge",
  "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue",
  "saturation", "color", "luminosity",
] as const;

export const MASK_SHAPES = [
  { id: "none", name: "Sem máscara" },
  { id: "rect", name: "Retângulo" },
  { id: "circle", name: "Círculo" },
  { id: "linear", name: "Gradiente linear" },
  { id: "radial", name: "Gradiente radial" },
  { id: "heart", name: "Coração" },
  { id: "star", name: "Estrela" },
  { id: "diagonal", name: "Diagonal" },
  { id: "split_l", name: "Split metade" },
  { id: "split_r", name: "Split invertido" },
  { id: "triangle", name: "Triângulo" },
  { id: "blinds", name: "Persianas" },
] as const;

export const KEYFRAME_PROPS = [
  { id: "x", label: "Posição X", def: 0 },
  { id: "y", label: "Posição Y", def: 0 },
  { id: "scale", label: "Escala", def: 1 },
  { id: "rotate", label: "Rotação", def: 0 },
  { id: "opacity", label: "Opacidade", def: 1 },
  { id: "volume", label: "Volume", def: 1 },
  { id: "brightness", label: "Brilho", def: 0 },
  { id: "contrast", label: "Contraste", def: 0 },
  { id: "saturation", label: "Saturação", def: 0 },
  { id: "blur", label: "Desfoque", def: 0 },
] as const;

export type KeyframeProp = (typeof KEYFRAME_PROPS)[number]["id"];

export const EASINGS = [
  { id: "linear", name: "Linear" },
  { id: "ease_in", name: "Entrada suave" },
  { id: "ease_out", name: "Saída suave" },
  { id: "ease_in_out", name: "Suave nos dois" },
  { id: "bounce", name: "Quicar" },
  { id: "elastic", name: "Elástico" },
] as const;

export type EasingId = (typeof EASINGS)[number]["id"];

export const CANVAS_BACKGROUNDS = [
  { id: "color", name: "Cor sólida" },
  { id: "gradient", name: "Gradiente" },
  { id: "image", name: "Imagem do projeto" },
  { id: "blur", name: "Desfoque do clipe" },
  { id: "pattern", name: "Padrão" },
  { id: "transparent", name: "Transparente" },
] as const;

export const GRADIENT_PRESETS: [string, string][] = [
  ["#a855f7", "#22d3ee"],
  ["#f472b6", "#7c3aed"],
  ["#fb7185", "#fbbf24"],
  ["#34d399", "#06b6d4"],
  ["#facc15", "#f97316"],
  ["#0ea5e9", "#1e1b4b"],
  ["#111827", "#4b5563"],
  ["#fdf4ff", "#c084fc"],
];

export const SOUND_EFFECTS = [
  { id: "whoosh", name: "Whoosh", desc: "Transição veloz." },
  { id: "pop", name: "Pop", desc: "Aparecimento de elemento." },
  { id: "click", name: "Clique", desc: "Marcação seca." },
  { id: "riser", name: "Riser", desc: "Tensão crescente." },
  { id: "braam", name: "Braam", desc: "Impacto cinematográfico." },
  { id: "camera", name: "Disparo de câmera", desc: "Foto instantânea." },
  { id: "ding", name: "Notificação", desc: "Aviso positivo." },
  { id: "error", name: "Erro", desc: "Negativa curta." },
  { id: "boing", name: "Boing", desc: "Salto elástico." },
  { id: "typewriter", name: "Datilografia", desc: "Texto aparecendo." },
  { id: "transition_swipe", name: "Swipe", desc: "Deslize." },
  { id: "crowd", name: "Plateia", desc: "Aplausos curtos." },
  { id: "heartbeat", name: "Batimento", desc: "Tensão corporal." },
  { id: "static", name: "Estática", desc: "Ruído de rádio." },
  { id: "sparkle", name: "Brilho", desc: "Estrelinhas mágicas." },
  { id: "thunder", name: "Trovão", desc: "Impacto grave longo." },
];

export const MUSIC_STYLES = [
  { id: "lofi", name: "Lo-fi chill", desc: "Acordes suaves com leve ruído de vinil.", bpm: 78 },
  { id: "trap", name: "Trap / Hip-hop", desc: "808 com hi-hats rápidos.", bpm: 140 },
  { id: "cinematic", name: "Cinematográfico", desc: "Pad expansivo e crescendo lento.", bpm: 90 },
  { id: "chiptune", name: "Chiptune", desc: "Ondas quadradas de videogame.", bpm: 128 },
  { id: "pop", name: "Pop energético", desc: "Progressão maior com batida dançante.", bpm: 118 },
  { id: "corporate", name: "Corporativo", desc: "Plim limpo para apresentações.", bpm: 104 },
  { id: "ambient", name: "Ambiente", desc: "Texturas calmas sem percussão.", bpm: 60 },
  { id: "suspense", name: "Suspense", desc: "Pulso grave em tensão.", bpm: 84 },
];

export const VOICE_EFFECTS = [
  { id: "none", name: "Natural" },
  { id: "deep", name: "Voz grave" },
  { id: "chipmunk", name: "Agudo (esquilo)" },
  { id: "robot", name: "Robô" },
  { id: "radio", name: "Rádio AM" },
  { id: "phone", name: "Telefone" },
  { id: "cave", name: "Caverna" },
  { id: "monster", name: "Monstro" },
  { id: "helium", name: "Hélio" },
  { id: "megaphone", name: "Megafone" },
];

export const STABILIZE_LEVELS = [
  { id: "off", name: "Desligado", strength: 0 },
  { id: "leve", name: "Leve", strength: 0.25 },
  { id: "media", name: "Média", strength: 0.5 },
  { id: "forte", name: "Forte", strength: 0.78 },
  { id: "extrema", name: "Extrema", strength: 1 },
];

export const TEMPLATES = [
  {
    id: "reels_rapido",
    name: "Reels rápido",
    desc: "9:16, cortes a cada 2s, legendas TikTok e trilha pop.",
    tags: ["Vertical", "Legenda", "Social"],
  },
  {
    id: "vlog_viagem",
    name: "Vlog de viagem",
    desc: "Abertura com título, cortes suaves e música lo-fi.",
    tags: ["16:9", "Trilha", "Transições"],
  },
  {
    id: "antes_depois",
    name: "Antes e depois",
    desc: "Split screen com varredura e rótulos.",
    tags: ["Comparação", "Split", "Efeito"],
  },
  {
    id: "trailer_cinema",
    name: "Trailer de cinema",
    desc: "Barras pretas, braam, contagem e títulos serifados.",
    tags: ["Cinema", "Impacto", "Título"],
  },
  {
    id: "tutorial_legenda",
    name: "Tutorial com legenda",
    desc: "Passos numerados, zoom no detalhe e narração.",
    tags: ["Educação", "Zoom", "Legenda"],
  },
  {
    id: "slides_musica",
    name: "Slides com música",
    desc: "Fotos sincronizadas com a batida e Ken Burns.",
    tags: ["Fotos", "Música", "Batida"],
  },
  {
    id: "gameplay_hype",
    name: "Gameplay hype",
    desc: "Zoom pulse, shake, glitch e cortes rápidos.",
    tags: ["Games", "Efeitos", "Ritmo"],
  },
  {
    id: "podcast_clip",
    name: "Corte de podcast",
    desc: "Duas câmeras, legendas grandes e remoção de silêncio.",
    tags: ["Multicam", "Legenda", "Áudio"],
  },
  {
    id: "produto_loja",
    name: "Vitrine de produto",
    desc: "Fundo limpo, movimento circular e preço animado.",
    tags: ["Comércio", "Produto", "Motion"],
  },
  {
    id: "meme_curto",
    name: "Meme curto",
    desc: "Texto Impact, zoom brusco e SFX.",
    tags: ["Humor", "Texto", "SFX"],
  },
  {
    id: "lyric_karaoke",
    name: "Vídeo com letra (karaokê)",
    desc: "Letras sincronizadas destacando por palavra.",
    tags: ["Música", "Karaokê", "Texto"],
  },
  {
    id: "aula_quadro",
    name: "Aula / quadro branco",
    desc: "Desenho por cima com caneta e ponteiro virtual.",
    tags: ["Ensino", "Anotação", "Narração"],
  },
];

export const EXPORT_TIPS = [
  "Exporte em 1080p vertical para Reels, Shorts e TikTok — as plataformas comprimem o vídeo.",
  "Use 60 fps para gameplay e esportes; 30 fps basta para vlogs.",
  "Antes de exportar, ative o batimento de trilha e corte nos marcadores de batida.",
  "Legendas são obrigatórias: metade da audiência assiste sem som.",
  "Para arquivos leves na web, use a predefinição 854x480 com 1,5 Mbps.",
];
