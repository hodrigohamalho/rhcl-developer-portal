import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, PackageSearch, Search, ShieldCheck, Layers } from "lucide-react";
import { useApis } from "../api/hooks";
import { PageHeader } from "../components/AppShell";
import { Badge, Button, Card, CardBody, EmptyState, Input, Skeleton } from "../components/ui";
import { productVisual } from "../lib/products";

const FILTERS = ["All", "Active", "Beta"] as const;

export default function Products() {
  const { data: products, isLoading } = useApis();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (filter !== "All") list = list.filter((p) => p.status === filter.toUpperCase());
    if (q) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          p.tags?.some((x) => x.toLowerCase().includes(t)),
      );
    }
    return list;
  }, [products, q, filter]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Business capabilities you can subscribe to and start building with."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, capabilities, tags…"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={26} />}
          title="No products found"
          hint="Try a different search term or filter."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const { Icon, tile } = productVisual(`${p.name} ${p.tags?.join(" ")}`);
            return (
              <Card key={p.id} hover className="flex animate-fade-up flex-col">
                <CardBody className="flex flex-1 flex-col">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tile}`}>
                      <Icon size={24} />
                    </div>
                    <Badge tone={p.status}>{p.status}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{p.displayName}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{p.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Layers size={13} /> {p.version}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck size={13} /> {p.approvalMode === "MANUAL" ? "Approval" : "Instant"}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-emerald-600">● Sandbox</span>
                  </div>

                  <Button className="mt-4 w-full" onClick={() => navigate(`/products/${p.id}`)}>
                    Explore <ArrowRight size={15} />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
