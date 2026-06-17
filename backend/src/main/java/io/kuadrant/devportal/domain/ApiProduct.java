package io.kuadrant.devportal.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import io.kuadrant.devportal.domain.Enums.ApiStatus;
import io.kuadrant.devportal.domain.Enums.ApprovalMode;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Catalog entry for an API. In mock mode this is seeded into the DB; in real
 * mode it is synchronized from the RHCL {@code APIProduct} CR
 * ({@code devportal.kuadrant.io/v1alpha1}). The {@link #rhclRef} keeps the link
 * back to the cluster resource ({@code namespace/name}).
 */
@Entity
@Table(name = "api_product")
public class ApiProduct extends PanacheEntity {

    @Column(nullable = false, unique = true)
    public String name;

    @Column(nullable = false)
    public String displayName;

    @Column(length = 2000)
    public String description;

    public String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ApiStatus status = ApiStatus.ACTIVE;

    public String owner;

    /** Gateway-fronted base URL consumers call (resolved from the HTTPRoute). */
    public String baseUrl;

    public String openApiSpecUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ApprovalMode approvalMode = ApprovalMode.MANUAL;

    /** Whether the product is visible in the public catalog. */
    public boolean published = true;

    @ElementCollection
    public List<String> tags = new ArrayList<>();

    /** {@code namespace/name} of the backing RHCL APIProduct CR, when synced. */
    public String rhclRef;

    public String contactTeam;
    public String contactEmail;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    @Column(nullable = false)
    public Instant updatedAt = Instant.now();

    public static ApiProduct findByName(String name) {
        return find("name", name).firstResult();
    }

    public static List<ApiProduct> listPublished() {
        return list("published", true);
    }
}
