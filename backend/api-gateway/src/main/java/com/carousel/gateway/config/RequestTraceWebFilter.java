package com.carousel.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class RequestTraceWebFilter implements WebFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestTraceWebFilter.class);

    @Value("${spring.application.name:api-gateway}")
    private String serviceName;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String requestId = normalize(exchange.getRequest().getHeaders().getFirst("X-Request-Id"));
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }

        String sessionId = normalize(exchange.getRequest().getHeaders().getFirst("X-Session-Id"));
        if (sessionId == null) {
            sessionId = "missing";
        }

        final String finalRequestId = requestId;
        final String finalSessionId = sessionId;

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(request -> request.headers(headers -> {
                    headers.set("X-Request-Id", finalRequestId);
                    headers.set("X-Session-Id", finalSessionId);
                }))
                .build();

        mutatedExchange.getResponse().getHeaders().set("X-Request-Id", finalRequestId);

        long start = System.currentTimeMillis();
        return chain.filter(mutatedExchange)
                .doFinally(signalType -> {
                    HttpStatusCode statusCode = mutatedExchange.getResponse().getStatusCode();
                    int status = statusCode != null ? statusCode.value() : 200;
                    long durationMs = System.currentTimeMillis() - start;

                    logger.info(
                            "{\"event\":\"request_trace\",\"service\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\",\"method\":\"{}\",\"path\":\"{}\",\"status\":{},\"durationMs\":{}}",
                            serviceName,
                            finalRequestId,
                            finalSessionId,
                            mutatedExchange.getRequest().getMethod(),
                            mutatedExchange.getRequest().getURI().getPath(),
                            status,
                            durationMs
                    );
                });
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
