package com.carousel.role.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestTraceFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestTraceFilter.class);

    @Value("${spring.application.name:role-service}")
    private String serviceName;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = normalize(request.getHeader("X-Request-Id"));
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }

        String sessionId = normalize(request.getHeader("X-Session-Id"));
        if (sessionId == null) {
            sessionId = "missing";
        }

        response.setHeader("X-Request-Id", requestId);

        MDC.put("requestId", requestId);
        MDC.put("sessionId", sessionId);
        MDC.put("service", serviceName);

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            int status = response.getStatus();

            logger.info(
                    "{\"event\":\"request_trace\",\"service\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\",\"method\":\"{}\",\"path\":\"{}\",\"status\":{},\"durationMs\":{}}",
                    serviceName,
                    requestId,
                    sessionId,
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    durationMs
            );

            MDC.remove("requestId");
            MDC.remove("sessionId");
            MDC.remove("service");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
