import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type ValueChange = { onChange?: (e: { target: { value: string } }) => void };

// ---- Button -----------------------------------------------------------------
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-[15px]",
  };
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-lift",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    dark: "bg-ink-900 text-white hover:bg-ink-800",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...props} />;
}

// ---- Card -------------------------------------------------------------------
export function Card({
  className,
  hover,
  children,
  ...rest
}: { className?: string; hover?: boolean; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-slate-200/80 bg-white shadow-card",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("p-5 sm:p-6", className)}>{children}</div>;
}

// ---- KPI stat ---------------------------------------------------------------
export function Stat({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  delta?: { value: string; up?: boolean };
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card hover>
      <CardBody className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          {icon && <span className="text-brand-500">{icon}</span>}
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {delta && (
            <span className={cx("font-semibold", delta.up ? "text-emerald-600" : "text-rose-600")}>
              {delta.up ? "↑" : "↓"} {delta.value}
            </span>
          )}
          {hint && <span className="text-slate-400">{hint}</span>}
        </div>
      </CardBody>
    </Card>
  );
}

// ---- Badge ------------------------------------------------------------------
const tones: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  BETA: "bg-amber-50 text-amber-700 ring-amber-600/20",
  DEPRECATED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  SUSPENDED: "bg-orange-50 text-orange-700 ring-orange-600/20",
  REVOKED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  gold: "bg-amber-50 text-amber-700 ring-amber-600/20",
  silver: "bg-slate-100 text-slate-600 ring-slate-500/20",
  bronze: "bg-orange-50 text-orange-700 ring-orange-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  // `info` is reserved for protocol / role markers (e.g. the MCP badge on
  // Model Context Protocol products) — a calm blue so it doesn't compete
  // visually with the green/amber/red status palette above.
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const cls = (tone && tones[tone]) || "bg-brand-50 text-brand-700 ring-brand-600/20";
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", cls)}>
      {children}
    </span>
  );
}

// ---- Form controls ----------------------------------------------------------
const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function Input(props: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & ValueChange) {
  return <input className={fieldCls} {...props} />;
}
export function Textarea(props: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & ValueChange) {
  return <textarea className={fieldCls} {...props} />;
}
export function Select(props: Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & ValueChange) {
  return <select className={cx(fieldCls, "appearance-none bg-no-repeat")} {...props} />;
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// ---- States -----------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">{icon}</div>
      )}
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-xl", className)} />;
}

// ---- Progress ring ----------------------------------------------------------
export function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const off = c - (pct / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)" }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d5efc" />
            <stop offset="100%" stopColor="#9b5cff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{label}</div>
    </div>
  );
}

// ---- Section heading --------------------------------------------------------
export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---- Tabs -------------------------------------------------------------------
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 scroll-thin">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cx(
            "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
            active === t ? "text-brand-700" : "text-slate-500 hover:text-slate-700",
          )}
        >
          {t}
          {active === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />}
        </button>
      ))}
    </div>
  );
}
