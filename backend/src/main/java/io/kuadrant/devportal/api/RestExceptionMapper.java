package io.kuadrant.devportal.api;

import java.util.Map;

import org.jboss.logging.Logger;

import io.kuadrant.devportal.service.PortalMetrics;

import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/** Renders exceptions as a consistent JSON envelope and counts errors. */
@Provider
public class RestExceptionMapper implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(RestExceptionMapper.class);

    @Inject
    PortalMetrics metrics;

    @Override
    public Response toResponse(Exception ex) {
        int status = 500;
        if (ex instanceof WebApplicationException wae) {
            status = wae.getResponse().getStatus();
        }
        if (status >= 500) {
            LOG.error("Unhandled error", ex);
            if (metrics != null) {
                metrics.incErrors();
            }
        }
        return Response.status(status)
                .entity(Map.of("error", ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage(),
                        "status", status))
                .build();
    }
}
