package io.kuadrant.devportal.domain;

/**
 * Shared domain enumerations for the Developer Portal.
 * Kept in one file so the small, closely-related value sets are easy to scan.
 */
public final class Enums {

    private Enums() {
    }

    /** Lifecycle status of an API product, as shown in the catalog. */
    public enum ApiStatus {
        ACTIVE,
        DEPRECATED,
        BETA
    }

    /** Target environment for an Application / Subscription. */
    public enum Environment {
        SANDBOX,
        STAGING,
        PRODUCTION
    }

    /** Whether a subscription request is auto-approved or requires a human. */
    public enum ApprovalMode {
        AUTOMATIC,
        MANUAL
    }

    /** Subscription lifecycle, mirrors the RHCL APIKeyRequest/APIKey phases. */
    public enum SubscriptionStatus {
        PENDING,
        APPROVED,
        REJECTED,
        SUSPENDED,
        REVOKED
    }

    /** API key lifecycle. */
    public enum ApiKeyStatus {
        ACTIVE,
        ROTATED,
        REVOKED
    }

    /**
     * Wire protocol exposed by the product. Most APIs are plain {@code REST};
     * {@code MCP} marks a Model Context Protocol server (Kuadrant's
     * {@code MCPServerRegistration}) — same subscription / API-key flow,
     * different "Try it" experience (tools instead of curl).
     */
    public enum ApiProtocol {
        REST,
        MCP
    }
}
