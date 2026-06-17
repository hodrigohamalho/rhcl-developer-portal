import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, KeyRound, Plus, RefreshCw } from "lucide-react";
import { useProfile, useRotateKey } from "../api/hooks";
import { PageHeader } from "../components/AppShell";
import { Badge, Button, Card, CardBody, EmptyState, Skeleton } from "../components/ui";
import CredentialDialog from "../components/CredentialDialog";
import PendingApprovalsBanner from "../components/PendingApprovalsBanner";
import type { ApiCredential, Subscription } from "../api/types";

export default function Applications() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const [cred, setCred] = useState<ApiCredential | null>(null);
  const newApp = () => navigate("/applications/new");

  const subsByApp = useMemo(() => {
    const m = new Map<number, Subscription[]>();
    for (const s of profile?.subscriptions ?? []) {
      m.set(s.applicationId, [...(m.get(s.applicationId) ?? []), s]);
    }
    return m;
  }, [profile]);

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="The technical consumers of your products. Manage credentials and connected products."
        actions={
          <Button onClick={newApp}>
            <Plus size={16} /> New application
          </Button>
        }
      />

      <PendingApprovalsBanner />

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (profile?.applications.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Boxes size={26} />}
          title="No applications yet"
          hint="Create your first application and start consuming API products."
          action={
            <Button onClick={newApp}>
              <Plus size={16} /> Create application
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {profile!.applications.map((a) => {
            const subs = subsByApp.get(a.id) ?? [];
            return (
              <Card key={a.id} hover className="animate-fade-up">
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Boxes size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-slate-900">{a.name}</h3>
                        <Badge tone="neutral">{a.environment}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{a.organization}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Mini label="Products" value={new Set(subs.map((s) => s.apiProductId)).size} />
                    <Mini label="Keys" value={subs.filter((s) => s.apiKeyPreview).length} />
                    <Mini label="Created" value={new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  </div>

                  {subs.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      {subs.map((s) => (
                        <CredRow key={s.id} sub={s} onRotated={setCred} />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {cred && <CredentialDialog credential={cred} onClose={() => setCred(null)} />}
    </>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <div className="text-sm font-bold text-slate-800">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

function CredRow({ sub, onRotated }: { sub: Subscription; onRotated: (c: ApiCredential) => void }) {
  const rotate = useRotateKey();
  return (
    <div className="flex items-center gap-2 text-sm">
      <KeyRound size={14} className="text-slate-400" />
      <span className="truncate text-slate-600">{sub.apiProductName}</span>
      <Badge tone={sub.planTier}>{sub.planTier}</Badge>
      <code className="ml-auto font-mono text-xs text-slate-400">{sub.apiKeyPreview ?? "pending"}</code>
      {sub.status === "APPROVED" && (
        <button
          title="Rotate key"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={async () => onRotated(await rotate.mutateAsync(sub.id))}
        >
          <RefreshCw size={13} className={rotate.isPending ? "animate-spin" : ""} />
        </button>
      )}
    </div>
  );
}

