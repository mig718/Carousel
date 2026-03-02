package com.carousel.inventory.repository;

import com.carousel.inventory.domain.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResourceTypeRepository extends JpaRepository<ResourceType, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<ResourceType> findByNameIgnoreCase(String name);
    List<ResourceType> findByParentTypeId(String parentTypeId);
}
