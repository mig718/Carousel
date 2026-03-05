package com.carousel.flows.controller;

import com.carousel.flows.dto.*;
import com.carousel.flows.service.FlowManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Flow Management", description = "Manage flows, states, and actions")
public class FlowController {
    private final FlowManagementService flowManagementService;

    public FlowController(FlowManagementService flowManagementService) {
        this.flowManagementService = flowManagementService;
    }

    @GetMapping
    @Operation(summary = "List flows", description = "Returns all configured flows")
    public ResponseEntity<List<FlowDto>> getFlows() {
        return ResponseEntity.ok(flowManagementService.getFlows());
    }

    @GetMapping("/action-templates")
    @Operation(summary = "List action templates", description = "Returns reusable action templates")
    public ResponseEntity<List<FlowActionTemplateDto>> getActionTemplates() {
        return ResponseEntity.ok(flowManagementService.getActionTemplates());
    }

    @PostMapping("/action-templates")
    @Operation(summary = "Create action template", description = "Creates a reusable action template")
    public ResponseEntity<FlowActionTemplateDto> createActionTemplate(@RequestBody CreateFlowActionTemplateRequest request) {
        return ResponseEntity.ok(flowManagementService.createActionTemplate(request));
    }

    @GetMapping("/{flowId}")
    @Operation(summary = "Get flow", description = "Returns a single flow with all states and actions")
    public ResponseEntity<FlowDto> getFlowById(@PathVariable String flowId) {
        return ResponseEntity.ok(flowManagementService.getFlowById(flowId));
    }

    @PostMapping
    @Operation(summary = "Create flow", description = "Creates a new flow definition")
    public ResponseEntity<FlowDto> createFlow(@RequestBody CreateFlowRequest request) {
        return ResponseEntity.ok(flowManagementService.createFlow(request));
    }

    @PostMapping("/{flowId}/states")
    @Operation(summary = "Add state", description = "Adds a state to a flow and seeds predefined actions")
    public ResponseEntity<FlowStateDto> addState(@PathVariable String flowId, @RequestBody CreateFlowStateRequest request) {
        return ResponseEntity.ok(flowManagementService.addState(flowId, request));
    }

    @PostMapping("/{flowId}/states/{stateId}/actions")
    @Operation(summary = "Add action", description = "Adds a custom action to a flow state")
    public ResponseEntity<FlowActionDto> addAction(
            @PathVariable String flowId,
            @PathVariable String stateId,
            @RequestBody CreateFlowActionRequest request
    ) {
        return ResponseEntity.ok(flowManagementService.addAction(flowId, stateId, request));
    }

    @GetMapping("/{flowId}/states/{stateId}/required-actions")
    @Operation(summary = "Required actions", description = "Lists required/available actions for a flow state")
    public ResponseEntity<RequiredActionsResponse> getRequiredActions(
            @PathVariable String flowId,
            @PathVariable String stateId
    ) {
        return ResponseEntity.ok(flowManagementService.getRequiredActions(flowId, stateId));
    }

    @GetMapping("/{flowId}/states/{stateId}/next-state")
    @Operation(summary = "Next state", description = "Gets next state from current state and optional action")
    public ResponseEntity<NextStateResponse> getNextState(
            @PathVariable String flowId,
            @PathVariable String stateId,
            @RequestParam(required = false) String actionId
    ) {
        return ResponseEntity.ok(flowManagementService.getNextState(flowId, stateId, actionId));
    }
}
