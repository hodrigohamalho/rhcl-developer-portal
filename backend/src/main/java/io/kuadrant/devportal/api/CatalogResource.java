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

    /**
     * MCP {@code tools/list} proxy. Browser can't JSON-RPC to the MCP
     * endpoint directly because of CORS; the backend forwards the call
     * (optionally with the consumer's API key) and returns the raw tools
     * array. Same shape works for the playground later via {@code
     * /apis/{id}/mcp/call}.
     *
     * Path is GET because tools listing is idempotent and we want it
     * cacheable; the actual JSON-RPC is a POST under the hood.
     */
    @GET
    @Path("/apis/{id}/mcp/tools")
    @Produces(MediaType.APPLICATION_JSON)
    public Response mcpTools(@PathParam("id") Long id,
            @jakarta.ws.rs.QueryParam("apiKey") String apiKey) {
        ApiProduct p = ApiProduct.findById(id);
        if (p == null || p.mcpEndpoint == null || p.mcpEndpoint.isBlank()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\":\"product has no MCP endpoint\"}").build();
        }
        // Minimal JSON-RPC envelope. MCP doesn't require an init handshake
        // before tools/list as long as the server is in the stateless mode
        // Kuadrant publishes.
        String body = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}";
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(p.mcpEndpoint))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10));
            if (apiKey != null && !apiKey.isBlank()) {
                b.header("api-key", apiKey);
            }
            HttpResponse<String> resp = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
            String ct = resp.headers().firstValue("content-type").orElse("application/json");
            return Response.status(resp.statusCode()).type(ct).entity(resp.body()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity("{\"error\":\"failed to list tools: " + e.getMessage() + "\"}").build();
        }
    }

    /** MCP {@code tools/call} proxy — Phase C playground. */
    @jakarta.ws.rs.POST
    @Path("/apis/{id}/mcp/call")
    @jakarta.ws.rs.Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response mcpCall(@PathParam("id") Long id, java.util.Map<String, Object> req) {
        ApiProduct p = ApiProduct.findById(id);
        if (p == null || p.mcpEndpoint == null || p.mcpEndpoint.isBlank()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\":\"product has no MCP endpoint\"}").build();
        }
        String toolName = String.valueOf(req.getOrDefault("name", ""));
        Object args = req.getOrDefault("arguments", java.util.Map.of());
        Object apiKey = req.get("apiKey");
        // Build JSON-RPC envelope by hand to avoid pulling Jackson — small payload.
        String body = String.format(
                "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":%s,\"arguments\":%s}}",
                jsonString(toolName), jsonValue(args));
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(p.mcpEndpoint))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15));
            if (apiKey instanceof String s && !s.isBlank()) {
                b.header("api-key", s);
            }
            HttpResponse<String> resp = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
            String ct = resp.headers().firstValue("content-type").orElse("application/json");
            return Response.status(resp.statusCode()).type(ct).entity(resp.body()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity("{\"error\":\"failed to call tool: " + e.getMessage() + "\"}").build();
        }
    }

    private static String jsonString(String s) {
        StringBuilder out = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> out.append(c);
            }
        }
        return out.append('"').toString();
    }

    @SuppressWarnings("unchecked")
    private static String jsonValue(Object o) {
        if (o == null) return "null";
        if (o instanceof String s) return jsonString(s);
        if (o instanceof Number || o instanceof Boolean) return o.toString();
        if (o instanceof java.util.Map<?, ?> m) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (var e : ((java.util.Map<String, Object>) m).entrySet()) {
                if (!first) sb.append(',');
                sb.append(jsonString(e.getKey())).append(':').append(jsonValue(e.getValue()));
                first = false;
            }
            return sb.append('}').toString();
        }
        if (o instanceof java.util.List<?> l) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : l) {
                if (!first) sb.append(',');
                sb.append(jsonValue(item));
                first = false;
            }
            return sb.append(']').toString();
        }
        return jsonString(o.toString());
    }
}
