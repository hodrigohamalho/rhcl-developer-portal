package io.kuadrant.devportal.api;

import java.util.List;

import io.kuadrant.devportal.api.Dtos.PlanDto;
import io.kuadrant.devportal.domain.ApplicationPlan;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

/** Public plan listing (spec §6: GET /api/plans). */
@Path("/api/plans")
@Produces(MediaType.APPLICATION_JSON)
public class PlansResource {

    @GET
    public List<PlanDto> list(@QueryParam("apiProductId") Long apiProductId) {
        List<ApplicationPlan> plans = apiProductId != null
                ? ApplicationPlan.listForProduct(apiProductId)
                : ApplicationPlan.list("active", true);
        return plans.stream().map(PlanDto::of).toList();
    }
}
