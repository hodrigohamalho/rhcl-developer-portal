package io.kuadrant.devportal.api;

import java.util.Map;

import io.kuadrant.devportal.rhcl.SettingsService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * Public read-only endpoints describing the running portal's identity.
 *
 * The frontend pulls {@code /api/system/tenant} on boot to use the admin-
 * editable tenant name without needing a pod restart (the static
 * {@code config.js} only carries the start-time defaults). Anything that
 * requires a redeploy to take effect stays in {@code config.js}.
 *
 * Unauthenticated by design — the tenant string appears on the login page
 * before any session exists; OIDC issuer info is needed to render the
 * "Identity provider" panel for unauthenticated visitors.
 */
@Path("/api/system")
@Produces(MediaType.APPLICATION_JSON)
public class SystemResource {

    @Inject
    SettingsService settings;

    @org.eclipse.microprofile.config.inject.ConfigProperty(
            name = "quarkus.oidc.auth-server-url", defaultValue = "")
    String oidcAuthServerUrl;

    @org.eclipse.microprofile.config.inject.ConfigProperty(
            name = "quarkus.oidc.client-id", defaultValue = "developer-portal")
    String oidcClientId;

    @GET
    @Path("/tenant")
    public Map<String, String> tenant() {
        return Map.of(
                "name", settings.tenantName(),
                "description", settings.tenantDescription());
    }

    @GET
    @Path("/oidc-info")
    public Map<String, String> oidcInfo() {
        return Map.of(
                "authority", oidcAuthServerUrl == null ? "" : oidcAuthServerUrl,
                "clientId", oidcClientId == null ? "" : oidcClientId);
    }
}
