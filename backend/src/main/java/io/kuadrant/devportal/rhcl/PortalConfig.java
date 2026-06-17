package io.kuadrant.devportal.rhcl;

import java.util.Optional;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

/**
 * Configuration for the RHCL integration layer, bound from {@code portal.rhcl.*}.
 */
@ConfigMapping(prefix = "portal.rhcl")
public interface PortalConfig {

    /** {@code mock} (default) or {@code kubernetes}. */
    @WithDefault("mock")
    String mode();

    /** Namespace holding the RHCL DevPortal CRs and API-key Secrets. */
    @WithDefault("rhcl-apps")
    String namespace();

    /** Header the gateway expects the API key in. */
    @WithDefault("api-key")
    String apiKeyHeader();

    /** Authorino Secret label key/value that marks a managed API-key Secret. */
    @WithDefault("banking-api-apikey")
    String apiKeyAppLabel();

    /** Fallback gateway hostname when an APIProduct has none in status. */
    Optional<String> defaultHostname();

    /** Base URL of the in-cluster Thanos/Prometheus query API (real usage). */
    Optional<String> prometheusUrl();

    /** File holding the bearer token used to query Thanos (SA token by default). */
    @WithDefault("/var/run/secrets/kubernetes.io/serviceaccount/token")
    String prometheusTokenPath();
}
