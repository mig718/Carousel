package com.carousel.gateway.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtAuthenticationGatewayFilterTest {

    private static final String JWT_SECRET = "carousel-secret-key-for-jwt-token-generation-and-validation";

    private JwtAuthenticationGatewayFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationGatewayFilter();
        ReflectionTestUtils.setField(filter, "jwtSecret", JWT_SECRET);
    }

    @ParameterizedTest
    @MethodSource("protectedEndpointUris")
    void returnsNotLoggedInWhenBearerTokenMissing(String uri) {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(uri).build());
        AtomicBoolean chainCalled = new AtomicBoolean(false);

        GatewayFilterChain chain = new RecordingGatewayFilterChain(chainCalled);

        filter.filter(exchange, chain).block();

        MockServerHttpResponse response = exchange.getResponse();
        String body = response.getBodyAsString().block();

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(body != null && body.contains("\"errorCode\":\"NOT_LOGGED_IN\""));
        assertTrue(body != null && body.contains("Missing bearer token"));
        assertFalse(chainCalled.get());
    }

    @ParameterizedTest
    @MethodSource("protectedEndpointUris")
    void returnsNotLoggedInWhenBearerTokenInvalid(String uri) {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get(uri)
                        .header("Authorization", "Bearer invalid-token")
                        .build()
        );
        AtomicBoolean chainCalled = new AtomicBoolean(false);

        GatewayFilterChain chain = new RecordingGatewayFilterChain(chainCalled);

        filter.filter(exchange, chain).block();

        MockServerHttpResponse response = exchange.getResponse();
        String body = response.getBodyAsString().block();

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(body != null && body.contains("\"errorCode\":\"NOT_LOGGED_IN\""));
        assertTrue(body != null && body.contains("Token expired or invalid"));
        assertFalse(chainCalled.get());
    }

    @ParameterizedTest
    @MethodSource("publicEndpointUris")
    void doesNotRequireBearerTokenForPublicEndpoints(String uri) {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(uri).build());
        AtomicBoolean chainCalled = new AtomicBoolean(false);

        GatewayFilterChain chain = new RecordingGatewayFilterChain(chainCalled);

        filter.filter(exchange, chain).block();

        MockServerHttpResponse response = exchange.getResponse();
        String body = response.getBodyAsString().block();

        assertTrue(chainCalled.get());
        assertEquals(null, response.getStatusCode());
        assertTrue(body == null || !body.contains("NOT_LOGGED_IN"));
    }

    private static Stream<String> protectedEndpointUris() {
        return Stream.of(
                "/api/users/me?email=user@example.com",
                "/api/approvals/pending",
                "/api/roles/user/user@example.com",
                "/api/inventory/items?requesterEmail=user@example.com"
        );
    }

    private static Stream<String> publicEndpointUris() {
        return Stream.of(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/validate",
                "/api/users/register",
                "/api/users/verify?token=abc123",
                "/api/health"
        );
    }

    private static class RecordingGatewayFilterChain implements GatewayFilterChain {
        private final AtomicBoolean called;

        private RecordingGatewayFilterChain(AtomicBoolean called) {
            this.called = called;
        }

        @Override
        public Mono<Void> filter(ServerWebExchange exchange) {
            called.set(true);
            return exchange.getResponse().setComplete();
        }
    }
}
