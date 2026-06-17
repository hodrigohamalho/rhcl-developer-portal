package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.kuadrant.devportal.domain.Enums.ApiKeyStatus;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Metadata about an API key. The portal NEVER stores the plaintext key: only a
 * SHA-256 hash (for verification/audit) and a masked preview. The live secret
 * value lives in the Authorino-managed Kubernetes Secret referenced by
 * {@link #secretRef} and is shown to the user exactly once at creation time.
 */
@Entity
@Table(name = "api_key")
public class ApiKey extends PanacheEntity {

    @Column(nullable = false)
    public Long subscriptionId;

    /** SHA-256 hash of the plaintext key. Never the key itself. */
    @Column(nullable = false)
    public String keyHash;

    /** Masked preview, e.g. {@code bk_live_••••2f9a}. */
    @Column(nullable = false)
    public String keyPreview;

    /** {@code namespace/name} of the Authorino API-key Secret. */
    public String secretRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ApiKeyStatus status = ApiKeyStatus.ACTIVE;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    public Instant rotatedAt;
    public Instant revokedAt;

    public static ApiKey findActiveForSubscription(Long subscriptionId) {
        return find("subscriptionId = ?1 and status = ?2", subscriptionId, ApiKeyStatus.ACTIVE).firstResult();
    }
}
