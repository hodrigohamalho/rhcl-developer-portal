package io.kuadrant.devportal.rhcl;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import io.kuadrant.devportal.domain.PortalSetting;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Authoritative source of runtime-editable portal settings.
 *
 * Resolution order for every key:
 *   1. In-memory cache (populated from DB on first read / after each PUT).
 *   2. {@link PortalSetting} row (DB).
 *   3. {@link PortalConfig} env / properties default.
 *
 * Why a service in front of {@link PortalConfig} rather than reading the
 * env directly: an admin needs to flip a flag without redeploying the pod
 * (e.g. point Prometheus at a different Thanos after migration). The
 * service keeps {@code PortalConfig} as the immutable "first install"
 * baseline and layers DB overrides on top.
 *
 * Thread-safe: cache is a {@link ConcurrentHashMap} and DB writes go
 * through a transactional method.
 */
@ApplicationScoped
public class SettingsService {

    // Setting keys. Centralised so the REST resource and the consumers
    // share an identifier — no magic strings scattered around.
    public static final String PROMETHEUS_URL = "rhcl.prometheusUrl";
    public static final String RHCL_NAMESPACE = "rhcl.namespace";
    public static final String API_KEY_EMIT_SECRET_REF = "rhcl.apiKeyEmitSecretRef";
    public static final String TENANT_NAME = "tenant.name";
    public static final String TENANT_DESCRIPTION = "tenant.description";

    @Inject
    PortalConfig config;

    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    // ----- Typed getters used by the rest of the backend --------------

    public Optional<String> prometheusUrl() {
        return get(PROMETHEUS_URL).or(() -> config.prometheusUrl().filter(s -> !s.isBlank()));
    }

    public String rhclNamespace() {
        return get(RHCL_NAMESPACE).orElse(config.namespace());
    }

    public boolean apiKeyEmitSecretRef() {
        return get(API_KEY_EMIT_SECRET_REF)
                .map(Boolean::parseBoolean)
                .orElse(config.apiKeyEmitSecretRef());
    }

    public String tenantName() {
        return get(TENANT_NAME).orElse("ACME Corp");
    }

    public String tenantDescription() {
        return get(TENANT_DESCRIPTION).orElse("APIs and developer tooling");
    }

    // ----- Public API used by the admin REST resource -----------------

    /** Snapshot of every editable setting + its current effective value and source. */
    public Map<String, SettingView> snapshot() {
        Map<String, SettingView> out = new LinkedHashMap<>();
        out.put(PROMETHEUS_URL, view(PROMETHEUS_URL,
                prometheusUrl().orElse(""),
                config.prometheusUrl().orElse(""),
                "URL of the cluster Prometheus/Thanos (https://thanos-querier.openshift-monitoring.svc:9091).",
                false));
        out.put(RHCL_NAMESPACE, view(RHCL_NAMESPACE,
                rhclNamespace(),
                config.namespace(),
                "Namespace where the backend reads APIProducts / writes APIKeys.",
                false));
        out.put(API_KEY_EMIT_SECRET_REF, view(API_KEY_EMIT_SECRET_REF,
                Boolean.toString(apiKeyEmitSecretRef()),
                Boolean.toString(config.apiKeyEmitSecretRef()),
                "Emit `spec.secretRef` on APIKey CRs. Required for Kuadrant 1.4+, rejected by 1.3.",
                false));
        out.put(TENANT_NAME, view(TENANT_NAME,
                tenantName(),
                "ACME Corp",
                "Brand name shown in the sidebar, hero and login.",
                false));
        out.put(TENANT_DESCRIPTION, view(TENANT_DESCRIPTION,
                tenantDescription(),
                "APIs and developer tooling",
                "Sub-line shown under the brand on the login page.",
                false));
        return out;
    }

    @Transactional
    public void set(String key, String value) {
        PortalSetting s = PortalSetting.findByKey(key);
        if (s == null) {
            s = new PortalSetting();
            s.key = key;
        }
        s.value = value;
        s.updatedAt = java.time.Instant.now();
        s.persist();
        if (value == null || value.isBlank()) {
            cache.remove(key);
        } else {
            cache.put(key, value);
        }
    }

    @Transactional
    public void unset(String key) {
        PortalSetting s = PortalSetting.findByKey(key);
        if (s != null) {
            s.delete();
        }
        cache.remove(key);
    }

    // ----- Internals --------------------------------------------------

    private Optional<String> get(String key) {
        String cached = cache.get(key);
        if (cached != null) return Optional.of(cached);
        // Fall back to DB; cache the hit. Misses are not cached so a fresh
        // PUT is visible immediately even from a concurrent reader.
        PortalSetting s = PortalSetting.findByKey(key);
        if (s == null || s.value == null || s.value.isBlank()) return Optional.empty();
        cache.put(key, s.value);
        return Optional.of(s.value);
    }

    private SettingView view(String key, String effective, String envDefault,
            String description, boolean requiresRestart) {
        boolean overridden = cache.containsKey(key) || PortalSetting.findByKey(key) != null;
        return new SettingView(key, effective, envDefault, overridden, requiresRestart, description);
    }

    public record SettingView(String key, String value, String envDefault,
            boolean overridden, boolean requiresRestart, String description) {
    }
}
