package io.kuadrant.devportal.security;

/** Portal role names. Expected to exist as Keycloak realm roles. */
public final class Roles {
    public static final String CONSUMER = "api-consumer";
    public static final String OWNER = "api-owner";
    public static final String ADMIN = "api-admin";

    private Roles() {
    }
}
