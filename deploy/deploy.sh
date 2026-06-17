#!/usr/bin/env bash
# deploy.sh — deploy the rhcl-developer-portal to the currently logged-in
# OpenShift cluster.
#
# Auto-discovers all cluster-specific values (apps domain, Keycloak issuer,
# gateway host, backend route), builds both images in-cluster from the
# Dockerfiles (no local Docker / no Quay needed), and applies the stack.
#
# Usage:
#   ./deploy/deploy.sh                          # discover + build + apply
#   ./deploy/deploy.sh --no-build               # skip image builds
#   OIDC_REALM=acme ./deploy/deploy.sh          # override Keycloak realm
#   TENANT_NAME="ACME Corp" ./deploy/deploy.sh  # rebrand at deploy time
#
# Every discovered/branding value can be overridden via env:
#   APPS_DOMAIN, OIDC_ISSUER, OIDC_REALM, KEYCLOAK_NS, GATEWAY_HOST,
#   BACKEND_HOST, RHCL_NAMESPACE, APIPRODUCT_NAME, TENANT_NAME,
#   TENANT_DESCRIPTION.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
NS="${PORTAL_NAMESPACE:-rhcl-devportal}"
BUILD=true
[ "${1:-}" = "--no-build" ] && BUILD=false

oc whoami >/dev/null 2>&1 || { echo "ERROR: oc not logged in" >&2; exit 1; }

# --- Discovery (every value overridable via env) ----------------------------
APPS_DOMAIN="${APPS_DOMAIN:-$(oc get ingresses.config/cluster -o jsonpath='{.spec.domain}' 2>/dev/null)}"
[ -z "$APPS_DOMAIN" ] && { echo "ERROR: could not discover apps domain; set APPS_DOMAIN=" >&2; exit 1; }

KEYCLOAK_NS="${KEYCLOAK_NS:-rhcl-keycloak}"
KEYCLOAK_HOST="${KEYCLOAK_HOST:-$(oc -n "$KEYCLOAK_NS" get route -o jsonpath='{.items[0].spec.host}' 2>/dev/null)}"
OIDC_REALM="${OIDC_REALM:-rhcl}"
OIDC_ISSUER="${OIDC_ISSUER:-https://${KEYCLOAK_HOST}/realms/${OIDC_REALM}}"

RHCL_NAMESPACE="${RHCL_NAMESPACE:-rhcl-apps}"
APIPRODUCT_NAME="${APIPRODUCT_NAME:-banking-api}"
GATEWAY_HOSTROUTE_NAME="${GATEWAY_HOSTROUTE_NAME:-${APIPRODUCT_NAME}-connectivity}"
GATEWAY_HOST="${GATEWAY_HOST:-$(oc -n "$RHCL_NAMESPACE" get httproute "$GATEWAY_HOSTROUTE_NAME" -o jsonpath='{.spec.hostnames[0]}' 2>/dev/null)}"
GATEWAY_HOST="${GATEWAY_HOST:-${GATEWAY_HOSTROUTE_NAME}.${APPS_DOMAIN}}"
BACKEND_HOST="${BACKEND_HOST:-portal-backend-${NS}.${APPS_DOMAIN}}"

# Tenant branding — surfaced in the frontend (header / hero / login). Falls
# back to the upstream demo placeholders.
TENANT_NAME="${TENANT_NAME:-ACME Corp}"
TENANT_DESCRIPTION="${TENANT_DESCRIPTION:-APIs and developer tooling}"

echo "============================================================"
echo " Developer Portal deploy"
echo "   namespace           : $NS"
echo "   cluster apps domain : $APPS_DOMAIN"
echo "   OIDC issuer         : $OIDC_ISSUER"
echo "   gateway host        : $GATEWAY_HOST"
echo "   backend route       : $BACKEND_HOST"
echo "   tenant name         : $TENANT_NAME"
echo "   build images        : $BUILD"
echo "============================================================"

# --- Namespace (needed before BuildConfigs) ---------------------------------
oc apply -f "$HERE/namespace.yaml"

# --- Build images in-cluster ------------------------------------------------
build_image() {
  local name="$1" dir="$2"
  if ! oc -n "$NS" get bc "$name" >/dev/null 2>&1; then
    oc -n "$NS" new-build --name="$name" --binary --strategy=docker >/dev/null
  fi
  echo "→ building $name from $dir ..."
  oc -n "$NS" start-build "$name" --from-dir="$dir" --wait >/dev/null
  echo "  done."
}
if $BUILD; then
  build_image developer-portal-backend  "$ROOT/backend"
  build_image developer-portal-frontend "$ROOT/frontend"
fi

# --- Render (substitute placeholders) + apply -------------------------------
echo "→ applying manifests ..."
oc kustomize "$HERE" \
  | sed -e "s|\${GATEWAY_HOST}|$GATEWAY_HOST|g" \
        -e "s|\${OIDC_ISSUER}|$OIDC_ISSUER|g" \
        -e "s|\${BACKEND_HOST}|$BACKEND_HOST|g" \
        -e "s|\${APPS_DOMAIN}|$APPS_DOMAIN|g" \
        -e "s|\${PORTAL_TENANT_NAME}|$TENANT_NAME|g" \
        -e "s|\${PORTAL_TENANT_DESCRIPTION}|$TENANT_DESCRIPTION|g" \
  | oc apply -f -

# --- Wait for rollouts ------------------------------------------------------
echo "→ waiting for rollouts ..."
oc -n "$NS" rollout status deploy/portal-db --timeout=180s || true
oc -n "$NS" rollout status deploy/portal-backend --timeout=180s || true
oc -n "$NS" rollout status deploy/portal-frontend --timeout=120s || true

# --- Optional: wire APIProduct documentation for the console plugin ---------
if oc -n "$RHCL_NAMESPACE" get apiproduct "$APIPRODUCT_NAME" >/dev/null 2>&1; then
  RT="${APIPRODUCT_NAME}-v1-${RHCL_NAMESPACE}.${APPS_DOMAIN}"
  oc -n "$RHCL_NAMESPACE" patch apiproduct "$APIPRODUCT_NAME" --type=merge -p \
    "{\"spec\":{\"documentation\":{\"openAPISpecURL\":\"https://$RT/q/openapi\",\"swaggerUI\":\"https://$RT/q/swagger-ui\",\"docsURL\":\"https://$RT/q/swagger-ui\"}}}" >/dev/null 2>&1 || true
fi

echo "============================================================"
echo " Done."
echo "   Portal:  https://devportal.${APPS_DOMAIN}"
echo "   API:     https://${BACKEND_HOST}  (Swagger at /q/swagger-ui)"
echo ""
echo " Next: create the Keycloak OIDC client + roles on this cluster:"
echo "   ./deploy/setup-keycloak.sh"
echo "============================================================"
