package io.kuadrant.devportal.api;

import java.util.List;

import io.kuadrant.devportal.api.Dtos.ApiCredentialDto;
import io.kuadrant.devportal.api.Dtos.ApplicationDto;
import io.kuadrant.devportal.api.Dtos.CreateApplicationRequest;
import io.kuadrant.devportal.api.Dtos.CreateSubscriptionRequest;
import io.kuadrant.devportal.api.Dtos.ProfileDto;
import io.kuadrant.devportal.api.Dtos.SubscriptionDto;
import io.kuadrant.devportal.api.Dtos.SubscriptionResultDto;
import io.kuadrant.devportal.api.Dtos.UsageDto;
import io.kuadrant.devportal.domain.Application;
import io.kuadrant.devportal.domain.Enums.Environment;
import io.kuadrant.devportal.domain.PortalUser;
import io.kuadrant.devportal.domain.Subscription;
import io.kuadrant.devportal.rhcl.RhclIntegrationService;
import io.kuadrant.devportal.rhcl.UsageQuery;
import io.kuadrant.devportal.security.CurrentUser;
import io.kuadrant.devportal.service.SubscriptionService;

import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

/** Authenticated consumer endpoints (spec §6 User APIs). */
@Path("/api/me")
@Produces(MediaType.APPLICATION_JSON)
public class MeResource {

    @Inject
    CurrentUser currentUser;

    @Inject
    SubscriptionService subscriptions;

    @Inject
    Instance<RhclIntegrationService> rhcl;

    @GET
    public ProfileDto me() {
        PortalUser u = currentUser.get();
        List<ApplicationDto> apps = Application.listForUser(u.id).stream().map(ApplicationDto::of).toList();
        List<SubscriptionDto> subs = Subscription.listForUser(u.id).stream()
                .map(Mappers::toSubscriptionDto).toList();
        return ProfileDto.of(u, apps, subs);
    }

    @GET
    @Path("/applications")
    public List<ApplicationDto> applications() {
        PortalUser u = currentUser.get();
        return Application.listForUser(u.id).stream().map(ApplicationDto::of).toList();
    }

    @POST
    @Path("/applications")
    @Transactional
    public ApplicationDto createApplication(@Valid CreateApplicationRequest req) {
        PortalUser u = currentUser.get();
        Application a = new Application();
        a.name = req.name();
        a.description = req.description();
        a.organization = req.organization() != null ? req.organization() : u.organization;
        a.environment = parseEnv(req.environment());
        a.callbackUrl = req.callbackUrl();
        a.technicalContact = req.technicalContact() != null ? req.technicalContact() : u.email;
        a.ownerUserId = u.id;
        a.persist();
        return ApplicationDto.of(a);
    }

    @GET
    @Path("/subscriptions")
    public List<SubscriptionDto> subscriptionsList() {
        PortalUser u = currentUser.get();
        return Subscription.listForUser(u.id).stream().map(Mappers::toSubscriptionDto).toList();
    }

    @POST
    @Path("/subscriptions")
    public SubscriptionResultDto subscribe(@Valid CreateSubscriptionRequest req) {
        PortalUser u = currentUser.get();
        Subscription sub = subscriptions.request(u, req.apiProductId(), req.applicationId(),
                req.applicationPlanId(), req.environment(), req.useCase());
        ApiCredentialDto cred = subscriptions.consumeLastCredential(); // non-null only on auto-approve
        return new SubscriptionResultDto(Mappers.toSubscriptionDto(sub), cred);
    }

    @GET
    @Path("/subscriptions/{id}")
    public SubscriptionDto subscription(@PathParam("id") Long id) {
        PortalUser u = currentUser.get();
        Subscription sub = Subscription.findById(id);
        if (sub == null || !sub.userId.equals(u.id)) {
            throw new NotFoundException();
        }
        return Mappers.toSubscriptionDto(sub);
    }

    @POST
    @Path("/subscriptions/{id}/rotate-key")
    public ApiCredentialDto rotateKey(@PathParam("id") Long id) {
        PortalUser u = currentUser.get();
        return subscriptions.rotateKey(u, id);
    }

    @GET
    @Path("/usage")
    public UsageDto usage(@QueryParam("subscriptionId") Long subscriptionId,
            @QueryParam("days") @jakarta.ws.rs.DefaultValue("7") int days) {
        PortalUser u = currentUser.get();
        Subscription sub = Subscription.findById(subscriptionId);
        if (sub == null || !sub.userId.equals(u.id)) {
            throw new BadRequestException("subscriptionId required and must belong to the user");
        }
        return UsageDto.of(rhcl.get().getUsage(sub, UsageQuery.lastDays(days)));
    }

    private static Environment parseEnv(String env) {
        if (env == null || env.isBlank()) {
            return Environment.SANDBOX;
        }
        try {
            return Environment.valueOf(env.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Environment.SANDBOX;
        }
    }
}
