package io.kuadrant.devportal.api;

import java.time.Instant;
import java.util.List;

import io.kuadrant.devportal.domain.ApiKey;
import io.kuadrant.devportal.domain.ApiProduct;
import io.kuadrant.devportal.domain.Application;
import io.kuadrant.devportal.domain.ApplicationPlan;
import io.kuadrant.devportal.domain.PortalUser;
import io.kuadrant.devportal.domain.Subscription;
import io.kuadrant.devportal.rhcl.UsageSummary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Transport records for the REST layer. Mapping helpers live alongside. */
public final class Dtos {

    private Dtos() {
    }

    public record ApiProductDto(Long id, String name, String displayName, String description, String version,
            String status, String owner, String baseUrl, String openApiSpecUrl, String approvalMode,
            List<String> tags, String contactTeam, String contactEmail, Instant updatedAt,
            String protocol, String mcpEndpoint) {
        public static ApiProductDto of(ApiProduct p) {
            return new ApiProductDto(p.id, p.name, p.displayName, p.description, p.version, p.status.name(),
                    p.owner, p.baseUrl, p.openApiSpecUrl, p.approvalMode.name(), p.tags, p.contactTeam,
                    p.contactEmail, p.updatedAt, p.protocol.name(), p.mcpEndpoint);
        }
    }

    public record PlanDto(Long id, String name, String description, String tier, int rpmLimit, long dailyQuota,
            long monthlyQuota, boolean approvalRequired, boolean active, Long apiProductId) {
        public static PlanDto of(ApplicationPlan p) {
            return new PlanDto(p.id, p.name, p.description, p.tier, p.rpmLimit, p.dailyQuota, p.monthlyQuota,
                    p.approvalRequired, p.active, p.apiProductId);
        }
    }

    public record ApplicationDto(Long id, String name, String description, String organization, String environment,
            String callbackUrl, String technicalContact, Instant createdAt) {
        public static ApplicationDto of(Application a) {
            return new ApplicationDto(a.id, a.name, a.description, a.organization, a.environment.name(),
                    a.callbackUrl, a.technicalContact, a.createdAt);
        }
    }

    public record CreateApplicationRequest(@NotBlank String name, String description, String organization,
            String environment, String callbackUrl, String technicalContact) {
    }

    public record SubscriptionDto(Long id, Long apiProductId, String apiProductName, Long applicationId,
            String applicationName, Long applicationPlanId, String planTier, String status, String environment,
            String useCase, String apiKeyPreview, Instant createdAt, Instant approvedAt, String rejectionReason) {
    }

    public record CreateSubscriptionRequest(@NotNull Long apiProductId, @NotNull Long applicationId,
            @NotNull Long applicationPlanId, String environment, String useCase) {
    }

    /** Returned once, at creation/rotation: includes the plaintext key. */
    public record ApiCredentialDto(String keyId, String apiKey, String keyPreview, String headerName,
            String hostname, String curlExample) {
    }

    public record ProfileDto(Long id, String username, String email, String displayName, String organization,
            List<String> roles, List<ApplicationDto> applications, List<SubscriptionDto> subscriptions) {
        public static ProfileDto of(PortalUser u, List<ApplicationDto> apps, List<SubscriptionDto> subs) {
            return new ProfileDto(u.id, u.username, u.email, u.displayName, u.organization,
                    List.copyOf(u.roles), apps, subs);
        }
    }

    public record ApiKeyDto(Long id, String keyPreview, String status, Instant createdAt, Instant rotatedAt,
            Instant revokedAt) {
        public static ApiKeyDto of(ApiKey k) {
            return new ApiKeyDto(k.id, k.keyPreview, k.status.name(), k.createdAt, k.rotatedAt, k.revokedAt);
        }
    }

    public record UsageDto(long totalRequests, long successCount, long blockedCount, long error4xxCount,
            long error5xxCount, double avgLatencyMs, long limitRemaining, double usagePercent, Instant quotaResetAt,
            List<UsageSummary.Point> series) {
        public static UsageDto of(UsageSummary s) {
            return new UsageDto(s.totalRequests(), s.successCount(), s.blockedCount(), s.error4xxCount(),
                    s.error5xxCount(), s.avgLatencyMs(), s.limitRemaining(), s.usagePercent(), s.quotaResetAt(),
                    s.series());
        }
    }

    public record AdminApiRequest(@NotBlank String name, @NotBlank String displayName, String description,
            String version, String status, String owner, String baseUrl, String openApiSpecUrl, String approvalMode,
            List<String> tags, String contactTeam, String contactEmail, Boolean published) {
    }

    public record ReviewRequest(String reason) {
    }

    /** POST result that may carry a one-time credential (auto-approve / approve). */
    public record SubscriptionResultDto(SubscriptionDto subscription, ApiCredentialDto credential) {
    }
}
