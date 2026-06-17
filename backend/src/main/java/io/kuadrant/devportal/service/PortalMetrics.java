package io.kuadrant.devportal.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Prometheus counters mandated by spec §10. Exposed via methods (not public
 * fields) because CDI client proxies only delegate method calls — reading a
 * public field through an injected proxy would return null.
 */
@ApplicationScoped
public class PortalMetrics {

    @Inject
    MeterRegistry registry;

    private Counter subscriptionsCreated;
    private Counter apiKeysCreated;
    private Counter apiKeysRotated;
    private Counter apiKeysRevoked;
    private Counter subscriptionApprovals;
    private Counter errors;

    @PostConstruct
    void init() {
        subscriptionsCreated = registry.counter("portal_subscriptions_created_total");
        apiKeysCreated = registry.counter("portal_api_keys_created_total");
        apiKeysRotated = registry.counter("portal_api_keys_rotated_total");
        apiKeysRevoked = registry.counter("portal_api_key_revoked_total");
        subscriptionApprovals = registry.counter("portal_subscription_approvals_total");
        errors = registry.counter("portal_errors_total");
    }

    public void incSubscriptionsCreated() {
        subscriptionsCreated.increment();
    }

    public void incApiKeysCreated() {
        apiKeysCreated.increment();
    }

    public void incApiKeysRotated() {
        apiKeysRotated.increment();
    }

    public void incApiKeysRevoked() {
        apiKeysRevoked.increment();
    }

    public void incSubscriptionApprovals() {
        subscriptionApprovals.increment();
    }

    public void incErrors() {
        errors.increment();
    }
}
