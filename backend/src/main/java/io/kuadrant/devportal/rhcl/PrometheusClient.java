package io.kuadrant.devportal.rhcl;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Minimal Prometheus/Thanos query client. Talks to the in-cluster Thanos
 * querier ({@code portal.rhcl.prometheus-url}) using the pod's ServiceAccount
 * bearer token, so per-API traffic can back the usage dashboard (spec §4.8).
 * TLS verification is relaxed because the in-cluster endpoint serves a
 * cluster-internal certificate.
 */
@ApplicationScoped
public class PrometheusClient {

    private static final Logger LOG = Logger.getLogger(PrometheusClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    PortalConfig config;

    private HttpClient http;

    private HttpClient client() {
        if (http == null) {
            try {
                SSLContext ssl = SSLContext.getInstance("TLS");
                ssl.init(null, new TrustManager[] { TRUST_ALL }, new SecureRandom());
                http = HttpClient.newBuilder().sslContext(ssl).connectTimeout(Duration.ofSeconds(5)).build();
            } catch (Exception e) {
                http = HttpClient.newHttpClient();
            }
        }
        return http;
    }

    public boolean enabled() {
        return config.prometheusUrl().filter(s -> !s.isBlank()).isPresent();
    }

    /**
     * Run a {@code query_range} and return a list of buckets, each a map of
     * {@code response_code -> value}, ordered by time. The matching series are
     * grouped by the {@code response_code} label.
     */
    public List<Bucket> rangeByResponseCode(String selector, Instant from, Instant to, long stepSeconds) {
        String promql = "sum by (response_code) (increase(istio_requests_total{" + selector + "}[" + stepSeconds + "s]))";
        JsonNode data = queryRange(promql, from, to, stepSeconds);
        Map<Long, Map<String, Double>> byTime = new LinkedHashMap<>();
        if (data != null) {
            for (JsonNode series : data.path("result")) {
                String code = series.path("metric").path("response_code").asText("0");
                for (JsonNode v : series.path("values")) {
                    long ts = v.get(0).asLong();
                    double val = parseDouble(v.get(1).asText());
                    byTime.computeIfAbsent(ts, k -> new LinkedHashMap<>()).merge(code, val, Double::sum);
                }
            }
        }
        List<Bucket> out = new ArrayList<>();
        byTime.forEach((ts, codes) -> out.add(new Bucket(Instant.ofEpochSecond(ts), codes)));
        out.sort((a, b) -> a.timestamp().compareTo(b.timestamp()));
        return out;
    }

    /** Instant scalar query; returns NaN when unavailable. */
    public double queryScalar(String promql) {
        JsonNode data = query(promql);
        if (data != null) {
            for (JsonNode series : data.path("result")) {
                JsonNode val = series.path("value");
                if (val.isArray() && val.size() == 2) {
                    return parseDouble(val.get(1).asText());
                }
            }
        }
        return Double.NaN;
    }

    private JsonNode query(String promql) {
        return call("/api/v1/query?query=" + enc(promql));
    }

    private JsonNode queryRange(String promql, Instant from, Instant to, long step) {
        return call("/api/v1/query_range?query=" + enc(promql)
                + "&start=" + from.getEpochSecond() + "&end=" + to.getEpochSecond() + "&step=" + Math.max(60, step));
    }

    private JsonNode call(String path) {
        try {
            String base = config.prometheusUrl().orElse("");
            HttpRequest req = HttpRequest.newBuilder(URI.create(base + path))
                    .header("Authorization", "Bearer " + token())
                    .timeout(Duration.ofSeconds(15)).GET().build();
            HttpResponse<String> resp = client().send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                LOG.warnf("Prometheus query failed (%d): %s", resp.statusCode(), truncate(resp.body()));
                return null;
            }
            return MAPPER.readTree(resp.body()).path("data");
        } catch (Exception e) {
            LOG.warnf("Prometheus query error: %s", e.getMessage());
            return null;
        }
    }

    private String token() {
        try {
            return Files.readString(Path.of(config.prometheusTokenPath())).trim();
        } catch (Exception e) {
            return "";
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private static double parseDouble(String s) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private static String truncate(String s) {
        return s == null ? "" : s.substring(0, Math.min(200, s.length()));
    }

    /** One time bucket: response_code -> increase value. */
    public record Bucket(Instant timestamp, Map<String, Double> byCode) {
    }

    private static final X509TrustManager TRUST_ALL = new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] c, String a) {
        }

        public void checkServerTrusted(X509Certificate[] c, String a) {
        }

        public X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[0];
        }
    };
}
