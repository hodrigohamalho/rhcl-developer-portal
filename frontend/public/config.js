// Local dev runtime config. In the container this file is regenerated from env
// vars by docker-entrypoint.sh. OIDC disabled => uses the backend dev identity.
window.__PORTAL_CONFIG__ = {
  apiBaseUrl: "",
  oidc: {
    enabled: false,
    authority: "",
    clientId: "developer-portal",
    redirectUri: window.location.origin,
  },
};
