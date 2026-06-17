package io.kuadrant.devportal.api;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

import io.kuadrant.devportal.api.Dtos.ApiProductDto;
import io.kuadrant.devportal.api.Dtos.PlanDto;
import io.kuadrant.devportal.domain.ApiProduct;
import io.kuadrant.devportal.domain.ApplicationPlan;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/** Public catalog endpoints (spec §6 Public APIs). */
@Path("/api/catalog")
@Produces(MediaType.APPLICATION_JSON)
public class CatalogResource {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();

    @GET
    @Path("/apis")
    public List<ApiProductDto> list() {
        return ApiProduct.listPublished().stream().map(ApiProductDto::of).toList();
    }

    @GET
    @Path("/apis/{id}")
    public ApiProductDto get(@PathParam("id") Long id) {
        ApiProduct p = ApiProduct.findById(id);
        if (p == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        return ApiProductDto.of(p);
    }

    /** Server-side proxy for the OpenAPI spec, avoiding browser CORS issues. */
    @GET
    @Path("/apis/{id}/openapi")
    @Produces(MediaType.APPLICATION_JSON)
    public Response openapi(@PathParam("id") Long id) {
        ApiProduct p = ApiProduct.findById(id);
        if (p == null || p.openApiSpecUrl == null || p.openApiSpecUrl.isBlank()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\":\"no OpenAPI spec registered for this product\"}").build();
        }
        try {
            HttpResponse<String> resp = HTTP.send(
                    HttpRequest.newBuilder(URI.create(p.openApiSpecUrl)).GET()
                            .header("Accept", "application/json")
                            .timeout(Duration.ofSeconds(10)).build(),
                    HttpResponse.BodyHandlers.ofString());
            String ct = resp.headers().firstValue("content-type").orElse("application/json");
            return Response.status(resp.statusCode()).type(ct).entity(resp.body()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity("{\"error\":\"failed to fetch spec: " + e.getMessage() + "\"}").build();
        }
    }

    /** Plans available for a given product (used by the API detail page). */
    @GET
    @Path("/apis/{id}/plans")
    public List<PlanDto> plansForApi(@PathParam("id") Long id) {
        return ApplicationPlan.listForProduct(id).stream().map(PlanDto::of).toList();
    }
}
