package com.carousel.flows.service;

import com.carousel.flows.domain.FlowAction;
import com.carousel.flows.domain.FlowActionTemplate;
import com.carousel.flows.domain.FlowDefinition;
import com.carousel.flows.domain.FlowState;
import com.carousel.flows.dto.*;
import com.carousel.flows.repository.FlowActionRepository;
import com.carousel.flows.repository.FlowActionTemplateRepository;
import com.carousel.flows.repository.FlowDefinitionRepository;
import com.carousel.flows.repository.FlowStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FlowManagementService {
    private final FlowDefinitionRepository flowDefinitionRepository;
    private final FlowStateRepository flowStateRepository;
    private final FlowActionRepository flowActionRepository;
    private final FlowActionTemplateRepository flowActionTemplateRepository;

    public FlowManagementService(
            FlowDefinitionRepository flowDefinitionRepository,
            FlowStateRepository flowStateRepository,
            FlowActionRepository flowActionRepository,
            FlowActionTemplateRepository flowActionTemplateRepository
    ) {
        this.flowDefinitionRepository = flowDefinitionRepository;
        this.flowStateRepository = flowStateRepository;
        this.flowActionRepository = flowActionRepository;
        this.flowActionTemplateRepository = flowActionTemplateRepository;
    }

    public List<FlowActionTemplateDto> getActionTemplates() {
        ensureDefaultTemplates();
        return flowActionTemplateRepository.findAll().stream()
                .sorted(Comparator.comparing(FlowActionTemplate::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toFlowActionTemplateDto)
                .toList();
    }

    @Transactional
    public FlowActionTemplateDto createActionTemplate(CreateFlowActionTemplateRequest request) {
        String name = requiredText(request.getName(), "Action name is required");
        String actionType = requiredText(request.getActionType(), "Action type is required").toUpperCase(Locale.ROOT);

        if (flowActionTemplateRepository.findByNameIgnoreCaseAndActionTypeIgnoreCase(name, actionType).isPresent()) {
            throw new RuntimeException("Action template already exists");
        }

        FlowActionTemplate template = new FlowActionTemplate();
        template.setName(name);
        template.setActionType(actionType);
        template.setAwaitable(Boolean.TRUE.equals(request.getAwaitable()));
        template.setRequiresApproval(Boolean.TRUE.equals(request.getRequiresApproval()));
        template.setApprovalType(optionalText(request.getApprovalType()));
        template.setApprovalRole(optionalText(request.getApprovalRole()));
        template.setPredefined(false);

        FlowActionTemplate saved = flowActionTemplateRepository.save(template);
        return toFlowActionTemplateDto(saved);
    }

    public List<FlowDto> getFlows() {
        return flowDefinitionRepository.findAll().stream()
                .sorted(Comparator.comparing(FlowDefinition::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toFlowDto)
                .toList();
    }

    public FlowDto getFlowById(String flowId) {
        FlowDefinition flow = getFlow(flowId);
        return toFlowDto(flow);
    }

    @Transactional
    public FlowDto createFlow(CreateFlowRequest request) {
        String name = requiredText(request.getName(), "Flow name is required");

        if (flowDefinitionRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Flow already exists");
        }

        FlowDefinition flow = new FlowDefinition();
        flow.setName(name);
        flow.setDescription(optionalText(request.getDescription()));

        FlowDefinition saved = flowDefinitionRepository.save(flow);
        return toFlowDto(saved);
    }

    @Transactional
    public FlowStateDto addState(String flowId, CreateFlowStateRequest request) {
        FlowDefinition flow = getFlow(flowId);

        String stateName = requiredText(request.getName(), "Flow state name is required");
        String color = normalizeColor(request.getColor());

        if (flowStateRepository.findByFlowIdAndNameIgnoreCase(flowId, stateName).isPresent()) {
            throw new RuntimeException("State already exists for this flow");
        }

        int sortOrder = request.getSortOrder() == null
                ? flowStateRepository.findByFlowIdOrderBySortOrderAscNameAsc(flowId).size() + 1
                : request.getSortOrder();

        FlowState state = new FlowState();
        state.setFlowId(flowId);
        state.setName(stateName);
        state.setColor(color);
        state.setSortOrder(sortOrder);

        FlowState savedState = flowStateRepository.save(state);

        if (flow.getInitialStateId() == null || flow.getInitialStateId().isBlank()) {
            flow.setInitialStateId(savedState.getId());
            flowDefinitionRepository.save(flow);
        }

        createPredefinedActions(flowId, savedState.getId());

        return toFlowStateDto(savedState, flowActionRepository.findByFlowIdAndStateIdOrderByNameAsc(flowId, savedState.getId()));
    }

    @Transactional
    public FlowActionDto addAction(String flowId, String stateId, CreateFlowActionRequest request) {
        ensureFlowAndState(flowId, stateId);

        String name = requiredText(request.getName(), "Action name is required");
        String actionType = requiredText(request.getActionType(), "Action type is required").toUpperCase(Locale.ROOT);

        FlowAction action = new FlowAction();
        action.setFlowId(flowId);
        action.setStateId(stateId);
        action.setName(name);
        action.setActionType(actionType);
        action.setAwaitable(Boolean.TRUE.equals(request.getAwaitable()));
        action.setRequiresApproval(Boolean.TRUE.equals(request.getRequiresApproval()));
        action.setApprovalType(optionalText(request.getApprovalType()));
        action.setApprovalRole(optionalText(request.getApprovalRole()));
        action.setNextStateId(optionalText(request.getNextStateId()));
        action.setPredefined(Boolean.TRUE.equals(request.getPredefined()));

        FlowAction saved = flowActionRepository.save(action);
        return toFlowActionDto(saved);
    }

    public RequiredActionsResponse getRequiredActions(String flowId, String stateId) {
        ensureFlowAndState(flowId, stateId);

        List<FlowActionDto> actionDtos = flowActionRepository.findByFlowIdAndStateIdOrderByNameAsc(flowId, stateId).stream()
                .map(this::toFlowActionDto)
                .toList();

        return new RequiredActionsResponse(flowId, stateId, actionDtos);
    }

    public NextStateResponse getNextState(String flowId, String currentStateId, String actionId) {
        ensureFlowAndState(flowId, currentStateId);

        if (actionId != null && !actionId.isBlank()) {
            FlowAction action = flowActionRepository.findByFlowIdAndStateIdAndId(flowId, currentStateId, actionId)
                    .orElseThrow(() -> new RuntimeException("Flow action not found"));

            if (action.getNextStateId() != null && !action.getNextStateId().isBlank()) {
                FlowState nextState = flowStateRepository.findByFlowIdAndId(flowId, action.getNextStateId())
                        .orElseThrow(() -> new RuntimeException("Flow state not found"));
                return new NextStateResponse(flowId, currentStateId, action.getId(), nextState.getId(), nextState.getName());
            }
        }

        List<FlowState> states = flowStateRepository.findByFlowIdOrderBySortOrderAscNameAsc(flowId);
        FlowState current = states.stream()
                .filter(state -> state.getId().equals(currentStateId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Flow state not found"));

        Optional<FlowState> next = states.stream()
                .filter(state -> state.getSortOrder() > current.getSortOrder())
                .findFirst();

        if (next.isEmpty()) {
            return new NextStateResponse(flowId, currentStateId, actionId, null, null);
        }

        return new NextStateResponse(flowId, currentStateId, actionId, next.get().getId(), next.get().getName());
    }

    private void createPredefinedActions(String flowId, String stateId) {
        ensureDefaultTemplates();
        List<FlowAction> existing = flowActionRepository.findByFlowIdAndStateIdOrderByNameAsc(flowId, stateId);
        boolean hasVerify = existing.stream().anyMatch(action -> "VERIFY".equalsIgnoreCase(action.getActionType()));
        boolean hasEmailApproval = existing.stream().anyMatch(action -> "EMAIL_APPROVAL".equalsIgnoreCase(action.getActionType()));

        if (!hasVerify) {
            FlowActionTemplate verifyTemplate = flowActionTemplateRepository
                    .findByNameIgnoreCaseAndActionTypeIgnoreCase("Verify", "VERIFY")
                    .orElseGet(() -> flowActionTemplateRepository.save(template("Verify", "VERIFY", true, true, "SELF", null, true)));

            flowActionRepository.save(actionFromTemplate(flowId, stateId, verifyTemplate));
        }

        if (!hasEmailApproval) {
            FlowActionTemplate emailTemplate = flowActionTemplateRepository
                    .findByNameIgnoreCaseAndActionTypeIgnoreCase("Email Approval", "EMAIL_APPROVAL")
                    .orElseGet(() -> flowActionTemplateRepository.save(template("Email Approval", "EMAIL_APPROVAL", true, true, "EMAIL", "approver", true)));

            flowActionRepository.save(actionFromTemplate(flowId, stateId, emailTemplate));
        }
    }

    private void ensureDefaultTemplates() {
        if (flowActionTemplateRepository.findByNameIgnoreCaseAndActionTypeIgnoreCase("Verify", "VERIFY").isEmpty()) {
            flowActionTemplateRepository.save(template("Verify", "VERIFY", true, true, "SELF", null, true));
        }

        if (flowActionTemplateRepository.findByNameIgnoreCaseAndActionTypeIgnoreCase("Email Approval", "EMAIL_APPROVAL").isEmpty()) {
            flowActionTemplateRepository.save(template("Email Approval", "EMAIL_APPROVAL", true, true, "EMAIL", "approver", true));
        }
    }

    private FlowActionTemplate template(
            String name,
            String actionType,
            boolean awaitable,
            boolean requiresApproval,
            String approvalType,
            String approvalRole,
            boolean predefined
    ) {
        FlowActionTemplate template = new FlowActionTemplate();
        template.setName(name);
        template.setActionType(actionType);
        template.setAwaitable(awaitable);
        template.setRequiresApproval(requiresApproval);
        template.setApprovalType(approvalType);
        template.setApprovalRole(approvalRole);
        template.setPredefined(predefined);
        return template;
    }

    private FlowAction actionFromTemplate(String flowId, String stateId, FlowActionTemplate template) {
        FlowAction action = new FlowAction();
        action.setFlowId(flowId);
        action.setStateId(stateId);
        action.setName(template.getName());
        action.setActionType(template.getActionType());
        action.setAwaitable(Boolean.TRUE.equals(template.getAwaitable()));
        action.setRequiresApproval(Boolean.TRUE.equals(template.getRequiresApproval()));
        action.setApprovalType(template.getApprovalType());
        action.setApprovalRole(template.getApprovalRole());
        action.setNextStateId(null);
        action.setPredefined(Boolean.TRUE.equals(template.getPredefined()));
        return action;
    }

    private void ensureFlowAndState(String flowId, String stateId) {
        getFlow(flowId);
        flowStateRepository.findByFlowIdAndId(flowId, stateId)
                .orElseThrow(() -> new RuntimeException("Flow state not found"));
    }

    private FlowDefinition getFlow(String flowId) {
        return flowDefinitionRepository.findById(flowId)
                .orElseThrow(() -> new RuntimeException("Flow not found"));
    }

    private FlowDto toFlowDto(FlowDefinition flow) {
        List<FlowState> states = flowStateRepository.findByFlowIdOrderBySortOrderAscNameAsc(flow.getId());
        List<String> stateIds = states.stream().map(FlowState::getId).toList();

        Map<String, List<FlowAction>> actionsByState = flowActionRepository.findByFlowIdOrderByNameAsc(flow.getId()).stream()
                .filter(action -> stateIds.contains(action.getStateId()))
                .collect(Collectors.groupingBy(FlowAction::getStateId));

        List<FlowStateDto> stateDtos = states.stream()
                .map(state -> toFlowStateDto(state, actionsByState.getOrDefault(state.getId(), List.of())))
                .toList();

        return new FlowDto(
                flow.getId(),
                flow.getName(),
                flow.getDescription(),
                flow.getInitialStateId(),
                stateDtos
        );
    }

    private FlowStateDto toFlowStateDto(FlowState state, List<FlowAction> actions) {
        return new FlowStateDto(
                state.getId(),
                state.getName(),
                state.getColor(),
                state.getSortOrder(),
                actions.stream().map(this::toFlowActionDto).toList()
        );
    }

    private FlowActionDto toFlowActionDto(FlowAction action) {
        return new FlowActionDto(
                action.getId(),
                action.getStateId(),
                action.getName(),
                action.getActionType(),
                Boolean.TRUE.equals(action.getAwaitable()),
                Boolean.TRUE.equals(action.getRequiresApproval()),
                action.getApprovalType(),
                action.getApprovalRole(),
                action.getNextStateId(),
                Boolean.TRUE.equals(action.getPredefined())
        );
    }

    private FlowActionTemplateDto toFlowActionTemplateDto(FlowActionTemplate template) {
        return new FlowActionTemplateDto(
                template.getId(),
                template.getName(),
                template.getActionType(),
                Boolean.TRUE.equals(template.getAwaitable()),
                Boolean.TRUE.equals(template.getRequiresApproval()),
                template.getApprovalType(),
                template.getApprovalRole(),
                Boolean.TRUE.equals(template.getPredefined())
        );
    }

    private String requiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }
        return value.trim();
    }

    private String optionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeColor(String color) {
        String normalized = optionalText(color);
        if (normalized == null) {
            return "#64748b";
        }
        if (!normalized.startsWith("#")) {
            normalized = "#" + normalized;
        }
        return normalized;
    }
}
