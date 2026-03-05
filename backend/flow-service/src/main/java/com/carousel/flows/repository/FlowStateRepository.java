package com.carousel.flows.repository;

import com.carousel.flows.domain.FlowState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlowStateRepository extends JpaRepository<FlowState, String> {
    List<FlowState> findByFlowIdOrderBySortOrderAscNameAsc(String flowId);
    Optional<FlowState> findByFlowIdAndId(String flowId, String id);
    Optional<FlowState> findByFlowIdAndNameIgnoreCase(String flowId, String name);
}
