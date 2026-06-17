package io.kuadrant.devportal.rhcl;

/**
 * Result of provisioning an API key against RHCL/Kuadrant.
 *
 * @param keyId       opaque id of the credential (RHCL APIKey name)
 * @param plainKey    the plaintext key — present ONLY at creation/rotation time
 * @param keyPreview  masked preview safe to persist/display later
 * @param headerName  the header the gateway expects (e.g. {@code api-key})
 * @param hostname    the gateway hostname the consumer should call
 * @param secretRef   {@code namespace/name} of the backing Authorino Secret
 */
public record ApiCredential(
        String keyId,
        String plainKey,
        String keyPreview,
        String headerName,
        String hostname,
        String secretRef) {
}
