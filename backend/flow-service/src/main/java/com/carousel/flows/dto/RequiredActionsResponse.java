package com.carousel.flows.dto;

import java.util.List;

public record RequiredActionsResponse(
        String flowId,
        String stateId,
        List<FlowActionDto> actions
) {
}
