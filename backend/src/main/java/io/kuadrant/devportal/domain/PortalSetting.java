package io.kuadrant.devportal.domain;

import java.time.Instant;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Single-row-per-key store for runtime-editable portal settings.
 *
 * Why a generic key/value table rather than typed columns per setting:
 *   - The set of editable settings grows over time (Prometheus URL today,
 *     OPA URL tomorrow, etc.); we don't want a schema migration per knob.
 *   - The admin UI is generic — render each key as a labelled field with
 *     metadata about whether it requires a restart, what the type is, and
 *     what the env-var fallback is.
 *
 * The {@link io.kuadrant.devportal.rhcl.SettingsService} loads these once
 * at startup, exposes typed accessors, and re-reads on PUT so changes
 * take effect without a pod restart.
 */
@Entity
@Table(name = "portal_setting")
public class PortalSetting extends PanacheEntityBase {

    @Id
    @Column(length = 128, nullable = false)
    public String key;

    @Column(length = 4096)
    public String value;

    @Column(nullable = false)
    public Instant updatedAt = Instant.now();

    public static PortalSetting findByKey(String key) {
        return findById(key);
    }
}
