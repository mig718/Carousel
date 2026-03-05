package com.carousel.flows.repository;

import com.carousel.flows.domain.FlowActionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlowActionTemplateRepository extends JpaRepository<FlowActionTemplate, String> {
    Optional<FlowActionTemplate> findByNameIgnoreCaseAndActionTypeIgnoreCase(String name, String actionType);
}
