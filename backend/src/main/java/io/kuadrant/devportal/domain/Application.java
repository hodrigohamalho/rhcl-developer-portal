package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.kuadrant.devportal.domain.Enums.Environment;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * The technical consumer of an API, owned by a {@link PortalUser}. A single
 * Application may hold several Subscriptions across products/plans.
 */
@Entity
@Table(name = "application")
public class Application extends PanacheEntity {

    @Column(nullable = false)
    public String name;

    @Column(length = 1000)
    public String description;

    @Column(nullable = false)
    public Long ownerUserId;

    public String organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Environment environment = Environment.SANDBOX;

    public String callbackUrl;

    public String technicalContact;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    public static java.util.List<Application> listForUser(Long userId) {
        return list("ownerUserId", userId);
    }
}
