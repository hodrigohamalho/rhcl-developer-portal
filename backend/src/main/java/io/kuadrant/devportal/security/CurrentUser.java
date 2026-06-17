package io.kuadrant.devportal.security;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import io.kuadrant.devportal.domain.PortalUser;

import jakarta.enterprise.context.RequestScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonString;
import jakarta.json.JsonValue;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ForbiddenException;

/**
 * Resolves the authenticated principal into a local {@link PortalUser},
 * provisioning the row on first sight (just-in-time). In production the data
 * comes from the OIDC access token (Keycloak realm {@code rhcl}); when OIDC is
 * disabled (local dev) it falls back to a configurable dev identity so the
 * consumer flow is exercisable without a token.
 */
@RequestScoped
public class CurrentUser {

    @Inject
    Instance<JsonWebToken> jwt;

    @ConfigProperty(name = "portal.dev.username", defaultValue = "alice")
    String devUsername;

    @ConfigProperty(name = "portal.dev.email", defaultValue = "alice@acme.example")
    String devEmail;

    @ConfigProperty(name = "portal.dev.roles", defaultValue = "api-consumer,api-admin")
    List<String> devRoles;

    private PortalUser cached;

    public boolean isAuthenticated() {
        return token() != null || devUsername != null;
    }

    public Set<String> roles() {
        JsonWebToken t = token();
        if (t == null) {
            return new HashSet<>(devRoles);
        }
        Set<String> roles = new HashSet<>(t.getGroups());
        JsonValue realmAccess = t.getClaim("realm_access");
        if (realmAccess instanceof JsonObject ra && ra.get("roles") instanceof JsonArray arr) {
            for (JsonValue v : arr) {
                if (v instanceof JsonString s) {
                    roles.add(s.getString());
                }
            }
        }
        return roles;
    }

    public boolean hasRole(String role) {
        return roles().contains(role);
    }

    public void requireRole(String role) {
        if (!hasRole(role)) {
            throw new ForbiddenException("Requires role: " + role);
        }
    }

    /** Resolve (and persist on first sight) the portal user row. */
    @Transactional
    public PortalUser get() {
        if (cached != null) {
            return cached;
        }
        JsonWebToken t = token();
        String username = t != null ? claim(t, "preferred_username", t.getName()) : devUsername;
        String email = t != null ? claim(t, "email", username + "@unknown") : devEmail;
        String displayName = t != null ? claim(t, "name", username) : devUsername;
        String defaultOrg = ConfigProvider.getConfig()
                .getOptionalValue("portal.tenant.name", String.class)
                .orElse("ACME Corp");
        String org = t != null ? claim(t, "organization", defaultOrg) : defaultOrg;

        PortalUser user = PortalUser.findByUsername(username);
        if (user == null) {
            user = new PortalUser();
            user.username = username;
        }
        user.email = email;
        user.displayName = displayName;
        user.organization = org;
        user.roles = roles();
        user.persist();
        cached = user;
        return user;
    }

    private JsonWebToken token() {
        if (jwt.isResolvable()) {
            JsonWebToken t = jwt.get();
            if (t != null && t.getName() != null) {
                return t;
            }
        }
        return null;
    }

    private static String claim(JsonWebToken t, String name, String fallback) {
        Object v = t.getClaim(name);
        if (v instanceof JsonString s) {
            return s.getString();
        }
        return v != null ? v.toString() : fallback;
    }
}
