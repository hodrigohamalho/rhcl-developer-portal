package io.kuadrant.devportal.service;

import io.kuadrant.devportal.domain.AuditEvent;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

/** Persists append-only audit records for key-lifecycle actions (spec §9). */
@ApplicationScoped
public class AuditService {

    @Transactional
    public void record(String action, String actor, String subjectType, String subjectId, String detail) {
        AuditEvent e = new AuditEvent();
        e.action = action;
        e.actor = actor;
        e.subjectType = subjectType;
        e.subjectId = subjectId;
        e.detail = detail;
        e.persist();
    }
}
