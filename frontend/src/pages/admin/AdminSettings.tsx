import { useState } from "react";
import { CheckCircle2, RefreshCw, ServerCog, ShieldAlert, XCircle } from "lucide-react";
import {
  useAdminSettings,
  useResetSetting,
  useSystemOidcInfo,
  useTestPrometheus,
  useUpdateSetting,
  type SettingView,
} from "../../api/hooks";
import { PageHeader } from "../../components/AppShell";
import { Badge, Button, Card, CardBody, Field, Input, SectionHeading, Skeleton } from "../../components/ui";

/**
 * Admin → System Settings. Lets `api-admin` edit the small set of
 * runtime-tunable knobs (Prometheus URL, RHCL namespace, 1.3/1.4
 * compatibility flag, tenant branding) without redeploying the pod.
 *
 * Identity provider config is shown read-only — the OIDC issuer is baked
 * into the frontend's window config at boot and changing it via this UI
 * would lock the admin out of their own session.
 */
export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: oidc } = useSystemOidcInfo();

  if (isLoading || !settings) return <Skeleton className="h-48" />;

  // Grouped for visual rhythm — observability and compat together, then
  // tenant branding, then read-only identity.
  const groups: { title: string; subtitle: string; keys: string[]; restartHint?: string }[] = [
    {
      title: "Observability & cluster",
      subtitle: "Where the backend reads metrics and writes Kuadrant CRs.",
      keys: ["rhcl.prometheusUrl", "rhcl.namespace"],
    },
    {
      title: "Compatibility",
      subtitle: "Schema differences between Kuadrant releases.",
      keys: ["rhcl.apiKeyEmitSecretRef"],
    },
    {
      title: "Tenant branding",
      subtitle: "Surface name shown in the header, hero and login.",
      keys: ["tenant.name", "tenant.description"],
      restartHint:
        "Takes effect on next page refresh (the frontend re-fetches /api/system/tenant on mount).",
    },
  ];

  return (
    <>
      <PageHeader
        title="System settings"
        subtitle="Runtime-tunable backend configuration. Changes persist in the portal DB and take effect without a pod restart, except where noted."
      />

      <div className="space-y-6">
        {groups.map((g) => (
          <Card key={g.title}>
            <CardBody>
              <SectionHeading title={g.title} subtitle={g.subtitle} />
              {g.restartHint && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <ShieldAlert size={14} className="mt-0.5" /> {g.restartHint}
                </div>
              )}
              <div className="space-y-5">
                {g.keys.map((k) => {
                  const s = settings[k];
                  if (!s) return null;
                  return s.key === "rhcl.prometheusUrl" ? (
                    <PrometheusRow key={k} setting={s} />
                  ) : s.key === "rhcl.apiKeyEmitSecretRef" ? (
                    <BoolRow key={k} setting={s} />
                  ) : (
                    <TextRow key={k} setting={s} />
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ))}

        {/* Identity provider — read-only. Changing OIDC mid-flight would
            lock admins out of their own session; reserved for re-deploy. */}
        <Card>
          <CardBody>
            <SectionHeading
              title="Identity provider"
              subtitle="Frontend OIDC config — read-only. Change via the cluster operator's environment / Helm values and redeploy."
            />
            <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
              <dt className="text-slate-500">Issuer</dt>
              <dd className="font-mono text-slate-800">{oidc?.authority || "—"}</dd>
              <dt className="text-slate-500">Client ID</dt>
              <dd className="font-mono text-slate-800">{oidc?.clientId || "—"}</dd>
            </dl>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">Re-running Keycloak setup</div>
              <p className="mt-1">
                To recreate the OIDC client and realm roles on a new cluster, run:
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-200 scroll-thin">
                {`./deploy/setup-keycloak.sh \\
  --admin-user=<user-to-grant-api-admin> \\
  --consumer-users=<user1>,<user2>`}
              </pre>
              <p className="mt-2">
                The script is idempotent — re-runs reconcile redirect URIs after a Route change.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Per-row editors
// ---------------------------------------------------------------------------

function rowMeta(s: SettingView) {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
      <span>Env default: <code>{s.envDefault || "—"}</code></span>
      {s.overridden && <Badge tone="info">DB override</Badge>}
    </div>
  );
}

function TextRow({ setting }: { setting: SettingView }) {
  const [draft, setDraft] = useState(setting.value);
  const update = useUpdateSetting();
  const reset = useResetSetting();
  const dirty = draft !== setting.value;
  return (
    <Field label={prettyKey(setting.key)} hint={setting.description}>
      <div className="flex items-stretch gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button
          variant="secondary"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate({ key: setting.key, value: draft })}
        >
          {update.isPending ? "Saving…" : "Save"}
        </Button>
        {setting.overridden && (
          <Button
            variant="ghost"
            disabled={reset.isPending}
            onClick={() => reset.mutate(setting.key)}
            title="Drop the DB override and fall back to the env-var default"
          >
            <RefreshCw size={14} /> Reset
          </Button>
        )}
      </div>
      {rowMeta(setting)}
    </Field>
  );
}

function BoolRow({ setting }: { setting: SettingView }) {
  const update = useUpdateSetting();
  const current = setting.value === "true";
  return (
    <Field label={prettyKey(setting.key)} hint={setting.description}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => update.mutate({ key: setting.key, value: current ? "false" : "true" })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            current ? "bg-brand-600" : "bg-slate-300"
          }`}
          aria-label="toggle"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              current ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">{current ? "Enabled" : "Disabled"}</span>
      </div>
      {rowMeta(setting)}
    </Field>
  );
}

function PrometheusRow({ setting }: { setting: SettingView }) {
  const [draft, setDraft] = useState(setting.value);
  const update = useUpdateSetting();
  const reset = useResetSetting();
  const test = useTestPrometheus();
  const dirty = draft !== setting.value;
  return (
    <Field label={prettyKey(setting.key)} hint={setting.description}>
      <div className="flex items-stretch gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button
          variant="secondary"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate({ key: setting.key, value: draft })}
        >
          {update.isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="ghost"
          disabled={test.isPending || !draft}
          onClick={() => test.mutate(draft)}
        >
          <ServerCog size={14} /> {test.isPending ? "Testing…" : "Test"}
        </Button>
        {setting.overridden && (
          <Button
            variant="ghost"
            disabled={reset.isPending}
            onClick={() => reset.mutate(setting.key)}
            title="Drop the DB override and fall back to the env-var default"
          >
            <RefreshCw size={14} /> Reset
          </Button>
        )}
      </div>
      {test.data && (
        <div
          className={`mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
            test.data.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
          }`}
        >
          {test.data.ok ? <CheckCircle2 size={14} className="mt-0.5" /> : <XCircle size={14} className="mt-0.5" />}
          <div>
            <div className="font-medium">
              {test.data.ok
                ? `OK (HTTP ${test.data.status}) — Prometheus is reachable.`
                : `Failed${test.data.status ? ` (HTTP ${test.data.status})` : ""}${test.data.error ? " — " + test.data.error : ""}.`}
            </div>
            {test.data.snippet && (
              <code className="mt-1 block break-all font-mono text-[11px] opacity-80">
                {test.data.snippet}
              </code>
            )}
          </div>
        </div>
      )}
      {rowMeta(setting)}
    </Field>
  );
}

const PRETTY: Record<string, string> = {
  "rhcl.prometheusUrl": "Prometheus / Thanos URL",
  "rhcl.namespace": "RHCL namespace",
  "rhcl.apiKeyEmitSecretRef": "Emit APIKey.spec.secretRef (Kuadrant 1.4+)",
  "tenant.name": "Tenant name",
  "tenant.description": "Tenant description",
};
function prettyKey(k: string) {
  return PRETTY[k] || k;
}
