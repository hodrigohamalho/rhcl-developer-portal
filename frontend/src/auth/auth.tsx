import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  AuthProvider as OidcProvider,
  useAuth as useOidcAuth,
  type AuthProviderProps,
} from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { config } from "../config";
import { setTokenProvider } from "../api/client";

export interface PortalAuth {
  enabled: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  username?: string;
  email?: string;
  roles: string[];
  login: () => void;
  logout: () => void;
}

const Ctx = createContext<PortalAuth | null>(null);

export function usePortalAuth(): PortalAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortalAuth must be used within <AuthRoot>");
  return ctx;
}

/** OIDC-backed auth bridge — only mounted when config.oidc.enabled. */
function OidcBridge({ children }: { children: ReactNode }) {
  const auth = useOidcAuth();

  useEffect(() => {
    setTokenProvider(() => auth.user?.access_token);
  }, [auth.user]);

  // Complete silent/redirect callbacks transparently.
  const profile = auth.user?.profile as Record<string, unknown> | undefined;
  const realmRoles =
    (profile?.realm_access as { roles?: string[] } | undefined)?.roles ?? [];

  const value: PortalAuth = {
    enabled: true,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    username: (profile?.preferred_username as string) ?? auth.user?.profile.sub,
    email: profile?.email as string | undefined,
    roles: realmRoles,
    login: () => void auth.signinRedirect(),
    logout: () => void auth.signoutRedirect(),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Dev bridge — OIDC disabled; backend resolves a dev identity. */
function DevBridge({ children }: { children: ReactNode }) {
  useEffect(() => {
    setTokenProvider(() => undefined);
  }, []);
  const value: PortalAuth = {
    enabled: false,
    isLoading: false,
    isAuthenticated: true,
    username: "dev",
    roles: ["api-consumer", "api-admin", "api-owner"],
    login: () => {},
    logout: () => {},
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function AuthRoot({ children }: { children: ReactNode }) {
  if (!config.oidc.enabled) {
    return <DevBridge>{children}</DevBridge>;
  }
  const oidcProps: AuthProviderProps = {
    authority: config.oidc.authority,
    client_id: config.oidc.clientId,
    redirect_uri: config.oidc.redirectUri,
    post_logout_redirect_uri: config.oidc.redirectUri,
    response_type: "code",
    scope: "openid profile email",
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };
  return (
    <OidcProvider {...oidcProps}>
      <OidcBridge>{children}</OidcBridge>
    </OidcProvider>
  );
}
