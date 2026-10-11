import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { store, useEditzz } from "@/core/store";

/* ───────────── botões ───────────── */

type BtnVariant = "primary" | "ghost" | "outline" | "soft" | "danger" | "success";

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
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  full?: boolean;
}) {
  const sizes = {
    xs: "h-6 px-2 text-[10.5px] gap-1 rounded-md",
    sm: "h-7 px-2.5 text-[11.5px] gap-1.5 rounded-lg",
    md: "h-9 px-3.5 text-[12.5px] gap-2 rounded-xl",
    lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  };
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-vio text-[#1d1a16] shadow-sm hover:bg-vio2",
    ghost: "text-muted hover:text-ink hover:bg-white/5",
    outline: "border border-line bg-panel2/80 text-ink hover:border-line2 hover:bg-panel3",
    soft: "bg-white/6 text-ink hover:bg-white/10 border border-white/8",
    danger: "border border-rose/40 bg-rose/12 text-rose hover:bg-rose/20",
    success: "border border-emerald/40 bg-emerald/12 text-emerald hover:bg-emerald/20",
  };
  return (
    <button
      type="button"
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
        "focus-ring inline-flex items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40 border border-transparent text-muted transition hover:bg-white/8 hover:text-ink",
        size === "sm" ? "size-7" : "size-9",
        active && "border-vio/50 bg-vio/15 text-ink",
        className
      )}
    >
      {children}
    </button>
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
  onReset,
  format,
  unit,
  accent = "var(--app-accent)",
  compact,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onReset?: () => void;
  format?: (v: number) => string;
  unit?: string;
  accent?: string;
  compact?: boolean;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("group", compact ? "space-y-1" : "space-y-1.5")}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-medium tracking-wide text-muted">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10.5px] tabular-nums text-ink/80">
            {format ? format(value) : value.toFixed(step < 1 ? 2 : 0)}
            {unit}
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Redefinir"
              className="opacity-0 transition group-hover:opacity-100"
            >
              <RotateCcw className="size-3 text-dim hover:text-ink" />
            </button>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(90deg, ${accent} ${pct}%, #343b3e ${pct}%)`,
          borderRadius: 999,
          height: 4,
          marginTop: 6,
          marginBottom: 6,
        }}
      />
    </div>
  );
}

export function NumField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  className,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      <div className="flex items-center rounded-lg border border-line bg-bg2/70 px-2 focus-within:border-vio/60">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="h-8 w-full bg-transparent font-mono text-[12px] text-ink outline-none"
        />
        {unit && <span className="pl-1 text-[10px] text-dim">{unit}</span>}
      </div>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  className,
  mono,
  textarea,
  rows = 3,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  mono?: boolean;
  textarea?: boolean;
  rows?: number;
}) {
  const base = cn(
    "w-full rounded-lg border border-line bg-bg2/70 px-2.5 py-2 text-[12px] text-ink outline-none transition placeholder:text-dim focus:border-vio/60",
    mono && "font-mono"
  );
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      {textarea ? (
        <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn(base, "resize-y")} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={base} />
      )}
    </label>
  );
}

export function Sel<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  compact,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            "w-full appearance-none rounded-lg border border-line bg-bg2/70 pr-7 text-[12px] text-ink outline-none transition focus:border-vio/60",
            compact ? "h-7 pl-2" : "h-9 pl-2.5"
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-panel2 text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-dim" />
      </div>
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-[11px] font-medium text-muted">{label}</span>}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-bg2/70 px-2 py-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 rounded-md" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-[11px] uppercase text-ink outline-none"
        />
      </div>
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left transition hover:bg-white/4"
    >
      <span className="min-w-0">
        <span className="block text-[12px] text-ink">{label}</span>
        {hint && <span className="block text-[10.5px] text-dim">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-4.5 w-8 shrink-0 rounded-full border transition",
          checked ? "border-vio/60 bg-vio/70" : "border-line bg-bg2"
        )}
        style={{ height: 18, width: 32 }}
      >
        <span
          className={cn("absolute top-0.5 size-3.5 rounded-full bg-white transition-all", checked ? "left-4" : "left-0.5")}
        />
      </span>
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  color,
  className,
  title,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
        active
          ? "border-vio/60 bg-vio/18 text-[#1d1a16]"
          : "border-line bg-panel2/60 text-muted hover:border-line2 hover:text-ink",
        className
      )}
      style={color && active ? { borderColor: color, background: `${color}22`, color: "#fff" } : undefined}
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1 rounded-xl border border-line bg-bg2/50 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "focus-ring inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition",
            value === t.id ? "bg-vio text-[#1d1a16] shadow-sm" : "text-muted hover:bg-white/6 hover:text-ink"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  children,
  right,
  icon,
  defaultOpen = true,
  dense,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  dense?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/70 last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="focus-ring flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn("size-3.5 shrink-0 text-dim transition", !open && "-rotate-90")} />
          {icon}
          <span className="truncate font-display text-[12.5px] font-semibold tracking-wide text-ink">{title}</span>
        </button>
        {right}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className={cn("space-y-3 px-3", dense ? "pb-2.5" : "pb-4")}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl",
              wide ? "max-w-4xl" : "max-w-lg"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
              <IconBtn onClick={onClose} title="Fechar">
                <X className="size-4" />
              </IconBtn>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-bg2/40 px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-bg2", className)}>
      <div
        className="h-full rounded-full transition-all duration-200"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color ?? "var(--app-accent)" }}
      />
    </div>
  );
}

export function Badge({ children, color = "#d7a45a", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", className)}
      style={{ borderColor: `${color}55`, background: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

export function Toasts() {
  const { state, store: s } = useEditzz();
  const tones: Record<string, string> = {
    info: "#78aaa5",
    ok: "#34d399",
    warn: "#fbbf24",
    erro: "#fb7185",
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {state.toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            onClick={() => s.dismissToast(t.id)}
            className="pointer-events-auto cursor-pointer overflow-hidden rounded-xl border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: tones[t.kind] ?? "#d7a45a" }} />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[11px] leading-snug text-muted">{t.desc}</p>}
              </div>
            </div>
            <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-bg2">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: 0 }}
                transition={{ duration: 4.2, ease: "linear" }}
                className="h-full"
                style={{ background: tones[t.kind] ?? "#d7a45a" }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-bg2/40 px-6 py-10 text-center">
      {icon && <div className="text-dim">{icon}</div>}
      <div>
        <p className="font-display text-[13.5px] font-semibold text-ink">{title}</p>
        {desc && <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-muted">
      <span className="size-3 animate-spin rounded-full border-2 border-vio border-t-transparent" />
      {label}
    </div>
  );
}

export function toast(title: string, desc?: string, kind?: "info" | "ok" | "warn" | "erro") {
  store.toast(title, desc, kind);
}
