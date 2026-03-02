package com.carousel.gateway.config;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class JwtAuthenticationGatewayFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret:carousel-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    private static final Set<String> PUBLIC_EXACT_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/validate",
            "/api/auth/verify-email",
            "/api/users/register",
            "/api/users/verify",
            "/api/health",
            "/health",
            "/swagger-ui.html"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        if (!path.startsWith("/api/")) {
            return chain.filter(exchange);
        }

        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeAuthError(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "NOT_LOGGED_IN", "Missing bearer token");
        }

        String token = authHeader.substring(7);
        String authenticatedEmail;

        try {
            authenticatedEmail = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (JwtException | IllegalArgumentException ex) {
            return writeAuthError(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "NOT_LOGGED_IN", "Token expired or invalid");
        }

        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            return writeAuthError(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "NOT_LOGGED_IN", "Token subject is missing");
        }

        if (!matchesAuthenticatedUser(authenticatedEmail, exchange.getRequest().getQueryParams())) {
            return writeAuthError(exchange.getResponse(), HttpStatus.FORBIDDEN, "FORBIDDEN", "Requester identity mismatch");
        }

        ServerHttpRequest requestWithIdentity = exchange.getRequest().mutate()
                .header("X-Authenticated-Email", authenticatedEmail)
                .build();

        return chain.filter(exchange.mutate().request(requestWithIdentity).build());
    }

    private boolean isPublicPath(String path) {
        if (PUBLIC_EXACT_PATHS.contains(path)) {
            return true;
        }

        return path.startsWith("/swagger-ui/")
            || path.startsWith("/webjars/")
                || path.startsWith("/v3/api-docs")
                || path.endsWith("/v3/api-docs")
                || path.endsWith("/health");
    }

    private boolean matchesAuthenticatedUser(String authenticatedEmail, MultiValueMap<String, String> queryParams) {
        return matchesIfPresent(authenticatedEmail, queryParams, "email")
                && matchesIfPresent(authenticatedEmail, queryParams, "requesterEmail")
                && matchesIfPresent(authenticatedEmail, queryParams, "approverEmail");
    }

    private boolean matchesIfPresent(String authenticatedEmail, MultiValueMap<String, String> queryParams, String key) {
        String value = queryParams.getFirst(key);
        if (value == null || value.isBlank()) {
            return true;
        }
        return authenticatedEmail.equalsIgnoreCase(value);
    }

    private Mono<Void> writeAuthError(ServerHttpResponse response, HttpStatus status, String errorCode, String message) {
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format("{\"errorCode\":\"%s\",\"message\":\"%s\"}", errorCode, message);
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
