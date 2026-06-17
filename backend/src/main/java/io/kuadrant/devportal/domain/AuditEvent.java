package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Append-only audit record for security-relevant actions: key creation,
 * approval, rotation, revocation (spec §9).
 */
@Entity
@Table(name = "audit_event")
public class AuditEvent extends PanacheEntity {

    @Column(nullable = false)
    public String action;

    public String actor;

    public String subjectType;
    public String subjectId;

    @Column(length = 2000)
    public String detail;

    @Column(nullable = false)
    public Instant timestamp = Instant.now();
}
