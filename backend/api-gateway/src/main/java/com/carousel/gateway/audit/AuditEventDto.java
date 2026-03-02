package com.carousel.gateway.audit;

import java.time.LocalDateTime;

public record AuditEventDto(
        String id,
        String actorEmail,
        String actionType,
        String httpMethod,
        String requestPath,
        String resourceType,
        String resourceId,
        int statusCode,
        boolean success,
        String requestId,
        String sessionId,
        String details,
        LocalDateTime createdAt
) {
}
