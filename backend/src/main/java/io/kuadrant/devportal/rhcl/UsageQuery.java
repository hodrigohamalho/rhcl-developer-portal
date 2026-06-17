package io.kuadrant.devportal.rhcl;

import java.time.Instant;

/**
 * Time window + granularity for a usage query.
 *
 * @param from        window start (inclusive)
 * @param to          window end (exclusive)
 * @param stepSeconds sample resolution in seconds (e.g. 3600 = hourly)
 */
public record UsageQuery(Instant from, Instant to, long stepSeconds) {

    public static UsageQuery lastDays(int days) {
        Instant now = Instant.now();
        return new UsageQuery(now.minusSeconds((long) days * 86400), now, 3600);
    }
}
