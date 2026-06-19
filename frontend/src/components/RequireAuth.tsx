import { KeyRound, Lock, LogIn } from "lucide-react";
import type { ReactNode } from "react";
import { usePortalAuth } from "../auth/auth";
import { usePortalPermissions } from "../auth/permissions";
import { Button, Card, CardBody, Spinner } from "./ui";

/**
 * Renders {children} only for authenticated users; otherwise shows an inline
 * "sign in to continue" card. Use this to gate routes that need a user
 * identity (Applications, Subscribe, Analytics, Settings, Admin), while
 * keeping the public catalogue (Home, Products, Documentation) accessible
 * to anonymous visitors — that's the standard dev-portal browsing model.
 *
 * Pass `requires` to also gate on a permission flag (defined in
 * auth/permissions.ts). When the user is authenticated but lacks the
 * permission, a "missing role" card explains which role they need.
 */
type Permission = "canApprove" | "canPublishApi";

export default function RequireAuth({
  children,
  title = "Sign in to continue",
  hint = "This area is for registered developers. Sign in with SSO to manage your applications and API keys.",
  requires,
}: {
  children: ReactNode;
  title?: string;
  hint?: string;
  requires?: Permission;
}) {
  const auth = usePortalAuth();
  const perms = usePortalPermissions();

  if (auth.isLoading) return <Spinner />;
  if (!auth.isAuthenticated) {
    return (
      <Gate icon={<KeyRound size={22} />} title={title} hint={hint}>
        <Button className="mt-5" onClick={auth.login}>
          <LogIn size={15} /> Sign in with SSO
        </Button>
      </Gate>
    );
  }

  if (requires && !perms[requires]) {
    const roleName = requires === "canApprove" ? "api-admin" : "api-owner";
    return (
      <Gate
        icon={<Lock size={22} />}
        title="You don't have access to this area"
        hint={`This page requires the ${roleName} role. Ask your platform administrator to assign it in Keycloak.`}
      />
    );
  }

  return <>{children}</>;
}

function Gate({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="animate-fade-up">
        <CardBody className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}
