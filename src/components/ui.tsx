'use client';

import clsx from 'clsx';
import { Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export { clsx as cx };

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'vector';
type ButtonSize = 'sm' | 'md';

const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none';
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-core text-white hover:bg-[color-mix(in_srgb,var(--core)_88%,black)] dark:text-[#0d141b]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-muted',
  ghost: 'text-ink-2 hover:bg-muted hover:text-ink',
  danger: 'bg-surface text-danger border border-line-strong hover:bg-danger-soft hover:border-danger/40',
  vector: 'bg-vector text-white hover:bg-[color-mix(in_srgb,var(--vector)_88%,black)] dark:text-[#0d141b]',
};
const buttonSizes: Record<ButtonSize, string> = { sm: 'h-8 px-2.5 text-[13px]', md: 'h-9 px-3.5 text-sm' };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

/** A link styled as a button (never nest <Button> inside <Link>). */
export function ButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-muted hover:text-ink disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------
const control =
  'rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-core focus:outline-none focus:ring-2 focus:ring-core/20 disabled:bg-muted disabled:text-ink-3';

/** Full width unless the caller passes its own w-* class. */
const width = (className?: string) => (/(^|\s)w-/.test(className ?? '') ? undefined : 'w-full');

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={clsx(control, width(className), 'h-9', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={clsx(control, width(className), 'py-2 leading-relaxed', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={clsx(control, width(className), 'h-9 pr-8', className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type Tone = 'neutral' | 'core' | 'vector' | 'ref' | 'audit' | 'danger' | 'warn' | 'ok';
const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-ink-2 border-line',
  core: 'bg-core-soft text-core border-core/20',
  vector: 'bg-vector-soft text-vector border-vector/20',
  ref: 'bg-ref-soft text-ref border-ref/20',
  audit: 'bg-audit-soft text-audit border-audit/20',
  danger: 'bg-danger-soft text-danger border-danger/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  ok: 'bg-ok-soft text-ok border-ok/25',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  scheduled: 'core',
  completed: 'ok',
  cancelled: 'neutral',
  no_show: 'warn',
  normal: 'ok',
  abnormal: 'warn',
  critical: 'danger',
  minor: 'neutral',
  moderate: 'warn',
  severe: 'danger',
  resolved: 'ok',
  improving: 'ok',
  unchanged: 'neutral',
  referred: 'warn',
  admitted: 'danger',
  INSERT: 'ok',
  UPDATE: 'audit',
  DELETE: 'danger',
  admin: 'audit',
  doctor: 'core',
  patient: 'ref',
};
const statusLabel: Record<string, string> = { no_show: 'No-show' };

export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  if (!status) return null;
  const label = statusLabel[status] ?? (status === status.toUpperCase() ? status : status[0].toUpperCase() + status.slice(1));
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} className={className}>
      {label}
    </Badge>
  );
}

/** Horizontal meter for a cosine similarity in [0, 1]. */
export function SimilarityBar({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className="text-xs text-ink-3">keyword only</span>;
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <span className={clsx('inline-flex items-center gap-2', className)} title={`Cosine similarity ${value.toFixed(3)}`}>
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-vector-soft">
        <span className="absolute inset-y-0 left-0 rounded-full bg-vector" style={{ width: `${pct}%` }} />
      </span>
      <span className="num font-mono text-xs text-vector">{value.toFixed(2)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-[70ch] text-[15px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={clsx('rounded-xl border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  const bar: Record<Tone, string> = {
    neutral: 'bg-line-strong',
    core: 'bg-core',
    vector: 'bg-vector',
    ref: 'bg-ref',
    audit: 'bg-audit',
    danger: 'bg-danger',
    warn: 'bg-warn',
    ok: 'bg-ok',
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface px-4 py-3.5">
      <span className={clsx('absolute inset-y-3 left-0 w-[3px] rounded-r', bar[tone])} aria-hidden />
      <div className="text-[13px] text-ink-3">{label}</div>
      <div className="num mt-0.5 text-[26px] leading-tight font-bold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-muted', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('size-4 animate-spin text-ink-3', className)} aria-label="Loading" />;
}

export function Empty({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 text-ink-3">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-[48ch] text-sm text-ink-3">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line-strong bg-surface px-1.5 py-px font-mono text-[11px] text-ink-3">
      {children}
    </kbd>
  );
}

export function Avatar({ name, tone = 'core', size = 'md' }: { name: string; tone?: Tone; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-base' };
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full border font-bold', tones[tone], sizes[size])}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** Pill-style single choice, used for filters and mode switches. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx('inline-flex rounded-lg border border-line bg-muted p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1 text-[13px] font-semibold transition-colors',
            value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div role="tablist" className={clsx('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            '-mb-px border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
            value === t.value ? 'border-core text-ink' : 'border-transparent text-ink-3 hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className="num ml-1.5 text-xs font-normal text-ink-3">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
/** Overlays render into document.body, which only exists after mount (not during SSR). */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEscape(open, onClose);
  const mounted = useMounted();
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-[10vh]">
      <div className="fixed inset-0 bg-[#0a1118]/45 animate-[fade-in_150ms_ease-out]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative w-full rounded-xl border border-line bg-surface shadow-pop animate-[pop-in_180ms_ease-out]',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEscape(open, onClose);
  const mounted = useMounted();
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#0a1118]/35 animate-[fade-in_150ms_ease-out]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={clsx(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-pop animate-[drawer-in_200ms_ease-out]',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-ink-3">{subtitle}</div>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export const table = {
  wrap: 'overflow-x-auto',
  table: 'w-full border-collapse text-sm',
  th: 'border-b border-line px-4 py-2.5 text-left text-[12px] font-semibold text-ink-3 whitespace-nowrap',
  td: 'border-b border-line px-4 py-3 align-middle',
  row: 'transition-colors hover:bg-muted/70',
};
