import { BookOpen, Cpu, HardDrive, Keyboard, LifeBuoy, Shield, Sparkles, TriangleAlert, Zap } from "lucide-react";
import { Section } from "@/components/ui";

const SHORTCUTS: [string, string][] = [
  ["Espaço", "Reproduzir / pausar"],
  ["S", "Dividir no playhead"],
  ["D", "Duplicar seleção"],
  ["F", "Congelar quadro atual"],
  ["M", "Adicionar marcador"],
  ["Delete / Backspace", "Apagar clipes selecionados"],
  ["← →", "Mover um quadro"],
  ["Shift + ← →", "Mover um segundo"],
  ["Home / End", "Ir ao início / fim"],
  ["Ctrl + Z", "Desfazer"],
  ["Ctrl + Shift + Z", "Refazer"],
  ["Ctrl + S", "Salvar projeto no navegador"],
  ["[ e ]", "Diminuir / aumentar o pincel (foto)"],
  ["B (foto)", "Ferramenta remendar"],
  ["C (foto)", "Ferramenta cortar"],
  ["Esc", "Cancelar seleção de corte"],
];

export default function Help() {
  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto p-3">
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-vio" />
            <div>
              <h1 className="font-display text-lg font-semibold text-ink">Ajuda e atalhos</h1>
              <p className="text-[11.5px] text-muted">
                O editzz funciona inteiro no seu navegador: nada de upload, nada de conta. Estas são as teclas e os
                truques que deixam a edição rápida.
              </p>
            </div>
          </div>
        </div>

        <Section title="Atalhos de teclado" icon={<Keyboard className="size-3.5 text-cy" />} defaultOpen>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SHORTCUTS.map(([key, what]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-panel2/40 px-2 py-1.5">
                <span className="rounded border border-line bg-bg2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink">{key}</span>
                <span className="text-[11px] text-muted">{what}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Perguntas frequentes" icon={<BookOpen className="size-3.5 text-amber" />} defaultOpen>
          <div className="space-y-2 text-[11.5px] leading-relaxed text-muted">
            {[
              ["Meus arquivos vão para algum servidor?", "Não. Todo o processamento (decodificação, filtros, mixagem, gravação) acontece na memória do navegador, com Canvas 2D, Web Audio e IndexedDB."],
              ["Como o projeto é salvo?", "Automaticamente a cada alteração, no IndexedDB do navegador (aba Exportar → Salvar no navegador). Você também pode baixar o arquivo .editzz.json e reabrir em outro computador."],
              ["A exportação é mais lenta que o tempo real?", "A gravação usa MediaRecorder sobre o canvas em tempo real: um vídeo de 1 minuto leva cerca de 1 minuto. Mantenha a aba em primeiro plano durante a gravação."],
              ["Por que meu vídeo exportou em WebM?", "Alguns navegadores não têm codificador H.264. O editzz escolhe automaticamente entre MP4 e WebM; o painel de exportação mostra o que está disponível."],
              ["Preciso instalar algo?", "Não. Mas o áudio e a gravação de tela exigem permissão do navegador, e o IndexedDB não guarda arquivos se você usar janela anônima."],
              ["Como faço legendas automáticas?", "Vídeo → Ferramentas → Legendas automáticas: o projeto toca o áudio e o reconhecedor de fala do navegador transcreve em português. Você também pode colar um roteiro e gerar legendas sincronizadas."],
              ["O que é uma ferramenta autoral?", "É recurso que não existe (ou existe de forma limitada) nos editores de referência e foi criado para o editzz: Grade Inteligente, estabilizador por análise de movimento, rastreio de objeto → keyframes, corte na batida, auto-reframe por saliência, entre outras."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl border border-line bg-panel2/40 p-2.5">
                <p className="flex items-start gap-1.5 text-[11.5px] font-medium text-ink">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-vio" />
                  {q}
                </p>
                <p className="mt-1 pl-5">{a}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Desempenho" icon={<Zap className="size-3.5 text-lime" />} defaultOpen={false}>
          <div className="space-y-2 text-[11.5px] leading-relaxed text-muted">
            <p className="flex gap-2">
              <Cpu className="mt-0.5 size-4 shrink-0 text-cy" />
              A prévia é renderizada na resolução do projeto multiplicada por um fator de qualidade. Em máquinas mais
              simples, use “Prévia equilibrada” (50%) no seletor acima do quadro.
            </p>
            <p className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" />
              Vídeos 4K com muitas camadas, efeitos de pixel (grão, bloom, chromatic) e máscaras pesam mais. Desligue os
              efeitos que não estiver usando no painel de efeitos do clipe.
            </p>
            <p className="flex gap-2">
              <HardDrive className="mt-0.5 size-4 shrink-0 text-vio" />
              Mídias ficam em memória durante a sessão. Libs grandes podem ser removidas do acervo (Mídia → ×) para
              liberar RAM; os clipes continuam na timeline se você reimportar depois.
            </p>
          </div>
        </Section>

        <Section title="Privacidade" icon={<Shield className="size-3.5 text-emerald" />} defaultOpen={false}>
          <p className="text-[11.5px] leading-relaxed text-muted">
            O editzz não envia arquivos, não usa cookies de rastreamento e não pede login. O acesso ao microfone só
            acontece quando você clica em Gravar, e o áudio capturado fica no acervo do próprio navegador. Você pode
            apagar tudo a qualquer momento em Mídia → Limpar acervo e na lista de projeto salvos.
          </p>
        </Section>

        <Section title="Sobre o editzz" icon={<Sparkles className="size-3.5 text-pink" />} defaultOpen={false}>
          <p className="text-[11.5px] leading-relaxed text-muted">
            O editzz nasceu de uma pesquisa com os editores mais usados do mundo — CapCut, Premiere Pro, DaVinci
            Resolve, Final Cut Pro, After Effects, Photoshop, Lightroom, Snapseed, Picsart, Canva, InShot, VN, Alight
            Motion, KineMaster, Filmora, Descript e Photoroom — e da vontade de ter tudo isso sem instalar nada.
          </p>
          <p className="text-[11.5px] leading-relaxed text-muted">
            Além dos recursos consagrados, o app traz ferramentas próprias: Grade Inteligente, restaurador de nitidez,
            estabilizador por análise de movimento, rastreio de objeto que gera keyframes, corte na batida, remoção de
            silêncio, detector de cenas, auto-reframe por saliência, sugestor de cortes, paleta aplicada às legendas,
            zonas seguras por plataforma, gerador de mídia procedural, estúdio de música, banco de SFX, mapa de energia,
            storyboard, receitas de look portáveis, estúdio de karaokê, kit de criador, leitor de EXIF e verificador de
            legibilidade.
          </p>
          <p className="text-[10.5px] text-dim">
            Versão de estúdio · processamento local · Canvas 2D + Web Audio + IndexedDB + MediaRecorder.
          </p>
        </Section>
      </div>
    </div>
  );
}
