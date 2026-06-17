package io.kuadrant.devportal.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A usage tier / ApplicationPlan. Maps to an RHCL {@code PlanPolicy} plan tier
 * (e.g. gold/silver/bronze). {@link #tier} is the identifier matched by the
 * {@code secret.kuadrant.io/plan-id} annotation on the Authorino API-key Secret.
 */
@Entity
@Table(name = "application_plan")
public class ApplicationPlan extends PanacheEntity {

    @Column(nullable = false)
    public String name;

    @Column(length = 1000)
    public String description;

    /** RHCL plan tier id (gold/silver/bronze/...). Matched by Authorino. */
    @Column(nullable = false)
    public String tier;

    /** Requests-per-minute limit (0 = unlimited). */
    public int rpmLimit;

    public long dailyQuota;

    public long monthlyQuota;

    public boolean approvalRequired = true;

    public boolean active = true;

    /** Optional: product this plan belongs to. Null = global plan. */
    public Long apiProductId;

    public static java.util.List<ApplicationPlan> listForProduct(Long apiProductId) {
        return list("apiProductId is null or apiProductId = ?1", apiProductId);
    }
}
