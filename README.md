# editzz

**Editor de vídeo e foto que roda inteiro no navegador** — sem conta, sem upload, sem servidor. Corte como num NLE,
corrija cor como no Lightroom, gere trilha como num estúdio e exporte o resultado em MP4/WebM, PNG, JPEG, WAV, SRT e VTT.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run typecheck
```

---

## Por que ele existe

O editzz nasceu de uma pesquisa com **17 editores de referência** — CapCut, Premiere Pro, DaVinci Resolve,
Final Cut Pro, After Effects, Photoshop, Lightroom, Snapseed, Picsart, Canva, InShot, VN, Alight Motion, KineMaster,
Filmora, Descript e Photoroom — incluindo os pagos. Cada recurso desses apps foi inventariado, agrupado e marcado com
o estado atual dentro do editzz (pronto / ferramenta própria / roadmap) em [src/data/research.ts](src/data/research.ts),
e a matriz completa pode ser navegada na aba **Recursos**.

Além do que já existe no mercado, o app traz **22 ferramentas autorais**, descritas mais abaixo.

---

## Recursos

### 🎬 Vídeo (timeline estilo NLE)

- **Timeline multifaixa** com vídeo, sobreposição (PIP), texto, áudio e camadas de ajuste; arraste entre faixas,
  apara nas bordas, ímã de encaixe, zoom, marcadores coloridos e menu de contexto.
- **Edição precisa**: dividir no playhead, duplicar, ripple delete, congelar quadro, entrada/saída (in/out),
  mover quadro a quadro e atalhos de teclado.
- **Velocidade 0,1×–8×** com 9 curvas (bullet time, momento heroico, corte seco, batida…), reverso e controle de
  curva por clipe.
- **~60 efeitos** em três camadas (pixel, desenho e movimento): blur, granulado, bloom, chromatic aberration, VHS,
  datamosh, glitch, cartoon, aquarela, halftone, ASCII, matrix rain e outros — com parâmetros ajustáveis por efeito.
- **~30 transições** (dissolve, zoom, wipe, glitch, film burn, light leak, glitch scan, whip pan, spin, VHS…)
  com prévia na faixa de transições e aplicação em todos os cortes.
- **~55 looks** organizados por grupo (cinema, filmes, preto e branco, vintage, vibrante, noite, estética, retrato)
  com intensidade ajustável.
- **Transformação completa**: posição, escala, rotação, espelhamento, opacidade, 16 modos de mistura, recorte (crop),
  máscaras (retângulo, círculo, triângulo, estrela, coração, persianas, diagonal, split, linear, radial) com inversão e suavidade.
- **Chroma key** com tolerância, suavidade, correção de spill e captura da cor diretamente do quadro.
- **Texto animado** com 12 fontes, gradiente, contorno, sombra, caixa de fundo, 18 animações (karaokê, máquina de
  escrever, neon piscando, glitch, onda…) e 12 predefinições prontas.
- **Formas e grafismos**: retângulo, elipse, triângulo, estrela, seta, coração, linha, anel, balão, botão de play,
  barras de áudio, progresso, contador, polaroid, moldura de celular e grade 3×3, além de 48 adesivos emoji.
- **Keyframes** para posição, escala, rotação, opacidade, volume e ajustes de cor, com 6 tipos de easing e editor visual.
- **Prévia** com controle de qualidade (35 %–100 %), terços, zonas seguras por plataforma (Reels, TikTok, Shorts),
  comparação antes/depois, tela cheia e volume do monitor.
- **Áudio na timeline**: waveform do clipe, fades, ducking, volume por clipe, marcadores de batida e mapa de energia.

### 🖼️ Foto (edição não destrutiva)

- **Receita de imagem**: rotação, espelhamento, endireitamento, perspectiva, corte, redimensionamento, ajustes de cor,
  curvas por canal, níveis, HSL por 8 faixas, grade de cor de três vias, looks, efeitos, molduras e marca d'água —
  tudo aplicável/trocável sem perder a foto original.
- **Curvas** desenhadas no gráfico (Catmull-Rom), histograma e níveis.
- **Pincéis de retoque**: reparar (heal), apagar com inpaint, clonar (Alt define origem), suavizar pele, clarear dentes,
  olhos vermelhos, iluminar, escurecer e três modos de liquify (empurrar, afinar, engordar).
- **Máscaras locais** lineares/radiais com exposição, brilho, contraste, saturação e temperatura próprios.
- **Remoção de fundo** automática (pelas bordas) ou por cor-chave (verde/azul), gerando um PNG transparente no acervo.
- **Camadas** de texto, forma, adesivo e imagem com posição, escala, rotação, opacidade e mistura.
- **Molduras** polaroid, filme 35 mm, cantos arredondados, dupla, cor sólida, sombra suave e moldura de celular.
- **Estúdio de arte**: pixel art, ASCII art, simulação de daltonismo, colagem em grade, paleta extraída da imagem.
- **Receitas portáveis** em `.editzz-photo.json` e leitura de EXIF.

### 🎵 Áudio

- **8 estilos musicais** compostos no navegador (lo-fi, trap, cinematográfico, chiptune, pop, corporativo, ambiente,
  suspense) com BPM e duração ajustáveis, exportáveis em WAV.
- **16 efeitos sonoros** sintetizados (whoosh, riser, braam, boing, trovão, aplausos…).
- **Tratamento de voz**: 10 predefinições (grave, robô, rádio, telefone, caverna, monstro, hélio, megafone…),
  afinador, redução de ruído, filtros passa-alta/baixa, normalização, compressor e reverb.
- **Análise**: detecção de batidas, mapa de energia, detector de silêncios, miniaturas e waveform.
- **Mixer** com fades, ducking automático da trilha quando há voz e captura para a exportação.

### 📦 Mídia e geração procedural

- **12 geradores** de vídeo e imagem — gradiente animado, partículas, contagem regressiva, cartão de texto, barras SMPTE,
  túnel neon, chuva de código, plasma, bokeh, ondas, grade técnica e textura de papel.
- Importação de vídeo/áudio/imagem, **gravação de microfone** e **gravação de tela**.
- Acervo com miniaturas, tamanho, duração, origem (arquivo, gerado, gravação) e persistência no IndexedDB.

### ⚡ Ferramentas próprias do editzz

| Ferramenta | O que faz |
| --- | --- |
| **Grade Inteligente** | Lê o histograma do quadro e corrige exposição, contraste e balanço de branco automaticamente. |
| **Realce IA local** | Nitidez com máscara + contraste local + redução de ruído, sem servidor. |
| **Estabilizador** | Mede o deslocamento entre quadros em 160×90 e aplica contra-movimento suavizado. |
| **Rastreador → keyframes** | Você marca o alvo; o editzz rastreia por correlação e gera keyframes (prende texto/adesivo no objeto). |
| **Corte na batida** | Detecta batidas da trilha e fatia os clipes exatamente nos marcadores. |
| **Remoção de silêncio** | Acha as pausas longas e reconstrói o clipe sem elas. |
| **Detector de cenas** | Divide o arquivo nos cortes existentes, gerando marcadores de cena. |
| **Auto-reframe** | Converte 16:9 em 9:16 seguindo a saliência do assunto com keyframes suavizados. |
| **Sugestor de cortes** | Combina picos de áudio e movimento para sugerir onde cortar. |
| **Paleta → legenda** | Extrai as cores dominantes do vídeo e aplica nas legendas. |
| **Zonas seguras** | Sobreposições das áreas cobertas pela interface de Reels, TikTok e Shorts. |
| **Mapa de energia** | Faixas de calor mostrando fala, silêncio e intensidade ao longo do tempo. |
| **Storyboard** | Folha de contato com 12 quadros numerados para revisão. |
| **Receitas de look** | Seus looks salvos viram `.editzz-look.json` para reutilizar e compartilhar. |
| **Estúdio de karaokê** | Cole a letra, sincronize por linha e destaque palavra por palavra. |
| **Kit de criador** | Exporta a mesma peça em 6 medidas sociais de uma vez. |
| **Leitor de EXIF** | Lê câmera, exposição, ISO, abertura e data do JPEG. |
| **Verificador de legibilidade** | Mede o contraste legenda × fundo e avisa quando fica abaixo de 4,5:1. |
| **Duplicar com receita** | Cria uma cópia do projeto inteiro com um novo look aplicado. |
| **Duplicar com receita** | (idem acima — atalho no painel Exportar) |

### 📤 Exportação

- **Vídeo**: MP4 (H.264) quando o navegador suporta, senão WebM — 8 predefinições (Reels, TikTok, YouTube 1080p60, 4K,
  feed quadrado, web leve, loop curto, podcast) com resolução, FPS e bitrate ajustáveis, além de exportar só o intervalo.
- **Imagem**: PNG (com transparência), JPEG e WebP com qualidade e tamanho máximo.
- **Áudio**: WAV.
- **Legendas**: SRT e VTT a partir dos clipes de texto.
- **Projeto**: `.editzz.json` portátil e salvamento no IndexedDB do navegador com autosave.

---

## Arquitetura

```
src/
├─ core/                 motores (sem UI)
│  ├─ model.ts           tipos do projeto: MediaAsset, Clip, Track, Project, Marker + factories
│  ├─ store.ts           store reativo global: undo/redo (80 passos), toasts, autosave, ações
│  ├─ transport.ts       relógio de reprodução isolado (evita re-render global)
│  ├─ media.ts           MediaPool: vídeo/imagem/AudioBuffer decodificados, thumbs, waveform, gravação
│  ├─ engine.ts          renderFrame(): compõe faixas, máscaras, chroma, texto, formas, transições
│  ├─ effects.ts         pipeline de cor (LUTs) + ~40 efeitos pixel + ~18 efeitos de desenho
│  ├─ imageops.ts        motor de foto: ImageRecipe, renderImage(), pincéis, fundo, molduras, EXIF
│  ├─ analysis.ts        cenas, rastreamento, estabilização, auto-reframe, sugestão de cortes
│  ├─ audio.ts           FFT, batidas, silêncio, energia, voz, música/SFX procedurais, mixer
│  ├─ captions.ts        VTT, leitura de legendas, roteiro → clipes de legenda
│  ├─ generate.ts        geradores procedurais de imagem/vídeo (MediaRecorder)
│  ├─ exporter.ts        VideoExporter (canvas + MediaRecorder), quadro, storyboard, SRT
│  └─ db.ts              IndexedDB (editzz-db): mídia e projetos
├─ components/ui.tsx     design system (botões, sliders, modais, toasts, tabs…)
├─ hooks/usePlayback.ts  loop de reprodução, áudio sincronizado e render em rAF
├─ lib/                  utilitários e catálogo central de presets
├─ data/research.ts      matriz de pesquisa (17 apps) + 22 ferramentas autorais
└─ views/
   ├─ inicio/            painel inicial, estatísticas e kit de criador
   ├─ video/             VideoStudio · Preview · Timeline · Inspector · MediaBin · ToolsPanel · ExportPanel
   ├─ foto/              PhotoStudio (não destrutivo, curvas, pincéis, camadas, arte)
   ├─ midia/             acervo + gerador procedural
   ├─ audio/             música, SFX, tratamento de voz e análise
   ├─ modelos/           12 modelos de projeto com receita de cor/som/título
   ├─ recursos/          navegador da pesquisa de mercado
   └─ ajuda/             atalhos, FAQ, desempenho e privacidade
```

**Como o vídeo é renderizado:** a cada quadro o `engine.ts` percorre as faixas visíveis, resolve o clipe ativo,
busca o quadro exato do vídeo (ou imagem/texto/forma), aplica transformação, recorte, máscara, chroma key e efeitos,
mistura a transição de entrada com o clipe anterior e, por fim, aplica as camadas de ajuste globais, fundo,
marca d'água e zonas seguras. A exportação roda o mesmo pipeline num canvas dedicado, com o áudio do mixer anexado ao
`MediaRecorder`.

---

## Atalhos

| Tecla | Ação |
| --- | --- |
| `Espaço` | reproduzir / pausar |
| `S` | dividir no playhead |
| `D` | duplicar seleção |
| `F` | congelar quadro |
| `M` | adicionar marcador |
| `←` `→` | mover um quadro (`Shift` = 1 s) |
| `Home` `End` | início / fim |
| `Ctrl+Z` / `Ctrl+Shift+Z` | desfazer / refazer |
| `Ctrl+S` | salvar no navegador |
| `1` `2` `3` `4` `0` | vídeo · foto · mídia · áudio · início |
| `[` `]` | tamanho do pincel (foto) |
| `B` / `C` | remendar / cortar (foto) |

---

## Limitações

- A exportação de vídeo usa `MediaRecorder` sobre `canvas.captureStream()`: **grava em tempo real** (1 min de vídeo leva
  ~1 min) e a aba precisa ficar visível. O formato depende do navegador (MP4 ou WebM).
- Recursos que dependem de modelos neurais de servidor (geração de vídeo por IA, upscale por difusão, remoção de
  objeto em vídeo) estão marcados como **roadmap** na aba Recursos — o editzz prioriza o que dá para fazer 100 % local.
- O reconhecimento de fala usa a Web Speech API do navegador (quando disponível); a transcrição por roteiro funciona em
  qualquer navegador.
- O acervo e os projetos ficam no IndexedDB: em janela anônima ou ao limpar os dados do site, eles são apagados.
  Use **Exportar → Projeto .json** para guardar uma cópia.

## Privacidade

Nenhum arquivo sai do seu dispositivo: a decodificação, os filtros, a mixagem, a gravação e o armazenamento acontecem
no próprio navegador (Canvas 2D, Web Audio e IndexedDB). Não há login, telemetria ou cookies de rastreamento.
