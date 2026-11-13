import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { store, useParallax } from "@/core/store";
import type { ModeId } from "@/core/types";

/* ───────────── botões ───────────── */

export function Btn({
  children,
  onClick,
  variant = "outline",
  size = "md",
  icon,
  active,
  disabled,
  title,
  className,
  full,
  type = "button",
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "soft" | "danger" | "gold" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  full?: boolean;
  type?: "button" | "submit";
}) {
  const sizes = {
    xs: "h-6 px-2 text-[10.5px] gap-1 rounded-md",
    sm: "h-7 px-2.5 text-[11.5px] gap-1.5 rounded-lg",
    md: "h-9 px-3.5 text-[12.5px] gap-2 rounded-xl",
    lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  };
  const variants = {
    primary: "bg-vio text-[#0a0d16] hover:bg-vio2 shadow-[0_1px_0_rgba(255,255,255,.25)_inset]",
    gold: "bg-gold text-[#1a1408] hover:bg-gold2 shadow-[0_1px_0_rgba(255,255,255,.3)_inset]",
    ghost: "text-dim hover:text-ink hover:bg-white/5",
    outline: "border border-line bg-panel2/80 text-ink hover:border-line2 hover:bg-panel3",
    soft: "bg-white/6 text-ink hover:bg-white/10 border border-white/8",
    danger: "border border-rose/40 bg-rose/12 text-rose hover:bg-rose/20",
    success: "border border-mint/40 bg-mint/12 text-mint hover:bg-mint/20",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex select-none items-center justify-center font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        sizes[size],
        variants[variant],
        active && "ring-1 ring-vio/60 bg-vio/15 text-ink",
        full && "w-full",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconBtn({
  children,
  onClick,
  title,
  active,
  className,
  size = "md",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-lg border border-transparent text-dim transition hover:bg-white/8 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "size-7" : "size-9",
        active && "border-vio/50 bg-vio/15 text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  title,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition",
        active
          ? "border-vio/60 bg-vio/18 text-ink"
          : "border-line bg-panel2/60 text-dim hover:border-line2 hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SiteBadge({ siteId, className }: { siteId: import("@/core/types").SiteId; className?: string }) {
  const site = SITE_META[siteId];
  return (
    <Badge color={site.accent} className={className}>
      {site.name}
    </Badge>
  );
}

export function Badge({ children, color = "#7c9cff", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider", className)}
      style={{ color, borderColor: `${color}44`, background: `${color}14` }}
    >
      {children}
    </span>
  );
}

/* ───────────── controles ───────────── */

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  unit,
  accent = "var(--app-accent)",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  unit?: string;
  accent?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[10.5px] font-medium text-dim">
          {label}
        </label>
        <span className="mono text-[10.5px] text-ink2">
          {format ? format(value) : value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="par-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent} ${pct}%, rgba(255,255,255,.08) ${pct}%)` }}
      />
      <style>{`.par-range::-webkit-slider-thumb{appearance:none;width:13px;height:13px;border-radius:50%;background:#eef1f7;border:2px solid ${accent};cursor:pointer}.par-range::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:#eef1f7;border:2px solid ${accent};cursor:pointer}`}</style>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/4"
    >
      <span className="min-w-0">
        <span className="block text-[11.5px] font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] leading-snug text-dim">{hint}</span>}
      </span>
      <span
        className={cn("relative h-4.5 w-8 shrink-0 rounded-full border transition-colors", checked ? "border-vio/60 bg-vio/70" : "border-line bg-panel3")}
        style={{ height: 18, width: 32 }}
      >
        <span
          className="absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 14 : 2 }}
        />
      </span>
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] leading-snug text-dim">{hint}</span>}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  className,
  onKeyDown,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "focus-ring h-9 w-full rounded-lg border border-line bg-night2 px-3 text-[12px] text-ink placeholder:text-faint",
        className
      )}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="focus-ring h-8 w-full appearance-none rounded-lg border border-line bg-night2 pl-2.5 pr-7 text-[11.5px] text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3.5 text-dim" />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-night2 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.hint}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[10.5px] font-medium transition",
            value === o.value ? "bg-panel3 text-ink shadow-sm" : "text-dim hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────── overlays ───────────── */

export function Tooltip({ label, children, side = "top" }: { label: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border border-line2 bg-[#0d1017] p-2.5 text-left text-[10.5px] font-normal leading-relaxed text-ink2 shadow-2xl",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 560,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{ width }}
            className="max-h-[88dvh] w-full max-w-full overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <h2 className="m-0 text-[14px] font-semibold text-ink">{title}</h2>
                {subtitle && <p className="m-0 mt-0.5 text-[10.5px] leading-snug text-dim">{subtitle}</p>}
              </div>
              <IconBtn size="sm" onClick={onClose} title="Fechar">
                <X className="size-3.5" />
              </IconBtn>
            </div>
            <div className="scroll-thin max-h-[calc(88dvh-108px)] overflow-y-auto p-4">{children}</div>
            {footer && <div className="border-t border-line px-4 py-2.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const { state, dispatch } = useParallax();
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timer = setTimeout(() => {
      const oldest = state.toasts[0];
      if (oldest) dispatch({ type: "dismissToast", id: oldest.id });
    }, 4600);
    return () => clearTimeout(timer);
  }, [state.toasts, dispatch]);

  const tones = {
    info: "border-line2 text-ink",
    ok: "border-mint/40 text-mint",
    warn: "border-gold/50 text-gold",
    bad: "border-rose/50 text-rose",
  } as const;

  return (
    <div className="pointer-events-none fixed bottom-10 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-1.5">
      <AnimatePresence>
        {state.toasts.slice(-3).map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className={cn(
              "pointer-events-auto flex max-w-[460px] items-start gap-2 rounded-xl border bg-[#0d1017]/95 px-3 py-2 shadow-2xl backdrop-blur",
              tones[t.tone]
            )}
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-white/10">
              <Check className="size-2.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-semibold">{t.title}</span>
              {t.detail && <span className="mt-0.5 block text-[10.5px] leading-snug text-dim">{t.detail}</span>}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: "dismissToast", id: t.id })}
              className="ml-1 rounded p-0.5 text-dim hover:bg-white/10 hover:text-ink"
              aria-label="Fechar aviso"
            >
              <X className="size-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── helpers visuais ───────────── */

export function Meter({ value, color = "var(--app-accent)", label, hint }: { value: number; color?: string; label?: string; hint?: string }) {
  return (
    <div>
      {(label || hint) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label && <span className="text-[10px] font-medium text-dim">{label}</span>}
          {hint && <span className="mono text-[10px] text-ink2">{hint}</span>}
        </div>
      )}
      <div className="meter">
        <i style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, background: color }} />
      </div>
    </div>
  );
}

export function SectionTitle({ icon, title, hint, right }: { icon?: ReactNode; title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line bg-panel2 text-dim">{icon}</span>}
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-ink2">{title}</h3>
          {hint && <p className="m-0 mt-0.5 text-[10px] leading-snug text-dim">{hint}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function ModeChip({ mode }: { mode: ModeId }) {
  const color = modeColor(mode);
  const label = modeLabel(mode);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      <i className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function ScoreBar({ value, max = 10, color = "#7ce0b1" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="mono text-[10px] text-ink2">{value.toFixed(1)}</span>
    </div>
  );
}

/** dispara um efeito de "reescrevendo" global por N ms */
export function flashRewrite(ms = 820) {
  document.documentElement.style.setProperty("--rewrite-flash", "1");
  window.setTimeout(() => document.documentElement.style.setProperty("--rewrite-flash", "0"), ms);
  store.dispatch({ type: "toast", title: "Motor reescrevendo", detail: "DOM re-renderizado localmente, sem rede.", tone: "info" });
}

export function useInterval(cb: () => void, ms: number | null) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export const MODE_META: Record<ModeId, { label: string; short: string; color: string; desc: string }> = {
  aprendizado: { label: "Aprendizado", short: "aprender", color: "#7c9cff", desc: "reescreve no seu nível, gera flashquiz e sumário de vídeo" },
  pesquisa: { label: "Pesquisa", short: "pesquisar", color: "#7ce0b1", desc: "layout uniforme, grafo de conceitos e citações ABNT/APA" },
  compra: { label: "Compra inteligente", short: "comprar", color: "#f0c987", desc: "preço real, reviews filtradas e dark patterns expostos" },
  foco: { label: "Foco absoluto", short: "focar", color: "#c7a6ff", desc: "suprime estímulo, suaviza abas e protege a tarefa" },
  calma: { label: "Calma", short: "calma", color: "#7fd1e8", desc: "dessatura, remove métricas de ansiedade e sugere pausa" },
};

export function modeColor(mode: ModeId) {
  return MODE_META[mode].color;
}
export function modeLabel(mode: ModeId) {
  return MODE_META[mode].label;
}

/** metadados mínimos de site para chips (evita import de dados em componentes visuais) */
const SITE_META: Record<import("@/core/types").SiteId, { name: string; accent: string }> = {
  wiki: { name: "Wikipédia", accent: "#3b6ea5" },
  devto: { name: "dev.to", accent: "#3b49df" },
  health: { name: "Clínica Aberta", accent: "#0f766e" },
  shop: { name: "MegaShop", accent: "#e11d48" },
  yt: { name: "YouTube", accent: "#ff0033" },
  news: { name: "Folha do Tempo", accent: "#b91c1c" },
};
