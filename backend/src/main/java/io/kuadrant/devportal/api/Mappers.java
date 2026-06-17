package io.kuadrant.devportal.api;

import io.kuadrant.devportal.api.Dtos.SubscriptionDto;
import io.kuadrant.devportal.domain.ApiKey;
import io.kuadrant.devportal.domain.ApiProduct;
import io.kuadrant.devportal.domain.Application;
import io.kuadrant.devportal.domain.ApplicationPlan;
import io.kuadrant.devportal.domain.Subscription;

/** Mapping helpers that need to join across entities. */
public final class Mappers {

    private Mappers() {
    }

    public static SubscriptionDto toSubscriptionDto(Subscription s) {
        ApiProduct product = ApiProduct.findById(s.apiProductId);
        Application app = Application.findById(s.applicationId);
        ApplicationPlan plan = ApplicationPlan.findById(s.applicationPlanId);
        ApiKey key = ApiKey.findActiveForSubscription(s.id);
        return new SubscriptionDto(
                s.id, s.apiProductId, product != null ? product.displayName : null,
                s.applicationId, app != null ? app.name : null,
                s.applicationPlanId, plan != null ? plan.tier : null,
                s.status.name(), s.environment.name(), s.useCase,
                key != null ? key.keyPreview : null,
                s.createdAt, s.approvedAt, s.rejectionReason);
    }
}
