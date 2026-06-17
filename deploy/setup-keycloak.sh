#!/usr/bin/env bash
# setup-keycloak.sh — create the Developer Portal OIDC client + realm roles
# on the currently logged-in cluster's Keycloak (realm rhcl by default).
#
# Idempotent: re-running is safe. Role-to-user mapping is OPT-IN (it grants
# privileges) via --admin-user / --consumer-users.
#
# Usage:
#   ./apps/developer-portal/deploy/setup-keycloak.sh
#   ./apps/developer-portal/deploy/setup-keycloak.sh --admin-user=alice --consumer-users=bob,carol
#   OIDC_REALM=rhcl KEYCLOAK_NS=rhcl-keycloak ./apps/developer-portal/deploy/setup-keycloak.sh
set -euo pipefail

NS=rhcl-devportal
KEYCLOAK_NS="${KEYCLOAK_NS:-rhcl-keycloak}"
REALM="${OIDC_REALM:-rhcl}"
ADMIN_USER_MAP=""
CONSUMER_USERS=""
for a in "$@"; do case "$a" in
  --admin-user=*)     ADMIN_USER_MAP="${a#*=}" ;;
  --consumer-users=*) CONSUMER_USERS="${a#*=}" ;;
  -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac; done

oc whoami >/dev/null 2>&1 || { echo "ERROR: oc not logged in" >&2; exit 1; }

APPS_DOMAIN="${APPS_DOMAIN:-$(oc get ingresses.config/cluster -o jsonpath='{.spec.domain}')}"
KC="${KEYCLOAK_URL:-https://$(oc -n "$KEYCLOAK_NS" get route -o jsonpath='{.items[0].spec.host}')}"
FE="https://devportal.${APPS_DOMAIN}"
echo "Keycloak: $KC  realm: $REALM  frontend: $FE"

# --- Admin token (bootstrap admin from the operator secret) -----------------
ADMIN_SECRET="${ADMIN_SECRET:-keycloak-bootstrap-admin}"
U=$(oc -n "$KEYCLOAK_NS" get secret "$ADMIN_SECRET" -o jsonpath='{.data.username}' | base64 -d)
P=$(oc -n "$KEYCLOAK_NS" get secret "$ADMIN_SECRET" -o jsonpath='{.data.password}' | base64 -d)
T=$(curl -sk -X POST "$KC/realms/master/protocol/openid-connect/token" \
  -d client_id=admin-cli -d "username=$U" --data-urlencode "password=$P" -d grant_type=password \
  | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
[ "${#T}" -lt 40 ] && { echo "ERROR: failed to obtain admin token" >&2; exit 1; }
auth="Authorization: Bearer $T"; ct="Content-Type: application/json"
api="$KC/admin/realms/$REALM"

# --- Realm roles ------------------------------------------------------------
for r in api-consumer api-owner api-admin; do
  code=$(curl -sk -o /dev/null -w '%{http_code}' -X POST "$api/roles" -H "$auth" -H "$ct" \
    -d "{\"name\":\"$r\",\"description\":\"Developer Portal role\"}")
  case "$code" in 201) echo "role $r: created" ;; 409) echo "role $r: exists" ;; *) echo "role $r: HTTP $code" ;; esac
done

# --- Client developer-portal (public, auth code + PKCE) ---------------------
# Body shared between create and update so redirectUris/webOrigins always
# follow the current frontend URL — re-running the script after a Route
# rename rewires the existing client instead of leaving stale URIs.
CLIENT_BODY="{
  \"clientId\":\"developer-portal\",\"name\":\"Developer Portal\",\"enabled\":true,
  \"publicClient\":true,\"standardFlowEnabled\":true,\"directAccessGrantsEnabled\":false,
  \"rootUrl\":\"$FE\",\"baseUrl\":\"$FE\",
  \"redirectUris\":[\"$FE/*\",\"http://localhost:5173/*\"],
  \"webOrigins\":[\"$FE\",\"http://localhost:5173\",\"+\"],
  \"attributes\":{\"pkce.code.challenge.method\":\"S256\",\"post.logout.redirect.uris\":\"$FE/*\"}}"
CJSON=$(curl -sk "$api/clients?clientId=developer-portal" -H "$auth")
if echo "$CJSON" | grep -q '"clientId":"developer-portal"'; then
  CID=$(echo "$CJSON" | sed -E 's/.*"id":"([0-9a-f-]+)".*/\1/')
  code=$(curl -sk -o /dev/null -w '%{http_code}' -X PUT "$api/clients/$CID" -H "$auth" -H "$ct" -d "$CLIENT_BODY")
  case "$code" in 204) echo "client developer-portal: updated" ;; *) echo "client developer-portal: update HTTP $code" ;; esac
else
  code=$(curl -sk -o /dev/null -w '%{http_code}' -X POST "$api/clients" -H "$auth" -H "$ct" -d "$CLIENT_BODY")
  case "$code" in 201) echo "client developer-portal: created" ;; *) echo "client developer-portal: HTTP $code" ;; esac
fi

# --- Optional role mapping (opt-in) -----------------------------------------
role_rep() { curl -sk "$api/roles/$1" -H "$auth"; }
map_roles() { # $1=username  $2=json array of role reps
  local uid
  uid=$(curl -sk "$api/users?username=$1&exact=true" -H "$auth" | sed -E 's/.*"id":"([0-9a-f-]+)".*/\1/' | head -1)
  if [ -z "$uid" ]; then echo "  user $1: NOT FOUND (skip)"; return; fi
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' -X POST "$api/users/$uid/role-mappings/realm" -H "$auth" -H "$ct" -d "$2")
  echo "  map $1: HTTP $code"
}
if [ -n "$ADMIN_USER_MAP" ] || [ -n "$CONSUMER_USERS" ]; then
  echo "Mapping roles:"
  RC=$(role_rep api-consumer); RO=$(role_rep api-owner); RA=$(role_rep api-admin)
  [ -n "$ADMIN_USER_MAP" ] && map_roles "$ADMIN_USER_MAP" "[$RC,$RO,$RA]"
  if [ -n "$CONSUMER_USERS" ]; then
    IFS=',' read -r -a us <<<"$CONSUMER_USERS"
    for u in "${us[@]}"; do map_roles "$u" "[$RC]"; done
  fi
else
  echo "No --admin-user/--consumer-users given — assign roles in the Keycloak UI"
  echo "(Users → <user> → Role mapping → assign api-admin/api-owner/api-consumer)."
fi

echo "Done."
