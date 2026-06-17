#!/bin/sh
# Regenerate runtime config from env vars at container start, so a single image
# is portable across environments (spec §13, mirrors tests/catalog pattern).
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.js"

cat > "$CONFIG_PATH" <<EOF
window.__PORTAL_CONFIG__ = {
  apiBaseUrl: "${API_BASE_URL:-}",
  oidc: {
    enabled: ${OIDC_ENABLED:-false},
    authority: "${OIDC_AUTHORITY:-}",
    clientId: "${OIDC_CLIENT_ID:-developer-portal}",
    redirectUri: "${OIDC_REDIRECT_URI:-}" || window.location.origin
  },
  tenant: {
    name: "${PORTAL_TENANT_NAME:-ACME Corp}",
    description: "${PORTAL_TENANT_DESCRIPTION:-APIs and developer tooling}"
  }
};
EOF

echo "Generated $CONFIG_PATH:"
cat "$CONFIG_PATH"

exec nginx -g 'daemon off;'
