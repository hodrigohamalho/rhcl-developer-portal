package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A time-bucketed usage sample for a subscription. In mock mode these are
 * seeded/generated; in real mode they are derived from the in-cluster
 * Prometheus/Thanos (Envoy + Limitador metrics) by the RHCL integration layer.
 */
@Entity
@Table(name = "usage_metric")
public class UsageMetric extends PanacheEntity {

    @Column(nullable = false)
    public Long subscriptionId;

    public Long apiProductId;
    public Long applicationId;

    @Column(nullable = false)
    public Instant timestamp;

    public long requestCount;
    public long successCount;
    public long blockedCount;
    public long error4xxCount;
    public long error5xxCount;
    public double avgLatencyMs;

    public static java.util.List<UsageMetric> listForSubscriptionSince(Long subscriptionId, Instant since) {
        return list("subscriptionId = ?1 and timestamp >= ?2 order by timestamp", subscriptionId, since);
    }
}
