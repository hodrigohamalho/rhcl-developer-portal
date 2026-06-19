import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  KeyRound,
  Boxes,
  PackageCheck,
  Activity,
  Gauge,
  LogIn,
  Send,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useApis, useProfile, useUsage } from "../api/hooks";
import { usePortalAuth } from "../auth/auth";
import { useTenant } from "../hooks/useTenant";
import { PageHeader } from "../components/AppShell";
import PendingApprovalsBanner from "../components/PendingApprovalsBanner";
import { Badge, Button, Card, CardBody, ProgressRing, SectionHeading, Skeleton, Stat } from "../components/ui";
import { productVisual } from "../lib/products";
import type { ApiProduct } from "../api/types";
import { compact, timeAgo } from "../lib/format";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const auth = usePortalAuth();

  if (!auth.isAuthenticated) return <PublicHome />;
  return <MemberHome />;
}

function MemberHome() {
  const auth = usePortalAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: pl } = useProfile();
  const { data: products } = useApis();

  const approved = (profile?.subscriptions ?? []).filter((s) => s.status === "APPROVED");
  const { data: usage } = useUsage(approved[0]?.id, 7);

  const steps = [
    { label: "Account created", done: true },
    { label: "Application created", done: (profile?.applications.length ?? 0) > 0 },
    { label: "Subscription approved", done: approved.length > 0 },
    { label: "First API call", done: (usage?.totalRequests ?? 0) > 0 },
  ];
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  const activeProducts = new Set(approved.map((s) => s.apiProductId)).size;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${profile?.displayName?.split(" ")[0] ?? auth.username ?? "there"}`}
        emoji="👋"
        subtitle="Build, secure and consume APIs at scale."
      />

      <PendingApprovalsBanner />

      {/* Onboarding + KPIs */}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_2fr]">
        <Card className="animate-fade-up">
          <CardBody className="flex items-center gap-6">
            <ProgressRing
              value={pct}
              label={
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{pct}%</div>
                  <div className="text-[11px] font-medium text-slate-400">Complete</div>
                </div>
              }
            />
            <div className="flex-1">
              <div className="mb-2 text-sm font-semibold text-slate-700">Your onboarding</div>
              <ul className="space-y-1.5">
                {steps.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-sm">
                    {s.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Circle size={16} className="text-slate-300" />
                    )}
                    <span className={s.done ? "text-slate-700" : "text-slate-400"}>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Link to="/applications" className="block">
            <Stat label="Applications" value={profile?.applications.length ?? 0} icon={<Boxes size={18} />} hint="View all →" />
          </Link>
          <Link to="/products" className="block">
            <Stat label="Active Products" value={activeProducts} icon={<PackageCheck size={18} />} hint="View all →" />
          </Link>
          <Link to="/analytics" className="block">
            <Stat
              label="Quota Used"
              value={usage ? `${Math.round(usage.usagePercent)}%` : "—"}
              icon={<Gauge size={18} />}
              hint="Analytics →"
            />
          </Link>
          <Link to="/analytics" className="block">
            <Stat
              label="Total Requests"
              value={usage ? compact(usage.totalRequests) : "—"}
              icon={<Activity size={18} />}
              delta={usage ? { value: "this month", up: true } : undefined}
            />
          </Link>
        </div>
      </div>

      {/* Featured products */}
      <div className="mt-9">
        <SectionHeading
          title="Featured products"
          subtitle="Explore our most popular API products"
          action={
            <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
              View all products →
            </Link>
          }
        />
        {!products ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((p) => {
              const { Icon, tile } = productVisual(`${p.name} ${p.tags?.join(" ")}`);
              return (
                <Link key={p.id} to={`/products/${p.id}`} className="block">
                  <Card hover className="h-full animate-fade-up">
                    <CardBody>
                      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${tile}`}>
                        <Icon size={22} />
                      </div>
                      <h3 className="font-bold text-slate-900">{p.displayName}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{p.version} · REST</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                          Explore <ArrowRight size={14} />
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick start + recent activity */}
      <div className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <QuickStart products={products ?? []} />
        <RecentActivity profile={profile} loading={pl} />
      </div>
    </>
  );
}

function QuickStart({ products }: { products: { id: number; displayName: string; baseUrl: string }[] }) {
  const navigate = useNavigate();
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  const product = products[sel];
  const base = product?.baseUrl ?? "https://sandbox.api.example.com";
  const curl = `curl ${base}/accounts/summary \\\n  -H "X-API-Key: sk_test_••••••••" \\\n  -H "Content-Type: application/json"`;
  return (
    <Card className="overflow-hidden">
      <CardBody>
        <SectionHeading title="Quick start" subtitle="Try an API in seconds with our sandbox" />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sel}
            onChange={(e) => setSel(Number((e.target as HTMLSelectElement).value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {products.map((p, i) => (
              <option key={p.id} value={i}>
                {p.displayName}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => product && navigate(`/products/${product.id}/subscribe`)}
            disabled={!product}
          >
            <KeyRound size={14} /> Generate sandbox key
          </Button>
        </div>
        <div className="relative mt-4 rounded-xl bg-ink-900 p-4">
          <button
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            onClick={() => {
              navigator.clipboard.writeText(curl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-emerald-200 scroll-thin">
            {curl}
          </pre>
        </div>
        <p className="mt-3 text-xs text-slate-400">Goal: time-to-first-call under 2 minutes.</p>
      </CardBody>
    </Card>
  );
}

function RecentActivity({
  profile,
  loading,
}: {
  profile: { subscriptions: { apiProductName: string; status: string; createdAt: string; approvedAt: string | null }[] } | undefined;
  loading: boolean;
}) {
  const items = useMemo(() => {
    const subs = profile?.subscriptions ?? [];
    const ev: { text: string; at: string; icon: typeof Send }[] = [];
    for (const s of subs) {
      ev.push({ text: `Subscription to ${s.apiProductName} requested`, at: s.createdAt, icon: Send });
      if (s.approvedAt) ev.push({ text: `${s.apiProductName} access approved · key issued`, at: s.approvedAt, icon: KeyRound });
    }
    return ev.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [profile]);

  return (
    <Card>
      <CardBody>
        <SectionHeading title="Recent activity" />
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No activity yet — subscribe to a product to get started.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <it.icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">{it.text}</p>
                  <p className="text-xs text-slate-400">{timeAgo(it.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Badge tone="neutral">live</Badge>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Anonymous landing — browse APIs and docs without signing in. Sign-in is
// only requested when the visitor actually wants to consume (subscribe / get
// an API key). Keeps the discovery loop open to the wider audience.
// ---------------------------------------------------------------------------
function PublicHome() {
  const auth = usePortalAuth();
  const { data: products } = useApis();
  const tenant = useTenant();

  return (
    <>
      <Card className="hero-sheen animate-fade-up overflow-hidden">
        <CardBody className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Badge tone="neutral">Developer Portal</Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Discover and consume {tenant.name} APIs
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-slate-600">
              Browse our API catalogue, read the docs and try sandbox endpoints.
              Sign in only when you're ready to subscribe to a plan and request your API key.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/products">
                <Button size="lg">
                  Explore APIs <ArrowRight size={15} />
                </Button>
              </Link>
              <Link to="/documentation">
                <Button size="lg" variant="secondary">
                  Read documentation
                </Button>
              </Link>
              <Button size="lg" variant="ghost" onClick={auth.login}>
                <LogIn size={15} /> Sign in
              </Button>
            </div>
          </div>
          <div className="grid w-full max-w-sm grid-cols-3 gap-3">
            <PerkTile icon={Sparkles} label="Self-service" />
            <PerkTile icon={Shield} label="Secure" />
            <PerkTile icon={Zap} label="Fast onboarding" />
          </div>
        </CardBody>
      </Card>

      <div className="mt-9">
        <SectionHeading
          title="Featured products"
          subtitle="A quick look at what's available — click to see the docs and try it out."
          action={
            <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
              View all products →
            </Link>
          }
        />
        {!products ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((p) => (
              <PublicProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <Card className="mt-9 animate-fade-up">
        <CardBody>
          <SectionHeading title="How it works" subtitle="From discovery to first call in a few minutes." />
          <ol className="grid gap-4 sm:grid-cols-4">
            {[
              { n: 1, t: "Browse", d: "Explore the API catalogue without signing in." },
              { n: 2, t: "Sign in", d: "Authenticate with SSO when you're ready." },
              { n: 3, t: "Subscribe", d: "Create an application and choose a plan." },
              { n: 4, t: "Build", d: "Get your API key and start integrating." },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {s.n}
                </div>
                <div className="font-semibold text-slate-800">{s.t}</div>
                <p className="mt-1 text-sm text-slate-500">{s.d}</p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </>
  );
}

function PerkTile({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={18} />
      </div>
      <div className="text-xs font-semibold text-slate-700">{label}</div>
    </div>
  );
}

function PublicProductCard({ product }: { product: ApiProduct }) {
  const { Icon, tile } = productVisual(`${product.name} ${product.tags?.join(" ")}`);
  return (
    <Link to={`/products/${product.id}`} className="block">
      <Card hover className="h-full animate-fade-up">
        <CardBody>
          <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${tile}`}>
            <Icon size={22} />
          </div>
          <h3 className="font-bold text-slate-900">{product.displayName}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">{product.version} · REST</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Explore <ArrowRight size={14} />
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
