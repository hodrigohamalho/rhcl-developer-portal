package io.kuadrant.devportal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import io.kuadrant.devportal.rhcl.ApiKeys;

/**
 * Plain unit test (no @QuarkusTest) so the build runs without Docker/DB.
 * Verifies the key-safety invariants from spec §9.
 */
class ApiKeysTest {

    @Test
    void generatesUniquePrefixedKeys() {
        String a = ApiKeys.generate();
        String b = ApiKeys.generate();
        assertTrue(a.startsWith("bk_live_"), "key must carry the live prefix");
        assertNotEquals(a, b, "keys must be unique");
    }

    @Test
    void maskHidesTheSecretButKeepsLast4() {
        String key = ApiKeys.generate();
        String masked = ApiKeys.mask(key);
        assertTrue(masked.contains("••••"), "mask must hide the body");
        assertTrue(masked.endsWith(key.substring(key.length() - 4)), "mask keeps last 4 chars");
        assertTrue(masked.length() < key.length(), "mask is shorter than the key");
    }

    @Test
    void hashIsStableAndHex() {
        String key = "bk_live_example";
        assertEquals(ApiKeys.hash(key), ApiKeys.hash(key), "hash must be deterministic");
        assertEquals(64, ApiKeys.hash(key).length(), "SHA-256 hex is 64 chars");
    }
}
