import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Code2, KeyRound, Rocket, Search, Terminal, Boxes } from "lucide-react";
import { useApis } from "../api/hooks";
import { PageHeader } from "../components/AppShell";
import { Card, CardBody, Select, Skeleton } from "../components/ui";
import { config } from "../config";

const CATEGORIES = [
  { icon: Rocket, title: "Getting Started", desc: "Set up your first integration in minutes." },
  { icon: KeyRound, title: "Authentication", desc: "API keys, headers and environments." },
  { icon: Boxes, title: "Products & Plans", desc: "Capabilities, quotas and rate limits." },
  { icon: Code2, title: "SDKs", desc: "curl, Node, Python, Java, Go, .NET." },
  { icon: Terminal, title: "Tutorials", desc: "Step-by-step integration guides." },
  { icon: BookOpen, title: "Examples", desc: "Copy-paste request/response samples." },
];

export default function Documentation() {
  const { data: products } = useApis();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const productId = params.get("product") ?? (products?.[0]?.id ? String(products[0].id) : "");

  useEffect(() => {
    if (!params.get("product") && products?.[0]) {
      setParams({ product: String(products[0].id) }, { replace: true });
    }
  }, [products, params, setParams]);

  return (
    <>
      <PageHeader title="Documentation" subtitle="Everything you need to build with Connectivity Link." />

      {/* Search hero */}
      <Card className="hero-sheen mb-6">
        <CardBody className="py-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold text-slate-900">How can we help you build?</h2>
            <div className="relative mt-4">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search APIs, endpoints, guides, examples…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase())).map((c) => (
          <Card key={c.title} hover>
            <CardBody className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-800">{c.title}</div>
                <div className="text-sm text-slate-500">{c.desc}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* OpenAPI viewer */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">API Reference</h2>
        {products && (
          <Select value={productId} onChange={(e) => setParams({ product: e.target.value })} style={{ minWidth: 200 }}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </Select>
        )}
      </div>
      {productId ? <ApiReference productId={productId} /> : <Skeleton className="h-96" />}
    </>
  );
}

function ApiReference({ productId }: { productId: string }) {
  const specUrl = `${config.apiBaseUrl}/api/catalog/apis/${productId}/openapi`;
  const CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

  useEffect(() => {
    let cancelled = false;

    const mount = () => {
      const scalar = (window as unknown as { Scalar?: { createApiReference: (sel: string, cfg: object) => void } }).Scalar;
      const el = document.getElementById("scalar-container");
      if (!scalar || !el || cancelled) return;
      el.innerHTML = "";
      scalar.createApiReference("#scalar-container", { url: specUrl, theme: "default", hideDownloadButton: false });
    };

    if ((window as unknown as { Scalar?: unknown }).Scalar) {
      mount();
    } else {
      const existing = document.getElementById("scalar-cdn") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", mount, { once: true });
      } else {
        const s = document.createElement("script");
        s.id = "scalar-cdn";
        s.src = CDN;
        s.onload = mount;
        document.body.appendChild(s);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  return (
    <Card className="overflow-hidden">
      <div id="scalar-container" className="min-h-[480px]">
        <div className="p-6 text-sm text-slate-500">
          Loading interactive reference… If it does not render, the raw spec is at{" "}
          <a className="text-brand-600 hover:underline" href={specUrl} target="_blank" rel="noreferrer">
            {specUrl}
          </a>
          .
        </div>
      </div>
    </Card>
  );
}
