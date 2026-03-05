package com.carousel.flows.dto;

import java.util.List;

public record FlowDto(
        String id,
        String name,
        String description,
        String initialStateId,
        List<FlowStateDto> states
) {
}
