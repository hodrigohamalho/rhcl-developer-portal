package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.kuadrant.devportal.domain.Enums.Environment;
import io.kuadrant.devportal.domain.Enums.SubscriptionStatus;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * A consumer's request to access an {@link ApiProduct} with a given
 * {@link Application} and {@link ApplicationPlan}. Mirrors the RHCL
 * {@code APIKeyRequest}/{@code APIKey} pair; {@link #rhclApiKeyRef} stores the
 * {@code namespace/name} of the cluster APIKey CR once provisioned.
 */
@Entity
@Table(name = "subscription")
public class Subscription extends PanacheEntity {

    @Column(nullable = false)
    public Long apiProductId;

    @Column(nullable = false)
    public Long applicationId;

    @Column(nullable = false)
    public Long applicationPlanId;

    @Column(nullable = false)
    public Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public SubscriptionStatus status = SubscriptionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Environment environment = Environment.SANDBOX;

    @Column(length = 1000)
    public String useCase;

    /** {@code namespace/name} of the backing RHCL APIKey CR. */
    public String rhclApiKeyRef;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    public Instant approvedAt;
    public Instant revokedAt;
    public String reviewedBy;
    public String rejectionReason;

    public static java.util.List<Subscription> listForUser(Long userId) {
        return list("userId", userId);
    }

    public static java.util.List<Subscription> listByStatus(SubscriptionStatus status) {
        return list("status", status);
    }
}
