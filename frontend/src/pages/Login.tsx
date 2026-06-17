import { KeyRound } from "lucide-react";
import { usePortalAuth } from "../auth/auth";
import { config } from "../config";
import { Button } from "../components/ui";

export default function Login() {
  const auth = usePortalAuth();
  return (
    <div className="brand-gradient flex min-h-screen items-center justify-center p-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <KeyRound />
          </div>
          <div>
            <h1 className="text-xl font-bold">{config.tenant.name} Developer Portal</h1>
            <p className="text-sm text-white/70">{config.tenant.description}</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-white/80">
          Discover APIs, subscribe to a plan, get your API key and monitor your consumption.
        </p>
        <Button className="w-full" onClick={auth.login}>
          Sign in with SSO
        </Button>
      </div>
    </div>
  );
}
