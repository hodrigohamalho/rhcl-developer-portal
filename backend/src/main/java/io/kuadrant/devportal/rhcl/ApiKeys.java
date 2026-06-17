package io.kuadrant.devportal.rhcl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Helpers for generating, masking and hashing API keys. The plaintext key is
 * never persisted — only the SHA-256 hash and a masked preview (spec §9).
 */
public final class ApiKeys {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PREFIX = "bk_live_";

    private ApiKeys() {
    }

    /** Generate a new opaque key, e.g. {@code bk_live_<32 url-safe bytes>}. */
    public static String generate() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Mask a key for display/storage: keep prefix + last 4 chars. */
    public static String mask(String key) {
        if (key == null || key.length() <= 8) {
            return "••••";
        }
        String last4 = key.substring(key.length() - 4);
        return PREFIX + "••••" + last4;
    }

    /** SHA-256 hex digest of the plaintext key. */
    public static String hash(String key) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
