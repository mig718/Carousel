package com.carousel.flows.dto;

import java.util.List;

public record FlowStateDto(
        String id,
        String name,
        String color,
        int sortOrder,
        List<FlowActionDto> actions
) {
}
