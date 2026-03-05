package com.carousel.flows.dto;

public record NextStateResponse(
        String flowId,
        String currentStateId,
        String actionId,
        String nextStateId,
        String nextStateName
) {
}
