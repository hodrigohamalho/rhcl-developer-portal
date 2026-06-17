package io.kuadrant.devportal.domain;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;

/**
 * A portal user. Identity is owned by Keycloak (OIDC); this row is a local
 * projection keyed by the OIDC {@code sub}/{@code preferred_username}, used to
 * own Applications and Subscriptions and to attach audit records.
 */
@Entity
@Table(name = "portal_user")
public class PortalUser extends PanacheEntity {

    @Column(nullable = false, unique = true)
    public String username;

    @Column(nullable = false)
    public String email;

    public String displayName;

    public String organization;

    @ElementCollection(fetch = FetchType.EAGER)
    public Set<String> roles = new HashSet<>();

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    public static PortalUser findByUsername(String username) {
        return find("username", username).firstResult();
    }
}
