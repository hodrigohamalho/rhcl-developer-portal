export interface PortalConfig {
  apiBaseUrl: string;
  oidc: {
    enabled: boolean;
    authority: string;
    clientId: string;
    redirectUri: string;
  };
  /**
   * Tenant-specific branding. Lets the same image serve different customers
   * without a rebuild — the entrypoint script writes whatever the operator
   * gave it via PORTAL_TENANT_NAME / PORTAL_TENANT_DESCRIPTION env vars.
   *
   * Falls back to "ACME Corp" so the demo install renders something sensible
   * out of the box.
   */
  tenant: {
    name: string;
    description: string;
  };
}

declare global {
  interface Window {
    __PORTAL_CONFIG__?: Partial<PortalConfig>;
  }
}

const raw = window.__PORTAL_CONFIG__ ?? {};

export const config: PortalConfig = {
  apiBaseUrl: raw.apiBaseUrl ?? "",
  oidc: {
    enabled: raw.oidc?.enabled ?? false,
    authority: raw.oidc?.authority ?? "",
    clientId: raw.oidc?.clientId ?? "developer-portal",
    redirectUri: raw.oidc?.redirectUri ?? window.location.origin,
  },
  tenant: {
    name: raw.tenant?.name ?? "ACME Corp",
    description: raw.tenant?.description ?? "APIs and developer tooling",
  },
};
