package io.kuadrant.devportal.api;

import java.time.Instant;
import java.util.List;

import io.kuadrant.devportal.api.Dtos.AdminApiRequest;
import io.kuadrant.devportal.api.Dtos.ApiCredentialDto;
import io.kuadrant.devportal.api.Dtos.ApiProductDto;
import io.kuadrant.devportal.api.Dtos.ReviewRequest;
import io.kuadrant.devportal.api.Dtos.SubscriptionDto;
import io.kuadrant.devportal.api.Dtos.SubscriptionResultDto;
import io.kuadrant.devportal.domain.ApiProduct;
import io.kuadrant.devportal.domain.Enums.ApiStatus;
import io.kuadrant.devportal.domain.Enums.ApprovalMode;
import io.kuadrant.devportal.domain.Subscription;
import io.kuadrant.devportal.security.CurrentUser;
import io.kuadrant.devportal.security.Roles;
import io.kuadrant.devportal.service.SubscriptionService;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

/**
 * Admin / API-owner endpoints (spec §6 Admin APIs). Every method requires the
 * {@code api-admin} or {@code api-owner} role, checked against the
 * authenticated identity.
 */
@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminResource {

    @Inject
    CurrentUser currentUser;

    @Inject
    SubscriptionService subscriptions;

    private void requireAdminOrOwner() {
        if (!currentUser.hasRole(Roles.ADMIN) && !currentUser.hasRole(Roles.OWNER)) {
            throw new PortalForbiddenException("Requires role api-admin or api-owner");
        }
    }

    @POST
    @Path("/apis")
    @Transactional
    public ApiProductDto createApi(@Valid AdminApiRequest req) {
        requireAdminOrOwner();
        ApiProduct p = new ApiProduct();
        apply(p, req);
        p.createdAt = Instant.now();
        p.persist();
        return ApiProductDto.of(p);
    }

    @PUT
    @Path("/apis/{id}")
    @Transactional
    public ApiProductDto updateApi(@PathParam("id") Long id, @Valid AdminApiRequest req) {
        requireAdminOrOwner();
        ApiProduct p = ApiProduct.findById(id);
        if (p == null) {
            throw new NotFoundException();
        }
        apply(p, req);
        return ApiProductDto.of(p);
    }

    @POST
    @Path("/apis/{id}/openapi")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public ApiProductDto uploadOpenApi(@PathParam("id") Long id, OpenApiUpload body) {
        requireAdminOrOwner();
        ApiProduct p = ApiProduct.findById(id);
        if (p == null) {
            throw new NotFoundException();
        }
        if (body == null || body.openApiSpecUrl == null || body.openApiSpecUrl.isBlank()) {
            throw new jakarta.ws.rs.BadRequestException("openApiSpecUrl required");
        }
        p.openApiSpecUrl = body.openApiSpecUrl;
        p.updatedAt = Instant.now();
        return ApiProductDto.of(p);
    }

    @GET
    @Path("/subscriptions")
    public List<SubscriptionDto> listSubscriptions(@QueryParam("status") String status) {
        requireAdminOrOwner();
        List<Subscription> subs = status != null
                ? Subscription.list("status", io.kuadrant.devportal.domain.Enums.SubscriptionStatus.valueOf(status.toUpperCase()))
                : Subscription.listAll();
        return subs.stream().map(Mappers::toSubscriptionDto).toList();
    }

    @POST
    @Path("/subscriptions/{id}/approve")
    public SubscriptionResultDto approve(@PathParam("id") Long id) {
        requireAdminOrOwner();
        Subscription sub = subscriptions.approve(id, currentUser.get().username);
        ApiCredentialDto cred = subscriptions.consumeLastCredential();
        return new SubscriptionResultDto(Mappers.toSubscriptionDto(sub), cred);
    }

    @POST
    @Path("/subscriptions/{id}/reject")
    public SubscriptionDto reject(@PathParam("id") Long id, ReviewRequest req) {
        requireAdminOrOwner();
        Subscription sub = subscriptions.reject(id, currentUser.get().username,
                req != null ? req.reason() : null);
        return Mappers.toSubscriptionDto(sub);
    }

    @POST
    @Path("/subscriptions/{id}/suspend")
    public SubscriptionDto suspend(@PathParam("id") Long id) {
        requireAdminOrOwner();
        Subscription sub = subscriptions.suspend(id, currentUser.get().username);
        return Mappers.toSubscriptionDto(sub);
    }

    private static void apply(ApiProduct p, AdminApiRequest req) {
        p.name = req.name();
        p.displayName = req.displayName();
        p.description = req.description();
        p.version = req.version();
        if (req.status() != null) {
            p.status = ApiStatus.valueOf(req.status().toUpperCase());
        }
        p.owner = req.owner();
        p.baseUrl = req.baseUrl();
        p.openApiSpecUrl = req.openApiSpecUrl();
        if (req.approvalMode() != null) {
            p.approvalMode = ApprovalMode.valueOf(req.approvalMode().toUpperCase());
        }
        if (req.tags() != null) {
            p.tags = req.tags();
        }
        p.contactTeam = req.contactTeam();
        p.contactEmail = req.contactEmail();
        if (req.published() != null) {
            p.published = req.published();
        }
        p.updatedAt = Instant.now();
    }

    /** Body for the OpenAPI upload endpoint (URL reference form). */
    public static class OpenApiUpload {
        public String openApiSpecUrl;
    }
}
