import { KeyRound, LogIn } from "lucide-react";
import type { ReactNode } from "react";
import { usePortalAuth } from "../auth/auth";
import { Button, Card, CardBody, Spinner } from "./ui";

/**
 * Renders {children} only for authenticated users; otherwise shows an inline
 * "sign in to continue" card. Use this to gate routes that need a user
 * identity (Applications, Subscribe, Analytics, Settings, Admin), while
 * keeping the public catalogue (Home, Products, Documentation) accessible
 * to anonymous visitors — that's the standard dev-portal browsing model.
 */
export default function RequireAuth({
  children,
  title = "Sign in to continue",
  hint = "This area is for registered developers. Sign in with SSO to manage your applications and API keys.",
}: {
  children: ReactNode;
  title?: string;
  hint?: string;
}) {
  const auth = usePortalAuth();

  if (auth.isLoading) return <Spinner />;
  if (auth.isAuthenticated) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="animate-fade-up">
        <CardBody className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <KeyRound size={22} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
          <Button className="mt-5" onClick={auth.login}>
            <LogIn size={15} /> Sign in with SSO
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
