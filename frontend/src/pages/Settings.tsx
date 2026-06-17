import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { useProfile } from "../api/hooks";
import { usePortalAuth } from "../auth/auth";
import { PageHeader } from "../components/AppShell";
import { Badge, Card, CardBody, SectionHeading, Skeleton } from "../components/ui";

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const auth = usePortalAuth();
  const isAdmin = auth.roles.includes("api-admin") || auth.roles.includes("api-owner");

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile, organization and access." />

      {isLoading || !profile ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardBody>
              <SectionHeading title="Profile" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Display name" value={profile.displayName} />
                <Info label="Username" value={profile.username} />
                <Info label="Email" value={profile.email} />
                <Info label="Organization" value={profile.organization} />
              </div>
              <div className="mt-5">
                <div className="mb-2 text-sm font-medium text-slate-600">Roles</div>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.length === 0 ? (
                    <span className="text-sm text-slate-400">No roles assigned</span>
                  ) : (
                    profile.roles.map((r) => <Badge key={r}>{r}</Badge>)
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardBody>
                <SectionHeading title="Appearance" />
                <p className="text-sm text-slate-500">Light theme. Dark mode coming soon.</p>
              </CardBody>
            </Card>

            {isAdmin && (
              <Card>
                <CardBody>
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-brand-600" />
                    <span className="font-semibold text-slate-800">Administration</span>
                  </div>
                  <p className="mb-3 text-sm text-slate-500">Manage products, plans and approve access requests.</p>
                  <div className="space-y-2 text-sm">
                    <AdminLink to="/admin/subscriptions" label="Review access requests" />
                    <AdminLink to="/admin/apis" label="Manage products" />
                    <AdminLink to="/admin/plans" label="Manage plans" />
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="font-medium text-slate-800">{value || "—"}</div>
    </div>
  );
}

function AdminLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
      {label}
      <ExternalLink size={14} className="text-slate-400" />
    </Link>
  );
}
