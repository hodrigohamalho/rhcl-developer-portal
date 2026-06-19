package io.kuadrant.devportal.api;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Map;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import io.kuadrant.devportal.rhcl.SettingsService;
import io.kuadrant.devportal.rhcl.SettingsService.SettingView;
import io.kuadrant.devportal.security.CurrentUser;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Admin-only REST for runtime-editable system settings.
 *
 * Endpoints:
 *   - GET    /api/admin/settings           — snapshot every editable knob
 *   - PUT    /api/admin/settings/{key}     — { value: "…" }; null/empty == reset
 *   - DELETE /api/admin/settings/{key}     — explicit reset-to-default
 *   - POST   /api/admin/settings/test-prometheus — sanity-check the URL
 *
 * RBAC: every endpoint requires the {@code api-admin} realm role. The
 * frontend's {@code RequireAuth requires="canApprove"} double-gates the
 * UI so the buttons are hidden for everyone else, but the role check
 * here is what actually protects the data — UI gates are advisory.
 */
@Path("/api/admin/settings")
@Produces(MediaType.APPLICATION_JSON)
public class AdminSettingsResource {

    @Inject
    SettingsService settings;

    @Inject
    CurrentUser currentUser;

    @GET
    public Map<String, SettingView> list() {
        requireAdmin();
        return settings.snapshot();
    }

    @PUT
    @Path("/{key}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@PathParam("key") String key, Map<String, String> body) {
        requireAdmin();
        String value = body == null ? null : body.get("value");
        if (value == null || value.isBlank()) {
            settings.unset(key);
        } else {
            settings.set(key, value);
        }
        return Response.ok(settings.snapshot().get(key)).build();
    }

    @DELETE
    @Path("/{key}")
    public Response reset(@PathParam("key") String key) {
        requireAdmin();
        settings.unset(key);
        return Response.ok(settings.snapshot().get(key)).build();
    }

    /**
     * Quick connectivity probe — uses the SA bearer token, hits Prometheus's
     * {@code /api/v1/query?query=up}. Returns the status code + a snippet of
     * the body so the admin gets a real signal back from the UI rather than
     * having to dig through pod logs.
     */
    @POST
    @Path("/test-prometheus")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response testPrometheus(Map<String, String> body) {
        requireAdmin();
        String url = body != null && body.get("url") != null && !body.get("url").isBlank()
                ? body.get("url")
                : settings.prometheusUrl().orElse("");
        if (url.isBlank()) {
            return Response.ok(Map.of("ok", false, "error", "no URL configured")).build();
        }
        String token = readToken();
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url + "/api/v1/query?query=up"))
                    .timeout(Duration.ofSeconds(8))
                    .header("Authorization", token.isBlank() ? "" : ("Bearer " + token))
                    .GET().build();
            HttpResponse<String> resp = trustAllClient().send(req, HttpResponse.BodyHandlers.ofString());
            return Response.ok(Map.of(
                    "ok", resp.statusCode() == 200,
                    "status", resp.statusCode(),
                    "snippet", resp.body().substring(0, Math.min(200, resp.body().length())))).build();
        } catch (Exception e) {
            return Response.ok(Map.of("ok", false, "error", e.getMessage())).build();
        }
    }

    private void requireAdmin() {
        if (!currentUser.get().roles.contains("api-admin")) {
            throw new jakarta.ws.rs.ForbiddenException("api-admin required");
        }
    }

    @RolesAllowed("api-admin")
    public static class Marker {
        // Marker class so the @RolesAllowed annotation is in the binary and
        // documented as the policy — actual enforcement is at requireAdmin().
    }

    // ----- helpers used by test-prometheus -----------------------------

    private static String readToken() {
        try {
            return Files.readString(java.nio.file.Path.of("/var/run/secrets/kubernetes.io/serviceaccount/token")).trim();
        } catch (Exception e) {
            return "";
        }
    }

    private static HttpClient trustAllClient() {
        try {
            SSLContext ssl = SSLContext.getInstance("TLS");
            ssl.init(null, new TrustManager[]{TRUST_ALL}, new SecureRandom());
            return HttpClient.newBuilder().sslContext(ssl).connectTimeout(Duration.ofSeconds(5)).build();
        } catch (Exception e) {
            return HttpClient.newHttpClient();
        }
    }

    private static final X509TrustManager TRUST_ALL = new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] c, String a) {}
        public void checkServerTrusted(X509Certificate[] c, String a) {}
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
    };
}
