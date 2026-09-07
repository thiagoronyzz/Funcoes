import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  SquarePlus,
  X,
} from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { cn } from "../utils/cn";

/* ─────────────────────────────────────────────────────────
   Botão "Baixar app"
   ───────────────────────────────────────────────────────── */

interface BotaoProps {
  variante?: "primario" | "escuro" | "claro" | "compacto";
  className?: string;
  rotulo?: string;
}

const estilos: Record<NonNullable<BotaoProps["variante"]>, string> = {
  primario:
    "bg-brand-600 text-white shadow-[0_20px_44px_-14px_rgba(10,61,255,0.6)] hover:bg-ink px-7 py-4 text-sm",
  escuro: "bg-ink text-white hover:bg-brand-600 px-5 py-2.5 text-sm",
  claro:
    "bg-white text-ink ring-1 ring-ink/15 hover:ring-brand-600/40 px-6 py-4 text-sm",
  compacto: "bg-brand-600 text-white hover:bg-ink px-4 py-2 text-xs",
};

export function BotaoBaixarApp({
  variante = "escuro",
  className,
  rotulo = "Baixar app",
}: BotaoProps) {
  const { podeInstalar, instalado, plataforma, instalar } = usePwaInstall();
  const [modal, setModal] = useState(false);

  if (instalado) return null;

  const aoClicar = async () => {
    const r = await instalar();
    // sem instalador nativo (iOS, Firefox…) → mostra o passo a passo
    if (r === "indisponivel") setModal(true);
  };

  return (
    <>
      <button
        onClick={aoClicar}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full font-display font-semibold transition-all duration-300",
          estilos[variante],
          className
        )}
      >
        <Download className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
        {rotulo}
        {!podeInstalar && plataforma === "ios" && (
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
            iOS
          </span>
        )}
      </button>

      <ModalComoInstalar aberto={modal} fechar={() => setModal(false)} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Modal com o passo a passo por plataforma
   ───────────────────────────────────────────────────────── */

function ModalComoInstalar({
  aberto,
  fechar,
}: {
  aberto: boolean;
  fechar: () => void;
}) {
  const { plataforma } = usePwaInstall();

  const passos =
    plataforma === "ios"
      ? [
          { icone: Share, texto: "Toque no botão Compartilhar do Safari" },
          { icone: SquarePlus, texto: 'Escolha "Adicionar à Tela de Início"' },
          { icone: Check, texto: 'Confirme em "Adicionar" — pronto!' },
        ]
      : plataforma === "android"
        ? [
            { icone: MoreVertical, texto: "Abra o menu ⋮ do navegador" },
            { icone: SquarePlus, texto: 'Toque em "Instalar app" ou "Adicionar à tela inicial"' },
            { icone: Check, texto: "Confirme e o ícone aparece no celular" },
          ]
        : [
            { icone: MoreVertical, texto: "Abra o menu do navegador (⋮)" },
            { icone: SquarePlus, texto: 'Clique em "Instalar RONYCODE"' },
            { icone: Check, texto: "O app abre em janela própria" },
          ];

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-end bg-ink/60 backdrop-blur-sm p-0 sm:place-items-center sm:p-6"
          onClick={fechar}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-600 text-white">
                  <Smartphone className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    Instalar RONYCODE
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                    {plataforma === "ios"
                      ? "iPhone / iPad"
                      : plataforma === "android"
                        ? "Android"
                        : "Computador"}
                  </p>
                </div>
              </div>
              <button
                onClick={fechar}
                aria-label="Fechar"
                className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-ink/10 transition-colors hover:bg-brand-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <ol className="space-y-3">
              {passos.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-ink/10">
                    <p.icone className="size-4" />
                  </span>
                  <span className="text-sm text-ink/75">{p.texto}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink/30">
                    0{i + 1}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-xs leading-relaxed text-ink/50">
              O app usa nada de loja: ele é instalado direto pelo navegador,
              ocupa poucos KB, abre em tela cheia e os aplicativos já visitados
              continuam funcionando sem internet.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Faixa fixa no rodapé do celular
   ───────────────────────────────────────────────────────── */

export function BarraInstalarMobile() {
  const { instalado } = usePwaInstall();
  const [fechado, setFechado] = useState(false);

  if (instalado || fechado) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 90, opacity: 0 }}
        transition={{ duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-3 bottom-3 z-[90] flex items-center gap-3 rounded-2xl bg-ink/95 px-4 py-3 text-white shadow-[0_20px_50px_-12px_rgba(6,11,36,0.55)] backdrop-blur-xl md:hidden"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold leading-tight">
            Leve a RONYCODE no bolso
          </p>
          <p className="truncate text-[11px] text-white/55">
            Instale o app e use até offline
          </p>
        </div>
        <BotaoBaixarApp variante="compacto" rotulo="Instalar" />
        <button
          onClick={() => setFechado(true)}
          aria-label="Dispensar"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-white/50 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
