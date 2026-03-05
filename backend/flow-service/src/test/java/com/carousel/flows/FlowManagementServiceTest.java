package com.carousel.flows;

import com.carousel.flows.domain.FlowAction;
import com.carousel.flows.domain.FlowDefinition;
import com.carousel.flows.domain.FlowState;
import com.carousel.flows.dto.CreateFlowRequest;
import com.carousel.flows.dto.CreateFlowStateRequest;
import com.carousel.flows.dto.NextStateResponse;
import com.carousel.flows.repository.FlowActionRepository;
import com.carousel.flows.repository.FlowActionTemplateRepository;
import com.carousel.flows.repository.FlowDefinitionRepository;
import com.carousel.flows.repository.FlowStateRepository;
import com.carousel.flows.service.FlowManagementService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FlowManagementServiceTest {

    @Mock
    private FlowDefinitionRepository flowDefinitionRepository;

    @Mock
    private FlowStateRepository flowStateRepository;

    @Mock
    private FlowActionRepository flowActionRepository;

    @Mock
    private FlowActionTemplateRepository flowActionTemplateRepository;

    @InjectMocks
    private FlowManagementService flowManagementService;

    @Test
    public void createFlowRejectsDuplicateName() {
        CreateFlowRequest request = new CreateFlowRequest();
        request.setName("Order Flow");

        when(flowDefinitionRepository.existsByNameIgnoreCase("Order Flow")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> flowManagementService.createFlow(request));
        assertEquals("Flow already exists", ex.getMessage());
    }

    @Test
    public void addStateSeedsPredefinedActionsAndSetsInitialState() {
        FlowDefinition flow = new FlowDefinition();
        flow.setId("flow-1");
        flow.setName("Order Flow");

        CreateFlowStateRequest request = new CreateFlowStateRequest();
        request.setName("Draft");
        request.setColor("#123456");
        request.setSortOrder(1);

        when(flowDefinitionRepository.findById("flow-1")).thenReturn(Optional.of(flow));
        when(flowStateRepository.findByFlowIdAndNameIgnoreCase("flow-1", "Draft")).thenReturn(Optional.empty());
        when(flowStateRepository.save(any(FlowState.class))).thenAnswer(invocation -> {
            FlowState state = invocation.getArgument(0);
            state.setId("state-1");
            return state;
        });
        when(flowActionTemplateRepository.findByNameIgnoreCaseAndActionTypeIgnoreCase(any(), any())).thenReturn(Optional.empty());
        when(flowActionTemplateRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(flowActionRepository.findByFlowIdAndStateIdOrderByNameAsc("flow-1", "state-1")).thenReturn(List.of());
        when(flowActionRepository.save(any(FlowAction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = flowManagementService.addState("flow-1", request);

        assertEquals("Draft", result.name());
        assertEquals("#123456", result.color());
        verify(flowDefinitionRepository, atLeastOnce()).save(any(FlowDefinition.class));
        verify(flowActionRepository, times(2)).save(any(FlowAction.class));
    }

    @Test
    public void getNextStateUsesActionSpecificTransition() {
        FlowDefinition flow = new FlowDefinition();
        flow.setId("flow-1");

        FlowState current = new FlowState();
        current.setId("state-1");
        current.setFlowId("flow-1");
        current.setName("Draft");
        current.setSortOrder(1);

        FlowState review = new FlowState();
        review.setId("state-2");
        review.setFlowId("flow-1");
        review.setName("Review");
        review.setSortOrder(2);

        FlowAction action = new FlowAction();
        action.setId("action-1");
        action.setFlowId("flow-1");
        action.setStateId("state-1");
        action.setNextStateId("state-2");

        when(flowDefinitionRepository.findById("flow-1")).thenReturn(Optional.of(flow));
        when(flowStateRepository.findByFlowIdAndId("flow-1", "state-1")).thenReturn(Optional.of(current));
        when(flowActionRepository.findByFlowIdAndStateIdAndId("flow-1", "state-1", "action-1")).thenReturn(Optional.of(action));
        when(flowStateRepository.findByFlowIdAndId("flow-1", "state-2")).thenReturn(Optional.of(review));

        NextStateResponse response = flowManagementService.getNextState("flow-1", "state-1", "action-1");

        assertEquals("state-2", response.nextStateId());
        assertEquals("Review", response.nextStateName());
        assertTrue(response.actionId().equals("action-1"));
    }
}
