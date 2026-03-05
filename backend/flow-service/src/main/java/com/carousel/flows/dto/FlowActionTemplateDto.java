package com.carousel.flows.dto;

public record FlowActionTemplateDto(
        String id,
        String name,
        String actionType,
        boolean awaitable,
        boolean requiresApproval,
        String approvalType,
        String approvalRole,
        boolean predefined
) {
}
