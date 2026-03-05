package com.carousel.flows.repository;

import com.carousel.flows.domain.FlowDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlowDefinitionRepository extends JpaRepository<FlowDefinition, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<FlowDefinition> findByNameIgnoreCase(String name);
}
