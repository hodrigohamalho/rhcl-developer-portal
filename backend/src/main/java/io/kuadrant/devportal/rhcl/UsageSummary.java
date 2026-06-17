package io.kuadrant.devportal.rhcl;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated consumption for a subscription over a window, plus a time series
 * for charting. Mirrors the dashboard indicators in spec §4.8.
 */
public record UsageSummary(
        long totalRequests,
        long successCount,
        long blockedCount,
        long error4xxCount,
        long error5xxCount,
        double avgLatencyMs,
        long limitRemaining,
        double usagePercent,
        Instant quotaResetAt,
        List<Point> series) {

    /** One time bucket in the usage series. */
    public record Point(
            Instant timestamp,
            long requestCount,
            long successCount,
            long blockedCount) {
    }
}
