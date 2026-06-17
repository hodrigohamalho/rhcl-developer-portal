import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import {
  BookOpen,
  Boxes,
  GaugeCircle,
  KeyRound,
  LayoutGrid,
  LogOut,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { usePortalAuth } from "../auth/auth";

const navItems = [
  { to: "/catalog", label: "API Catalog", icon: LayoutGrid },
  { to: "/applications", label: "My Applications", icon: Boxes },
  { to: "/subscriptions", label: "My Subscriptions", icon: KeyRound },
  { to: "/usage", label: "Usage Dashboard", icon: GaugeCircle },
];

const adminItems = [
  { to: "/admin/apis", label: "APIs", icon: Layers },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: ShieldCheck },
  { to: "/admin/plans", label: "Plans", icon: BookOpen },
];

export default function Layout({ children }: { children: ReactNode }) {
  const auth = usePortalAuth();
  const navigate = useNavigate();
  const isAdmin = auth.roles.includes("api-admin") || auth.roles.includes("api-owner");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div
          className="hero-gradient flex h-16 cursor-pointer items-center gap-2 px-5 text-white"
          onClick={() => navigate("/catalog")}
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 font-bold">A</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">API Portal</div>
            <div className="text-[11px] text-white/70">Connectivity Link</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((it) => (
            <NavItem key={it.to} {...it} />
          ))}

          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Administration
              </div>
              {adminItems.map((it) => (
                <NavItem key={it.to} to={`${it.to}`} label={it.label} icon={it.icon} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
              {(auth.username ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{auth.username}</div>
              <div className="truncate text-xs text-slate-500">{auth.email ?? "developer"}</div>
            </div>
            {auth.enabled && (
              <button onClick={auth.logout} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" title="Sign out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutGrid }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
