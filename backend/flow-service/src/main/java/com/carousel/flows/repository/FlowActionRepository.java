package com.carousel.flows.repository;

import com.carousel.flows.domain.FlowAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlowActionRepository extends JpaRepository<FlowAction, String> {
    List<FlowAction> findByFlowIdAndStateIdOrderByNameAsc(String flowId, String stateId);
    List<FlowAction> findByFlowIdOrderByNameAsc(String flowId);
    Optional<FlowAction> findByFlowIdAndStateIdAndId(String flowId, String stateId, String id);
}
