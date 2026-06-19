import { usePortalAuth } from "./auth";

/**
 * Centralised role → capability mapping.
 *
 * Three named capabilities; everywhere in the UI gates on one of these
 * names rather than spelling out "roles.includes('api-admin') ||
 * roles.includes('api-owner')" inline. Keeping a single source of truth
 * here means adjusting the role hierarchy is one diff, not a sweep.
 *
 *   - `canApprove`    — review and act on subscription requests
 *                       (issue/revoke API keys). `api-admin` only.
 *   - `canPublishApi` — register / edit API products and plans.
 *                       Either `api-owner` or `api-admin`.
 *   - `hasAdminUI`    — should the Administration nav group render?
 *                       True when any of the above is true.
 *
 * Keeps in lockstep with the role table in README.md.
 */
export interface PortalPermissions {
  canApprove: boolean;
  canPublishApi: boolean;
  hasAdminUI: boolean;
}

export function usePortalPermissions(): PortalPermissions {
  const auth = usePortalAuth();
  const isAuthed = auth.isAuthenticated;
  const canApprove = isAuthed && auth.roles.includes("api-admin");
  const canPublishApi =
    isAuthed && (auth.roles.includes("api-owner") || auth.roles.includes("api-admin"));
  return {
    canApprove,
    canPublishApi,
    hasAdminUI: canApprove || canPublishApi,
  };
}
