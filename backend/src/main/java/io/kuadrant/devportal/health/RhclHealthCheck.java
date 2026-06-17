package io.kuadrant.devportal.health;

import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

import io.kuadrant.devportal.rhcl.RhclIntegrationService;

import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

/** Readiness probe reporting which RHCL integration backend is active. */
@Readiness
public class RhclHealthCheck implements HealthCheck {

    @Inject
    Instance<RhclIntegrationService> rhcl;

    @Override
    public HealthCheckResponse call() {
        try {
            return HealthCheckResponse.named("rhcl-integration")
                    .up().withData("backend", rhcl.get().describe()).build();
        } catch (RuntimeException e) {
            return HealthCheckResponse.named("rhcl-integration").down()
                    .withData("error", e.getMessage()).build();
        }
    }
}
