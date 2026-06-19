import React, { createContext, useContext, useEffect, type ReactNode } from "react";
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
  const accessToken = auth.user?.access_token;

  // Keycloak / OIDC role surfaces vary by client config. Public clients
  // without the `roles` scope assigned won't ship `realm_access.roles` in
  // the id_token (which becomes `profile` here), so we also decode the
  // access_token where Keycloak puts realm/resource roles by default.
  const roles = React.useMemo(() => {
    const collected = new Set<string>();
    const ingest = (claims: Record<string, unknown> | undefined) => {
      if (!claims) return;
      const realm = (claims.realm_access as { roles?: string[] } | undefined)?.roles;
      realm?.forEach((r) => collected.add(r));
      const ra = claims.resource_access as Record<string, { roles?: string[] }> | undefined;
      if (ra) for (const e of Object.values(ra)) e.roles?.forEach((r) => collected.add(r));
      const flat = claims.roles;
      if (Array.isArray(flat)) flat.forEach((r) => collected.add(r as string));
      const groups = claims.groups;
      if (Array.isArray(groups)) {
        groups.forEach((g) => {
          const v = typeof g === "string" ? g : "";
          const stripped = v.startsWith("/") ? v.slice(1) : v;
          if (stripped) collected.add(stripped);
        });
      }
    };
    ingest(profile);
    // Decode the access_token JWT payload (b64-url) and ingest its claims too.
    // realm_access.roles is on the access_token by default with Keycloak's
    // built-in `roles` scope — the id_token usually doesn't carry it.
    if (accessToken && accessToken.split(".").length === 3) {
      try {
        const payload = accessToken.split(".")[1];
        const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
        const json = JSON.parse(atob(padded)) as Record<string, unknown>;
        ingest(json);
      } catch {
        /* malformed JWT — fall back to whatever profile gave us */
      }
    }
    return Array.from(collected);
  }, [profile, accessToken]);

  const value: PortalAuth = {
    enabled: true,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    username: (profile?.preferred_username as string) ?? auth.user?.profile.sub,
    email: profile?.email as string | undefined,
    roles,
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
    // `roles` is Keycloak's built-in client scope that injects
    // realm_access.roles and resource_access.<client>.roles into the
    // tokens. Requesting it explicitly avoids relying on the client
    // having `roles` listed as a default scope.
    scope: "openid profile email roles",
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
