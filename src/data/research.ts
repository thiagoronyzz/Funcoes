/**
 * editzz — PESQUISA DE MERCADO
 * ------------------------------------------------------------------
 * Levantamento das utilidades oferecidas pelo CapCut e pelos editores
 * mais usados do mundo (inclusive os pagos), com o mapeamento de cada
 * recurso para o estado de implementação dentro do editzz.
 *
 * status:
 *   "pronto"   → implementado no editzz
 *   "original" → ferramenta nova, criada pelo editzz (não existe no app de origem)
 *   "roadmap"  → documentado, ainda não implementado (limitação de navegador)
 */

export type FeatureStatus = "pronto" | "original" | "roadmap";

export interface Feature {
  name: string;
  desc: string;
  status: FeatureStatus;
  /** onde usar dentro do editzz */
  where: string;
}

export interface ReferenceGroup {
  group: string;
  features: Feature[];
}

export interface EditorReference {
  id: string;
  app: string;
  vendor: string;
  tier: "grátis" | "freemium" | "pago" | "pago único";
  tagline: string;
  color: string;
  groups: ReferenceGroup[];
}

const F = (name: string, desc: string, status: FeatureStatus, where: string): Feature => ({ name, desc, status, where });

/* ═══════════════════════════ CAPCUT (referência nº 1) ═══════════════════════════ */

const CAPCUT: EditorReference = {
  id: "capcut",
  app: "CapCut",
  vendor: "ByteDance",
  tier: "freemium",
  tagline: "Editor mobile-first que virou padrão para conteúdo vertical. É a nossa principal referência de recursos.",
  color: "#22d3ee",
  groups: [
    {
      group: "Edição básica",
      features: [
        F("Cortar, aparar e dividir", "Trim/split de clipes no ponto do playhead, com ímã de encaixe.", "pronto", "Vídeo → Timeline"),
        F("Mesclar clipes", "Sequência de clipes em várias faixas, arrastando na timeline.", "pronto", "Vídeo → Timeline"),
        F("Reverter vídeo", "Reprodução invertida quadro a quadro.", "pronto", "Inspetor → Velocidade → Reverso"),
        F("Congelar quadro (freeze)", "Transforma o quadro atual em clipe parado.", "pronto", "Timeline → Congelar"),
        F("Velocidade 0,1x a 100x", "Controle de velocidade com prévia em tempo real.", "pronto", "Inspetor → Velocidade"),
        F("Curvas de velocidade", "Rampa de velocidade (hero, bullet time, batida…).", "pronto", "Inspetor → Curva: 9 predefinições"),
        F("Zoom in/out automático", "Animações de zoom prontas para o clipe.", "pronto", "Inspetor → Animações + Zoom Pulse"),
        F("Multi-trilha (PIP)", "Vídeo sobre vídeo, com recorte, máscara e mistura.", "pronto", "Timeline → + Faixa"),
        F("Proporções de tela", "9:16, 16:9, 1:1, 4:5, 21:9, 2.39:1, 3:2.", "pronto", "Vídeo → Proporção"),
      ],
    },
    {
      group: "Recursos inteligentes (IA)",
      features: [
        F("Legendas automáticas", "Reconhecimento de fala (Web Speech API) gerando clipes de legenda.", "pronto", "Vídeo → Legendas → Automática"),
        F("Legendas a partir de roteiro", "Distribui um texto colado em legendas sincronizadas.", "pronto", "Vídeo → Legendas → Roteiro"),
        F("Texto para fala (TTS)", "Narração sintetizada em pt-BR na prévia, com download via gravação.", "pronto", "Áudio → Texto para fala"),
        F("Remoção de fundo (pessoa)", "Chroma key + recorte por luminância/contorno.", "pronto", "Inspetor → Chroma Key · Foto → Fundo"),
        F("Motion tracking", "Rastreia um ponto do vídeo e gera keyframes para anexar texto/adesivo.", "pronto", "Vídeo → Rastrear objeto"),
        F("Estabilização", "Análise de movimento entre quadros + compensação suavizada.", "pronto", "Inspetor → Estabilização"),
        F("Retoque (suavizar pele)", "Suavização preservando bordas (aproximação bilateral).", "pronto", "Foto → Retoque"),
        F("Remoção de objeto", "Inpainting por síntese de vizinhança (patch fill).", "pronto", "Foto → Apagar objeto"),
        F("Preenchimento generativo", "Expansão de moldura/tela por espelhamento e amostragem de borda.", "pronto", "Foto → Expandir/Generativo"),
        F("Detecção de cenas", "Encontra cortes por diferença entre quadros e divide o clipe.", "pronto", "Vídeo → Detectar cenas"),
        F("Auto-reframe", "Reenquadra 16:9 em 9:16 seguindo a região de maior saliência.", "pronto", "Vídeo → Auto-reframe"),
        F("Sugestão de cortes", "Analisa áudio/movimento e sugere pontos de corte.", "pronto", "Vídeo → Sugerir cortes"),
        F("Escolha de enquadramento por IA", "Mantém o assunto dentro da área segura.", "pronto", "Vídeo → Auto-reframe"),
      ],
    },
    {
      group: "Texto, adesivos e legendas",
      features: [
        F("Texto com fontes e estilos", "12 famílias, 12 estilos prontos, peso, espaçamento, caixa alta.", "pronto", "Inspetor → Texto"),
        F("Modelos de texto", "Título limpo, meme Impact, lower third, neon, balão.", "pronto", "Texto → Predefinições"),
        F("Animações de texto", "18 animações: máquina de escrever, pop, karaokê, glitch, onda…", "pronto", "Texto → Animação"),
        F("Contorno, sombra e fundo", "Contorno de qualquer cor, sombra e caixa com raio/opacidade.", "pronto", "Texto → Estilo"),
        F("Adesivos e emojis", "48 adesivos organizados em coleções.", "pronto", "Inspetor → Adesivos"),
        F("Formas e grafismos", "16 formas incluindo barras de áudio, contador e barras de progresso.", "pronto", "Inspetor → Formas"),
        F("Legendas editáveis na timeline", "Legendas são clipes reais: mova, ajuste o tempo e o estilo.", "pronto", "Timeline → faixa de texto"),
        F("Estilos de legenda viral", "8 predefinições (TikTok, karaokê, contorno, neon, podcast…).", "pronto", "Legendas → Estilo"),
        F("Animar vários elementos juntos", "Seleção múltipla com aplicação de estilo em lote.", "pronto", "Timeline → seleção múltipla"),
        F("Tradução de legenda", "Dicionário rápido de termos + exportação SRT traduzida manualmente.", "roadmap", "Legendas → tradução automática exige serviço externo"),
      ],
    },
    {
      group: "Efeitos, filtros e transições",
      features: [
        F("Biblioteca de efeitos (glitch, blur, 3D…)", "62 efeitos próprios: glitch, VHS, neo, cartoon, clima, luz.", "pronto", "Inspetor → Efeitos"),
        F("Filtros de cinema", "54 looks: Kodak, Portra, CineStill, Technicolor, noir…", "pronto", "Inspetor → Look"),
        F("Transições (30+)", "31 transições: dissolver, cortina, zoom, glitch, whip pan, queima.", "pronto", "Timeline → Transição"),
        F("Efeitos corporais / beleza", "Suavizar pele, afinar, clarear dentes, redução de vermelho.", "pronto", "Foto → Retoque"),
        F("Sobreposições (light leak, bokeh, poeira)", "Camadas geradas em tempo real, sem arquivos externos.", "pronto", "Efeitos → Luz/Clima"),
        F("Efeitos de vídeo em tempo real", "Renderização em canvas a cada quadro a 30/60 fps.", "pronto", "Prévia → render"),
        F("Ajustes manuais de cor", "21 controles incluindo vinheta, grão, bloom e cromática.", "pronto", "Inspetor → Ajustes"),
      ],
    },
    {
      group: "Música e áudio",
      features: [
        F("Biblioteca de músicas", "8 estilos gerados proceduralmente (lo-fi, trap, cinema, chiptune…).", "original", "Áudio → Estúdio de música"),
        F("Efeitos sonoros", "16 SFX sintetizados (whoosh, riser, braam, pop, trovão…).", "original", "Áudio → Efeitos sonoros"),
        F("Extrair áudio do vídeo", "Separa a faixa de áudio do clipe em faixa própria.", "pronto", "Vídeo → Extrair áudio"),
        F("Volume, fade in/out", "Volume por clipe, fades e envelope no tempo.", "pronto", "Inspetor → Áudio"),
        F("Gravação de narração (voz)", "Grava o microfone e coloca na timeline.", "pronto", "Áudio → Narração"),
        F("Redução de ruído", "Filtro passa-alta + gate de ruído por limiar.", "pronto", "Áudio → Limpar"),
        F("Mudança de voz", "10 predefinições com pitch/formante.", "pronto", "Áudio → Voz"),
        F("Batidas e cortes no ritmo", "Detecção de batidas, marcadores e corte automático.", "pronto", "Áudio → Batidas"),
        F("Ducking automático", "Trilha abaixa quando há voz.", "pronto", "Áudio → Ducking"),
        F("Sincronia labial / clonagem de voz", "Exige modelos de IA em servidor.", "roadmap", "—"),
      ],
    },
    {
      group: "Exportação",
      features: [
        F("Exportar até 4K 60fps", "Resoluções até 3840×2160 com fps configurável.", "pronto", "Exportar"),
        F("Formatos de arquivo", "WebM (VP9/VP8) e MP4 quando o navegador suporta.", "pronto", "Exportar → Formato"),
        F("Taxa de bits ajustável", "De 1 a 24 Mbps conforme a plataforma.", "pronto", "Exportar → Qualidade"),
        F("Exportar sem marca d'água", "Nada é marcado; o vídeo é só seu.", "pronto", "Exportar"),
        F("Modelos (templates) prontos", "12 modelos que montam o projeto automaticamente.", "pronto", "Modelos"),
        F("Exportar apenas um trecho", "Define entrada/saída e exporta só o intervalo.", "pronto", "Exportar → Intervalo"),
      ],
    },
  ],
};

/* ═══════════════════════════ PROFISSIONAIS PAGOS ═══════════════════════════ */

const PREMIERE: EditorReference = {
  id: "premiere",
  app: "Adobe Premiere Pro",
  vendor: "Adobe",
  tier: "pago",
  tagline: "Padrão de mercado em edição não linear profissional.",
  color: "#d7a45a",
  groups: [
    {
      group: "Timeline e montagem",
      features: [
        F("Timeline multicalha", "Faixas ilimitadas com arrastar, cortar e organizar.", "pronto", "Vídeo → Timeline"),
        F("Ripple / roll edit", "Ripple: remove lacunas ao apagar; roll: reajusta corte.", "pronto", "Atalhos → Ripple delete / rolar corte"),
        F("Camadas de ajuste", "Clipe que aplica cor/efeito a tudo abaixo dele.", "pronto", "Timeline → Clipe de ajuste"),
        F("Copiar e colar atributos", "Copia estilo de um clipe para outro.", "pronto", "Inspetor → Colar estilo"),
        F("Marcadores e comentários", "Marcadores nomeados no tempo + exportação de anotações.", "pronto", "Timeline → Marcadores"),
        F("Edição baseada em texto", "Edita o vídeo a partir do texto transcrito.", "pronto", "Legendas → Roteiro (dividir por fala)"),
        F("Multicam", "Sincroniza ângulos e permite alternar na timeline.", "pronto", "Vídeo → Multicam (2+ faixas)"),
        F("Proxy de mídia", "Prévia leve para arquivos pesados.", "pronto", "Vídeo → Qualidade de prévia"),
      ],
    },
    {
      group: "Cor (Lumetri)",
      features: [
        F("Lumetri Color", "Correção primária com 21 controles.", "pronto", "Inspetor → Ajustes"),
        F("Curvas personalizadas", "Curva RGB + canais com pontos arrastáveis.", "pronto", "Foto → Curvas"),
        F("Rodas de cor / color match", "Rodas sombras/meios/altas + correspondência entre clipes.", "pronto", "Foto → Color grading"),
        F("Escopos", "Histograma e medidores de tons em tempo real.", "pronto", "Foto → Histograma"),
        F("LUTs importáveis", "Importe/exporte LUTs como receitas JSON.", "pronto", "Looks → Importar receita"),
      ],
    },
    {
      group: "Áudio e efeitos",
      features: [
        F("Essential Sound", "Presets por tipo de áudio (diálogo, música, SFX).", "pronto", "Áudio → Predefinições"),
        F("Auto ducking", "Trilha abaixa automaticamente sob a voz.", "pronto", "Áudio → Ducking"),
        F("Auto reframe (Sensei)", "Reenquadramento inteligente por proporção.", "pronto", "Vídeo → Auto-reframe"),
        F("Templates de motion graphics", "Títulos e grafismos prontos para aplicar.", "pronto", "Texto/Formas → predefinições"),
        F("Integração com After Effects", "Composição avançada em outro aplicativo.", "roadmap", "—"),
      ],
    },
  ],
};

const RESOLVE: EditorReference = {
  id: "resolve",
  app: "DaVinci Resolve",
  vendor: "Blackmagic Design",
  tier: "freemium",
  tagline: "Referência mundial em cor e áudio profissional (versão Studio é paga).",
  color: "#fb7185",
  groups: [
    {
      group: "Página de cor",
      features: [
        F("Color wheels", "Rodas de cor para sombras, meios-tons e altas luzes.", "pronto", "Foto → Color grading"),
        F("Qualifier (HSL key)", "Seleção por faixa de cor para ajuste local.", "pronto", "Foto → HSL 8 faixas"),
        F("Power windows", "Máscaras circulares/lineares com ajuste local.", "pronto", "Foto → Máscaras locais"),
        F("Curvas (tons e saturação)", "Curvas de luminância, RGB e saturação por matiz.", "pronto", "Foto → Curvas"),
        F("Color Warper", "Grelha de matiz/saturação para grades extremos.", "pronto", "Foto → HSL avançado"),
        F("Magic Mask", "Seleção de assunto com um clique (heurística de saliência).", "pronto", "Foto → Selecionar assunto"),
        F("Face refinement", "Suavização de pele por detecção heurística de tom de pele.", "pronto", "Foto → Retoque de rosto"),
        F("Speed Warp / slow motion", "Câmera lenta suave por mistura de quadros.", "pronto", "Inspetor → Curva de velocidade"),
        F("Object removal", "Remove objetos com preenchimento por vizinhança.", "pronto", "Foto → Apagar objeto"),
        F("Nós (node graph)", "Pipeline de efeitos seriado e reordenável.", "pronto", "Foto → Pilha de efeitos / Vídeo → Ordem de efeitos"),
      ],
    },
    {
      group: "Fairlight (áudio) e entrega",
      features: [
        F("Mesa de mixagem", "Volume, pan e medidores por faixa.", "pronto", "Vídeo → Mixer"),
        F("Equalizador e dinâmica", "Filtros de áudio por clipe.", "pronto", "Áudio → Limpar/Equalizar"),
        F("Voice isolation", "Separação de voz por filtragem espectral simplificada.", "pronto", "Áudio → Isolar voz"),
        F("Entrega multi-formato", "Vários presets de exportação por plataforma.", "pronto", "Exportar → Predefinições"),
      ],
    },
  ],
};

const FINALCUT: EditorReference = {
  id: "finalcut",
  app: "Final Cut Pro",
  vendor: "Apple",
  tier: "pago único",
  tagline: "Timeline magnética e desempenho em Apple Silicon.",
  color: "#fbbf24",
  groups: [
    {
      group: "Fluxo de edição",
      features: [
        F("Timeline magnética", "Clipes não deixam lacunas; o encaixe puxa automaticamente.", "pronto", "Vídeo → Encaixe + arrastar"),
        F("Skimmer (prévia no cursor)", "Passar o mouse pela timeline mostra o quadro.", "pronto", "Timeline → prévia ao passar o mouse"),
        F("Clipes compostos", "Agrupar clipes como um só.", "pronto", "Timeline → Agrupar"),
        F("Áudio roles / componentes", "Organização de diálogo, música e efeitos.", "pronto", "Áudio → Tipos e presets"),
        F("Renderização em segundo plano", "Proxy leve enquanto você edita.", "pronto", "Vídeo → Qualidade de prévia (auto)"),
        F("Efeitos e transições integrados", "Biblioteca de efeitos com ajuste instantâneo.", "pronto", "Efeitos / Transições"),
        F("HDR e 360°", "Fluxos imersivos e HDR real.", "roadmap", "—"),
      ],
    },
  ],
};

const AFTER_EFFECTS: EditorReference = {
  id: "aftereffects",
  app: "Adobe After Effects",
  vendor: "Adobe",
  tier: "pago",
  tagline: "Animação e composição quadro a quadro.",
  color: "#d7a45a",
  groups: [
    {
      group: "Animação e composição",
      features: [
        F("Keyframes com interpolação", "Animar posição, escala, rotação, opacidade, cor e áudio.", "pronto", "Inspetor → Keyframes"),
        F("Easings (bounce, elastic, ease)", "6 curvas de interpolação por keyframe.", "pronto", "Keyframes → Easing"),
        F("Pré-composição / agrupamento", "Aninhar clipes para tratar como bloco.", "pronto", "Timeline → Agrupar"),
        F("Modos de mesclagem", "16 modos de blend por camada.", "pronto", "Inspetor → Mistura"),
        F("Máscaras e mattes", "12 formatos de máscara com feather e inversão.", "pronto", "Inspetor → Máscara"),
        F("Rastreamento de movimento", "Movimento estimado por correlação normalizada.", "pronto", "Vídeo → Rastrear"),
        F("Estabilizador (warp)", "Suaviza tremores do vídeo.", "pronto", "Inspetor → Estabilização"),
        F("Chroma key (Keylight)", "Remoção de fundo verde/azul com spill.", "pronto", "Inspetor → Chroma key"),
        F("Particles / simulações", "Partículas, neve, faíscas e confete gerados.", "pronto", "Efeitos → Clima"),
        F("Motion graphics (Motion)", "Títulos animados e formas prontas.", "pronto", "Texto/Formas"),
      ],
    },
  ],
};

const PHOTOSHOP: EditorReference = {
  id: "photoshop",
  app: "Adobe Photoshop",
  vendor: "Adobe",
  tier: "pago",
  tagline: "Edição de imagem por camadas e retoque de precisão.",
  color: "#60a5fa",
  groups: [
    {
      group: "Retoque e camadas",
      features: [
        F("Camadas com blend", "Overlays de texto, imagem e forma com 16 modos.", "pronto", "Foto → Camadas"),
        F("Máscara de camada", "Máscaras lineares/radiais e por seleção.", "pronto", "Foto → Máscaras"),
        F("Pincel de recuperação / healing", "Remove imperfeições por amostragem de vizinhança.", "pronto", "Foto → Retoque → Curar"),
        F("Carimbo (clone stamp)", "Copia uma área de origem para outra.", "pronto", "Foto → Retoque → Carimbo"),
        F("Dodge & Burn", "Clareia/escurece regiões localmente.", "pronto", "Foto → Retoque → Dodge/Burn"),
        F("Liquify", "Empurrar, inchar e comprimir áreas.", "pronto", "Foto → Retoque → Liquify"),
        F("Olhos vermelhos", "Remoção de pupilas vermelhas.", "pronto", "Foto → Retoque → Olhos vermelhos"),
        F("Preenchimento generativo", "Preenche seleções com conteúdo sintetizado da vizinhança.", "pronto", "Foto → Apagar/Preencher"),
        F("Expandir imagem", "Aumenta a tela completando as bordas.", "pronto", "Foto → Expandir"),
        F("Curvas, níveis e HSL", "Curvas RGB, níveis com histograma e HSL por faixa.", "pronto", "Foto → Ajustes"),
        F("Filtros inteligentes", "Pilha de efeitos reordenável e não destrutiva.", "pronto", "Foto → Efeitos"),
        F("Ferramenta de texto", "Texto com contorno, sombra e rotação.", "pronto", "Foto → Texto"),
        F("Neural Filters", "Filtros criativos de estúdio (estilo, sketch, cartoon).", "pronto", "Foto → Efeitos de estilo"),
        F("Corte com proporções", "7 proporções + corte livre e endireitamento.", "pronto", "Foto → Corte"),
        F("Perspectiva / keystone", "Corrige linhas convergentes.", "pronto", "Foto → Perspectiva"),
        F("Pincel de história", "Voltar estados anteriores pontualmente.", "pronto", "Foto → Histórico (undo/redo)"),
      ],
    },
  ],
};

const LIGHTROOM: EditorReference = {
  id: "lightroom",
  app: "Adobe Lightroom",
  vendor: "Adobe",
  tier: "freemium",
  tagline: "Fluxo fotográfico: presets, cor e revelação.",
  color: "#38bdf8",
  groups: [
    {
      group: "Revelação e cor",
      features: [
        F("Presets (um clique)", "54 looks com intensidade ajustável.", "pronto", "Foto → Presets/Looks"),
        F("Sliders de luz", "Exposição, contraste, altas, sombras, brancos, pretos.", "pronto", "Foto → Ajustes"),
        F("Cor: temperatura, matiz, vibração", "Balanço de branco completo + conta-gotas.", "pronto", "Foto → Ajustes → Conta-gotas"),
        F("Curvas por canal", "RGB e canais individuais.", "pronto", "Foto → Curvas"),
        F("Color mixer (HSL)", "Matiz/saturação/luminância em 8 faixas.", "pronto", "Foto → HSL"),
        F("Color grading", "Rodas de cor para 3 faixas tonais + split toning.", "pronto", "Foto → Color grading"),
        F("Detalhe: nitidez e ruído", "Nitidez com máscara e redução de ruído.", "pronto", "Foto → Detalhe"),
        F("Efeitos: vinheta e grão", "Vinheta, grão e corte pós-crop.", "pronto", "Foto → Efeitos"),
        F("Máscaras por assunto/céu", "Seleção automática heurística de assunto, céu e fundo.", "pronto", "Foto → Máscaras inteligentes"),
        F("Presets salvos pelo usuário", "Crie, salve, exporte e importe seus looks.", "pronto", "Looks → Minhas receitas"),
        F("Sincronizar edições em lote", "Aplique a mesma receita a várias fotos.", "pronto", "Foto → Lote"),
        F("Comparar antes/depois", "Slider de comparação lado a lado.", "pronto", "Foto → Comparar"),
        F("Correção de lente/perspectiva", "Endireitamento e linhas verticais.", "pronto", "Foto → Perspectiva"),
        F("Super-resolução (IA)", "Ampliação com realce de bordas (2x–4x).", "pronto", "Foto → Realce IA / 2x-4x"),
        F("Prévia de intervalo HDR", "Fusão simples de exposições múltiplas.", "roadmap", "requer múltiplos arquivos RAW"),
      ],
    },
  ],
};

/* ═══════════════════════════ MOBILE POPULARES ═══════════════════════════ */

const INSHOT: EditorReference = {
  id: "inshot",
  app: "InShot",
  vendor: "Shantanu Pte",
  tier: "freemium",
  tagline: "Editor mobile rápido para redes sociais, com 60+ transições.",
  color: "#f472b6",
  groups: [
    {
      group: "Recursos",
      features: [
        F("60+ transições", "31 transições implementadas com prévia animada.", "pronto", "Timeline → Transição"),
        F("Blur de fundo", "Preenche bordas com o próprio vídeo desfocado.", "pronto", "Vídeo → Fundo → Desfoque"),
        F("Colagem freestyle", "Grade de fotos com espaçamento ajustável.", "pronto", "Foto → Colagem"),
        F("Máscara de forma no PIP", "12 máscaras aplicadas a clipes sobrepostos.", "pronto", "Inspetor → Máscara"),
        F("Blend modes", "16 modos de mistura.", "pronto", "Inspetor → Mistura"),
        F("Keyframe em texto/adesivo", "Anime qualquer elemento com keyframes.", "pronto", "Keyframes"),
        F("Chroma key", "Fundo verde com tolerância e correção de spill.", "pronto", "Inspetor → Chroma key"),
        F("Estabilizador", "5 níveis de estabilização.", "pronto", "Inspetor → Estabilização"),
        F("Filtros de filme (VHS, glitch)", "VHS, glitch, retro, RGB e outros 58.", "pronto", "Looks / Efeitos"),
        F("Velocidade 0,2x–100x com rampa", "Velocidade por clipe e curvas.", "pronto", "Inspetor → Velocidade"),
        F("Smooth slow motion", "Câmera lenta suave por mistura de quadros.", "pronto", "Curvas → Slow motion suave"),
      ],
    },
  ],
};

const VN: EditorReference = {
  id: "vn",
  app: "VN Video Editor",
  vendor: "Ubiquiti/VlogNow",
  tier: "grátis",
  tagline: "Editor gratuito sem marca d'água, forte em curvas de velocidade.",
  color: "#34d399",
  groups: [
    {
      group: "Recursos",
      features: [
        F("Curva de velocidade desenhável", "9 curvas prontas + multiplicador ajustável.", "pronto", "Inspetor → Curva de velocidade"),
        F("Zoom de timeline", "Zoom por roda, pinça e barra compacta.", "pronto", "Timeline → Zoom"),
        F("Sem marca d'água", "Exportação limpa.", "pronto", "Exportar"),
        F("Ajuste fino de áudio", "Volume, fade e mixagem por faixa.", "pronto", "Mixer"),
        F("Múltiplos formatos de exportação", "8 predefinições por plataforma.", "pronto", "Exportar"),
      ],
    },
  ],
};

const ALIGHT: EditorReference = {
  id: "alight",
  app: "Alight Motion",
  vendor: "Alight Creative",
  tier: "freemium",
  tagline: "Motion graphics com keyframes e camadas no celular.",
  color: "#818cf8",
  groups: [
    {
      group: "Animação",
      features: [
        F("Keyframes para tudo", "10 propriedades animáveis com easings.", "pronto", "Keyframes"),
        F("Curvas bezier de easing", "6 easings incluindo bounce e elastic.", "pronto", "Keyframes → Easing"),
        F("Camadas com blend", "Camadas equivalentes a faixas + blend.", "pronto", "Timeline → Faixas"),
        F("Máscaras", "12 máscaras com feather e inversão.", "pronto", "Inspetor → Máscara"),
        F("Efeitos empilháveis", "Pilha de efeitos reordenável por clipe.", "pronto", "Efeitos → Ordem"),
        F("Exportação em sequência de quadros", "Exporta o quadro atual em PNG.", "pronto", "Exportar → Quadro PNG"),
      ],
    },
  ],
};

const KINEMASTER: EditorReference = {
  id: "kinemaster",
  app: "KineMaster",
  vendor: "Kinemaster Corp",
  tier: "freemium",
  tagline: "Editor mobile com muitas camadas, máscaras e modos de mistura.",
  color: "#f97316",
  groups: [
    {
      group: "Recursos",
      features: [
        F("Camadas ilimitadas", "Faixas adicionais sem limite prático.", "pronto", "Timeline → Faixas"),
        F("Modo de mistura por camada", "16 modos.", "pronto", "Inspetor → Mistura"),
        F("Máscara com feather", "Ajuste de suavidade e inversão.", "pronto", "Inspetor → Máscara"),
        F("Envelope de áudio", "Curva de volume por clipe (keyframes de volume).", "pronto", "Keyframes → Volume"),
        F("Ferramentas de desenho", "Formas e traços por cima do vídeo.", "pronto", "Formas / Caneta"),
      ],
    },
  ],
};

const FILMORA: EditorReference = {
  id: "filmora",
  app: "Wondershare Filmora",
  vendor: "Wondershare",
  tier: "pago",
  tagline: "Editor amigável com efeitos criativos e IA assistida.",
  color: "#06b6d4",
  groups: [
    {
      group: "Recursos",
      features: [
        F("Efeitos de sobreposição", "Camadas de luz, poeira, bokeh e partículas.", "pronto", "Efeitos → Luz/Clima"),
        F("Motion tracking", "Adesivos e textos seguem o objeto.", "pronto", "Vídeo → Rastrear"),
        F("Auditores de áudio (auto duck)", "Trilha abaixa sob voz.", "pronto", "Áudio → Ducking"),
        F("Silêncio removido automaticamente", "Corta trechos sem som.", "pronto", "Áudio → Remover silêncio"),
        F("Ferramentas de cor avançadas", "HSL, curvas e rodas de cor.", "pronto", "Foto → Cor"),
        F("Títulos animados", "Predefinições de título e lower third.", "pronto", "Texto → Predefinições"),
        F("Screenshots / quadro em imagem", "Exporta o quadro atual.", "pronto", "Exportar → Quadro PNG"),
      ],
    },
  ],
};

const DESCRIPT: EditorReference = {
  id: "descript",
  app: "Descript",
  vendor: "Descript Inc.",
  tier: "freemium",
  tagline: "Edição por transcrição: apagar palavra, apagar vídeo.",
  color: "#22d3ee",
  groups: [
    {
      group: "Transcrição",
      features: [
        F("Edição baseada em texto", "Transcrição (ou roteiro colado) gera legendas editáveis.", "pronto", "Legendas → Roteiro"),
        F("Remover palavras de preenchimento", "Fila de limpeza rápida de muletas de fala.", "pronto", "Legendas → Limpar muletas"),
        F("Remover silêncios", "Detecção de pausas e corte automático.", "pronto", "Áudio → Remover silêncio"),
        F("Studio Sound", "Melhora a voz com filtros e compressão simples.", "pronto", "Áudio → Melhorar voz"),
        F("Filler word remover", "Lista configurável de expressões a remover.", "pronto", "Legendas → Limpar muletas"),
        F("Eye contact", "Correção de olhar exige IA generativa.", "roadmap", "—"),
      ],
    },
  ],
};

const CANVA: EditorReference = {
  id: "canva",
  app: "Canva",
  vendor: "Canva",
  tier: "freemium",
  tagline: "Design gráfico com modelos e ferramentas rápidas.",
  color: "#a3e635",
  groups: [
    {
      group: "Design",
      features: [
        F("Modelos de tamanhos sociais", "12 formatos sociais prontos.", "pronto", "Foto → Tamanhos sociais"),
        F("Remover fundo", "Recorte automático de fundo.", "pronto", "Foto → Remover fundo"),
        F("Elementos e adesivos", "48 adesivos e 16 formas.", "pronto", "Foto → Elementos"),
        F("Texto estilizado", "Combinações de fonte/contorno/caixa.", "pronto", "Texto → Predefinições"),
        F("Molduras e grades", "Molduras e colagens.", "pronto", "Foto → Molduras/Colagem"),
        F("Blur e vinheta", "Desfoque de fundo e vinheta.", "pronto", "Foto → Efeitos"),
        F("Gerador de apresentação/slides", "Criação de carrossel a partir de imagens.", "original", "Foto → Carrossel (exportação múltipla)"),
      ],
    },
  ],
};

const PICSART: EditorReference = {
  id: "picsart",
  app: "Picsart",
  vendor: "Picsart",
  tier: "freemium",
  tagline: "Edição criativa com IA, remoção de objeto e retoque de rosto.",
  color: "#78aaa5",
  groups: [
    {
      group: "Recursos",
      features: [
        F("Retoque facial com um toque", "Suaviza pele, clareia dentes, remove vermelhidão.", "pronto", "Foto → Retoque de rosto"),
        F("Remover objeto", "Apaga elementos indesejados.", "pronto", "Foto → Apagar objeto"),
        F("Trocar/repor fundo", "Cor, gradiente, imagem ou blur.", "pronto", "Foto → Fundo"),
        F("Expandir imagem", "Completa bordas para formatos novos.", "pronto", "Foto → Expandir"),
        F("Melhorar qualidade", "Realce com nitidez e contraste local.", "pronto", "Foto → Realce IA"),
        F("Gerador de imagem IA", "Geração real exige modelo em servidor.", "roadmap", "—"),
        F("Stickers e texto", "48 adesivos, 16 formas e texto completo.", "pronto", "Foto → Elementos"),
      ],
    },
  ],
};

const SNAPSEED: EditorReference = {
  id: "snapseed",
  app: "Snapseed",
  vendor: "Google",
  tier: "grátis",
  tagline: "Ferramentas profissionais gratuitas com controle seletivo.",
  color: "#34d399",
  groups: [
    {
      group: "Recursos",
      features: [
        F("Ajuste seletivo por ponto", "Máscaras locais com ajuste independente.", "pronto", "Foto → Máscaras → pontos"),
        F("Pincel de cura", "Remoção de imperfeições.", "pronto", "Foto → Retoque → Curar"),
        F("Curvas e níveis", "Curvas com histograma.", "pronto", "Foto → Curvas"),
        F("Tonalidade e HSL", "Ajuste por faixa de cor.", "pronto", "Foto → HSL"),
        F("Perspectiva", "Correção de linhas e horizonte.", "pronto", "Foto → Perspectiva"),
        F("Expansão de tela", "Completa o quadro.", "pronto", "Foto → Expandir"),
        F("Desfoque de lente", "Blur com faixa nítida.", "pronto", "Foto → Efeitos → Tilt-Shift"),
        F("Dupla exposição", "Combina duas imagens com blend.", "pronto", "Foto → Camadas → Dupla exposição"),
        F("Desfoque de movimento", "Borrão direcional.", "pronto", "Efeitos → Movimento"),
        F("Halation e bloom", "Brilho analógico nas luzes.", "pronto", "Efeitos → Bloom/Halation"),
        F("Filmes simulados", "Looks inspirados em filmes reais.", "pronto", "Looks → Filme analógico"),
        F("Stacks (histórico reversível)", "Pilha de edições não destrutivas com undo/redo.", "pronto", "Foto → Histórico"),
        F("Edição em lote", "Aplica o look a várias fotos.", "pronto", "Foto → Lote"),
      ],
    },
  ],
};

const ROADMAP_EXTRA: EditorReference = {
  id: "outros",
  app: "Outros editores do levantamento",
  vendor: "LumaFusion · PowerDirector · VSCO · Lumii · Photoroom · Kapwing · Clipchamp · Opus Clip · Runway · CapCut Pro",
  tier: "pago",
  tagline: "Recursos adicionais coletados desses aplicativos e trazidos para o editzz quando o navegador permite.",
  color: "#94a3b8",
  groups: [
    {
      group: "Recursos incorporados",
      features: [
        F("Curvas e HSL (Lumii/VSCO)", "Curvas por canal, HSL e grão de filme.", "pronto", "Foto → Curvas/HSL"),
        F("Batch e presets (VSCO)", "Receitas aplicadas em lote.", "pronto", "Foto → Lote"),
        F("Fundo por IA (Photoroom)", "Remoção de fundo + novo cenário.", "pronto", "Foto → Fundo"),
        F("Edição colaborativa (Kapwing/Clipchamp)", "Projetos em arquivo .editzz.json para enviar a outra pessoa.", "pronto", "Projeto → Exportar arquivo"),
        F("Clipes curtos de vídeos longos (Opus Clip)", "Sugestão de cortes por análise de áudio/movimento.", "pronto", "Vídeo → Sugerir cortes"),
        F("Geração de vídeo por IA (Runway)", "Depende de modelo em nuvem.", "roadmap", "—"),
        F("Storyboard e roteiro visual (LumaFusion/Storyboard)", "Exporta folha de contato com todos os cortes.", "original", "Exportar → Storyboard"),
        F("Marcas e kits de criador", "Kit de tamanhos sociais + marca d'água salva.", "original", "Foto → Kit de criador"),
      ],
    },
  ],
};

export const REFERENCIAS: EditorReference[] = [
  CAPCUT,
  PREMIERE,
  RESOLVE,
  FINALCUT,
  AFTER_EFFECTS,
  PHOTOSHOP,
  LIGHTROOM,
  INSHOT,
  VN,
  ALIGHT,
  KINEMASTER,
  FILMORA,
  DESCRIPT,
  CANVA,
  PICSART,
  SNAPSEED,
  ROADMAP_EXTRA,
];

/* ═══════════════════════════ FERRAMENTAS ORIGINAIS EDITZZ ═══════════════════════════ */

export interface EditzzTool {
  id: string;
  name: string;
  desc: string;
  where: string;
  icon: string;
  kind: "vídeo" | "foto" | "áudio" | "projeto";
}

export const NOVAS_FERRAMENTAS: EditzzTool[] = [
  { id: "grade_inteligente", name: "Grade Inteligente", desc: "Analisa o histograma de cada quadro e corrige exposição, contraste e balanço de branco automaticamente — funciona em vídeo e foto.", where: "Foto → Ajustes · Vídeo → Look → Grade Inteligente", icon: "sparkles", kind: "foto" },
  { id: "realce_ia", name: "Realce IA local", desc: "Combina nitidez com máscara, contraste local e redução de ruído — sem depender de servidor.", where: "Foto → Detalhe · Efeitos → Realce IA", icon: "wand", kind: "foto" },
  { id: "estabilizador", name: "Estabilizador por análise de movimento", desc: "Mede o deslocamento entre quadros em baixa resolução e aplica contra-movimento suavizado.", where: "Vídeo → Inspetor → Estabilização", icon: "activity", kind: "vídeo" },
  { id: "rastreador", name: "Rastreador de objeto → keyframes", desc: "Você marca um ponto, o editzz rastreia por correlação e gera keyframes para prender texto, adesivo ou máscara no objeto.", where: "Vídeo → Rastrear objeto", icon: "crosshair", kind: "vídeo" },
  { id: "corte_batida", name: "Corte na batida", desc: "Detecta batidas da trilha e corta os clipes exatamente nos marcadores, em lote.", where: "Vídeo → Batidas → Cortar no ritmo", icon: "music", kind: "áudio" },
  { id: "remove_silencio", name: "Remoção de silêncio", desc: "Encontra pausas longas no áudio e remove automaticamente, acelerando entrevistas e aulas.", where: "Áudio → Remover silêncio", icon: "scissors", kind: "áudio" },
  { id: "detecta_cenas", name: "Detector de cenas", desc: "Compara quadros e divide o clipe em todos os cortes existentes no arquivo.", where: "Vídeo → Detectar cenas", icon: "layers", kind: "vídeo" },
  { id: "auto_reframe", name: "Auto-reframe por saliência", desc: "Converte 16:9 em 9:16 mantendo o assunto enquadrado, com suavização de movimento.", where: "Vídeo → Auto-reframe", icon: "crop", kind: "vídeo" },
  { id: "sugere_cortes", name: "Sugestor de cortes", desc: "Analisa picos de áudio e movimento para sugerir os melhores pontos de corte.", where: "Vídeo → Sugerir cortes", icon: "zap", kind: "vídeo" },
  { id: "paleta_legenda", name: "Paleta → legenda", desc: "Extrai as cores dominantes do vídeo e aplica nas legendas para manter harmonia visual.", where: "Legendas → Paleta do vídeo", icon: "palette", kind: "vídeo" },
  { id: "areas_seguras", name: "Zonas seguras por plataforma", desc: "Sobreposições com as áreas cobertas por interface do Reels, TikTok e YouTube Shorts.", where: "Prévia → Zonas seguras", icon: "square", kind: "vídeo" },
  { id: "gerador_midia", name: "Gerador de mídia procedural", desc: "Cria fundos animados, partículas, contagem regressiva, cartões de texto e barras de cores sem precisar de arquivo externo.", where: "Mídia → Gerador", icon: "box", kind: "vídeo" },
  { id: "estudio_musica", name: "Estúdio de música procedural", desc: "Compõe trilhas em 8 estilos (lo-fi, trap, cinema, chiptune…) e exporta em WAV.", where: "Áudio → Música", icon: "piano", kind: "áudio" },
  { id: "banco_sfx", name: "Banco de SFX sintetizado", desc: "16 efeitos sonoros gerados por síntese, prontos para arrastar na timeline.", where: "Áudio → Efeitos", icon: "volume", kind: "áudio" },
  { id: "mapa_energia", name: "Mapa de energia da timeline", desc: "Mostra onde há fala, silêncio e movimento ao longo do tempo, em faixas de calor.", where: "Timeline → Mapa de energia", icon: "bar-chart", kind: "áudio" },
  { id: "storyboard_export", name: "Storyboard e folha de contato", desc: "Gera uma imagem com os quadros principais do projeto para revisão em equipe.", where: "Exportar → Storyboard", icon: "grid", kind: "projeto" },
  { id: "receitas", name: "Receitas de look portáveis", desc: "Seus looks personalizados viram um arquivo .editzz-look.json para compartilhar e reutilizar.", where: "Looks → Minhas receitas", icon: "bookmark", kind: "projeto" },
  { id: "karaoke", name: "Estúdio de karaokê", desc: "Cole a letra, sincronize por linha e o editzz anima o destaque palavra por palavra.", where: "Legendas → Karaokê", icon: "mic", kind: "vídeo" },
  { id: "kit_criador", name: "Kit de criador", desc: "Exporta a mesma peça em 6 tamanhos sociais com marca d'água opcional.", where: "Foto → Kit de criador", icon: "package", kind: "foto" },
  { id: "exif", name: "Leitor de EXIF", desc: "Lê dados da câmera embutidos no JPEG e mostra no painel de informações.", where: "Foto → Informações", icon: "info", kind: "foto" },
  { id: "acessibilidade", name: "Verificador de legibilidade", desc: "Mede o contraste entre legenda e fundo e avisa quando o texto fica difícil de ler.", where: "Legendas → Contraste", icon: "eye", kind: "vídeo" },
  { id: "clonagem_projeto", name: "Duplicar projeto com receita", desc: "Duplica um projeto e aplica uma nova receita de cor em todo o vídeo de uma vez.", where: "Projeto → Duplicar", icon: "copy", kind: "projeto" },
];

/* ═══════════════════════════ ESTATÍSTICAS ═══════════════════════════ */

export function researchStats() {
  let pronto = 0;
  let original = 0;
  let roadmap = 0;
  REFERENCIAS.forEach((r) =>
    r.groups.forEach((g) =>
      g.features.forEach((f) => {
        if (f.status === "pronto") pronto++;
        else if (f.status === "original") original++;
        else roadmap++;
      })
    )
  );
  return { pronto, original, roadmap, apps: REFERENCIAS.length, total: pronto + original + roadmap };
}

export const FONTES_PESQUISA = [
  "CapCut — App Store e Google Play (lista oficial de recursos) e central de ajuda do CapCut sobre remoção de fundo, legendas automáticas e curvas de velocidade.",
  "Adobe Premiere Pro 2026 — recursos anunciados de edição baseada em texto, Generative Extend, Auto Reframe, Lumetri Color e Essential Sound.",
  "DaVinci Resolve — página de cor (nodes, qualifier, power windows), Fairlight e Neural Engine (Magic Mask, Speed Warp, object removal).",
  "Final Cut Pro — timeline magnética, skimmer, clipes compostos e roles de áudio.",
  "Adobe Lightroom — curvas, color mixer, color grading, máscaras por assunto/céu e presets adaptativos.",
  "Adobe Photoshop — camadas, healing, clone stamp, liquify, preenchimento generativo e neural filters.",
  "Snapseed — ajuste seletivo, cura, RAW, curvas, perspectiva, dupla exposição, halation/bloom e edição em lote.",
  "Picsart, Canva, InShot, VN, Alight Motion, KineMaster, Filmora, Descript e Photoroom — listas de recursos publicadas nas lojas e sites oficiais.",
];
