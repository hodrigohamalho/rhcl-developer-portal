import { config } from "../config";
import { useSystemTenant } from "../api/hooks";

/**
 * Effective tenant branding: backend-served value (admin-editable, lives in
 * the portal DB) when available, falling back to the boot-time {@code
 * window.__PORTAL_CONFIG__.tenant} defaults.
 *
 * Components should always read tenant strings through this hook rather
 * than from {@code config.tenant} directly so changes via Admin → System
 * settings appear without a pod restart.
 */
export interface Tenant {
  name: string;
  description: string;
}

export function useTenant(): Tenant {
  const { data } = useSystemTenant();
  return {
    name: data?.name || config.tenant.name,
    description: data?.description || config.tenant.description,
  };
}
