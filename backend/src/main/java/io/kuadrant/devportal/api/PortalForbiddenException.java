package io.kuadrant.devportal.api;

import jakarta.ws.rs.ForbiddenException;

/** Thrown when a user acts on a resource they do not own. */
public class PortalForbiddenException extends ForbiddenException {
    public PortalForbiddenException(String message) {
        super(message);
    }
}
