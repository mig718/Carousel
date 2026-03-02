package com.carousel.gateway.audit;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AuditTrailGatewayFilter implements GlobalFilter, Ordered {

    private static final List<HttpMethod> TRACKED_METHODS = List.of(HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE);

    private final AuditTrailService auditTrailService;
    private final JwtIdentityService jwtIdentityService;

    public AuditTrailGatewayFilter(AuditTrailService auditTrailService, JwtIdentityService jwtIdentityService) {
        this.auditTrailService = auditTrailService;
        this.jwtIdentityService = jwtIdentityService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();
        HttpMethod method = request.getMethod();

        if (method == null || !path.startsWith("/api/") || !TRACKED_METHODS.contains(method) || shouldIgnore(path)) {
            return chain.filter(exchange);
        }

        String actorEmail = normalize(request.getHeaders().getFirst("X-Authenticated-Email"));
        String requestId = normalize(request.getHeaders().getFirst("X-Request-Id"));
        String sessionId = normalize(request.getHeaders().getFirst("X-Session-Id"));

        return chain.filter(exchange)
                .then(Mono.defer(() -> {
                    HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
                    int status = statusCode != null ? statusCode.value() : 200;

                    AuditEvent event = new AuditEvent();
                    event.setActorEmail(resolveActor(actorEmail, path, request));
                    event.setActionType(resolveActionType(path, method));
                    event.setHttpMethod(method.name());
                    event.setRequestPath(path);
                    event.setResourceType(resolveResourceType(path));
                    event.setResourceId(resolveResourceId(path));
                    event.setStatusCode(status);
                    event.setSuccess(status >= 200 && status < 300);
                    event.setRequestId(requestId);
                    event.setSessionId(sessionId);
                    event.setDetails(trimDetails(request.getURI().getQuery()));

                    return auditTrailService.record(event).onErrorResume(ex -> Mono.empty());
                }));
    }

    private boolean shouldIgnore(String path) {
        return "/api/auth/validate".equals(path);
    }

    private String resolveActor(String actorEmail, String path, ServerHttpRequest request) {
        if (actorEmail != null && !actorEmail.isBlank()) {
            return actorEmail;
        }

        String fromAuthorization = jwtIdentityService.extractEmail(request.getHeaders().getFirst("Authorization")).orElse(null);
        if (fromAuthorization != null && !fromAuthorization.isBlank()) {
            return fromAuthorization;
        }

        if ("/api/auth/login".equals(path)) {
            String hinted = normalize(request.getHeaders().getFirst("X-Login-Email"));
            if (hinted != null && !hinted.isBlank()) {
                return hinted;
            }

            String responseHint = normalize(request.getHeaders().getFirst("X-Authenticated-Email"));
            if (responseHint != null && !responseHint.isBlank()) {
                return responseHint;
            }
        }

        return "unknown";
    }

    private AuditActionType resolveActionType(String path, HttpMethod method) {
        if (path.contains("/login")) {
            return AuditActionType.LOGIN;
        }

        if (path.contains("/logout")) {
            return AuditActionType.LOGOUT;
        }

        if (method == HttpMethod.POST) {
            return AuditActionType.CREATE;
        }

        if (method == HttpMethod.PUT || method == HttpMethod.PATCH) {
            return AuditActionType.UPDATE;
        }

        if (method == HttpMethod.DELETE) {
            return AuditActionType.DELETE;
        }

        return AuditActionType.OTHER;
    }

    private String resolveResourceType(String path) {
        String[] segments = path.split("/");
        if (segments.length >= 3) {
            return segments[2];
        }
        return "unknown";
    }

    private String resolveResourceId(String path) {
        String[] segments = path.split("/");
        if (segments.length >= 5) {
            String candidate = segments[4];
            if (!candidate.isBlank() && !"assign".equalsIgnoreCase(candidate) && !"history".equalsIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return "";
    }

    private String trimDetails(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }

        String value = query.trim();
        return value.length() > 512 ? value.substring(0, 512) : value;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    public int getOrder() {
        return -90;
    }
}
