package com.carousel.flows.dto;

public record FlowActionDto(
        String id,
        String stateId,
        String name,
        String actionType,
        boolean awaitable,
        boolean requiresApproval,
        String approvalType,
        String approvalRole,
        String nextStateId,
        boolean predefined
) {
}
